import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../App'
import { DEPARTMENTS, deptName, toFacultyCsv, download } from '../lib/facultyData'

export default function FacultyDirectory() {
  const { user, visibleFaculty } = useApp()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')

  const dept = params.get('dept') || (user.scope === 'all' ? 'all' : user.scope)
  const setDept = (v) => setParams(v === 'all' ? {} : { dept: v })

  const rows = useMemo(() => {
    let r = visibleFaculty
    if (dept !== 'all') r = r.filter((f) => f.department === dept)
    if (q.trim()) {
      const t = q.toLowerCase()
      r = r.filter((f) =>
        [f.Name, f.Designation, deptName(f.department)].join(' ').toLowerCase().includes(t)
      )
    }
    return [...r].sort((a, b) => (a.Name || '').localeCompare(b.Name || ''))
  }, [visibleFaculty, dept, q])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Faculty</h1>
          <p className="muted" style={{ margin: 0 }}>{rows.length} faculty member(s) match your filters.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-sm" onClick={() => download('faculty-filtered.csv', toFacultyCsv(rows))}>
            Download this list (CSV)
          </button>
          <Link className="btn btn-sm btn-primary" to="/faculty/upload">Upload CSV</Link>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div style={{ flex: '2 1 260px' }}>
            <label>Search by name or designation</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Padmavathy, Head" />
          </div>
          {user.scope === 'all' && (
            <div>
              <label>Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="all">All departments</option>
                {DEPARTMENTS.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginTop: 16, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Faculty</th><th>Designation</th><th>Department</th><th>Contact</th></tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} onClick={() => nav(`/faculty/${f.id}`)}>
                <td>
                  <b>{f.Name}</b>
                  {f['Is HoD'] === 'Yes' && <span className="tag" style={{ marginLeft: 8 }}>Head</span>}
                </td>
                <td>{f.Designation}</td>
                <td>{deptName(f.department)}</td>
                <td className="small muted">{f.Email}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={4} className="muted" style={{ padding: 26, textAlign: 'center' }}>
                No faculty match. Try clearing a filter or <Link to="/faculty/upload">upload a CSV</Link>.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
