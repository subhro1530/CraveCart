import { useEffect, useState } from 'react'
import { fulfillmentApi, kitchenApi, pickupApi, restaurantAdminApi, restaurantApi, userApi } from '../cravecartApi.js'

const statusOptions = {
  KITCHEN: ['PREPARING', 'READY_FOR_PICKUP'],
  PICKUP_AGENT: ['COLLECTED', 'AT_PICKUP_POINT'],
}
const roles = ['CUSTOMER', 'RESTAURANT_OWNER', 'ADMIN', 'KITCHEN', 'PICKUP_AGENT']

export default function OperationsPanel({ user, onSignOut }) {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [restaurants, setRestaurants] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', is_available: true })
  const [editingMenuId, setEditingMenuId] = useState(null)
  const [restaurantEdit, setRestaurantEdit] = useState(null)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', address: '', description: '', phone: '' })
  const [serviceForm, setServiceForm] = useState({ restaurant_id: '', label: '', starts_at: '11:00', ends_at: '14:00', name: '', address: '', access_code: '', type: 'window' })
  const [windows, setWindows] = useState([])
  const [pickupPoints, setPickupPoints] = useState([])
  const isKitchen = user.role === 'KITCHEN'
  const isPickup = user.role === 'PICKUP_AGENT'
  const isAdmin = user.role === 'ADMIN'
  const isOwner = user.role === 'RESTAURANT_OWNER'
  const isMenuManager = isOwner || isAdmin || isKitchen
  const api = isKitchen ? kitchenApi : isPickup ? pickupApi : null

  async function load() {
    setError('')
    if (!api) { setOrders([]); return }
    try { setOrders(await api.orders()) } catch (requestError) { setError(requestError.message) }
  }
  useEffect(() => { load(); if (isMenuManager) (isKitchen ? kitchenApi.providers({ limit: 100 }) : restaurantApi.list({ limit: 100 })).then((result) => { const rows = Array.isArray(result) ? result : result?.restaurants || result?.kitchens || result?.rows || []; setRestaurants(rows); setSelectedRestaurant((current) => rows.find((item) => item.id === current?.id) || rows[0] || null) }).catch((e) => setError(e.message)); if (isAdmin) userApi.list({ limit: 100 }).then((result) => setUsers(Array.isArray(result) ? result : result?.rows || [])).catch(() => {}) }, [user.role])
  useEffect(() => { if (selectedRestaurant) refreshRestaurantData(selectedRestaurant.id) }, [selectedRestaurant])

  async function refreshRestaurantData(id) {
    try {
      const [menu, windowResult, pointResult] = await Promise.all([isKitchen ? kitchenApi.menu(id) : restaurantApi.menu(id), isKitchen ? kitchenApi.windows(id) : fulfillmentApi.windows(id), isKitchen ? kitchenApi.locations(id) : fulfillmentApi.pickupPoints(id)])
      setMenuItems(Array.isArray(menu) ? menu : menu?.menuItems || menu?.rows || [])
      setWindows(Array.isArray(windowResult) ? windowResult : windowResult?.windows || [])
      setPickupPoints(Array.isArray(pointResult) ? pointResult : pointResult?.pickupPoints || [])
    } catch (e) { setError(e.message) }
  }

  async function update(id, status) {
    try { await api.updateOrderStatus(id, status); await load() } catch (requestError) { setError(requestError.message) }
  }
  async function collect(orderId) {
    try { await pickupApi.collect(orderId); await load() } catch (requestError) { setError(requestError.message) }
  }
  async function createRestaurant(event) {
    event.preventDefault()
    try {
      const created = await (isKitchen ? kitchenApi.createProvider(form) : restaurantAdminApi.create(form))
      setRestaurants((current) => [...current, created]); setSelectedRestaurant(created); setForm({ name: '', address: '', description: '', phone: '' })
    } catch (requestError) { setError(requestError.message) }
  }
  async function saveRestaurant(event) {
    event.preventDefault()
    try { const updated = await (isKitchen ? kitchenApi.updateProvider(restaurantEdit.id, restaurantEdit) : restaurantAdminApi.update(restaurantEdit.id, restaurantEdit)); setRestaurants((current) => current.map((item) => item.id === updated.id ? updated : item)); setSelectedRestaurant(updated); setRestaurantEdit(null) } catch (requestError) { setError(requestError.message) }
  }
  async function saveMenu(event) {
    event.preventDefault()
    try {
      const payload = { ...menuForm, price: Number(menuForm.price) }
      const saved = editingMenuId ? await (isKitchen ? kitchenApi.updateDish(editingMenuId, payload) : restaurantAdminApi.updateMenu(editingMenuId, payload)) : await (isKitchen ? kitchenApi.addDish(selectedRestaurant.id, payload) : restaurantAdminApi.addMenu(selectedRestaurant.id, payload))
      setMenuItems((current) => editingMenuId ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved])
      setMenuForm({ name: '', description: '', price: '', is_available: true }); setEditingMenuId(null)
    } catch (requestError) { setError(requestError.message) }
  }
  async function createService(event) {
    event.preventDefault()
    try {
      const providerKey = isKitchen ? 'kitchen_id' : 'restaurant_id'
      const providerId = Number(serviceForm.restaurant_id)
      if (serviceForm.type === 'pickup') await (isKitchen ? kitchenApi.createLocation({ [providerKey]: providerId, name: serviceForm.name || serviceForm.label, address: serviceForm.address, access_code: serviceForm.access_code || 'OPEN1234' }) : fulfillmentApi.createPickupPoint({ [providerKey]: providerId, name: serviceForm.name || serviceForm.label, address: serviceForm.address, access_code: serviceForm.access_code || 'OPEN1234' }))
      else await (isKitchen ? kitchenApi.createWindow({ [providerKey]: providerId, label: serviceForm.label, starts_at: serviceForm.starts_at, ends_at: serviceForm.ends_at, is_active: true }) : fulfillmentApi.createWindow({ [providerKey]: providerId, label: serviceForm.label, starts_at: serviceForm.starts_at, ends_at: serviceForm.ends_at, is_active: true }))
      setServiceForm({ ...serviceForm, label: '', name: '', address: '', access_code: '' })
      if (serviceForm.restaurant_id) await refreshRestaurantData(Number(serviceForm.restaurant_id))
    } catch (requestError) { setError(requestError.message) }
  }

  return <main id="operations" className="menu-section">
    <div className="section-intro"><div><span className="eyebrow">{isKitchen ? 'Kitchen partner' : isPickup ? 'Pickup agent' : isOwner ? 'Restaurant studio' : 'Operations center'}</span><h1>{isKitchen ? "Today's kitchen queue" : isPickup ? "Today's van manifest" : isOwner ? 'Manage your restaurant' : 'Admin command center'}</h1></div><button className="small-button" type="button" onClick={onSignOut}>Sign out</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {(isKitchen || isPickup) && <><div className="operations-summary"><strong>{orders.length}</strong><span>active orders in your queue</span></div>{!orders.length && <p className="account-note">No assigned orders for this service window.</p>}<div className="account-list">{orders.map((order) => <article className="account-row" key={order.id}><span><strong>Order #{order.id}</strong><br />{order.restaurant_name || order.restaurant?.name || 'CraveCart partner'} · <b>{(order.status || '').replaceAll('_', ' ')}</b></span><span>{isPickup && ['READY_FOR_PICKUP', 'AT_PICKUP_POINT'].includes(order.status) ? <button className="small-button" type="button" onClick={() => collect(order.id)}>Mark picked up</button> : statusOptions[user.role].filter((status) => status !== order.status).map((status) => <button className="small-button" type="button" key={status} onClick={() => update(order.id, status)}>{status.replaceAll('_', ' ')}</button>)}</span></article>)}</div></>}
    {isAdmin && <section className="management-card"><h2>User access</h2><p className="account-note">Manage operational workspaces and remove accounts without exposing passwords.</p><div className="account-list">{users.map((item) => <article className="account-row" key={item.id}><span><strong>{item.name}</strong><br />{item.email}</span><span><select aria-label={`Role for ${item.email}`} value={item.role} onChange={(event) => userApi.updateUser(item.id, { role: event.target.value }).then((updated) => setUsers((current) => current.map((entry) => entry.id === item.id ? updated : entry))).catch((e) => setError(e.message))}>{roles.map((role) => <option value={role} key={role}>{role}</option>)}</select><button className="text-button" type="button" onClick={() => userApi.remove(item.id).then(() => setUsers((current) => current.filter((entry) => entry.id !== item.id))).catch((e) => setError(e.message))}>Delete</button></span></article>)}</div></section>}
    {isMenuManager && <section className="management-card"><h2>{isAdmin ? 'Restaurants, menus & fulfillment' : isKitchen ? 'Kitchen dishes & pickup setup' : 'Restaurant studio'}</h2>{(isKitchen || isAdmin || isOwner) && <form className="admin-form" onSubmit={createRestaurant}>{Object.keys(form).map((field) => <input key={field} required={field !== 'description' && field !== 'phone'} placeholder={field.replace('_', ' ')} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />)}<button className="checkout-button" type="submit">Create {isKitchen ? 'kitchen' : 'restaurant'} <span>→</span></button></form>}
      <div className="account-list"><h3>{isKitchen ? 'Kitchen providers' : 'Your restaurants'}</h3>{restaurants.map((restaurant) => <article className="account-row" key={restaurant.id}><span><strong>{restaurant.name}</strong><br />{restaurant.address}</span><span><button className="text-button" type="button" onClick={() => setRestaurantEdit({ ...restaurant })}>Edit</button><button className="text-button" type="button" onClick={() => (isKitchen ? kitchenApi.removeProvider(restaurant.id) : restaurantAdminApi.remove(restaurant.id)).then(() => { setRestaurants((current) => current.filter((item) => item.id !== restaurant.id)); if (selectedRestaurant?.id === restaurant.id) setSelectedRestaurant(null) }).catch((e) => setError(e.message))}>Delete</button></span></article>)}</div>
      {restaurantEdit && <form className="admin-form" onSubmit={saveRestaurant}><input required value={restaurantEdit.name} onChange={(event) => setRestaurantEdit({ ...restaurantEdit, name: event.target.value })} /><input required value={restaurantEdit.address} onChange={(event) => setRestaurantEdit({ ...restaurantEdit, address: event.target.value })} /><input placeholder="Phone" value={restaurantEdit.phone || ''} onChange={(event) => setRestaurantEdit({ ...restaurantEdit, phone: event.target.value })} /><input placeholder="Description" value={restaurantEdit.description || ''} onChange={(event) => setRestaurantEdit({ ...restaurantEdit, description: event.target.value })} /><button className="small-button" type="submit">Save restaurant</button><button className="text-button" type="button" onClick={() => setRestaurantEdit(null)}>Cancel</button></form>}
      <div className="account-list"><h3>Menu {selectedRestaurant ? `· ${selectedRestaurant.name}` : ''}</h3>{selectedRestaurant && <form className="admin-form" onSubmit={saveMenu}><input required placeholder="Dish name" value={menuForm.name} onChange={(event) => setMenuForm({ ...menuForm, name: event.target.value })} /><input required type="number" min="0" step="0.01" placeholder="Price" value={menuForm.price} onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })} /><input placeholder="Description" value={menuForm.description} onChange={(event) => setMenuForm({ ...menuForm, description: event.target.value })} /><button className="small-button" type="submit">{editingMenuId ? 'Save dish' : 'Add dish'}</button></form>}{menuItems.map((item) => <article className="account-row" key={item.id}><span><strong>{item.name}</strong><br />${Number(item.price).toFixed(2)} · {item.is_available === false ? 'Unavailable' : 'Available'}</span><span><button className="text-button" type="button" onClick={() => { setEditingMenuId(item.id); setMenuForm({ name: item.name, description: item.description || '', price: item.price, is_available: item.is_available !== false }) }}>Edit</button><button className="text-button" type="button" onClick={() => (isKitchen ? kitchenApi.removeDish(item.id) : restaurantAdminApi.removeMenu(item.id)).then(() => setMenuItems((current) => current.filter((entry) => entry.id !== item.id))).catch((e) => setError(e.message))}>Delete</button></span></article>)}</div>
      <form className="admin-form service-form" onSubmit={createService}><select value={serviceForm.type} onChange={(event) => setServiceForm({ ...serviceForm, type: event.target.value })}><option value="window">Pickup window</option><option value="pickup">Pickup location</option></select><select required value={serviceForm.restaurant_id} onChange={(event) => setServiceForm({ ...serviceForm, restaurant_id: event.target.value })}><option value="">Choose {isKitchen ? 'kitchen' : 'restaurant'}</option>{restaurants.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><input placeholder="Label or pickup name" value={serviceForm.label} onChange={(event) => setServiceForm({ ...serviceForm, label: event.target.value, name: event.target.value })} required />{serviceForm.type === 'pickup' && <input placeholder="Pickup address" value={serviceForm.address} onChange={(event) => setServiceForm({ ...serviceForm, address: event.target.value })} required />}{serviceForm.type === 'window' && <><input type="time" value={serviceForm.starts_at} onChange={(event) => setServiceForm({ ...serviceForm, starts_at: event.target.value })} /><input type="time" value={serviceForm.ends_at} onChange={(event) => setServiceForm({ ...serviceForm, ends_at: event.target.value })} /></>}<button className="small-button" type="submit">Add {serviceForm.type === 'window' ? 'window' : 'location'}</button></form>
      {selectedRestaurant && <div className="service-lists"><h3>Pickup windows</h3>{windows.map((item) => <article className="account-row" key={`window-${item.id}`}><span>{item.label} · {item.starts_at}–{item.ends_at}</span><button className="text-button" type="button" onClick={() => (isKitchen ? kitchenApi.removeWindow(item.id) : fulfillmentApi.removeWindow(item.id)).then(() => refreshRestaurantData(selectedRestaurant.id)).catch((e) => setError(e.message))}>Delete</button></article>)}<h3>Pickup locations</h3>{pickupPoints.map((item) => <article className="account-row" key={`point-${item.id}`}><span>{item.name}<br /><small>{item.address}</small></span><button className="text-button" type="button" onClick={() => (isKitchen ? kitchenApi.removeLocation(item.id) : fulfillmentApi.removePickupPoint(item.id)).then(() => refreshRestaurantData(selectedRestaurant.id)).catch((e) => setError(e.message))}>Delete</button></article>)}</div>}</section>}
  </main>
}
