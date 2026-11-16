import { useEffect, useMemo, useState } from 'react'
import { useTasks } from './hooks/useTasks'
import BoardView from './components/BoardView'
import ListView from './components/ListView'
import CalendarView from './components/CalendarView'
import TaskModal from './components/TaskModal'
import { btnGhost, btnPrimary } from './components/ui'

const VIEWS = [
  { id: 'board', label: 'Board' },
  { id: 'list', label: 'List' },
  { id: 'calendar', label: 'Calendar' },
]

export default function App() {
  const { tasks, loading, error, fetchTasks, addTask, editTask, removeTask, clearDone } = useTasks()
  const [view, setView] = useState('board')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // { task } untuk edit, { defaults } untuk create
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter((t) => `${t.title} ${t.description}`.toLowerCase().includes(q))
  }, [tasks, search])

  const openTask = (task) => setModal({ task })
  const newTask = (defaults = {}) => setModal({ defaults })

  const handleClearDone = async () => {
    const n = tasks.filter((t) => t.status === 'Done').length
    if (!window.confirm(`Delete ${n} completed ${n === 1 ? 'task' : 'tasks'}?`)) return
    try {
      await clearDone()
    } catch (err) {
      setToast(err.message)
    }
  }

  const viewProps = {
    tasks: visible,
    onOpen: openTask,
    onCreate: newTask,
    onUpdate: editTask,
    onDelete: removeTask,
    onError: setToast,
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-14">
      <header>
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="text-[26px] font-bold tracking-tight sm:text-[32px]">Jaco</h1>
          <span className="rounded border border-line bg-panel px-2 py-px text-[13px] text-muted">
            Task tracker
          </span>
        </div>
        <p className="mt-1 text-muted">Plan, track, and finish your team's work.</p>
      </header>

      <div className="mb-5 mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:border-b sm:border-line">
        <nav className="flex gap-1 border-b border-line sm:border-b-0">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`-mb-px border-b-2 px-1.5 py-2 ${
                view === v.id ? 'border-ink font-medium text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <div className="flex gap-2 sm:pb-2">
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-transparent bg-panel px-2.5 py-[5px] outline-none focus:border-line focus:bg-white sm:w-[200px] sm:flex-none"
          />
          <button className={btnPrimary} onClick={() => newTask()}>
            New
          </button>
        </div>
      </div>

      <main>
        {loading && <p className="py-12 text-center text-muted">Loading…</p>}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted">
            <p>{error}</p>
            <button className={btnGhost} onClick={fetchTasks}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {view === 'board' && <BoardView {...viewProps} onClearDone={handleClearDone} />}
            {view === 'list' && <ListView {...viewProps} />}
            {view === 'calendar' && <CalendarView {...viewProps} />}
          </>
        )}
      </main>

      {modal && (
        <TaskModal
          key={modal.task?.id ?? 'new'}
          task={modal.task}
          defaults={modal.defaults}
          onSave={(payload) => (modal.task ? editTask(modal.task.id, payload) : addTask(payload))}
          onDelete={removeTask}
          onClose={() => setModal(null)}
        />
      )}

      {toast && (
        <div
          role="alert"
          onClick={() => setToast('')}
          className="fixed bottom-6 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 cursor-pointer rounded-lg bg-[#2f2f2d] px-3.5 py-2 text-[13px] text-white"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
