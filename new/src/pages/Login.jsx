import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'
import { useApp } from '../App'

export default function Login() {
  const { setUser } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  function submit(e) {
    e.preventDefault()
    const u = login(email, password)
    if (!u) return setErr('Those credentials did not match any Dean, HoD or Admin account.')
    setUser(u)
    nav('/portals')
  }

  return (
    <div className="login-wrap">
      <aside className="login-aside">
        <div className="crest">S</div>
        <div>
          <h1>SSSIHL Research Portal</h1>
          <p>
            A single place for Deans and Heads of Department at SSSIHL to follow the
            progress of PhD and Post-Doctoral scholars — registrations, seminars,
            publications, patents and collaborations, department by department.
          </p>
        </div>
        <p className="small" style={{ color: '#a9c2ba' }}>
          Sri Sathya Sai Institute of Higher Learning · Internal use only
        </p>
      </aside>

      <main className="login-main">
        <div className="topbar-auth">
          <button className="btn btn-sm btn-ghost" disabled title="Accounts are issued by the office">
            Sign up
          </button>
          <button className="btn btn-sm btn-primary">Login</button>
        </div>

        <form className="login-card" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="muted small">Access is restricted to DoS, ADoS, ADoC, HoDs and the Administrator.</p>

          <label htmlFor="email">Institute email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="hod.dfns@sssihl.edu.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="pw">Password</label>
          <input
            id="pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {err && <p className="error">{err}</p>}

          <div style={{ marginTop: 22 }}>
            <button className="btn btn-primary btn-block" type="submit">Login</button>
          </div>
        </form>
      </main>
    </div>
  )
}
