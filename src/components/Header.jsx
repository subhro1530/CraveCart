export default function Header({ cartCount, onCartClick }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="CraveCart home">
        <span className="brand-mark">C</span>
        <span>crave<span>cart</span></span>
      </a>
      <nav className="main-nav" aria-label="Primary navigation">
        <a className="active" href="#menu">Browse menu</a>
        <a href="#how-it-works">How it works</a>
      </nav>
      <button className="cart-button" type="button" onClick={onCartClick} aria-label={`Open cart with ${cartCount} items`}>
        Cart <span>{cartCount}</span>
      </button>
    </header>
  )
}
