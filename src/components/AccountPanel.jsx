import { useState } from 'react'
import { restaurantApi } from '../cravecartApi.js'

const emptyAddress = { label: '', address_line: '', city: '', state: '', postal_code: '' }

export default function AccountPanel({ user, addresses, orders, error, pending, onClose, onSignOut, onProfileSave, onAddressSave, onAddressUpdate, onAddressDelete, onOrderCancel }) {
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [address, setAddress] = useState(emptyAddress)
  const [editingAddress, setEditingAddress] = useState(null)
  const [review, setReview] = useState({ order_id: '', restaurant_id: '', rating: 5, comment: '' })
  const [reviewMessage, setReviewMessage] = useState('')
  async function submitReview(event) {
    event.preventDefault(); setReviewMessage('')
    try { await restaurantApi.addReview(review.restaurant_id, { order_id: Number(review.order_id), rating: Number(review.rating), comment: review.comment }); setReviewMessage('Review submitted.') } catch (reviewError) { setReviewMessage(reviewError.message) }
  }
  function editAddress(item) { setEditingAddress(item.id); setAddress({ label: item.label || '', address_line: item.address_line || '', city: item.city || '', state: item.state || '', postal_code: item.postal_code || '' }) }
  function resetAddress() { setEditingAddress(null); setAddress(emptyAddress) }
  return <div className="dialog-backdrop"><section className="dialog account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
    <button className="close-button" type="button" onClick={onClose} aria-label="Close account">×</button><span className="eyebrow">Your account</span><h2 id="account-title">{user?.name || user?.email}</h2>{error && <p className="form-error" role="alert">{error}</p>}
    <form className="account-form" onSubmit={(event) => { event.preventDefault(); onProfileSave(profile) }}><h3>Profile</h3><label>Name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label>Phone<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><button className="small-button" type="submit" disabled={pending}>Save profile</button></form>
    <div className="account-list"><h3>Saved addresses</h3>{addresses.length ? addresses.map((item) => <div className="account-row" key={item.id}><span><strong>{item.label}</strong><br />{item.address_line}, {item.city}</span><span><button className="text-button" type="button" onClick={() => editAddress(item)}>Edit</button><button className="text-button" type="button" onClick={() => onAddressDelete(item.id)}>Delete</button></span></div>) : <p className="account-note">No saved addresses yet.</p>}
      <form onSubmit={(event) => { event.preventDefault(); editingAddress ? onAddressUpdate(editingAddress, address) : onAddressSave(address); resetAddress() }}><div className="address-fields">{Object.keys(address).map((field) => <input key={field} required={field !== 'label'} placeholder={field.replace('_', ' ')} value={address[field]} onChange={(event) => setAddress({ ...address, [field]: event.target.value })} />)}</div><button className="small-button" type="submit" disabled={pending}>{editingAddress ? 'Save address' : 'Add address'}</button>{editingAddress && <button className="text-button" type="button" onClick={resetAddress}>Cancel edit</button>}</form>
    </div>
    <div className="account-list"><h3>Orders & pickup status</h3>{orders.length ? orders.map((order) => <div className="account-row" key={order.id}><span>Order #{order.id} · <b>{(order.status || 'Placed').replaceAll('_', ' ')}</b><br /><small>{order.fulfillment_type || 'DELIVERY'}</small></span><span>${Number(order.total || 0).toFixed(2)} {['PENDING', 'CONFIRMED'].includes(order.status) && <button className="text-button" type="button" onClick={() => onOrderCancel(order.id)}>Cancel</button>}</span></div>) : <p className="account-note">No orders yet.</p>}</div>
    <form className="account-form" onSubmit={submitReview}><h3>Review a delivered order</h3><div className="address-fields"><input required placeholder="Order ID" value={review.order_id} onChange={(event) => setReview({ ...review, order_id: event.target.value })} /><input required placeholder="Restaurant ID" value={review.restaurant_id} onChange={(event) => setReview({ ...review, restaurant_id: event.target.value })} /><input required min="1" max="5" type="number" placeholder="Rating" value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })} /></div><textarea required placeholder="Tell us about it" value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} /><button className="small-button" type="submit">Submit review</button>{reviewMessage && <p className="account-note">{reviewMessage}</p>}</form>
    <button className="checkout-button" type="button" onClick={onSignOut}>Sign out <span>→</span></button>
  </section></div>
}
