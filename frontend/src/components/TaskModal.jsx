import { useEffect, useState } from 'react'
import { PRIORITIES, STATUSES } from '../api/tasks'
import { PillSelect } from './Pill'
import { btnGhost, btnPrimary } from './ui'

const blank = { title: '', description: '', status: 'Todo', priority: 'Medium', due_date: '' }

/** Panel untuk membuat tugas baru atau mengedit tugas yang ada. */
export default function TaskModal({ task, defaults, onSave, onDelete, onClose }) {
  const isEdit = Boolean(task)
  const [form, setForm] = useState(() =>
    isEdit ? { ...task, due_date: task.due_date || '' } : { ...blank, ...defaults },
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const save = async () => {
    if (!form.title.trim()) {
      setError('Title cannot be empty')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    try {
      await onDelete(task.id)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  // Esc = tutup, Ctrl/Cmd + Enter = simpan
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 px-4 pb-4 pt-[10vh]"
    >
      <form
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="flex max-h-[85vh] w-full max-w-[580px] flex-col gap-4 overflow-y-auto rounded-[10px] bg-white p-5 shadow-modal sm:px-8 sm:pb-5 sm:pt-7"
      >
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Untitled"
          maxLength={200}
          autoFocus
          className="w-full border-0 p-0 text-[26px] font-bold tracking-tight outline-none placeholder:text-[#d3d1cb]"
        />

        <div className="grid grid-cols-[96px_1fr] items-center gap-y-2 sm:grid-cols-[120px_1fr]">
          <span className="text-muted">Status</span>
          <div>
            <PillSelect kind="status" label="Status" value={form.status} options={STATUSES} onChange={(v) => set('status', v)} />
          </div>

          <span className="text-muted">Priority</span>
          <div>
            <PillSelect kind="priority" label="Priority" value={form.priority} options={PRIORITIES} onChange={(v) => set('priority', v)} />
          </div>

          <span className="text-muted">Due date</span>
          <div>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => set('due_date', e.target.value)}
              className="-ml-1.5 rounded border-0 bg-transparent px-1.5 py-0.5 outline-none hover:bg-hover focus:bg-hover"
            />
          </div>
        </div>

        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Add a description…"
          rows={5}
          maxLength={2000}
          className="min-h-[110px] w-full resize-y border-0 border-t border-line pt-3.5 outline-none placeholder:text-faint"
        />

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex items-center justify-between">
          {isEdit ? (
            <button type="button" className="text-[13px] text-danger" onClick={remove}>
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button type="button" className={btnGhost} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
