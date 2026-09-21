export default function MenuCard({ item, onAdd, pending }) {
  const price = Number(item.price ?? item.base_price ?? 0)
  const available = item.is_available !== false && item.available !== false
  return (
    <article className="menu-card">
      <div className={`food-art ${item.color}`} aria-hidden="true"><span>{item.emoji}</span></div>
      <div className="menu-card-content">
        <div className="card-heading">
          <div>
            <span className="item-tag">{item.tag}</span>
            <h3>{item.name}</h3>
          </div>
          <strong>${price.toFixed(2)}</strong>
        </div>
        <p>{item.description}</p>
        <button className="add-button" type="button" onClick={() => onAdd(item)} disabled={pending || !available}>{available ? 'Add to order' : 'Currently unavailable'} <span>{available ? '+' : '—'}</span></button>
      </div>
    </article>
  )
}
