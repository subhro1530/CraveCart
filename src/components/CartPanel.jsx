export default function CartPanel({ cart, onChangeQuantity, onClose }) {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const delivery = cart.length ? 2.99 : 0
  const total = subtotal + delivery

  return (
    <aside className="cart-panel" aria-label="Your order">
      <div className="cart-panel-header">
        <div><span className="eyebrow">Your basket</span><h2>Ready when you are</h2></div>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close cart">×</button>
      </div>
      {cart.length === 0 ? <div className="empty-cart"><span>🛍️</span><p>Your basket is waiting for something delicious.</p></div> : <>
        <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><span className="cart-emoji">{item.emoji}</span><div><strong>{item.name}</strong><small>${(item.price * item.quantity).toFixed(2)}</small><div className="quantity"><button type="button" onClick={() => onChangeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => onChangeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button></div></div></div>)}</div>
        <div className="bill"><div><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div><div><span>Delivery</span><span>${delivery.toFixed(2)}</span></div><div className="total"><strong>Total</strong><strong>${total.toFixed(2)}</strong></div></div>
        <button className="checkout-button" type="button" onClick={() => alert('Checkout is next sprint. Your order is saved in this demo!')}>Continue to checkout <span>→</span></button>
      </>}
    </aside>
  )
}
