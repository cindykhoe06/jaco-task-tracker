import { useState } from 'react'
import { PRIORITIES, STATUSES } from '../api/tasks'
import { formatDue, isOverdue } from '../utils/date'
import { Pill, PillSelect } from './Pill'
import { addRow, revealOnHover } from './ui'

const th = 'border-b border-line px-2 py-1.5 text-left text-[13px] font-normal text-muted'
const td = 'border-b border-line px-2 py-[7px] align-middle'

export default function ListView({ tasks, onOpen, onCreate, onUpdate, onDelete, onError }) {
  const [collapsed, setCollapsed] = useState({})

  const update = (task, payload) => onUpdate(task.id, payload).catch((err) => onError(err.message))
  const remove = (task) => {
    if (window.confirm(`Delete "${task.title}"?`)) onDelete(task.id).catch((err) => onError(err.message))
  }

  return (
    <div className="flex flex-col gap-5">
      {STATUSES.map((status) => {
        const rows = tasks.filter((t) => t.status === status)
        const isOpen = !collapsed[status]
        return (
          <section key={status}>
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [status]: !c[status] }))}
              aria-expanded={isOpen}
              className="mb-1 flex items-center gap-2 rounded-md px-1 py-1 hover:bg-hover"
            >
              <span className={`inline-block w-3 text-faint transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
              <Pill kind="status" value={status} />
              <span className="text-[13px] text-faint">{rows.length}</span>
            </button>

            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>Name</th>
                      <th className={`${th} w-[130px]`}>Priority</th>
                      <th className={`${th} w-[120px]`}>Due date</th>
                      <th className={`${th} w-[130px]`}>Status</th>
                      <th className={`${th} w-[70px]`} aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t.id} className="group hover:bg-[#fbfbfa]">
                        <td className={`${td} cursor-pointer`} onClick={() => onOpen(t)}>
                          <span className={`block font-medium ${t.status === 'Done' ? 'text-faint line-through' : ''}`}>
                            {t.title}
                          </span>
                          {t.description && (
                            <span className="block max-w-[420px] truncate text-[12.5px] text-muted">{t.description}</span>
                          )}
                        </td>
                        <td className={td}>
                          <PillSelect
                            kind="priority"
                            label="Priority"
                            value={t.priority}
                            options={PRIORITIES}
                            onChange={(v) => update(t, { priority: v })}
                          />
                        </td>
                        <td className={`${td} ${isOverdue(t) ? 'text-danger' : ''}`}>
                          {t.due_date ? formatDue(t.due_date) : <span className="text-faint">Empty</span>}
                        </td>
                        <td className={td}>
                          <PillSelect
                            kind="status"
                            label="Status"
                            value={t.status}
                            options={STATUSES}
                            onChange={(v) => update(t, { status: v })}
                          />
                        </td>
                        <td className={`${td} text-right`}>
                          <button
                            onClick={() => remove(t)}
                            className={`rounded px-1.5 py-0.5 text-[13px] text-faint hover:bg-hover hover:text-danger ${revealOnHover}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} className="py-0.5">
                        <button className={addRow} onClick={() => onCreate({ status })}>
                          + New
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
