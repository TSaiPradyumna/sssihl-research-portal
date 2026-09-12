import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useApp } from '../App'
import { DEPARTMENTS, FIELDS, deptName, download, num, toCsv } from '../lib/data'

export default function Reports() {
  const { user, visible } = useApp()
  const [dept, setDept] = useState(user.scope === 'all' ? 'all' : user.scope)
  const [programme, setProgramme] = useState('all')
  const [minPapers, setMinPapers] = useState(0)
  const [year, setYear] = useState('all')

  const years = useMemo(
    () => [...new Set(visible.map((s) => String(s['DoJ/registration'] || '').slice(-4)).filter((y) => /^\d{4}$/.test(y)))].sort(),
    [visible]
  )

  const rows = useMemo(() => {
    return visible.filter((s) => {
      if (dept !== 'all' && s.department !== dept) return false
      if (programme !== 'all' && s.Programme !== programme) return false
      if (num(s['Paper published']) < minPapers) return false
      if (year !== 'all' && String(s['DoJ/registration'] || '').slice(-4) !== year) return false
      return true
    })
  }, [visible, dept, programme, minPapers, year])

  const stat = (f) => rows.reduce((a, s) => a + num(s[f]), 0)

  function exportExcel() {
    const wb = XLSX.utils.book_new()
    const data = rows.map((r) => {
      const o = { Department: deptName(r.department) }
      FIELDS.forEach((f) => (o[f] = r[f] ?? ''))
      return o
    })
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Scholars')
    const summary = DEPARTMENTS.map((d) => {
      const r = rows.filter((s) => s.department === d.code)
      return {
        Department: d.name,
        Total: r.length,
        PhD: r.filter((s) => s.Programme !== 'Post-Doc').length,
        'Post-Doc': r.filter((s) => s.Programme === 'Post-Doc').length,
        'Papers published': r.reduce((a, s) => a + num(s['Paper published']), 0),
        'Patents': r.reduce((a, s) => a + num(s['Patents filed/granted']), 0),
      }
    }).filter((r) => r.Total)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary')
    XLSX.writeFile(wb, 'sssihl-scholars-report.xlsx')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports &amp; exports</h1>
          <p className="muted" style={{ margin: 0 }}>Build a filtered report, read the summary, then export it.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => download('sssihl-scholars-report.csv', toCsv(rows))}>Export CSV</button>
          <button className="btn btn-sm btn-primary" onClick={exportExcel}>Export Excel</button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
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
            <label>Year of registration</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="all">Any year</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label>Minimum papers published</label>
            <input type="number" min="0" value={minPapers} onChange={(e) => setMinPapers(Number(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      <div className="grid g4" style={{ marginTop: 16 }}>
        <div className="card stat"><b>{rows.length}</b><span>Scholars in report</span></div>
        <div className="card stat"><b>{stat('Paper published')}</b><span>Papers published</span></div>
        <div className="card stat"><b>{stat('Papers under review')}</b><span>Under review</span></div>
        <div className="card stat accent"><b>{stat('Patents filed/granted')}</b><span>Patents</span></div>
      </div>

      <h2 className="section-title">Report preview</h2>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Scholar</th><th>Dept</th><th>Programme</th><th>Supervisor</th><th>Papers</th><th>Thesis (proposed)</th></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td><b>{s['Scholar Name']}</b><div className="small muted">{s['Registration Number']}</div></td>
                <td className="small">{deptName(s.department)}</td>
                <td>{s.Programme}</td>
                <td className="small">{s['Research Supervisor']}</td>
                <td>{s['Paper published']}</td>
                <td className="small">{s['Proposed date of thesis submission']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
