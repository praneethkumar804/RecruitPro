import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function login(email, password) {
  const { data } = await api.post('/auth/token/', { email, password })
  localStorage.setItem('access_token', data.access)
  localStorage.setItem('refresh_token', data.refresh)
  return data
}

export async function register(user) {
  const { data } = await api.post('/auth/register/', user)
  return data
}

export async function getJobs(params = {}) {
  const query = typeof params === 'string' ? (params ? { search: params } : {}) : params
  const { data } = await api.get('/jobs/', { params: query })
  return data
}

export default api
