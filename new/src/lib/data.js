import { makeCsvStore, toCsvRows, download as downloadFile } from './store'

const modules = import.meta.glob('../data/csv/*.csv', { eager: true, as: 'raw' })

export const DEPARTMENTS = [
  { code: 'dfns', name: 'Food Science and Nutrition' },
  { code: 'dmacs', name: 'Mathematics and Computer Science' },
  { code: 'dbs', name: 'Biosciences' },
  { code: 'dedu', name: 'Education' },
  { code: 'dchem', name: 'Chemistry' },
  { code: 'dhss', name: 'Humanities and Social Sciences' },
  { code: 'dll', name: 'Languages and Literature' },
  { code: 'dmc', name: 'Management and Commerce' },
  { code: 'dpa', name: 'Performing Arts' },
  { code: 'dphy', name: 'Physics' },
]

export const deptName = (code) =>
  DEPARTMENTS.find((d) => d.code === code)?.name || code

export const FIELDS = [
  'Scholar Name',
  'Programme',
  'Registration Number',
  'DoJ/registration',
  'Research Supervisor',
  'RAC members',
  'Completion status and date/proposed date of CE',
  'Seminar 1',
  'Seminar 2',
  'Colloquium',
  'Paper published',
  'Papers under review',
  'Papers in pipeline/submitted',
  'Proposed date of thesis submission',
  'Conference presentations',
  'Books and book chapters',
  'Awards and fellowships',
  'Innovation awards/grants',
  'Patents filed/granted',
  'Start-up initiatives',
  'National and International Collaborations',
  'Grants or financial support from SSSIHL',
  'Other external grants',
  'Contribution to research facility',
  'Any other relevant details',
]

// Whatever variant someone types in the CSV ("phd", "Ph.D", "post doc",
// "POSTDOC", blank, ...) is normalized to exactly 'PhD' or 'Post-Doc' so
// every filter/count/report in the app that checks this field is reliable.
export function normalizeProgramme(v) {
  const t = String(v ?? '').trim().toLowerCase().replace(/[.\s-]+/g, '')
  return t.startsWith('post') ? 'Post-Doc' : 'PhD'
}

const store = makeCsvStore({
  modules,
  storageKey: 'sssihl.scholars',
  primaryField: 'Scholar Name',
  transformRow: (r) => ({ ...r, Programme: normalizeProgramme(r.Programme) }),
})

// Always mixes the current bundled CSV files with whatever the signed-in
// browser has uploaded — see src/lib/store.js for why this replaced the old
// "seed once into localStorage" approach.
export function loadScholars() {
  return store.load()
}

// mode: 'append' | 'replace' — see store.js for exact semantics.
export function addScholars(rows, department, mode) {
  return store.addRows(rows, department, mode)
}

export function removeScholar(id) {
  return store.removeRow(id)
}

export function resetScholars() {
  return store.reset()
}

export function parseCsvText(text, department) {
  // Programme is already normalized by transformRow above.
  return store.parseCsvText(text, department)
}

export const num = (v) => {
  const m = String(v ?? '').match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

export function toCsv(rows) {
  return toCsvRows(rows, FIELDS, deptName)
}

export const download = downloadFile
