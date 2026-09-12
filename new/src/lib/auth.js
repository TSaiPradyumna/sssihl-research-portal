import { DEPARTMENTS } from './data'

const KEY = 'sssihl.users.v1'
const SESSION = 'sssihl.session.v1'

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function seedUsers() {
  const users = [
    { email: 'admin@sssihl.edu.in', password: 'Admin@123', name: 'Portal Administrator', role: 'admin', title: 'Administrator', scope: 'all', phone: '+91 94900 00000' },
    { email: 'dos@sssihl.edu.in', password: 'Dos@123', name: 'Prof. R. Krishnan', role: 'dean', title: 'Dean of Sciences', scope: 'all', phone: '+91 94900 11111' },
    { email: 'ados@sssihl.edu.in', password: 'Ados@123', name: 'Prof. S. Meenakshi', role: 'dean', title: 'Associate Dean of Sciences', scope: 'all', phone: '+91 94900 22222' },
    { email: 'adoc@sssihl.edu.in', password: 'Adoc@123', name: 'Dr. V. Ramesh', role: 'dean', title: 'Academic Dean of Sciences', scope: 'all', phone: '+91 94900 33333' },
    { email: 'aadoc@sssihl.edu.in', password: 'Aadoc@123', name: 'Dr. A. Padmavathi', role: 'dean', title: 'Associate Academic Dean of Sciences', scope: 'all', phone: '+91 94900 44444' },
  ]
  DEPARTMENTS.forEach((d) => {
    users.push({
      email: `hod.${d.code}@sssihl.edu.in`,
      password: `${cap(d.code)}@123`,
      name: `Head, ${d.name}`,
      role: 'hod',
      title: `Head of Department — ${d.name}`,
      scope: d.code,
      phone: '+91 94900 55555',
    })
  })
  return users
}

export function getUsers() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* reseed */
  }
  const u = seedUsers()
  localStorage.setItem(KEY, JSON.stringify(u))
  return u
}

export function saveUsers(users) {
  localStorage.setItem(KEY, JSON.stringify(users))
}

export function login(email, password) {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  )
  if (!user) return null
  localStorage.setItem(SESSION, user.email)
  return user
}

export function currentUser() {
  const email = localStorage.getItem(SESSION)
  if (!email) return null
  return getUsers().find((u) => u.email === email) || null
}

export function logout() {
  localStorage.removeItem(SESSION)
}

export function updateUser(email, patch) {
  const users = getUsers().map((u) => (u.email === email ? { ...u, ...patch } : u))
  saveUsers(users)
  return users.find((u) => u.email === email)
}
