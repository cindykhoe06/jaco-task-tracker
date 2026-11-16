import { useMemo, useState } from 'react'
import { toKey, todayKey } from '../utils/date'
import { btnGhost } from './ui'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS = 3

// Warna penanda priority: titik di mobile, garis kiri di desktop
const PRIO_COLOR = {
  Low: 'bg-[#6c9b7d] border-[#6c9b7d]',
  Medium: 'bg-[#d9a441] border-[#d9a441]',
  High: 'bg-danger border-danger',
}

export default function CalendarView({ tasks, onOpen, onCreate }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Tanggal-tanggal yang tampil di grid (mulai Senin, penuh per minggu)
  const days = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const offset = (cursor.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const total = Math.ceil((offset + daysInMonth) / 7) * 7
    return Array.from({ length: total }, (_, i) => new Date(year, month, 1 - offset + i))
  }, [cursor])

  const byDate = useMemo(() => {
    const map = {}
    tasks.forEach((t) => t.due_date && (map[t.due_date] ||= []).push(t))
    return map
  }, [tasks])

  const noDueCount = tasks.filter((t) => !t.due_date).length
  const today = todayKey()
  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1))
  const goToday = () => {
    const now = new Date()
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
  }
  const navBtn = `${btnGhost} px-2.5 py-0.5`

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-1">
          <button className={navBtn} onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <button className={navBtn} onClick={goToday}>Today</button>
          <button className={navBtn} onClick={() => shift(1)} aria-label="Next month">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-l border-t border-line">
        {WEEKDAYS.map((d) => (
          <div key={d} className="border-b border-r border-line px-2 py-1.5 text-xs text-muted">
            {d}
          </div>
        ))}

        {days.map((day) => {
          const key = toKey(day)
          const items = byDate[key] || []
          const outside = day.getMonth() !== cursor.getMonth()
          return (
            <div
              key={key}
              title="Add task on this day"
              onClick={() => onCreate({ due_date: key })}
              className={`flex min-h-[64px] min-w-0 cursor-pointer flex-col gap-[3px] border-b border-r border-line p-1 sm:min-h-[112px] sm:p-1.5 ${
                outside ? 'bg-panel' : 'hover:bg-[#fbfbfa]'
              }`}
            >
              <span
                className={`h-[22px] w-[22px] self-end rounded-full text-center text-[12.5px] leading-[22px] ${
                  key === today ? 'bg-[#eb5757] text-white' : outside ? 'text-faint' : 'text-muted'
                }`}
              >
                {day.getDate()}
              </span>
              {items.slice(0, MAX_CHIPS).map((t) => (
                <button
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen(t)
                  }}
                  className={`h-1.5 truncate rounded p-0 text-left text-[0px] ${PRIO_COLOR[t.priority]}
                    sm:h-auto sm:border-l-[3px] sm:bg-white sm:px-1.5 sm:py-0.5 sm:text-[12.5px] sm:shadow-[0_0_0_1px_rgba(15,15,15,0.1)] sm:hover:bg-panel
                    ${t.status === 'Done' ? 'sm:text-faint sm:line-through' : ''}`}
                >
                  {t.title}
                </button>
              ))}
              {items.length > MAX_CHIPS && (
                <span className="text-[10px] text-faint sm:pl-1 sm:text-xs">+{items.length - MAX_CHIPS} more</span>
              )}
            </div>
          )
        })}
      </div>

      {noDueCount > 0 && (
        <p className="mt-3 text-[13px] text-faint">
          {noDueCount} {noDueCount === 1 ? 'task has' : 'tasks have'} no due date and{' '}
          {noDueCount === 1 ? "isn't" : "aren't"} shown here.
        </p>
      )}
    </div>
  )
}
