const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'cravecart_token'

function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function setToken(token) { if (token) localStorage.setItem(TOKEN_KEY, token) }
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }

async function request(path, options = {}) {
  if (!API_URL) throw new Error('VITE_API_URL is not configured.')
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) { const error = new Error(payload?.message || 'Something went wrong. Please try again.'); error.status = response.status; error.details = payload?.errors || []; throw error }
  return payload?.data ?? payload
}
const json = (method, path, body) => request(path, { method, body: JSON.stringify(body) })

export const authApi = { register: (body) => json('POST', '/auth/register', body), login: (body) => json('POST', '/auth/login', body), me: () => request('/auth/me') }
export const restaurantApi = { list: (params = {}) => request(`/restaurants?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null))}`), get: (id) => request(`/restaurants/${id}`), menu: (id) => request(`/restaurants/${id}/menu`), reviews: (id) => request(`/restaurants/${id}/reviews`), addReview: (id, body) => json('POST', `/restaurants/${id}/reviews`, body) }
export const cartApi = { get: () => request('/cart'), addItem: (menuItemId, quantity) => json('POST', '/cart/items', { menu_item_id: menuItemId, quantity }), updateItem: (itemId, quantity) => json('PUT', `/cart/items/${itemId}`, { quantity }), removeItem: (itemId) => request(`/cart/items/${itemId}`, { method: 'DELETE' }), clear: () => request('/cart', { method: 'DELETE' }) }
export const addressApi = { list: () => request('/addresses'), create: (body) => json('POST', '/addresses', body), update: (id, body) => json('PUT', `/addresses/${id}`, body), remove: (id) => request(`/addresses/${id}`, { method: 'DELETE' }) }
export const orderApi = { create: (body) => json('POST', '/orders', body), list: () => request('/orders'), get: (id) => request(`/orders/${id}`) }
export const reviewApi = { update: (id, body) => json('PUT', `/reviews/${id}`, body), remove: (id) => request(`/reviews/${id}`, { method: 'DELETE' }) }
export const userApi = { me: () => request('/users/me'), update: (body) => json('PATCH', '/users/me', body) }