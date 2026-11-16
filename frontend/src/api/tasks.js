import axios from 'axios'

// Base URL backend dari .env (VITE_API_URL), default ke localhost:8000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

export const STATUSES = ['Todo', 'In Progress', 'Done']
export const PRIORITIES = ['Low', 'Medium', 'High']

export const getTasks = () => api.get('/tasks').then((r) => r.data)
export const createTask = (payload) => api.post('/tasks', payload).then((r) => r.data)
export const updateTask = (id, payload) => api.put(`/tasks/${id}`, payload).then((r) => r.data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)

/** Ubah error axios / FastAPI jadi pesan singkat yang bisa ditampilkan. */
export function errorMessage(err) {
  if (!err.response) return "Can't reach the server. Make sure the backend is running."
  const detail = err.response.data?.detail
  if (Array.isArray(detail)) {
    // Error validasi 422 dari Pydantic
    return detail.map((d) => d.msg.replace(/^Value error, /, '')).join(', ')
  }
  return detail || `Something went wrong (${err.response.status})`
}
