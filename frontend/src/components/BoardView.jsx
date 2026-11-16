import { useEffect, useRef, useState } from 'react'
import { STATUSES } from '../api/tasks'
import { formatDue, isOverdue } from '../utils/date'
import { Pill } from './Pill'
import { addRow, revealOnHover } from './ui'

function BoardCard({ task, onOpen, onUpdate, onDelete, onError }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Tutup menu kalau klik di luar
  useEffect(() => {
    if (!menuOpen) return
    const close = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const moveTo = (status) => {
    setMenuOpen(false)
    onUpdate(task.id, { status }).catch((err) => onError(err.message))
  }

  const remove = () => {
    setMenuOpen(false)
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDelete(task.id).catch((err) => onError(err.message))
    }
  }

  const menuItem = 'flex w-full justify-between rounded px-2 py-[5px] text-left enabled:hover:bg-hover disabled:cursor-default'

  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(task.id))}
      onClick={() => onOpen(task)}
      className="group flex cursor-pointer flex-col gap-1.5 rounded-md bg-white px-3 py-2.5 shadow-card hover:bg-[#fbfbfa]"
    >
      <div className="flex items-center justify-between">
        <Pill kind="priority" value={task.priority} />
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            aria-label="More actions"
            onClick={() => setMenuOpen((v) => !v)}
            className={`rounded px-1.5 tracking-wider text-faint hover:bg-hover hover:text-ink ${revealOnHover}`}
          >
            ···
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-6 z-20 w-[180px] rounded-lg bg-white p-1 shadow-menu">
              <div className="px-2 py-1 text-xs text-faint">Move to</div>
              {STATUSES.map((s) => (
                <button key={s} className={menuItem} onClick={() => moveTo(s)} disabled={s === task.status}>
                  {s}
                  {s === task.status && <span className="text-xs text-faint">Current</span>}
                </button>
              ))}
              <div className="my-1 h-px bg-line" />
              <button className={`${menuItem} text-danger`} onClick={remove}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`break-words font-medium ${task.status === 'Done' ? 'text-faint line-through' : ''}`}>
        {task.title}
      </div>
      {task.description && <p className="line-clamp-2 break-words text-[13px] text-muted">{task.description}</p>}
      {task.due_date && (
        <div className={`text-[12.5px] ${isOverdue(task) ? 'text-danger' : 'text-muted'}`}>
          {formatDue(task.due_date)}
        </div>
      )}
    </article>
  )
}

export default function BoardView({ tasks, onOpen, onCreate, onUpdate, onDelete, onClearDone, onError }) {
  const [dragOver, setDragOver] = useState(null)

  const handleDrop = (e, status) => {
    e.preventDefault()
    setDragOver(null)
    const id = Number(e.dataTransfer.getData('text/plain'))
    const task = tasks.find((t) => t.id === id)
    if (task && task.status !== status) {
      onUpdate(id, { status }).catch((err) => onError(err.message))
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(3,280px)] sm:overflow-x-auto sm:pb-2 lg:grid-cols-3 lg:overflow-visible lg:pb-0">
      {STATUSES.map((status) => {
        const items = tasks.filter((t) => t.status === status)
        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(status)
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDragOver(null)}
            onDrop={(e) => handleDrop(e, status)}
            className={`flex flex-col gap-1.5 rounded-lg p-2 transition-colors sm:min-h-[160px] ${
              dragOver === status ? 'bg-[#efefec]' : 'bg-panel'
            }`}
          >
            <header className="flex items-center gap-2 px-1 pb-1.5 pt-0.5">
              <Pill kind="status" value={status} />
              <span className="text-[13px] text-faint">{items.length}</span>
              {status === 'Done' && items.length > 0 && (
                <button className="ml-auto text-[13px] text-faint hover:text-ink" onClick={onClearDone}>
                  Clear
                </button>
              )}
            </header>

            {items.map((task) => (
              <BoardCard
                key={task.id}
                task={task}
                onOpen={onOpen}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onError={onError}
              />
            ))}

            <button className={addRow} onClick={() => onCreate({ status })}>
              + New
            </button>
          </section>
        )
      })}
    </div>
  )
}
