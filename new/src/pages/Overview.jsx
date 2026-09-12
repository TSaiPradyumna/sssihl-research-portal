import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { DEPARTMENTS, deptName, num } from '../lib/data'

export default function Overview() {
  const { user, visible } = useApp()
  const scoped = user.scope === 'all' ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.code === user.scope)

  const phd = visible.filter((s) => s.Programme !== 'Post-Doc').length
  const papers = visible.reduce((a, s) => a + num(s['Paper published']), 0)
  const patents = visible.reduce((a, s) => a + num(s['Patents filed/granted']), 0)
  const supervisors = new Set(visible.map((s) => s['Research Supervisor']).filter(Boolean)).size

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{user.scope === 'all' ? 'All departments' : deptName(user.scope)}</h1>
          <p className="muted" style={{ margin: 0 }}>
            PhD and Post-Doctoral research scholars — snapshot as on today.
          </p>
        </div>
        <Link className="btn btn-sm btn-primary" to="/scholars/directory">Search scholars</Link>
      </div>

      <div className="grid g4">
        <div className="card stat"><b>{visible.length}</b><span>Total scholars</span></div>
        <div className="card stat"><b>{phd}</b><span>PhD</span></div>
        <div className="card stat"><b>{visible.length - phd}</b><span>Post-Doc</span></div>
        <div className="card stat accent"><b>{supervisors}</b><span>Supervisors</span></div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card stat"><b>{papers}</b><span>Papers published</span></div>
        <div className="card stat"><b>{patents}</b><span>Patents filed / granted</span></div>
      </div>

      <h2 className="section-title">Department-wise strength</h2>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Department</th><th>PhD</th><th>Post-Doc</th><th>Total</th>
              <th>Papers</th><th></th>
            </tr>
          </thead>
          <tbody>
            {scoped.map((d) => {
              const rows = visible.filter((s) => s.department === d.code)
              const p = rows.filter((s) => s.Programme !== 'Post-Doc').length
              return (
                <tr key={d.code}>
                  <td><b>{d.name}</b><div className="small muted">{d.code.toUpperCase()}</div></td>
                  <td>{p}</td>
                  <td>{rows.length - p}</td>
                  <td>{rows.length}</td>
                  <td>{rows.reduce((a, s) => a + num(s['Paper published']), 0)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link className="btn btn-sm" to={`/scholars/directory?dept=${d.code}`}>Open</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
