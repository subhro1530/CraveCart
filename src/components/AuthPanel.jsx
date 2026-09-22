import { useState } from 'react'

const roles = [
  ['CUSTOMER', 'Customer'],
  ['ADMIN', 'Admin'],
  ['RESTAURANT_OWNER', 'Restaurant'],
  ['KITCHEN', 'Kitchen'],
  ['PICKUP_AGENT', 'Van'],
]

export default function AuthPanel({ onSubmit, onClose, error, pending }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER', admin_passphrase: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const isAdmin = form.role === 'ADMIN'

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
  }
  function submit(event) {
    event.preventDefault()
    const errors = {}
    if (mode === 'register' && !form.name.trim()) errors.name = 'Name is required.'
    if (!form.email.trim()) errors.email = 'Email is required.'
    if (!form.password) errors.password = 'Password is required.'
    if (mode === 'register' && form.password.length < 8) errors.password = 'Use at least 8 characters.'
    if (mode === 'register' && isAdmin && !form.admin_passphrase) errors.admin_passphrase = 'The admin passphrase is required.'
    setFieldErrors(errors)
    if (!Object.keys(errors).length) onSubmit(mode, form)
  }
  function toggleMode() {
    setMode((current) => current === 'login' ? 'register' : 'login')
    setFieldErrors({})
  }

  return <div className="dialog-backdrop"><section className="dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <button className="close-button" type="button" onClick={onClose} aria-label="Close sign in">×</button>
    <span className="eyebrow">Welcome to CraveCart</span>
    <h2 id="auth-title">{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>
    <p className="auth-intro">{mode === 'login' ? 'Choose a workspace to continue.' : 'Create a customer or partner workspace.'}</p>
    <form onSubmit={submit} noValidate>
      <label>{mode === 'login' ? 'Sign in as' : 'Create account as'}
        <select value={form.role} onChange={(event) => update('role', event.target.value)}>
          {roles.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      {mode === 'register' && <label>Full name<input value={form.name} onChange={(event) => update('name', event.target.value)} aria-invalid={!!fieldErrors.name} />{fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}</label>}
      <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} aria-invalid={!!fieldErrors.email} />{fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}</label>
      <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => update('password', event.target.value)} aria-invalid={!!fieldErrors.password} />{fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}</label>
      {mode === 'register' && isAdmin && <label>Admin onboarding passphrase<input type="password" autoComplete="off" value={form.admin_passphrase} onChange={(event) => update('admin_passphrase', event.target.value)} aria-invalid={!!fieldErrors.admin_passphrase} />{fieldErrors.admin_passphrase && <small className="field-error">{fieldErrors.admin_passphrase}</small>}<small className="account-type-note">This securely enables the first administrator account.</small></label>}
      {mode === 'register' && !isAdmin && <small className="account-type-note">Your {roles.find(([value]) => value === form.role)?.[1].toLowerCase()} workspace is available immediately after registration.</small>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="checkout-button" type="submit" disabled={pending}>{pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button>
    </form>
    <button className="text-button" type="button" onClick={toggleMode}>{mode === 'login' ? 'Need an account? Create one' : 'Already registered? Sign in'}</button>
  </section></div>
}
