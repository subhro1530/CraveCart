import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import MenuCard from './components/MenuCard.jsx'
import CartPanel from './components/CartPanel.jsx'
import AuthPanel from './components/AuthPanel.jsx'
import AccountPanel from './components/AccountPanel.jsx'
import { addressApi, authApi, cartApi, clearToken, orderApi, restaurantApi, setToken, userApi } from './cravecartApi.js'

const listData = (value, key) => Array.isArray(value) ? value : value?.[key] || []
const messageFor = (error) => error.status === 401 ? 'Your session has expired. Please sign in again.' : error.message

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [cart, setCart] = useState({ items: [] })
  const [cartLoading, setCartLoading] = useState(false)
  const [cartMutationLoading, setCartMutationLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [accountError, setAccountError] = useState('')
  const [checkoutPending, setCheckoutPending] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('cravecart_token')
    if (!token) { setAuthLoading(false); return }
    authApi.me().then(setUser).catch(() => { clearToken(); setUser(null) }).finally(() => setAuthLoading(false))
  }, [])
  useEffect(() => { loadRestaurants() }, [searchTerm, openOnly])
  useEffect(() => { if (selectedRestaurant) loadMenu(selectedRestaurant.id) }, [selectedRestaurant])
  useEffect(() => { if (user) loadCart() }, [user])

  async function loadRestaurants() {
    setMenuLoading(true); setMenuError('')
    try {
      const result = await restaurantApi.list({ page: 1, limit: 20, search: searchTerm, isOpen: openOnly || undefined })
      const values = listData(result, 'restaurants')
      setRestaurants(values)
      setSelectedRestaurant((current) => values.find((item) => item.id === current?.id) || values[0] || null)
    } catch (error) { setMenuError(messageFor(error)); setRestaurants([]); setSelectedRestaurant(null) } finally { setMenuLoading(false) }
  }
  async function loadMenu(id) {
    setMenuLoading(true); setMenuError('')
    try { setMenuItems(listData(await restaurantApi.menu(id), 'menuItems')) } catch (error) { setMenuItems([]); setMenuError(messageFor(error)) } finally { setMenuLoading(false) }
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
  function addToCart(item) { if (requireAuth()) mutateCart(() => cartApi.addItem(item.id, 1)) }
  function signOut() { clearToken(); setUser(null); setCart({ items: [] }); setAddresses([]); setOrders([]); setAccountOpen(false) }
  async function submitAuth(mode, form) {
    setAuthPending(true); setAuthError('')
    try { const result = await (mode === 'login' ? authApi.login({ email: form.email, password: form.password }) : authApi.register(form)); setToken(result.token); setUser(result.user || await authApi.me()); setAuthOpen(false) } catch (error) { setAuthError(messageFor(error)) } finally { setAuthPending(false) }
  }
  async function openAccount() {
    if (!requireAuth()) return
    setAccountOpen(true); setAccountError('')
    try { const [addressResult, orderResult, profile] = await Promise.all([addressApi.list(), orderApi.list(), userApi.me()]); setAddresses(listData(addressResult, 'addresses')); setOrders(listData(orderResult, 'orders')); setUser(profile) } catch (error) { if (error.status === 401) signOut(); setAccountError(messageFor(error)) }
  }
  async function checkout() {
    if (!requireAuth() || !cart.items?.length) return
    if (!addresses.length) { await openAccount(); return }
    setCheckoutPending(true); setAccountError('')
    try { const order = await orderApi.create({ address_id: addresses[0].id, payment_method: 'COD' }); await cartApi.get().then(setCart); setOrders((current) => [order, ...current]); setIsCartOpen(false); setAccountOpen(true) } catch (error) { if (error.status === 401) signOut(); setAccountError(messageFor(error)) } finally { setCheckoutPending(false) }
  }
  async function saveProfile(profile) { try { setUser(await userApi.update({ name: profile.name, phone: profile.phone })) } catch (error) { setAccountError(messageFor(error)) } }
  async function saveAddress(address) { try { const created = await addressApi.create(address); setAddresses((current) => [...current, created]) } catch (error) { setAccountError(messageFor(error)) } }
  async function deleteAddress(id) { try { await addressApi.remove(id); setAddresses((current) => current.filter((item) => item.id !== id)) } catch (error) { setAccountError(messageFor(error)) } }

  const visibleItems = useMemo(() => menuItems.filter((item) => `${item.name || ''} ${item.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase())), [menuItems, searchTerm])
  const isAuthenticated = Boolean(user)
  const cartCount = (cart.items || []).reduce((count, item) => count + Number(item.quantity || 0), 0)
  if (authLoading) return <div className="loading-screen">Loading your CraveCart…</div>

  return <div id="top">
    <Header cartCount={cartCount} user={isAuthenticated ? user : null} onAccountClick={isAuthenticated ? openAccount : () => setAuthOpen(true)} onCartClick={() => { if (isAuthenticated) { setIsCartOpen(true); loadCart() } else setAuthOpen(true) }} />
    <main>
      <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><span className="eyebrow">Dinner, delivered differently</span><h1 id="hero-title">Good food has<br /><em>a feeling.</em></h1><p>Discover local favorites and tiny treasures, brought to your door while they are still delicious.</p><a className="hero-link" href="#menu">Explore the menu <span>↓</span></a></div><div className="hero-art" aria-label="A colorful bowl of food" role="img"><span className="hero-spark">✦</span><span className="hero-plate">🥙</span><span className="hero-note">made with<br /><strong>good energy</strong></span></div></section>
      <section className="menu-section" id="menu" aria-labelledby="menu-title"><div className="section-intro"><div><span className="eyebrow">The good stuff</span><h2 id="menu-title">Pick your mood</h2></div><label className="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search restaurants or dishes" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Search restaurants or dishes" /></label></div>
        <div className="restaurant-row"><span className="category-label">Restaurants</span><button className={!selectedRestaurant ? 'selected' : ''} type="button" onClick={() => setSelectedRestaurant(null)}>All</button>{restaurants.map((restaurant) => <button key={restaurant.id} className={selectedRestaurant?.id === restaurant.id ? 'selected' : ''} type="button" onClick={() => setSelectedRestaurant(restaurant)}>{restaurant.name} {restaurant.is_open === false ? '(Closed)' : ''}</button>)}<label className="open-filter"><input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} /> Open now</label></div>
        {selectedRestaurant && <p className="restaurant-summary">{selectedRestaurant.description || selectedRestaurant.address || 'Fresh local favorites, delivered with care.'}</p>}
        {menuError && <p className="form-error" role="alert">{menuError}</p>}{menuLoading ? <div className="loading-state">Loading restaurants and menus…</div> : <div className="menu-grid">{visibleItems.length ? visibleItems.map((item) => <MenuCard key={item.id} item={item} pending={cartMutationLoading} onAdd={addToCart} />) : <p className="no-results">{restaurants.length ? 'No dishes found for this selection.' : 'No restaurants are available right now.'}</p>}</div>}
      </section>
      <section className="how-section" id="how-it-works"><span className="eyebrow">Simple by design</span><h2>From our kitchen<br /><em>to your table.</em></h2><div className="steps"><div><span>01</span><strong>Choose your craving</strong><p>Browse dishes from makers we love.</p></div><div><span>02</span><strong>We make it fresh</strong><p>Your order starts cooking right away.</p></div><div><span>03</span><strong>Meet your meal</strong><p>Fast, friendly delivery to your door.</p></div></div></section>
    </main>
    {isCartOpen && <><button className="backdrop" type="button" aria-label="Close cart" onClick={() => setIsCartOpen(false)}></button><CartPanel cart={cart} pending={cartLoading || cartMutationLoading} error={cartError} onChangeQuantity={(id, quantity) => mutateCart(() => cartApi.updateItem(id, quantity))} onRemove={(id) => mutateCart(() => cartApi.removeItem(id))} onClear={() => mutateCart(() => cartApi.clear())} onCheckout={checkout} onClose={() => setIsCartOpen(false)} /></>}
    {authOpen && <AuthPanel onSubmit={submitAuth} onClose={() => setAuthOpen(false)} error={authError} pending={authPending} />}
    {accountOpen && <AccountPanel user={user} addresses={addresses} orders={orders} error={accountError} pending={checkoutPending} onClose={() => setAccountOpen(false)} onSignOut={signOut} onProfileSave={saveProfile} onAddressSave={saveAddress} onAddressDelete={deleteAddress} />}
  </div>
}

export default App
