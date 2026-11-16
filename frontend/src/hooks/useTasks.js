import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/tasks'

/**
 * Satu sumber state untuk semua view (Board, List, Calendar).
 * Setiap POST/PUT/DELETE yang sukses langsung memperbarui state lokal
 * memakai data dari response backend, jadi layar ter-update tanpa reload.
 */
export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTasks(await api.getTasks())
    } catch (err) {
      setError(api.errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Bungkus aksi: error axios diubah jadi Error dengan pesan yang rapi.
  const run = async (fn) => {
    try {
      return await fn()
    } catch (err) {
      throw new Error(api.errorMessage(err))
    }
  }

  const addTask = (payload) =>
    run(async () => {
      const created = await api.createTask(payload)
      setTasks((prev) => [created, ...prev])
      return created
    })

  const editTask = (id, payload) =>
    run(async () => {
      const updated = await api.updateTask(id, payload)
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      return updated
    })

  const removeTask = (id) =>
    run(async () => {
      await api.deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    })

  const clearDone = () =>
    run(async () => {
      const done = tasks.filter((t) => t.status === 'Done')
      await Promise.all(done.map((t) => api.deleteTask(t.id)))
      setTasks((prev) => prev.filter((t) => t.status !== 'Done'))
    })

  return { tasks, loading, error, fetchTasks, addTask, editTask, removeTask, clearDone }
}
