const pad = (n) => String(n).padStart(2, '0')

/** Date -> "YYYY-MM-DD" (waktu lokal), sama dengan format due_date dari API. */
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayKey = () => toKey(new Date())

export function formatDue(key) {
  if (!key) return ''
  const [y, m, d] = key.split('-').map(Number)
  const opts = { month: 'short', day: 'numeric' }
  if (y !== new Date().getFullYear()) opts.year = 'numeric'
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts)
}

export const isOverdue = (task) =>
  Boolean(task.due_date) && task.status !== 'Done' && task.due_date < todayKey()
