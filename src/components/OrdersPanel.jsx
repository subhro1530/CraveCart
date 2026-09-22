const formatDate = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Time pending'

export default function OrdersPanel({ orders, loading, error, onClose, onRetry }) {
  return <div className="dialog-backdrop"><section className="dialog orders-dialog" role="dialog" aria-modal="true" aria-labelledby="orders-title">
    <button className="close-button" type="button" onClick={onClose} aria-label="Close orders">×</button>
    <span className="eyebrow">Your orders</span><h2 id="orders-title">Order history</h2>
    {loading && <p className="loading-state">Loading your orders…</p>}
    {error && <div className="state-card"><p className="form-error" role="alert">{error}</p><button className="small-button" type="button" onClick={onRetry}>Try again</button></div>}
    {!loading && !error && !orders.length && <div className="state-card"><span className="empty-state-icon">🧾</span><h3>No orders yet</h3><p className="account-note">Your completed and scheduled van pickups will appear here.</p></div>}
    {!loading && !error && orders.length > 0 && <div className="order-history">{orders.map((order) => {
      const status = (order.status || 'PLACED').replaceAll('_', ' ')
      const pickup = order.fulfillment_type === 'PICKUP'
      return <article className="order-card" key={order.id}>
        <div><span className="order-id">Order #{order.id}</span><strong>{status}</strong><small>{formatDate(order.created_at || order.placed_at || order.createdAt)}</small></div>
        <div className="order-meta"><span>{pickup ? 'Scheduled van pickup' : 'Delivery'}</span><b>${Number(order.total || 0).toFixed(2)}</b></div>
        {(order.pickup_point_name || order.pickup_point?.name || order.delivery_window_label) && <p>{order.pickup_point_name || order.pickup_point?.name || 'Pickup location'}{order.delivery_window_label ? ` · ${order.delivery_window_label}` : ''}</p>}
      </article>
    })}</div>}
  </section></div>
}
