export default function CartPanel({ cart, onChangeQuantity, onRemove, onClear, onCheckout, onClose, pending, error }) {
  const items = cart?.items || []
  const summary = cart?.summary || cart || {}
  const money = (value) => `$${Number(value || 0).toFixed(2)}`
  return <aside className="cart-panel" aria-label="Your order">
    <div className="cart-panel-header"><div><span className="eyebrow">Your basket</span><h2>Ready when you are</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="Close cart">×</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!items.length ? <div className="empty-cart"><span>🛍️</span><p>Your basket is waiting for something delicious.</p></div> : <>
      <div className="cart-items">{items.map((item) => { const id = item.id ?? item.cart_item_id; const menuItem = item.menu_item || item.menuItem || item; return <div className="cart-item" key={id}><span className="cart-emoji">{menuItem.emoji || '🍽️'}</span><div><strong>{menuItem.name || 'Menu item'}</strong><small>{money(item.line_total ?? item.total ?? Number(menuItem.price) * item.quantity)}</small><div className="quantity"><button type="button" disabled={pending} onClick={() => item.quantity > 1 ? onChangeQuantity(id, item.quantity - 1) : onRemove(id)} aria-label={`Remove one ${menuItem.name || 'item'}`}>−</button><span>{item.quantity}</span><button type="button" disabled={pending} onClick={() => onChangeQuantity(id, item.quantity + 1)} aria-label={`Add one ${menuItem.name || 'item'}`}>+</button></div></div></div> })}</div>
      <div className="bill"><div><span>Subtotal</span><span>{money(summary.subtotal)}</span></div><div><span>Delivery</span><span>{money(summary.deliveryFee ?? summary.delivery_fee)}</span></div><div><span>Tax</span><span>{money(summary.tax)}</span></div><div className="total"><strong>Total</strong><strong>{money(summary.total)}</strong></div></div>
      <button className="checkout-button" type="button" disabled={pending} onClick={onCheckout}>Continue to checkout <span>→</span></button><button className="text-button" type="button" disabled={pending} onClick={onClear}>Clear basket</button>
    </>}
  </aside>
}
