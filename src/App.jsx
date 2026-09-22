import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import MenuCard from './components/MenuCard.jsx'
import CartPanel from './components/CartPanel.jsx'
import AuthPanel from './components/AuthPanel.jsx'
import AccountPanel from './components/AccountPanel.jsx'
import OperationsPanel from './components/OperationsPanel.jsx'
import OrdersPanel from './components/OrdersPanel.jsx'
import { addressApi, authApi, cartApi, clearToken, fulfillmentApi, kitchenApi, orderApi, restaurantApi, setToken, userApi } from './cravecartApi.js'

const listData = (value, key) => Array.isArray(value) ? value : value?.[key] || []
const messageFor = (error) => error.status === 401 ? 'Your session has expired. Please sign in again.' : error.message

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [kitchens, setKitchens] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [selectedKitchen, setSelectedKitchen] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [dishSource, setDishSource] = useState('ALL')
  const [fulfillmentInfo, setFulfillmentInfo] = useState({ windows: [], points: [] })
  const [cart, setCart] = useState({ items: [] })
  const [cartLoading, setCartLoading] = useState(false)
  const [cartMutationLoading, setCartMutationLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [accountError, setAccountError] = useState('')
  const [checkoutPending, setCheckoutPending] = useState(false)
  const [checkoutOptions, setCheckoutOptions] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('cravecart_token')
    if (!token) { setAuthLoading(false); return }
    authApi.me().then(setUser).catch(() => { clearToken(); setUser(null) }).finally(() => setAuthLoading(false))
  }, [])
  useEffect(() => { loadRestaurants(); loadKitchens() }, [searchTerm, openOnly])
  useEffect(() => {
    const provider = selectedKitchen || selectedRestaurant
    if (provider) {
      if (selectedKitchen) loadKitchenMenu(provider.id)
      else loadMenu(provider.id)
      loadFulfillment(provider.id, Boolean(selectedKitchen))
    } else setFulfillmentInfo({ windows: [], points: [] })
  }, [selectedRestaurant, selectedKitchen, restaurants, kitchens])
  useEffect(() => { if (user) loadCart() }, [user])

  async function loadRestaurants() {
    setMenuLoading(true); setMenuError('')
    try {
      const result = await restaurantApi.list({ page: 1, limit: 20, search: searchTerm, isOpen: openOnly || undefined })
      const values = listData(result, 'restaurants')
      setRestaurants(values)
      setSelectedRestaurant((current) => current ? values.find((item) => item.id === current.id) || null : values[0] || null)
    } catch (error) { setMenuError(messageFor(error)); setRestaurants([]); setSelectedRestaurant(null) } finally { setMenuLoading(false) }
  }
  async function loadKitchens() {
    try {
      const result = await kitchenApi.providers({ page: 1, limit: 20, search: searchTerm, isOpen: openOnly || undefined })
      setKitchens(listData(result, 'kitchens'))
    } catch { setKitchens([]) }
  }
  async function loadMenu(id) {
    setMenuLoading(true); setMenuError('')
    try { setMenuItems(listData(await restaurantApi.menu(id), 'menuItems')) } catch (error) { setMenuItems([]); setMenuError(messageFor(error)) } finally { setMenuLoading(false) }
  }
  async function loadKitchenMenu(id) {
    setMenuLoading(true); setMenuError('')
    try { setMenuItems(listData(await kitchenApi.menu(id), 'menuItems').map((item) => ({ ...item, source: 'KITCHEN' }))) } catch (error) { setMenuItems([]); setMenuError(messageFor(error)) } finally { setMenuLoading(false) }
  }
  async function loadFulfillment(id, kitchen = false) {
    try {
      const [windows, points] = await Promise.all([kitchen ? kitchenApi.windows(id) : fulfillmentApi.windows(id), kitchen ? kitchenApi.locations(id) : fulfillmentApi.pickupPoints(id)])
      setFulfillmentInfo({ windows: listData(windows, 'windows'), points: listData(points, 'pickupPoints') })
    } catch { setFulfillmentInfo({ windows: [], points: [] }) }
  }
  async function loadAllMenus(restaurantValues, kitchenValues) {
    if (!restaurantValues.length && !kitchenValues.length) { setMenuItems([]); return }
    setMenuLoading(true); setMenuError('')
    try {
      const restaurantMenus = await Promise.all(restaurantValues.map((restaurant) => restaurantApi.menu(restaurant.id).catch(() => [])))
      const kitchenMenus = await Promise.all(kitchenValues.map((kitchen) => kitchenApi.menu(kitchen.id).catch(() => [])))
      setMenuItems([
        ...restaurantMenus.flat().map((item) => ({ ...item, source: 'RESTAURANT' })),
        ...kitchenMenus.flat().map((item) => ({ ...item, source: 'KITCHEN' }))
      ])
    } catch (error) { setMenuItems([]); setMenuError(messageFor(error)) } finally { setMenuLoading(false) }
  }
  async function loadCart() {
    setCartLoading(true)
    try { setCart(await cartApi.get() || { items: [] }) } catch (error) { if (error.status === 401) signOut(); setCartError(messageFor(error)) } finally { setCartLoading(false) }
  }
  async function mutateCart(action) {
    setCartMutationLoading(true); setCartError('')
    try { setCart(await action() || { items: [] }) } catch (error) { if (error.status === 401) signOut(); setCartError(messageFor(error)) } finally { setCartMutationLoading(false) }
  }
  function requireAuth() { if (!user) { setAuthOpen(true); setIsCartOpen(false); return false } return true }
  function addToCart(item) {
    if (!requireAuth()) return
    mutateCart(() => cartApi.addItem(item.id, 1)).then(() => setIsCartOpen(true))
  }
  function signOut() { clearToken(); setUser(null); setCart({ items: [] }); setAddresses([]); setOrders([]); setAccountOpen(false) }
  async function submitAuth(mode, form) {
    setAuthPending(true); setAuthError('')
    try {
      const payload = mode === 'login'
        ? { email: form.email, password: form.password, role: form.role }
        : { name: form.name, email: form.email, password: form.password, role: form.role, admin_passphrase: form.admin_passphrase || undefined }
      const result = await (mode === 'login' ? authApi.login(payload) : authApi.register(payload))
      setToken(result.token); setUser(result.user || await authApi.me()); setAuthOpen(false)
    } catch (error) { setAuthError(messageFor(error)) } finally { setAuthPending(false) }
  }
  async function openAccount() {
    if (!requireAuth()) return
    setAccountOpen(true); setAccountError('')
    try { const [addressResult, orderResult, profile] = await Promise.all([addressApi.list(), orderApi.list(), userApi.me()]); setAddresses(listData(addressResult, 'addresses')); setOrders(listData(orderResult, 'orders')); setUser(profile) } catch (error) { if (error.status === 401) signOut(); setAccountError(messageFor(error)) }
  }
  async function openOrders() {
    if (!requireAuth()) return
    setOrdersOpen(true); setOrdersLoading(true); setOrdersError('')
    try { setOrders(listData(await orderApi.list(), 'orders')) }
    catch (error) { if (error.status === 401) signOut(); setOrdersError(messageFor(error)) }
    finally { setOrdersLoading(false) }
  }
  async function beginCheckout() {
    if (!requireAuth() || !cart.items?.length) return
    setCartError('')
    try {
      const addressResult = addresses.length ? addresses : await addressApi.list().then((result) => listData(result, 'addresses')).catch(() => [])
      setAddresses(addressResult)
      const provider = cart.cart || cart.items[0] || {}
      const restaurantId = selectedRestaurant?.id || provider.restaurant_id || cart.items[0]?.restaurant_id
      const kitchenId = selectedKitchen?.id || provider.kitchen_id || cart.items[0]?.kitchen_id
      const [windows, points] = kitchenId && !restaurantId
        ? await Promise.all([kitchenApi.windows(kitchenId), kitchenApi.locations(kitchenId)])
        : restaurantId ? await Promise.all([fulfillmentApi.windows(restaurantId), fulfillmentApi.pickupPoints(restaurantId)]) : [[], []]
      const validWindows = listData(windows, 'windows').filter((window) => window.is_active !== false)
      const validPoints = listData(points, 'pickupPoints').filter((point) => point.is_active !== false)
      setCheckoutOptions({ type: 'PICKUP', addresses: addressResult, address_id: addressResult[0]?.id || '', delivery_window_id: validWindows[0]?.id || '', pickup_point_id: validPoints[0]?.id || '', windows: validWindows, points: validPoints })
    } catch (error) { setCartError(messageFor(error)) }
  }
  async function checkout() {
    if (!checkoutOptions || !cart.items?.length) return
    setCheckoutPending(true); setAccountError('')
    try {
      const payload = checkoutOptions.type === 'PICKUP'
        ? { fulfillment_type: 'PICKUP', pickup_point_id: Number(checkoutOptions.pickup_point_id), delivery_window_id: checkoutOptions.delivery_window_id ? Number(checkoutOptions.delivery_window_id) : undefined, payment_method: 'COD' }
        : { fulfillment_type: 'DELIVERY', address_id: Number(checkoutOptions.address_id), delivery_window_id: checkoutOptions.delivery_window_id ? Number(checkoutOptions.delivery_window_id) : undefined, payment_method: 'COD' }
      const order = await orderApi.create(payload)
      await cartApi.get().then(setCart); setOrders((current) => [order, ...current]); setCheckoutOptions(null); setIsCartOpen(false); setAccountOpen(true)
    } catch (error) { if (error.status === 401) signOut(); setAccountError(messageFor(error)) } finally { setCheckoutPending(false) }
  }
  async function saveProfile(profile) { try { setUser(await userApi.update({ name: profile.name, phone: profile.phone })) } catch (error) { setAccountError(messageFor(error)) } }
  async function saveAddress(address) { try { const created = await addressApi.create(address); setAddresses((current) => [...current, created]) } catch (error) { setAccountError(messageFor(error)) } }
  async function updateAddress(id, address) { try { const updated = await addressApi.update(id, address); setAddresses((current) => current.map((item) => item.id === id ? updated : item)) } catch (error) { setAccountError(messageFor(error)) } }
  async function deleteAddress(id) { try { await addressApi.remove(id); setAddresses((current) => current.filter((item) => item.id !== id)) } catch (error) { setAccountError(messageFor(error)) } }
  async function cancelOrder(id) { if (!window.confirm('Cancel this order?')) return; try { const updated = await orderApi.status(id, 'CANCELLED'); setOrders((current) => current.map((item) => item.id === id ? updated : item)) } catch (error) { setAccountError(messageFor(error)) } }

  const visibleItems = useMemo(() => menuItems.filter((item) => {
    const text = `${item.name || ''} ${item.description || ''}`.toLowerCase()
    const source = String(item.source || item.menu_type || item.category_type || 'RESTAURANT').toUpperCase()
    return text.includes(searchTerm.toLowerCase()) && (dishSource === 'ALL' || source.includes(dishSource))
  }), [menuItems, searchTerm, dishSource])
  const isAuthenticated = Boolean(user)
  const cartCount = (cart.items || []).reduce((count, item) => count + Number(item.quantity || 0), 0)
  useEffect(() => {
    if (!selectedRestaurant && !selectedKitchen) loadAllMenus(restaurants, kitchens)
  }, [selectedRestaurant, selectedKitchen, restaurants, kitchens])

  if (authLoading) return <div className="loading-screen">Loading your CraveCart…</div>

  if (user && user.role !== 'CUSTOMER') return <><Header cartCount={0} user={user} onAccountClick={() => {}} onCartClick={() => {}} /><OperationsPanel user={user} onSignOut={signOut} /></>

  return <div id="top">
    <Header cartCount={cartCount} user={isAuthenticated ? user : null} onAccountClick={isAuthenticated ? openAccount : () => setAuthOpen(true)} onOrdersClick={openOrders} onCartClick={() => { if (isAuthenticated) { setIsCartOpen(true); loadCart() } else setAuthOpen(true) }} />
    <main>
      <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><span className="eyebrow">Dinner, delivered differently</span><h1 id="hero-title">Good food has<br /><em>a feeling.</em></h1><p>Discover local favorites and tiny treasures, brought to your door while they are still delicious.</p><a className="hero-link" href="#menu">Explore the menu <span>↓</span></a></div><div className="hero-art" aria-label="A colorful bowl of food" role="img"><span className="hero-spark">✦</span><span className="hero-plate">🥙</span><span className="hero-note">made with<br /><strong>good energy</strong></span></div></section>
      <section className="menu-section" id="menu" aria-labelledby="menu-title"><div className="section-intro"><div><span className="eyebrow">The good stuff</span><h2 id="menu-title">Pick your mood</h2></div><label className="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search restaurants or dishes" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Search restaurants or dishes" /></label></div>
        <div className="restaurant-row"><span className="category-label">Restaurants</span><button className={!selectedRestaurant && !selectedKitchen ? 'selected' : ''} type="button" onClick={() => { setSelectedRestaurant(null); setSelectedKitchen(null) }}>All</button>{restaurants.map((restaurant) => <button key={restaurant.id} className={selectedRestaurant?.id === restaurant.id ? 'selected' : ''} type="button" onClick={() => { setSelectedKitchen(null); setSelectedRestaurant(restaurant) }}>{restaurant.name} {restaurant.is_open === false ? '(Closed)' : ''}</button>)}<label className="open-filter"><input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} /> Open now</label></div>
        <div className="restaurant-row"><span className="category-label">Kitchens</span>{kitchens.length ? kitchens.map((kitchen) => <button key={kitchen.id} className={selectedKitchen?.id === kitchen.id ? 'selected' : ''} type="button" onClick={() => { setSelectedRestaurant(null); setSelectedKitchen(kitchen) }}>{kitchen.name} {kitchen.is_open === false ? '(Closed)' : ''}</button>) : <span className="account-note">No kitchens available yet.</span>}</div>
        <div className="category-list dish-source-tabs"><span className="category-label">Dishes</span>{[['ALL','All dishes'],['RESTAURANT','Restaurant dishes'],['KITCHEN','Kitchen dishes']].map(([value, label]) => <button key={value} className={dishSource === value ? 'selected' : ''} type="button" onClick={() => setDishSource(value)}>{label}</button>)}</div>
        {(selectedRestaurant || selectedKitchen) && <p className="restaurant-summary">{(selectedKitchen || selectedRestaurant).description || (selectedKitchen || selectedRestaurant).address || 'Fresh local favorites, delivered with care.'} {fulfillmentInfo.points.length > 0 && ` · Pickup at ${fulfillmentInfo.points.map((point) => point.name).join(', ')}`} {fulfillmentInfo.windows.length > 0 && ` · Windows: ${fulfillmentInfo.windows.map((window) => `${window.label} (${window.starts_at}–${window.ends_at})`).join(', ')}`}</p>}
        {menuError && <p className="form-error" role="alert">{menuError}</p>}{menuLoading ? <div className="loading-state">Loading restaurants and menus…</div> : <div className="menu-grid">{visibleItems.length ? visibleItems.map((item) => <MenuCard key={item.id} item={item} pending={cartMutationLoading} onAdd={addToCart} />) : <p className="no-results">{restaurants.length ? 'No dishes found for this selection.' : 'No restaurants are available right now.'}</p>}</div>}
      </section>
      <section className="how-section" id="how-it-works"><span className="eyebrow">Simple by design</span><h2>From our kitchen<br /><em>to your table.</em></h2><div className="steps"><div><span>01</span><strong>Choose your craving</strong><p>Browse dishes from makers we love.</p></div><div><span>02</span><strong>We make it fresh</strong><p>Your order starts cooking right away.</p></div><div><span>03</span><strong>Meet your meal</strong><p>Fast, friendly delivery to your door.</p></div></div></section>
    </main>
    {isCartOpen && <><button className="backdrop" type="button" aria-label="Close cart" onClick={() => setIsCartOpen(false)}></button><CartPanel cart={cart} pending={cartLoading || cartMutationLoading || checkoutPending} error={cartError} checkoutOptions={checkoutOptions} onCheckoutOptions={setCheckoutOptions} onChangeQuantity={(id, quantity) => mutateCart(() => cartApi.updateItem(id, quantity))} onRemove={(id) => mutateCart(() => cartApi.removeItem(id))} onClear={() => mutateCart(() => cartApi.clear())} onCheckout={checkoutOptions ? checkout : beginCheckout} onClose={() => setIsCartOpen(false)} /></>}
    {authOpen && <AuthPanel onSubmit={submitAuth} onClose={() => setAuthOpen(false)} error={authError} pending={authPending} />}
    {accountOpen && <AccountPanel user={user} addresses={addresses} orders={orders} error={accountError} pending={checkoutPending} onClose={() => setAccountOpen(false)} onSignOut={signOut} onProfileSave={saveProfile} onAddressSave={saveAddress} onAddressUpdate={updateAddress} onAddressDelete={deleteAddress} onOrderCancel={cancelOrder} />}
    {ordersOpen && <OrdersPanel orders={orders} loading={ordersLoading} error={ordersError} onRetry={openOrders} onClose={() => setOrdersOpen(false)} />}
  </div>
}

export default App
