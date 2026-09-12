import { useState } from 'react'
import { useApp } from '../App'
import { DEPARTMENTS, FIELDS, deptName, parseCsvText, toCsv, download } from '../lib/data'

export default function UploadCsv() {
  const { user, scholars, addScholars, resetScholarsData } = useApp()
  const [dept, setDept] = useState(user.scope === 'all' ? DEPARTMENTS[0].code : user.scope)
  const [mode, setMode] = useState('append')
  const [msg, setMsg] = useState('')
  const [preview, setPreview] = useState([])

  const options = user.scope === 'all' ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.code === user.scope)

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseCsvText(String(reader.result), dept)
      if (!rows.length) return setMsg('No usable rows found — the file needs a "Scholar Name" column.')
      setPreview(rows.slice(0, 5))
      addScholars(rows, dept, mode)
      setMsg(`${rows.length} record(s) ${mode === 'replace' ? 'replaced into' : 'added to'} ${deptName(dept)}. This shows on the site immediately.`)
    }
    reader.readAsText(file)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Upload CSV</h1>
          <p className="muted" style={{ margin: 0 }}>
            Add or replace records for a department. Changes appear on the site immediately.
          </p>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => { resetScholarsData(); setMsg('Cleared everything uploaded in this browser and restored the department CSV files.'); setPreview([]) }}
        >
          Reset to CSV files
        </button>
      </div>

      <div className="card">
        <div className="filters" style={{ marginBottom: 18 }}>
          <div>
            <label>Department</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              {options.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label>On upload</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="append">Add to existing records</option>
              <option value="replace">Replace this department's records</option>
            </select>
          </div>
        </div>

        <label htmlFor="file" className="dropzone" style={{ display: 'block', cursor: 'pointer' }}>
          <b>Choose a .csv file</b>
          <p className="muted small" style={{ marginBottom: 0 }}>
            Header row must match the standard scholar columns listed below.
          </p>
          <input
            id="file"
            type="file"
            accept=".csv,text/csv"
            style={{ marginTop: 14 }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </label>

        {msg && <p className="notice" style={{ marginTop: 16 }}>{msg}</p>}
      </div>

      {!!preview.length && (
        <>
          <h2 className="section-title">First rows read</h2>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Scholar Name</th><th>Programme</th><th>Registration</th><th>Supervisor</th></tr></thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i}>
                    <td>{r['Scholar Name']}</td><td>{r.Programme}</td>
                    <td>{r['Registration Number']}</td><td>{r['Research Supervisor']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="section-title">Making an upload permanent for every visitor</h2>
      <div className="card small muted" style={{ lineHeight: 1.9 }}>
        This site has no database — an upload here is remembered only in the browser that made it
        (via <code>localStorage</code>), like a form that hasn't been sent to a server yet.
        To make a change permanent for everyone who visits the site, download the current merged file below and
        replace the matching file inside <code>src/data/csv/</code> in the project, then rebuild/redeploy.
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-sm"
            onClick={() => download(`${dept}.csv`, toCsv(scholars.filter((s) => s.department === dept)))}
          >
            Download current {deptName(dept)} data as CSV
          </button>
        </div>
      </div>

      <h2 className="section-title">Expected columns</h2>
      <div className="card small muted" style={{ lineHeight: 1.9 }}>
        {FIELDS.join(' · ')}
      </div>
    </>
  )
}
