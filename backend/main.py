"""
Jaco - Backend (FastAPI + PostgreSQL)

Semua kode backend ada di file ini, dibaca dari atas ke bawah:
  1. Baca konfigurasi dari file .env
  2. Sambungkan ke database PostgreSQL
  3. Bentuk tabel "tasks"
  4. Aturan validasi data yang masuk & keluar
  5. Bikin aplikasi FastAPI + CORS
  6. Endpoint API: GET, POST, PUT, DELETE

Jalankan:  uvicorn main:app --reload --port 8000
"""

import enum
from datetime import date, datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import Date, DateTime, Enum, String, Text, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


# =====================================================================
# 1. KONFIGURASI (dibaca dari file .env)
# =====================================================================
# Password database TIDAK ditulis di kode. Semua diambil dari file .env.
# Kalau .env belum diisi, aplikasi langsung error dan kasih tahu yang kurang.

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    db_host: str
    db_port: int = 5432
    db_user: str
    db_password: str
    db_name: str
    cors_origins: str = "http://localhost:5173"


settings = Settings()


# =====================================================================
# 2. KONEKSI DATABASE
# =====================================================================
# Alamat database dirakit dari isi .env, formatnya:
# postgresql+psycopg://USER:PASSWORD@HOST:PORT/NAMA_DB

DATABASE_URL = (
    f"postgresql+psycopg://{settings.db_user}:{settings.db_password}"
    f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
)

engine = create_engine(DATABASE_URL)          # "kabel" ke PostgreSQL
SessionLocal = sessionmaker(bind=engine)      # pembuat sesi untuk tiap request


def get_db():
    """Buka koneksi database untuk 1 request, lalu tutup lagi setelah selesai."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =====================================================================
# 3. TABEL "tasks"
# =====================================================================
# Class Python ini = bentuk tabel di database.
# Setiap atribut = satu kolom.

class Status(str, enum.Enum):
    TODO = "Todo"
    IN_PROGRESS = "In Progress"
    DONE = "Done"


class Priority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Base(DeclarativeBase):
    pass


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[Status] = mapped_column(
        Enum(Status, values_callable=lambda e: [x.value for x in e]),
        default=Status.TODO,
    )
    priority: Mapped[Priority] = mapped_column(
        Enum(Priority, values_callable=lambda e: [x.value for x in e]),
        default=Priority.MEDIUM,
    )
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# =====================================================================
# 4. VALIDASI DATA (Pydantic)
# =====================================================================
# Sebelum data masuk database, dicek dulu di sini.
# Kalau tidak lolos, FastAPI otomatis membalas error 422.

class TaskCreate(BaseModel):
    """Data yang boleh dikirim saat MEMBUAT task (POST)."""
    title: str = Field(max_length=200)
    description: str = ""
    status: Status = Status.TODO          # status hanya boleh Todo / In Progress / Done
    priority: Priority = Priority.MEDIUM
    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def title_tidak_boleh_kosong(cls, value):
        value = value.strip()             # buang spasi di depan & belakang
        if not value:
            raise ValueError("Title cannot be empty")
        return value


class TaskUpdate(BaseModel):
    """Data yang boleh dikirim saat MENGUBAH task (PUT). Semua opsional."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    status: Optional[Status] = None
    priority: Optional[Priority] = None
    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def title_tidak_boleh_kosong(cls, value):
        if value is None or not value.strip():
            raise ValueError("Title cannot be empty")
        return value.strip()

    @field_validator("status", "priority")
    @classmethod
    def tidak_boleh_null(cls, value):
        if value is None:
            raise ValueError("Cannot be null")
        return value


class TaskResponse(BaseModel):
    """Bentuk data task yang dikirim balik ke frontend."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: Status
    priority: Priority
    due_date: Optional[date]
    created_at: datetime


# =====================================================================
# 5. APLIKASI FASTAPI + CORS
# =====================================================================

app = FastAPI(title="Jaco Task Tracker API")

# Bikin tabel otomatis saat aplikasi dijalankan (kalau belum ada).
Base.metadata.create_all(bind=engine)

# CORS: izinkan frontend (localhost:5173) mengakses API ini.
# Tanpa ini, browser akan memblokir request dari frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


def cari_task(db: Session, task_id: int) -> Task:
    """Cari task berdasarkan id. Kalau tidak ada, balas error 404."""
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# =====================================================================
# 6. ENDPOINT API
# =====================================================================

@app.get("/tasks", response_model=List[TaskResponse])
def ambil_semua_task(db: Session = Depends(get_db)):
    """GET /tasks -> ambil semua task, yang terbaru di atas."""
    return db.scalars(select(Task).order_by(Task.id.desc())).all()


@app.post("/tasks", response_model=TaskResponse, status_code=201)
def buat_task(data: TaskCreate, db: Session = Depends(get_db)):
    """POST /tasks -> buat task baru."""
    task = Task(**data.model_dump())   # ubah data jadi baris tabel
    db.add(task)                       # siapkan untuk disimpan
    db.commit()                        # simpan ke database
    db.refresh(task)                   # ambil ulang (supaya dapat id & created_at)
    return task


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def ubah_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    """PUT /tasks/{id} -> ubah judul, deskripsi, status, priority, atau due date."""
    task = cari_task(db, task_id)

    # Hanya field yang benar-benar dikirim yang diubah.
    # Contoh: kirim {"status": "Done"} -> cuma status yang berubah.
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@app.delete("/tasks/{task_id}", status_code=204)
def hapus_task(task_id: int, db: Session = Depends(get_db)):
    """DELETE /tasks/{id} -> hapus task."""
    task = cari_task(db, task_id)
    db.delete(task)
    db.commit()
    return Response(status_code=204)
