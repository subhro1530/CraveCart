import { useState } from 'react'

export default function AuthPanel({ onSubmit, onClose, error, pending }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  function submit(event) { event.preventDefault(); const errors = {}; if (mode === 'register' && !form.name.trim()) errors.name = 'Name is required.'; if (!form.email.trim()) errors.email = 'Email is required.'; if (!form.password) errors.password = 'Password is required.'; setFieldErrors(errors); if (!Object.keys(errors).length) onSubmit(mode, form) }
  return <div className="dialog-backdrop"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="close-button" type="button" onClick={onClose} aria-label="Close sign in">×</button><span className="eyebrow">Welcome to CraveCart</span><h2 id="auth-title">{mode === 'login' ? 'Sign in' : 'Create your account'}</h2><form onSubmit={submit} noValidate>
    {mode === 'register' && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!fieldErrors.name} />{fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}</label>}
    <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!fieldErrors.email} />{fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}</label>
    <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={!!fieldErrors.password} />{fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}</label>
    {error && <p className="form-error" role="alert">{error}</p>}<button className="checkout-button" type="submit" disabled={pending}>{pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'} <span>→</span></button>
  </form><button className="text-button" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setFieldErrors({}) }}>{mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}</button></section></div>
}