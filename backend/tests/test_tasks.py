"""Integration test untuk endpoint /tasks.

Test ini memakai database PostgreSQL sungguhan sesuai konfigurasi .env
(sangat disarankan pakai database terpisah, mis. DB_NAME=task_tracker_test).
Semua isi tabel tasks dihapus sebelum tiap test.

Jalankan:  pytest -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from main import SessionLocal, Task, app


@pytest.fixture()
def client():
    with TestClient(app) as c:
        with SessionLocal() as db:
            db.execute(delete(Task))
            db.commit()
        yield c


def test_create_and_list(client):
    r = client.post("/tasks", json={"title": "  Belajar FastAPI  ", "description": "CRUD", "status": "Todo"})
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "Belajar FastAPI"  # di-trim
    assert body["status"] == "Todo"

    r = client.get("/tasks")
    assert r.status_code == 200
    assert [t["id"] for t in r.json()] == [body["id"]]


def test_default_status_is_todo(client):
    r = client.post("/tasks", json={"title": "Tanpa status"})
    assert r.status_code == 201
    assert r.json()["status"] == "Todo"
    assert r.json()["description"] == ""


@pytest.mark.parametrize(
    "payload",
    [
        {"title": ""},
        {"title": "   "},
        {"description": "tanpa judul"},
        {"title": "x" * 201},
        {"title": "ok", "status": "Selesai"},
    ],
)
def test_create_validation(client, payload):
    assert client.post("/tasks", json=payload).status_code == 422


def test_update_partial(client):
    task = client.post("/tasks", json={"title": "Awal", "description": "desc"}).json()

    r = client.put(f"/tasks/{task['id']}", json={"status": "In Progress"})
    assert r.status_code == 200
    assert r.json()["status"] == "In Progress"
    assert r.json()["title"] == "Awal"

    r = client.put(f"/tasks/{task['id']}", json={"title": "Baru", "description": "desc baru", "status": "Done"})
    assert r.status_code == 200
    assert (r.json()["title"], r.json()["description"], r.json()["status"]) == ("Baru", "desc baru", "Done")


@pytest.mark.parametrize("payload", [{"title": ""}, {"title": None}, {"status": "Unknown"}, {"status": None}])
def test_update_validation(client, payload):
    task = client.post("/tasks", json={"title": "Valid"}).json()
    assert client.put(f"/tasks/{task['id']}", json=payload).status_code == 422


def test_update_and_delete_not_found(client):
    assert client.put("/tasks/999999", json={"status": "Done"}).status_code == 404
    assert client.delete("/tasks/999999").status_code == 404


def test_delete(client):
    task = client.post("/tasks", json={"title": "Hapus aku"}).json()
    assert client.delete(f"/tasks/{task['id']}").status_code == 204
    assert client.get("/tasks").json() == []


def test_cors_header(client):
    r = client.options(
        "/tasks",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_priority_and_due_date(client):
    r = client.post("/tasks", json={"title": "Prioritas", "priority": "High", "due_date": "2026-12-01"})
    assert r.status_code == 201
    task = r.json()
    assert (task["priority"], task["due_date"]) == ("High", "2026-12-01")

    # default priority Medium, due_date null
    t2 = client.post("/tasks", json={"title": "Default"}).json()
    assert (t2["priority"], t2["due_date"]) == ("Medium", None)

    # hapus due date & ubah priority
    r = client.put(f"/tasks/{task['id']}", json={"due_date": None, "priority": "Low"})
    assert (r.json()["priority"], r.json()["due_date"]) == ("Low", None)


@pytest.mark.parametrize("payload", [{"title": "x", "priority": "Urgent"}, {"title": "x", "due_date": "bukan-tanggal"}])
def test_priority_due_date_validation(client, payload):
    assert client.post("/tasks", json=payload).status_code == 422
