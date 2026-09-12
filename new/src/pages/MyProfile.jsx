import { useState } from 'react'
import { useApp } from '../App'
import { updateUser } from '../lib/auth'
import { deptName } from '../lib/data'

export default function MyProfile() {
  const { user, setUser } = useApp()
  const [form, setForm] = useState({ name: user.name, title: user.title, phone: user.phone || '' })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function saveProfile(e) {
    e.preventDefault()
    setUser(updateUser(user.email, form))
    setErr('')
    setMsg('Profile updated. These details are stored and will be there at your next login.')
  }

  function savePassword(e) {
    e.preventDefault()
    setMsg('')
    if (pw.current !== user.password) return setErr('Current password is incorrect.')
    if (pw.next.length < 6) return setErr('New password must be at least 6 characters.')
    if (pw.next !== pw.confirm) return setErr('New password and confirmation do not match.')
    setUser(updateUser(user.email, { password: pw.next }))
    setPw({ current: '', next: '', confirm: '' })
    setErr('')
    setMsg('Password changed. Use the new one the next time you sign in.')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My profile &amp; password</h1>
          <p className="muted" style={{ margin: 0 }}>
            {user.email} · {user.scope === 'all' ? 'Institute-wide access' : deptName(user.scope)}
          </p>
        </div>
      </div>

      {msg && <p className="notice" style={{ marginBottom: 16 }}>{msg}</p>}
      {err && <p className="error" style={{ marginBottom: 16 }}>{err}</p>}

      <div className="grid g2">
        <form className="card" onSubmit={saveProfile}>
          <h3 style={{ marginTop: 0 }}>Your details</h3>
          <label>Full name</label>
          <input value={form.name} onChange={set('name')} required />
          <label>Designation</label>
          <input value={form.title} onChange={set('title')} required />
          <label>Contact number</label>
          <input value={form.phone} onChange={set('phone')} />
          <label>Email (fixed)</label>
          <input value={user.email} disabled />
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-primary">Save details</button>
          </div>
        </form>

        <form className="card" onSubmit={savePassword}>
          <h3 style={{ marginTop: 0 }}>Change password</h3>
          <label>Current password</label>
          <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          <label>New password</label>
          <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
          <label>Confirm new password</label>
          <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-primary">Update password</button>
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Credentials are persisted in browser storage in this build; point <code>src/lib/auth.js</code> at your
            server or user sheet when you move it onto the institute network.
          </p>
        </form>
      </div>
    </>
  )
}
