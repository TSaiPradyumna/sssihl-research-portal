import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { DEPARTMENTS, FACULTY_FIELDS, deptName, parseFacultyCsvText, toFacultyCsv, download } from '../lib/facultyData'

export default function FacultyUpload() {
  const { user, faculty, addFaculty, resetFacultyData } = useApp()
  const [dept, setDept] = useState(user.scope === 'all' ? DEPARTMENTS[0].code : user.scope)
  const [mode, setMode] = useState('append')
  const [msg, setMsg] = useState('')
  const [preview, setPreview] = useState([])

  const options = user.scope === 'all' ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.code === user.scope)

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseFacultyCsvText(String(reader.result), dept)
      if (!rows.length) return setMsg('No usable rows found — the file needs a "Name" column.')
      setPreview(rows.slice(0, 5))
      addFaculty(rows, dept, mode)
      setMsg(`${rows.length} record(s) ${mode === 'replace' ? 'replaced into' : 'added to'} ${deptName(dept)}. This shows on the site immediately.`)
    }
    reader.readAsText(file)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Upload faculty CSV</h1>
          <p className="muted" style={{ margin: 0 }}>Add or replace faculty records for a department.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn btn-sm" to="/faculty">Back to faculty</Link>
          <button
            className="btn btn-sm"
            onClick={() => { resetFacultyData(); setMsg('Cleared everything uploaded in this browser and restored the bundled faculty CSVs.'); setPreview([]) }}
          >
            Reset to CSV files
          </button>
        </div>
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

        <label htmlFor="ffile" className="dropzone" style={{ display: 'block', cursor: 'pointer' }}>
          <b>Choose a .csv file</b>
          <p className="muted small" style={{ marginBottom: 0 }}>
            Header row must match the standard faculty columns listed below.
          </p>
          <input
            id="ffile"
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
              <thead><tr><th>Name</th><th>Designation</th><th>Email</th></tr></thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i}><td>{r.Name}</td><td>{r.Designation}</td><td>{r.Email}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="section-title">Making an upload permanent for every visitor</h2>
      <div className="card small muted" style={{ lineHeight: 1.9 }}>
        Same as the scholars upload: this browser remembers the change via <code>localStorage</code> only.
        Download the merged file and replace the matching file inside <code>src/data/csv/faculty/</code>,
        then rebuild/redeploy, to make it permanent for everyone.
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-sm"
            onClick={() => download(`${dept}.csv`, toFacultyCsv(faculty.filter((f) => f.department === dept)))}
          >
            Download current {deptName(dept)} faculty as CSV
          </button>
        </div>
      </div>

      <h2 className="section-title">Expected columns</h2>
      <div className="card small muted" style={{ lineHeight: 1.9 }}>
        {FACULTY_FIELDS.join(' · ')}
      </div>
    </>
  )
}
