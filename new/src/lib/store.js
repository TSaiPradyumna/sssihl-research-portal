import Papa from 'papaparse'

// A small store factory shared by scholars and faculty.
//
// KEY FIX vs the old version: the bundled CSV files (src/data/csv/*.csv) are
// now re-read fresh every time the app loads instead of being frozen into
// localStorage on first run. That old behaviour is why editing a CSV file
// and rebuilding never showed up on the site — the very first visit copied
// the CSVs into localStorage once, and every visit after that kept reading
// the stale copy instead of the file. Now localStorage only remembers what
// the *user* uploaded (or which departments they chose to fully replace),
// and that is layered on top of the always-current bundled files.
export function makeCsvStore({ modules, storageKey, primaryField, transformRow }) {
  const UPLOADS_KEY = `${storageKey}.uploads.v1`
  const REPLACED_KEY = `${storageKey}.replaced.v1`
  const xform = transformRow || ((r) => r)

  function bundled() {
    const out = []
    for (const path in modules) {
      const code = path.split('/').pop().replace('.csv', '')
      const parsed = Papa.parse(modules[path].trim(), { header: true, skipEmptyLines: 'greedy' })
      parsed.data
        .filter((row) => (row[primaryField] || '').trim())
        .forEach((row, i) => {
          out.push(xform({ ...row, department: code, id: `${code}-${i}`, source: 'bundled' }))
        })
    }
    return out
  }

  function getReplaced() {
    try {
      return JSON.parse(localStorage.getItem(REPLACED_KEY) || '[]')
    } catch (e) {
      return []
    }
  }
  function setReplaced(list) {
    localStorage.setItem(REPLACED_KEY, JSON.stringify(list))
  }

  function getUploads() {
    try {
      return JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]')
    } catch (e) {
      return []
    }
  }
  function setUploads(rows) {
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(rows))
  }

  // Bundled CSV rows for a department that the user has chosen to fully
  // replace are hidden; everything the user uploaded is appended.
  function load() {
    const replaced = getReplaced()
    const base = bundled().filter((r) => !replaced.includes(r.department))
    return [...base, ...getUploads()]
  }

  // mode: 'append' keeps existing rows for the department and adds these.
  // mode: 'replace' hides the bundled rows for that department (permanently,
  // until "Reset to bundled data" is used) and drops any earlier uploads
  // for it, then adds these rows as the new full set.
  function addRows(rows, department, mode) {
    const replaced = getReplaced()
    let uploads = getUploads()
    if (mode === 'replace') {
      if (!replaced.includes(department)) replaced.push(department)
      setReplaced(replaced)
      uploads = uploads.filter((r) => r.department !== department)
    }
    uploads = [...uploads, ...rows]
    setUploads(uploads)
    return load()
  }

  function removeRow(id) {
    const uploads = getUploads().filter((r) => r.id !== id)
    setUploads(uploads)
    return load()
  }

  function reset() {
    setUploads([])
    setReplaced([])
    return load()
  }

  function parseCsvText(text, department) {
    const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: 'greedy' })
    return parsed.data
      .filter((r) => (r[primaryField] || '').trim())
      .map((r, i) =>
        xform({
          ...r,
          department,
          id: `${department}-up-${Date.now()}-${i}`,
          source: 'upload',
        })
      )
  }

  return { load, addRows, removeRow, reset, parseCsvText }
}

export function toCsvRows(rows, fields, deptName) {
  return Papa.unparse(
    rows.map((r) => {
      const o = { Department: deptName(r.department) }
      fields.forEach((f) => (o[f] = r[f] ?? ''))
      return o
    })
  )
}

export function download(filename, content, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
