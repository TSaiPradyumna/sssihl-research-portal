import { useMemo, useRef, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Line, LineChart,
} from 'recharts'
import { useApp } from '../App'
import { DEPARTMENTS, deptName, num } from '../lib/data'
import { exportStatsExcel, exportStatsPdf } from '../lib/statsExport'

const COLORS = ['#14524a', '#c2711c', '#8a2f2f', '#3f7d6f', '#d9a441', '#5c6660', '#2c6e63', '#a4623a']

const truncate = (s, n = 20) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const yearOf = (v) => {
  const m = String(v ?? '').match(/\d{4}/)
  return m ? m[0] : null
}
const hasValue = (v) => {
  const t = String(v ?? '').trim().toLowerCase()
  return t && t !== 'na' && t !== 'n/a' && t !== '-' && t !== 'none'
}
const isCompleted = (v) => /complet/i.test(String(v ?? ''))

export default function Dashboard() {
  const { user, visible, visibleFaculty } = useApp()
  const printRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const [dept, setDept] = useState(user.scope === 'all' ? 'all' : user.scope)
  const [programme, setProgramme] = useState('all')
  const [supervisor, setSupervisor] = useState('all')
  const [yearFrom, setYearFrom] = useState('all')
  const [yearTo, setYearTo] = useState('all')

  const deptOptions = user.scope === 'all' ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.code === user.scope)

  const allYears = useMemo(
    () => [...new Set(visible.map((s) => yearOf(s['DoJ/registration'])).filter(Boolean))].sort(),
    [visible]
  )
  const allSupervisors = useMemo(
    () => [...new Set(visible.map((s) => (s['Research Supervisor'] || '').trim()).filter(Boolean))].sort(),
    [visible]
  )

  const rows = useMemo(() => {
    return visible.filter((s) => {
      if (dept !== 'all' && s.department !== dept) return false
      if (programme !== 'all' && s.Programme !== programme) return false
      if (supervisor !== 'all' && (s['Research Supervisor'] || '').trim() !== supervisor) return false
      const y = yearOf(s['DoJ/registration'])
      if (yearFrom !== 'all' && (!y || y < yearFrom)) return false
      if (yearTo !== 'all' && (!y || y > yearTo)) return false
      return true
    })
  }, [visible, dept, programme, supervisor, yearFrom, yearTo])

  const facRows = useMemo(
    () => (dept === 'all' ? visibleFaculty : visibleFaculty.filter((f) => f.department === dept)),
    [visibleFaculty, dept]
  )

  const filterLabels = useMemo(() => {
    const l = []
    l.push(`Department: ${dept === 'all' ? 'All' : deptName(dept)}`)
    l.push(`Programme: ${programme === 'all' ? 'All' : programme}`)
    if (supervisor !== 'all') l.push(`Supervisor: ${supervisor}`)
    if (yearFrom !== 'all' || yearTo !== 'all') {
      l.push(`Registered: ${yearFrom === 'all' ? 'earliest' : yearFrom}–${yearTo === 'all' ? 'latest' : yearTo}`)
    }
    return l
  }, [dept, programme, supervisor, yearFrom, yearTo])

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    const phd = rows.filter((s) => s.Programme !== 'Post-Doc').length
    const postdoc = rows.length - phd
    const completed = rows.filter((s) => isCompleted(s['Completion status and date/proposed date of CE'])).length
    return [
      { label: 'Total scholars', value: rows.length },
      { label: 'PhD', value: phd },
      { label: 'Post-Doc', value: postdoc },
      { label: 'Faculty in scope', value: facRows.length },
      { label: 'Unique supervisors', value: new Set(rows.map((s) => (s['Research Supervisor'] || '').trim()).filter(Boolean)).size },
      { label: 'Completed / CE cleared', value: completed },
      { label: 'Papers published', value: rows.reduce((a, s) => a + num(s['Paper published']), 0) },
      { label: 'Papers under review', value: rows.reduce((a, s) => a + num(s['Papers under review']), 0) },
      { label: 'Papers in pipeline', value: rows.reduce((a, s) => a + num(s['Papers in pipeline/submitted']), 0) },
      { label: 'Patents filed / granted', value: rows.reduce((a, s) => a + num(s['Patents filed/granted']), 0) },
      { label: 'Scholars with conference talks', value: rows.filter((s) => hasValue(s['Conference presentations'])).length },
      { label: 'Books & book chapters', value: rows.filter((s) => hasValue(s['Books and book chapters'])).length },
      { label: 'Awards & fellowships', value: rows.filter((s) => hasValue(s['Awards and fellowships'])).length },
      { label: 'Innovation awards/grants', value: rows.filter((s) => hasValue(s['Innovation awards/grants'])).length },
      { label: 'Start-up initiatives', value: rows.filter((s) => hasValue(s['Start-up initiatives'])).length },
      { label: 'National/international collaborations', value: rows.filter((s) => hasValue(s['National and International Collaborations'])).length },
      { label: 'SSSIHL grants received', value: rows.filter((s) => hasValue(s['Grants or financial support from SSSIHL'])).length },
      { label: 'External grants received', value: rows.filter((s) => hasValue(s['Other external grants'])).length },
    ]
  }, [rows, facRows])

  // ---------- Chart data ----------
  const byDept = useMemo(() => {
    const m = {}
    rows.forEach((s) => {
      const k = deptName(s.department)
      m[k] = m[k] || { name: truncate(k), full: k, PhD: 0, PostDoc: 0, papers: 0, patents: 0 }
      if (s.Programme === 'Post-Doc') m[k].PostDoc++
      else m[k].PhD++
      m[k].papers += num(s['Paper published'])
      m[k].patents += num(s['Patents filed/granted'])
    })
    return Object.values(m)
  }, [rows])

  const programmeSplit = useMemo(() => {
    const phd = rows.filter((s) => s.Programme !== 'Post-Doc').length
    return [
      { name: 'PhD', value: phd },
      { name: 'Post-Doc', value: rows.length - phd },
    ]
  }, [rows])

  const byYear = useMemo(() => {
    const m = {}
    rows.forEach((s) => {
      const y = yearOf(s['DoJ/registration'])
      if (y) m[y] = (m[y] || 0) + 1
    })
    return Object.keys(m).sort().map((y) => ({ year: y, registrations: m[y] }))
  }, [rows])

  const output = useMemo(() => ([
    { name: 'Published', value: rows.reduce((a, s) => a + num(s['Paper published']), 0) },
    { name: 'Under review', value: rows.reduce((a, s) => a + num(s['Papers under review']), 0) },
    { name: 'In pipeline', value: rows.reduce((a, s) => a + num(s['Papers in pipeline/submitted']), 0) },
    { name: 'Patents', value: rows.reduce((a, s) => a + num(s['Patents filed/granted']), 0) },
  ]), [rows])

  const completionSplit = useMemo(() => {
    const completed = rows.filter((s) => isCompleted(s['Completion status and date/proposed date of CE'])).length
    return [
      { name: 'Completed / CE cleared', value: completed },
      { name: 'In progress / proposed', value: rows.length - completed },
    ]
  }, [rows])

  const facByDept = useMemo(() => {
    const m = {}
    facRows.forEach((f) => {
      const k = deptName(f.department)
      m[k] = m[k] || { name: truncate(k), full: k, count: 0 }
      m[k].count++
    })
    return Object.values(m)
  }, [facRows])

  const facByDesignation = useMemo(() => {
    const bucket = (d) => {
      const t = (d || '').toLowerCase()
      if (t.includes('senior professor') || (t.includes('professor') && !t.includes('associate') && !t.includes('asst') && !t.includes('assistant'))) return 'Professor'
      if (t.includes('associate professor')) return 'Associate Professor'
      if (t.includes('asst') || t.includes('assistant')) return 'Asst. Professor'
      return 'Other'
    }
    const m = {}
    facRows.forEach((f) => {
      const k = bucket(f.Designation)
      m[k] = (m[k] || 0) + 1
    })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [facRows])

  const topSupervisors = useMemo(() => {
    const m = {}
    rows.forEach((s) => {
      const sup = (s['Research Supervisor'] || '').trim()
      if (!sup) return
      m[sup] = (m[sup] || 0) + 1
    })
    return Object.entries(m)
      .map(([name, count]) => ({ name: truncate(name, 24), full: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rows])

  const deptTable = useMemo(() => {
    return DEPARTMENTS
      .filter((d) => dept === 'all' || d.code === dept)
      .map((d) => {
        const r = rows.filter((s) => s.department === d.code)
        const f = facRows.filter((x) => x.department === d.code)
        return {
          Department: d.name,
          PhD: r.filter((s) => s.Programme !== 'Post-Doc').length,
          'Post-Doc': r.filter((s) => s.Programme === 'Post-Doc').length,
          Total: r.length,
          Faculty: f.length,
          'Papers published': r.reduce((a, s) => a + num(s['Paper published']), 0),
          'Patents filed/granted': r.reduce((a, s) => a + num(s['Patents filed/granted']), 0),
        }
      })
      .filter((r) => r.Total || r.Faculty)
  }, [rows, facRows, dept])

  // ---------- exports ----------
  function handleExcel() {
    exportStatsExcel({
      filename: 'sssihl-statistics.xlsx',
      filtersApplied: filterLabels,
      kpis,
      tables: [
        { name: 'By department', rows: deptTable },
        { name: 'Registrations by year', rows: byYear.map((r) => ({ Year: r.year, Registrations: r.registrations })) },
        { name: 'Programme split', rows: programmeSplit.map((r) => ({ Programme: r.name, Count: r.value })) },
        { name: 'Research output', rows: output.map((r) => ({ Type: r.name, Count: r.value })) },
        { name: 'Completion status', rows: completionSplit.map((r) => ({ Status: r.name, Count: r.value })) },
        { name: 'Faculty by department', rows: facByDept.map((r) => ({ Department: r.full, Faculty: r.count })) },
        { name: 'Faculty by designation', rows: facByDesignation.map((r) => ({ Designation: r.name, Count: r.value })) },
        { name: 'Top supervisors', rows: topSupervisors.map((r) => ({ Supervisor: r.full, Scholars: r.count })) },
      ],
      rawSheets: [
        { name: 'Scholars (filtered)', rows: rows.map((s) => ({ Department: deptName(s.department), ...s, id: undefined, source: undefined })) },
        { name: 'Faculty (filtered)', rows: facRows.map((f) => ({ Department: deptName(f.department), ...f, id: undefined, source: undefined })) },
      ],
    })
  }

  async function handlePdf() {
    if (!printRef.current) return
    setBusy(true)
    try {
      await exportStatsPdf({
        node: printRef.current,
        title: 'SSSIHL Research Statistics',
        subtitle: dept === 'all' ? 'All departments' : deptName(dept),
        filtersApplied: filterLabels,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Statistics dashboard</h1>
          <p className="muted" style={{ margin: 0 }}>Live figures from the records in your scope. Filter, then export.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={handleExcel}>Download Excel</button>
          <button className="btn btn-sm btn-primary" onClick={handlePdf} disabled={busy}>
            {busy ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          {user.scope === 'all' && (
            <div>
              <label>Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="all">All departments</option>
                {deptOptions.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label>Programme</label>
            <select value={programme} onChange={(e) => setProgramme(e.target.value)}>
              <option value="all">PhD + Post-Doc</option>
              <option value="PhD">PhD only</option>
              <option value="Post-Doc">Post-Doc only</option>
            </select>
          </div>
          <div>
            <label>Supervisor</label>
            <select value={supervisor} onChange={(e) => setSupervisor(e.target.value)}>
              <option value="all">All supervisors</option>
              {allSupervisors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Registered from</label>
            <select value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}>
              <option value="all">Earliest</option>
              {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label>Registered to</label>
            <select value={yearTo} onChange={(e) => setYearTo(e.target.value)}>
              <option value="all">Latest</option>
              {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ---- everything inside here is what gets captured into the PDF ---- */}
      <div ref={printRef} className="printable">
        <h2 className="section-title">Key figures</h2>
        <div className="kpi-grid">
          {kpis.map((k) => (
            <div className="kpi-card" key={k.label}>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        <h2 className="section-title">Department-wise strength</h2>
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Department</th><th>PhD</th><th>Post-Doc</th><th>Total scholars</th>
                <th>Faculty</th><th>Papers published</th><th>Patents</th>
              </tr>
            </thead>
            <tbody>
              {deptTable.map((r) => (
                <tr key={r.Department}>
                  <td><b>{r.Department}</b></td><td>{r.PhD}</td><td>{r['Post-Doc']}</td>
                  <td>{r.Total}</td><td>{r.Faculty}</td><td>{r['Papers published']}</td><td>{r['Patents filed/granted']}</td>
                </tr>
              ))}
              {!deptTable.length && <tr><td colSpan={7} className="muted" style={{ padding: 20, textAlign: 'center' }}>No records match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>

        <h2 className="section-title">Scholars</h2>
        <div className="stats-grid">
          <div className="card chart-card">
            <h3 style={{ marginTop: 0 }}>Scholars per department</h3>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={byDept} margin={{ left: 0, right: 12, bottom: 56 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceadf" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={80} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={34} />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.full || ''} />
                <Legend />
                <Bar dataKey="PhD" stackId="a" fill="#14524a" />
                <Bar dataKey="PostDoc" name="Post-Doc" stackId="a" fill="#c2711c" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h3 style={{ marginTop: 0 }}>Programme split</h3>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie data={programmeSplit} dataKey="value" nameKey="name" innerRadius={64} outerRadius={110} label>
                  {programmeSplit.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h3 style={{ marginTop: 0 }}>Registrations by year</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={byYear} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceadf" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                <Tooltip />
                <Line type="monotone" dataKey="registrations" stroke="#8a2f2f" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h3 style={{ marginTop: 0 }}>Research output</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={output} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceadf" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                <Tooltip />
                <Bar dataKey="value" name="Count">
                  {output.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h3 style={{ marginTop: 0 }}>Completion status</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={completionSplit} dataKey="value" nameKey="name" innerRadius={64} outerRadius={110} label>
                  {completionSplit.map((e, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h3 style={{ marginTop: 0 }}>Top 10 supervisors by scholar count</h3>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topSupervisors} layout="vertical" margin={{ left: 24, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceadf" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.full || ''} />
                <Bar dataKey="count" name="Scholars" fill="#3f7d6f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <h2 className="section-title">Faculty</h2>
        <div className="stats-grid">
          <div className="card chart-card">
            <h3 style={{ marginTop: 0 }}>Faculty per department</h3>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={facByDept} margin={{ left: 0, right: 12, bottom: 56 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceadf" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={80} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.full || ''} />
                <Bar dataKey="count" name="Faculty" fill="#c2711c" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h3 style={{ marginTop: 0 }}>Faculty by designation</h3>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie data={facByDesignation} dataKey="value" nameKey="name" innerRadius={64} outerRadius={110} label>
                  {facByDesignation.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}
