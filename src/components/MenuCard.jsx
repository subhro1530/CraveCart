export default function MenuCard({ item, onAdd }) {
  return (
    <article className="menu-card">
      <div className={`food-art ${item.color}`} aria-hidden="true"><span>{item.emoji}</span></div>
      <div className="menu-card-content">
        <div className="card-heading">
          <div>
            <span className="item-tag">{item.tag}</span>
            <h3>{item.name}</h3>
          </div>
          <strong>${item.price.toFixed(2)}</strong>
        </div>
        <p>{item.description}</p>
        <button className="add-button" type="button" onClick={() => onAdd(item)}>Add to order <span>+</span></button>
      </div>
    </article>
  )
}
