export default function Header({ cartCount, onCartClick, user, onAccountClick, onOrdersClick }) {
  const operations = ['KITCHEN', 'PICKUP_AGENT', 'RESTAURANT_OWNER', 'ADMIN'].includes(user?.role)
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="CraveCart home">
        <span className="brand-mark">C</span>
        <span>crave<span>cart</span></span>
      </a>
      <nav className="main-nav" aria-label="Primary navigation">
        <a className="active" href={operations ? '#operations' : '#menu'}>{user?.role === 'KITCHEN' ? 'Kitchen dashboard' : user?.role === 'PICKUP_AGENT' ? 'Van dashboard' : user?.role === 'ADMIN' ? 'Admin dashboard' : user?.role === 'RESTAURANT_OWNER' ? 'Restaurant dashboard' : 'Browse menu'}</a>
        {!operations && user && <button className="nav-button" type="button" onClick={onOrdersClick}>Orders</button>}
        <a href={operations ? '#operations' : '#how-it-works'}>{operations ? 'Manage' : 'How it works'}</a>
      </nav>
      <div className="header-actions">
        <button className="account-button" type="button" onClick={onAccountClick}>{user ? user.name || 'Account' : 'Sign in'}</button>
        {!operations && <button className="cart-button" type="button" onClick={onCartClick} aria-label={`Open cart with ${cartCount} items`}>Cart <span>{cartCount}</span></button>}
      </div>
    </header>
  )
}
