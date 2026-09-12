import { Link, useParams } from 'react-router-dom'
import { useApp } from '../App'
import { deptName } from '../lib/facultyData'

export default function FacultyProfile() {
  const { id } = useParams()
  const { faculty } = useApp()
  const f = faculty.find((x) => x.id === id)

  if (!f) {
    return (
      <div className="card">
        <p>Faculty member not found.</p>
        <Link className="btn btn-sm" to="/faculty">Back to faculty</Link>
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="muted small" style={{ margin: 0 }}>{deptName(f.department)}</p>
          <h1 style={{ margin: '4px 0' }}>{f.Name}</h1>
          <p className="muted" style={{ margin: 0 }}>{f.Designation}</p>
        </div>
        <Link className="btn btn-sm" to="/faculty">Back to faculty</Link>
      </div>

      <div className="grid g2">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 17 }}>Contact</h2>
          <p className="small" style={{ lineHeight: 2 }}>
            <b>Email:</b> {f.Email}<br />
            <b>Phone:</b> {f.Phone}<br />
            <b>Qualification:</b> {f.Qualification}
          </p>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 17 }}>Role</h2>
          <p className="small" style={{ lineHeight: 2 }}>
            <b>Department:</b> {deptName(f.department)}<br />
            <b>Head of Department:</b> {f['Is HoD'] === 'Yes' ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      <h2 className="section-title">Areas of interest</h2>
      <div className="card small">{f['Areas of Interest'] || 'To be updated'}</div>

      <h2 className="section-title">Scholars guided</h2>
      <div className="card small muted">{f['Scholars Guided'] || 'To be updated'}</div>

      <h2 className="section-title">Publications</h2>
      <div className="card small muted">{f.Publications || 'To be updated'}</div>
    </>
  )
}
