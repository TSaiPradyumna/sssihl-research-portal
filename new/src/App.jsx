import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { currentUser, logout as doLogout } from './lib/auth'
import { loadScholars, addScholars, resetScholars } from './lib/data'
import { loadFaculty, addFaculty, resetFaculty } from './lib/facultyData'
import Login from './pages/Login'
import Portals from './pages/Portals'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Directory from './pages/Directory'
import ScholarProfile from './pages/ScholarProfile'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import UploadCsv from './pages/UploadCsv'
import MyProfile from './pages/MyProfile'
import FacultyDirectory from './pages/FacultyDirectory'
import FacultyProfile from './pages/FacultyProfile'
import FacultyUpload from './pages/FacultyUpload'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export default function App() {
  const [user, setUser] = useState(() => currentUser())
  const [scholars, setScholarsState] = useState(() => loadScholars())
  const [faculty, setFacultyState] = useState(() => loadFaculty())
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const value = useMemo(
    () => ({
      user,
      setUser,
      logout: () => {
        doLogout()
        setUser(null)
      },
      scholars,
      addScholars: (rows, department, mode) => {
        setScholarsState(addScholars(rows, department, mode))
      },
      resetScholarsData: () => {
        setScholarsState(resetScholars())
      },
      // scholar rows the signed-in user is allowed to see
      visible:
        !user || user.scope === 'all'
          ? scholars
          : scholars.filter((s) => s.department === user.scope),

      faculty,
      addFaculty: (rows, department, mode) => {
        setFacultyState(addFaculty(rows, department, mode))
      },
      resetFacultyData: () => {
        setFacultyState(resetFaculty())
      },
      // faculty rows the signed-in user is allowed to see
      visibleFaculty:
        !user || user.scope === 'all'
          ? faculty
          : faculty.filter((f) => f.department === user.scope),
    }),
    [user, scholars, faculty]
  )

  return (
    <Ctx.Provider value={value}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/portals" replace /> : <Login />} />
        <Route path="/portals" element={<Guard><Portals /></Guard>} />
        <Route element={<Guard><Layout /></Guard>}>
          <Route path="/scholars" element={<Overview />} />
          <Route path="/scholars/directory" element={<Directory />} />
          <Route path="/scholars/directory/:id" element={<ScholarProfile />} />
          <Route path="/scholars/reports" element={<Reports />} />
          <Route path="/scholars/dashboard" element={<Dashboard />} />
          <Route path="/scholars/upload" element={<UploadCsv />} />
          <Route path="/scholars/account" element={<MyProfile />} />
          <Route path="/faculty" element={<FacultyDirectory />} />
          <Route path="/faculty/upload" element={<FacultyUpload />} />
          <Route path="/faculty/:id" element={<FacultyProfile />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/portals' : '/login'} replace />} />
      </Routes>
    </Ctx.Provider>
  )
}

function Guard({ children }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  return children
}
