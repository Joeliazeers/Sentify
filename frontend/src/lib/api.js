import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  // HF Spaces can take 30-60 s to cold-start; 90 s keeps things from failing silently
  timeout: 90000,
})

/**
 * Start a new analysis job.
 * @returns {Promise<{task_id, status, progress, message}>}
 */
export async function startAnalysis(url, maxComments = 2000) {
  const res = await api.post('/analyze', { url, max_comments: maxComments })
  return res.data
}

/**
 * Poll the status of an analysis task.
 * @returns {Promise<{task_id, status, progress, message, result?, error?}>}
 */
export async function getTaskStatus(taskId) {
  const res = await api.get(`/status/${taskId}`)
  return res.data
}

/**
 * Get paginated comments for a video filtered by sentiment.
 * @param {string} videoId
 * @param {string} sentiment  "positive" | "negative" | "neutral"
 * @param {string} sortBy     "confidence" | "likes"
 * @param {number} page       1-based
 * @param {number} perPage    default 20
 */
export async function getComments(videoId, sentiment, sortBy = 'confidence', page = 1, perPage = 20, search = '') {
  const params = { sentiment, sort_by: sortBy, page, per_page: perPage }
  if (search && search.trim()) params.search = search.trim()
  const res = await api.get(`/comments/${videoId}`, { params })
  return res.data
}

/**
 * Health check.
 */
export async function healthCheck() {
  const res = await api.get('/health')
  return res.data
}
