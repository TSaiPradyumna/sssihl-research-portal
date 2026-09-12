import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { deptName } from '../lib/data'

const links = [
  { to: '/scholars', label: 'Department overview', end: true },
  { to: '/scholars/directory', label: 'Search scholars' },
  { to: '/scholars/reports', label: 'Reports & exports' },
  { to: '/scholars/dashboard', label: 'Statistics dashboard' },
  { to: '/scholars/upload', label: 'Upload CSV' },
  { to: '/scholars/account', label: 'My profile & password' },
]

export default function Layout() {
  const { user, logout } = useApp()
  const nav = useNavigate()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="crest">S</div>
          <div>
            <b>SSSIHL Research</b>
            <span className="small muted">Scholars Portal</span>
          </div>
        </div>

        <nav className="nav">
          <div className="sec">Scholars</div>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
          <div className="sec">Other</div>
          <NavLink to="/portals" end>Switch portal</NavLink>
          <NavLink to="/faculty">Faculty</NavLink>
        </nav>

        <div className="sidebar-foot">
          <p className="small" style={{ margin: '0 0 2px', fontWeight: 600 }}>{user.name}</p>
          <p className="small muted" style={{ margin: '0 0 10px' }}>
            {user.scope === 'all' ? user.title : deptName(user.scope)}
          </p>
          <button
            className="btn btn-sm btn-block"
            onClick={() => {
              logout()
              nav('/login')
            }}
          >
            Sign out
          </button>
          <div className="social-footer">
            <span className="small muted">Connect with us</span>
            <div className="social-links">
              <a href="https://instagram.com/sssihl_official" target="_blank" rel="noreferrer" aria-label="Instagram">Instagram</a>
              <a href="https://youtube.com/@sssihl" target="_blank" rel="noreferrer" aria-label="YouTube">YouTube</a>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
