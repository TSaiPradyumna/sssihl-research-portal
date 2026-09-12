import { Link } from 'react-router-dom'
import { useApp } from '../App'

export default function Portals() {
  const { user, logout, visible, visibleFaculty } = useApp()
  const phd = visible.filter((s) => s.Programme !== 'Post-Doc').length
  const postdoc = visible.length - phd

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '54px 24px' }}>
      <div className="page-head">
        <div>
          <p className="muted small" style={{ margin: 0 }}>Signed in as {user.email}</p>
          <h1>{user.name}</h1>
          <p className="muted" style={{ margin: 0 }}>{user.title}</p>
        </div>
        <button className="btn btn-sm" onClick={logout}>Sign out</button>
      </div>

      <div className="grid g3" style={{ marginTop: 10 }}>
        <Link to="/scholars/directory?programme=PhD" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="tag">Available now</span>
          <h2 style={{ margin: '14px 0 8px', fontSize: 21 }}>PhD Scholars</h2>
          <p className="muted small" style={{ marginTop: 0, lineHeight: 1.6 }}>
            Registrations, supervisors, RAC, seminars, colloquium, publications, patents and grants.
          </p>
          <p className="small muted" style={{ fontWeight: 600 }}>{phd} PhD record(s) in your scope</p>
        </Link>

        <Link to="/scholars/directory?programme=Post-Doc" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="tag">Available now</span>
          <h2 style={{ margin: '14px 0 8px', fontSize: 21 }}>Post-Doc Scholars</h2>
          <p className="muted small" style={{ marginTop: 0, lineHeight: 1.6 }}>
            The same tracking as PhD scholars, filtered to Post-Doctoral researchers only.
          </p>
          <p className="small muted" style={{ fontWeight: 600 }}>{postdoc} Post-Doc record(s) in your scope</p>
        </Link>

        <Link to="/faculty" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="tag">Available now</span>
          <h2 style={{ margin: '14px 0 8px', fontSize: 21 }}>Faculty</h2>
          <p className="muted small" style={{ marginTop: 0, lineHeight: 1.6 }}>
            Faculty profiles — designation, contact details, scholars guided, research areas, publications.
          </p>
          <p className="small muted" style={{ fontWeight: 600 }}>{visibleFaculty.length} faculty record(s) in your scope</p>
        </Link>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="small muted" style={{ margin: 0 }}>
          Want everything together — searchable across PhD and Post-Doc at once, with charts and downloads?
          Open the <Link to="/scholars">department overview</Link> or the <Link to="/scholars/dashboard">statistics dashboard</Link>.
        </p>
      </div>
    </div>
  )
}
