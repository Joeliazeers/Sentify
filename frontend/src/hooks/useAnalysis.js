import { useState, useRef, useCallback } from 'react'
import { startAnalysis, getTaskStatus } from '../lib/api'

const POLL_INTERVAL_MS = 2000

export function useAnalysis() {
  const [taskId, setTaskId] = useState(null)
  const [status, setStatus] = useState('idle') // idle | pending | processing | completed | failed
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const pollRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const poll = useCallback(async (id) => {
    try {
      const data = await getTaskStatus(id)
      setProgress(data.progress)
      setMessage(data.message)
      setStatus(data.status)

      if (data.status === 'completed') {
        stopPolling()
        setResult(data.result)
      } else if (data.status === 'failed') {
        stopPolling()
        setError(data.error || 'Analisis gagal. Silakan coba lagi.')
      }
    } catch (err) {
      stopPolling()
      setStatus('failed')
      setError('Tidak dapat terhubung ke server.')
    }
  }, [stopPolling])

  const analyze = useCallback(async (url, maxComments) => {
    stopPolling()
    setStatus('pending')
    setProgress(0)
    setMessage('Memulai analisis...')
    setResult(null)
    setError(null)

    try {
      const data = await startAnalysis(url, maxComments)
      const id = data.task_id
      setTaskId(id)

      // If immediately completed (cache hit)
      if (data.status === 'completed') {
        setStatus('completed')
        setProgress(100)
        setMessage(data.message)
        setResult(data.result)
        return
      }

      // Start polling
      pollRef.current = setInterval(() => poll(id), POLL_INTERVAL_MS)
    } catch (err) {
      setStatus('failed')
      const msg = err?.response?.data?.detail || 'Terjadi kesalahan. Periksa URL dan coba lagi.'
      setError(msg)
    }
  }, [poll, stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setTaskId(null)
    setStatus('idle')
    setProgress(0)
    setMessage('')
    setResult(null)
    setError(null)
  }, [stopPolling])

  return { status, progress, message, result, error, analyze, reset }
}
