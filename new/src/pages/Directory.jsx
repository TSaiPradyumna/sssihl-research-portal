import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../App'
import { DEPARTMENTS, deptName, num, toCsv, download } from '../lib/data'

export default function Directory() {
  const { user, visible } = useApp()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [supervisor, setSupervisor] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('name')

  const dept = params.get('dept') || (user.scope === 'all' ? 'all' : user.scope)
  const setDept = (v) => setParams((p) => { const n = new URLSearchParams(p); v === 'all' ? n.delete('dept') : n.set('dept', v); return n })

  const [programme, setProgrammeState] = useState(params.get('programme') || 'all')
  const setProgramme = (v) => {
    setProgrammeState(v)
    setParams((p) => { const n = new URLSearchParams(p); v === 'all' ? n.delete('programme') : n.set('programme', v); return n })
  }

  const supervisors = useMemo(
    () => [...new Set(visible.map((s) => s['Research Supervisor']).filter(Boolean))].sort(),
    [visible]
  )

  const rows = useMemo(() => {
    let r = visible
    if (dept !== 'all') r = r.filter((s) => s.department === dept)
    if (programme !== 'all') r = r.filter((s) => s.Programme === programme)
    if (supervisor !== 'all') r = r.filter((s) => s['Research Supervisor'] === supervisor)
    if (status !== 'all') {
      const key = 'Completion status and date/proposed date of CE'
      r = r.filter((s) =>
        status === 'ongoing'
          ? /ongoing/i.test(s[key] || '')
          : !/ongoing/i.test(s[key] || '')
      )
    }
    if (q.trim()) {
      const t = q.toLowerCase()
      r = r.filter((s) =>
        [s['Scholar Name'], s['Registration Number'], s['Research Supervisor'], deptName(s.department)]
          .join(' ')
          .toLowerCase()
          .includes(t)
      )
    }
    const by = {
      name: (a, b) => (a['Scholar Name'] || '').localeCompare(b['Scholar Name'] || ''),
      papers: (a, b) => num(b['Paper published']) - num(a['Paper published']),
      dept: (a, b) => deptName(a.department).localeCompare(deptName(b.department)),
      doj: (a, b) => (a['DoJ/registration'] || '').slice(-4).localeCompare((b['DoJ/registration'] || '').slice(-4)),
    }
    return [...r].sort(by[sort])
  }, [visible, dept, programme, supervisor, status, q, sort])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Search scholars{programme !== 'all' ? ` — ${programme}` : ''}</h1>
          <p className="muted" style={{ margin: 0 }}>{rows.length} record(s) match your filters.</p>
        </div>
        <button className="btn btn-sm" onClick={() => download('scholars-filtered.csv', toCsv(rows))}>
          Download this list (CSV)
        </button>
      </div>

      <div className="card">
        <div className="filters">
          <div style={{ flex: '2 1 260px' }}>
            <label>Search by name, registration or supervisor</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Meera, DPHY-PH-2021" />
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
          <div>
            <label>Programme</label>
            <select value={programme} onChange={(e) => setProgramme(e.target.value)}>
              <option value="all">PhD + Post-Doc</option>
              <option value="PhD">PhD</option>
              <option value="Post-Doc">Post-Doc</option>
            </select>
          </div>
          <div>
            <label>Supervisor</label>
            <select value={supervisor} onChange={(e) => setSupervisor(e.target.value)}>
              <option value="all">All supervisors</option>
              {supervisors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Any status</option>
              <option value="ongoing">Ongoing</option>
              <option value="progressed">CE done / submitted</option>
            </select>
          </div>
          <div>
            <label>Sort by</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name">Name (A–Z)</option>
              <option value="papers">Papers published</option>
              <option value="dept">Department</option>
              <option value="doj">Year of registration</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginTop: 16, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Scholar</th><th>Programme</th><th>Department</th><th>Supervisor</th>
              <th>Registered</th><th>Papers</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} onClick={() => nav(`/scholars/directory/${s.id}`)}>
                <td>
                  <b>{s['Scholar Name']}</b>
                  <div className="small muted">{s['Registration Number']}</div>
                </td>
                <td><span className={'tag' + (s.Programme === 'Post-Doc' ? ' warn' : '')}>{s.Programme}</span></td>
                <td>{deptName(s.department)}</td>
                <td>{s['Research Supervisor']}</td>
                <td>{s['DoJ/registration']}</td>
                <td>{s['Paper published']}</td>
                <td className="small">{s['Completion status and date/proposed date of CE']}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} className="muted" style={{ padding: 26, textAlign: 'center' }}>
                No scholars match. Try clearing a filter or <Link to="/scholars/upload">upload a CSV</Link>.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
