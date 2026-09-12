import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../App'
import { FIELDS, deptName } from '../lib/data'

const initials = (n = '') => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export default function ScholarProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const { visible } = useApp()
  const s = visible.find((x) => x.id === id)

  if (!s) {
    return (
      <div className="card">
        <h2>Record not available</h2>
        <p className="muted">This scholar is outside your department scope or has been removed.</p>
        <Link className="btn btn-sm" to="/scholars/directory">Back to search</Link>
      </div>
    )
  }

  const head = ['Programme', 'Registration Number', 'DoJ/registration', 'Research Supervisor']
  const rest = FIELDS.filter((f) => f !== 'Scholar Name' && !head.includes(f))

  return (
    <>
      <button className="btn btn-sm" onClick={() => nav(-1)}>← Back</button>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="profile-head">
          <div className="avatar">{initials(s['Scholar Name'])}</div>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 27 }}>{s['Scholar Name']}</h1>
            <p className="muted" style={{ margin: '0 0 8px' }}>
              {deptName(s.department)} · {s['Registration Number']}
            </p>
            <span className={'tag' + (s.Programme === 'Post-Doc' ? ' warn' : '')}>{s.Programme}</span>{' '}
            <span className="tag plain">Registered {s['DoJ/registration']}</span>{' '}
            <span className="tag plain">Guide: {s['Research Supervisor']}</span>
          </div>
        </div>
      </div>

      <h2 className="section-title">Research record</h2>
      <div className="card">
        <div className="detail-grid">
          {rest.map((f) => (
            <div className="detail" key={f}>
              <span>{f}</span>
              <p>{String(s[f] ?? '').trim() || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
