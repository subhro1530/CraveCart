const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')
const TOKEN_KEY = 'cravecart_token'

function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function setToken(token) { if (token) localStorage.setItem(TOKEN_KEY, token) }
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }
async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) { const error = new Error(payload?.message || 'Something went wrong. Please try again.'); error.status = response.status; error.details = payload?.errors || []; throw error }
  return payload?.data ?? payload
}
const json = (method, path, body) => request(path, { method, body: JSON.stringify(body) })
const query = (params) => { const value = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)).toString(); return value ? `?${value}` : '' }

export const authApi = { register: (body) => json('POST', '/auth/register', body), login: (body) => json('POST', '/auth/login', body), me: () => request('/auth/me'), logout: () => request('/auth/logout', { method: 'POST' }) }
export const healthApi = { root: () => request('/health'), db: () => request('/health/db') }
export const restaurantApi = { list: (params = {}) => request(`/restaurants${query(params)}`), get: (id) => request(`/restaurants/${id}`), menu: (id) => request(`/restaurants/${id}/menu`), reviews: (id) => request(`/restaurants/${id}/reviews`), addReview: (id, body) => json('POST', `/restaurants/${id}/reviews`, body) }
export const restaurantAdminApi = { create: (body) => json('POST', '/restaurants', body), update: (id, body) => json('PUT', `/restaurants/${id}`, body), remove: (id) => request(`/restaurants/${id}`, { method: 'DELETE' }), addMenu: (id, body) => json('POST', `/restaurants/${id}/menu`, body), updateMenu: (id, body) => json('PUT', `/menu/${id}`, body), removeMenu: (id) => request(`/menu/${id}`, { method: 'DELETE' }) }
export const menuApi = { get: (id) => request(`/menu/${id}`) }
export const cartApi = { get: () => request('/cart'), addItem: (menuItemId, quantity) => json('POST', '/cart/items', { menu_item_id: menuItemId, quantity }), updateItem: (itemId, quantity) => json('PUT', `/cart/items/${itemId}`, { quantity }), removeItem: (itemId) => request(`/cart/items/${itemId}`, { method: 'DELETE' }), clear: () => request('/cart', { method: 'DELETE' }) }
export const addressApi = { list: () => request('/addresses'), create: (body) => json('POST', '/addresses', body), update: (id, body) => json('PUT', `/addresses/${id}`, body), remove: (id) => request(`/addresses/${id}`, { method: 'DELETE' }) }
export const orderApi = { create: (body) => json('POST', '/orders', body), list: () => request('/orders'), get: (id) => request(`/orders/${id}`), status: (id, status) => json('PATCH', `/orders/${id}/status`, { status }) }
export const fulfillmentApi = { windows: (id) => request(`/fulfillment/restaurants/${id}/delivery-windows`), pickupPoints: (id) => request(`/fulfillment/restaurants/${id}/pickup-points`), createWindow: (body) => json('POST', '/fulfillment/delivery-windows', body), updateWindow: (id, body) => json('PUT', `/fulfillment/delivery-windows/${id}`, body), removeWindow: (id) => request(`/fulfillment/delivery-windows/${id}`, { method: 'DELETE' }), createPickupPoint: (body) => json('POST', '/fulfillment/pickup-points', body), updatePickupPoint: (id, body) => json('PUT', `/fulfillment/pickup-points/${id}`, body), removePickupPoint: (id) => request(`/fulfillment/pickup-points/${id}`, { method: 'DELETE' }) }
export const deliveryApi = { windows: (restaurantId) => request(`/delivery/windows?restaurant_id=${restaurantId}`), createWindow: (body) => json('POST', '/delivery/windows', body) }
export const reviewApi = { update: (id, body) => json('PUT', `/reviews/${id}`, body), remove: (id) => request(`/reviews/${id}`, { method: 'DELETE' }) }
export const userApi = { me: () => request('/users/me'), update: (body) => json('PATCH', '/users/me', body), list: (params = {}) => request(`/users${query(params)}`), updateUser: (id, body) => json('PATCH', `/users/${id}`, body), remove: (id) => request(`/users/${id}`, { method: 'DELETE' }) }
export const kitchenApi = {
  providers: (params = {}) => request(`/kitchens${query(params)}`),
  provider: (id) => request(`/kitchens/${id}`),
  updateProvider: (id, body) => json('PATCH', `/kitchens/${id}`, body),
  createProvider: (body) => json('POST', '/kitchens', body),
  removeProvider: (id) => request(`/kitchens/${id}`, { method: 'DELETE' }),
  menu: (id) => request(`/kitchens/${id}/menu`),
  addDish: (id, body) => json('POST', `/kitchens/${id}/menu`, body),
  updateDish: (id, body) => json('PUT', `/menu/${id}`, body),
  removeDish: (id) => request(`/menu/${id}`, { method: 'DELETE' }),
  locations: (id) => request(`/fulfillment/kitchens/${id}/pickup-points`),
  windows: (id) => request(`/fulfillment/kitchens/${id}/delivery-windows`),
  createLocation: (body) => json('POST', '/fulfillment/pickup-points', body),
  updateLocation: (id, body) => json('PUT', `/fulfillment/pickup-points/${id}`, body),
  removeLocation: (id) => request(`/fulfillment/pickup-points/${id}`, { method: 'DELETE' }),
  createWindow: (body) => json('POST', '/fulfillment/delivery-windows', body),
  updateWindow: (id, body) => json('PUT', `/fulfillment/delivery-windows/${id}`, body),
  removeWindow: (id) => request(`/fulfillment/delivery-windows/${id}`, { method: 'DELETE' }),
  orders: (params = {}) => request(`/kitchen/orders${query(params)}`),
  updateOrderStatus: (id, status) => json('PATCH', `/kitchen/orders/${id}/status`, { status }),
  assign: (id, user_id) => json('POST', `/kitchen/orders/${id}/assign`, { user_id })
}
export const pickupApi = {
  orders: (params = {}) => request(`/pickup-agent/orders${query(params)}`),
  manifest: () => request('/pickup/manifest'),
  collect: (id) => request(`/pickup/orders/${id}/collect`, { method: 'POST' }),
  updateOrderStatus: (id, status) => json('PATCH', `/pickup-agent/orders/${id}/status`, { status }),
  assign: (id, user_id) => json('POST', `/pickup-agent/orders/${id}/assign`, { user_id }),
  receive: (id) => request(`/pickup/orders/${id}/collect`, { method: 'POST' })
}
