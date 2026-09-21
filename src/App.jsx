import { useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import MenuCard from './components/MenuCard.jsx'
import CartPanel from './components/CartPanel.jsx'
import { categories, menuItems } from './data/menu.js'

function App() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const visibleItems = useMemo(() => menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory || item.tag === activeCategory
    const searchText = `${item.name} ${item.description}`.toLowerCase()
    return matchesCategory && searchText.includes(searchTerm.toLowerCase())
  }), [activeCategory, searchTerm])

  function addToCart(item) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((cartItem) => cartItem.id === item.id)
      if (existingItem) return currentCart.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem)
      return [...currentCart, { ...item, quantity: 1 }]
    })
  }

  function changeQuantity(id, amount) {
    setCart((currentCart) => currentCart.map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0))
  }

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0)

  return <div id="top">
    <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><span className="eyebrow">Dinner, delivered differently</span><h1 id="hero-title">Good food has<br /><em>a feeling.</em></h1><p>Discover local favorites and tiny treasures, brought to your door while they are still delicious.</p><a className="hero-link" href="#menu">Explore the menu <span>↓</span></a></div>
        <div className="hero-art" aria-label="A colorful bowl of food" role="img"><span className="hero-spark">✦</span><span className="hero-plate">🥙</span><span className="hero-note">made with<br /><strong>good energy</strong></span></div>
      </section>
      <section className="menu-section" id="menu" aria-labelledby="menu-title">
        <div className="section-intro"><div><span className="eyebrow">The good stuff</span><h2 id="menu-title">Pick your mood</h2></div><label className="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search dishes" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Search dishes" /></label></div>
        <div className="category-list" role="tablist" aria-label="Filter menu"><span className="category-label">Filter by</span>{categories.map((category) => <button key={category} className={activeCategory === category ? 'selected' : ''} type="button" onClick={() => setActiveCategory(category)} role="tab" aria-selected={activeCategory === category}>{category}</button>)}</div>
        <div className="menu-grid">{visibleItems.length ? visibleItems.map((item) => <MenuCard key={item.id} item={item} onAdd={addToCart} />) : <p className="no-results">No dishes found. Try a different search.</p>}</div>
      </section>
      <section className="how-section" id="how-it-works"><span className="eyebrow">Simple by design</span><h2>From our kitchen<br /><em>to your table.</em></h2><div className="steps"><div><span>01</span><strong>Choose your craving</strong><p>Browse dishes from makers we love.</p></div><div><span>02</span><strong>We make it fresh</strong><p>Your order starts cooking right away.</p></div><div><span>03</span><strong>Meet your meal</strong><p>Fast, friendly delivery to your door.</p></div></div></section>
    </main>
    {isCartOpen && <><button className="backdrop" type="button" aria-label="Close cart" onClick={() => setIsCartOpen(false)}></button><CartPanel cart={cart} onChangeQuantity={changeQuantity} onClose={() => setIsCartOpen(false)} /></>}
  </div>
}

export default App
