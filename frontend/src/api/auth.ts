import api from './client'

export async function register(username: string, password: string) {
  const res = await api.post('/auth/register', { username, password })
  return res.data
}

export async function login(username: string, password: string) {
  const res = await api.post('/auth/login', { username, password })
  return res.data
}

export function saveToken(token: string) {
  localStorage.setItem('token', token)
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function clearToken() {
  localStorage.removeItem('token')
}
