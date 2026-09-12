import { makeCsvStore, toCsvRows, download as downloadFile } from './store'
import { DEPARTMENTS, deptName } from './data'

const modules = import.meta.glob('../data/csv/faculty/*.csv', { eager: true, as: 'raw' })

export { DEPARTMENTS, deptName }

export const FACULTY_FIELDS = [
  'Name',
  'Designation',
  'Department',
  'Email',
  'Phone',
  'Qualification',
  'Areas of Interest',
  'Is HoD',
  'Scholars Guided',
  'Publications',
]

const store = makeCsvStore({
  modules,
  storageKey: 'sssihl.faculty',
  primaryField: 'Name',
})

export function loadFaculty() {
  return store.load()
}

export function addFaculty(rows, department, mode) {
  return store.addRows(rows, department, mode)
}

export function removeFaculty(id) {
  return store.removeRow(id)
}

export function resetFaculty() {
  return store.reset()
}

export function parseFacultyCsvText(text, department) {
  return store.parseCsvText(text, department)
}

export function toFacultyCsv(rows) {
  return toCsvRows(rows, FACULTY_FIELDS, deptName)
}

export const download = downloadFile
