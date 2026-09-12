/**
 * SSSIHL Research Portal — Google Sheets automation
 * -----------------------------------------------------------------
 * Paste this whole file into Extensions > Apps Script for this
 * spreadsheet, then follow AUTOMATION-SETUP.md to finish wiring it up
 * (installable trigger, permissions, test).
 *
 * What it does:
 * 1. Watches every department sheet (DFNS, DMACS, DBS, DEDU, DCHEM,
 *    DHSS, DLL, DMC, DPA, DPHY).
 * 2. If someone edits the Seminar 1, Seminar 2, or Colloquium date for
 *    a scholar, it emails that scholar, their supervisor, and their
 *    HoD a specific "date updated" email.
 * 3. If someone edits ANY other tracked field for a scholar, it
 *    emails the scholar, supervisor, and HoD a general "record
 *    updated" email.
 * 4. Every processed edit gets one row in the "Activity Log" sheet —
 *    this is how the admin sees who changed what and when, since
 *    Sheets edit history alone doesn't show "who was notified."
 */

const DEPARTMENT_SHEETS = ['DFNS', 'DMACS', 'DBS', 'DEDU', 'DCHEM', 'DHSS', 'DLL', 'DMC', 'DPA', 'DPHY'];
const DATE_FIELDS = ['Seminar 1', 'Seminar 2', 'Colloquium'];

// Columns that should NEVER trigger an email even if edited (avoid spam
// on free-text notes fields). Remove any of these if you want them
// watched too.
const IGNORED_FIELDS = ['Any other relevant details', 'Contribution to research facility'];

const INSTITUTE_NAME = 'SSSIHL';

/**
 * Installable onEdit handler. Do NOT rename this if you're relying on
 * the trigger being created by name in setup — see AUTOMATION-SETUP.md.
 */
function onEditInstallable(e) {
  try {
    handleEdit_(e);
  } catch (err) {
    // Never let a script error block someone's edit — just log it.
    logError_(err, e);
  }
}

function handleEdit_(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  if (DEPARTMENT_SHEETS.indexOf(sheetName) === -1) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();
  if (row === 1) return; // header row edited, ignore
  if (e.range.getNumRows() > 1 || e.range.getNumColumns() > 1) return; // only handle single-cell edits

  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const fieldName = header[col - 1];
  if (!fieldName) return;
  if (IGNORED_FIELDS.indexOf(fieldName) !== -1) return;

  const rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowObj = {};
  header.forEach((h, i) => (rowObj[h] = rowValues[i]));

  const scholarName = rowObj['Scholar Name'];
  if (!scholarName) return; // blank row, ignore

  const scholarEmail = rowObj['Scholar Email'];
  const supervisorEmail = rowObj['Supervisor Email'];
  const dept = departmentInfo_(sheetName);
  const hodEmail = dept ? dept.hodEmail : '';

  const oldValue = e.oldValue !== undefined ? e.oldValue : '(blank)';
  const newValue = e.value !== undefined ? e.value : sheet.getRange(row, col).getDisplayValue();

  const recipients = uniqueEmails_([scholarEmail, supervisorEmail, hodEmail]);
  if (!recipients.length) {
    logActivity_(sheetName, row, scholarName, fieldName, oldValue, newValue, 'No valid recipient emails found');
    return;
  }

  const isDateField = DATE_FIELDS.indexOf(fieldName) !== -1;
  const subject = isDateField
    ? `${scholarName}: ${fieldName} date updated — ${dept ? dept.name : sheetName}`
    : `${scholarName}: record updated — ${dept ? dept.name : sheetName}`;

  const body = isDateField
    ? dateUpdateTemplate_(scholarName, fieldName, oldValue, newValue, dept)
    : generalUpdateTemplate_(scholarName, fieldName, oldValue, newValue, dept);

  MailApp.sendEmail({
    to: recipients.join(','),
    subject: subject,
    body: body,
  });

  logActivity_(sheetName, row, scholarName, fieldName, oldValue, newValue, recipients.join(', '));
}

// ---------- email templates ----------

function dateUpdateTemplate_(scholarName, fieldName, oldValue, newValue, dept) {
  const deptName = dept ? dept.name : '';
  return [
    `Dear all,`,
    ``,
    `This is an automated notice from the ${INSTITUTE_NAME} Research Portal.`,
    ``,
    `${fieldName} for ${scholarName} (${deptName}) has been updated:`,
    ``,
    `  Previous: ${oldValue || '(not set)'}`,
    `  Updated:  ${newValue || '(not set)'}`,
    ``,
    `This email has gone to the scholar, their research supervisor, and the Head of Department so everyone stays in sync on scheduling.`,
    ``,
    `If this change was made in error, please correct it directly in the department sheet — a follow-up email will go out automatically once it is corrected.`,
    ``,
    `— ${INSTITUTE_NAME} Research Portal (automated message, please do not reply)`,
  ].join('\n');
}

function generalUpdateTemplate_(scholarName, fieldName, oldValue, newValue, dept) {
  const deptName = dept ? dept.name : '';
  return [
    `Dear all,`,
    ``,
    `This is an automated notice from the ${INSTITUTE_NAME} Research Portal.`,
    ``,
    `A record for ${scholarName} (${deptName}) was updated:`,
    ``,
    `  Field:    ${fieldName}`,
    `  Previous: ${oldValue || '(blank)'}`,
    `  Updated:  ${newValue || '(blank)'}`,
    ``,
    `This email has gone to the scholar, their research supervisor, and the Head of Department.`,
    ``,
    `— ${INSTITUTE_NAME} Research Portal (automated message, please do not reply)`,
  ].join('\n');
}

// ---------- helpers ----------

function departmentInfo_(sheetCode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Departments');
  if (!sheet) return null;
  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const codeCol = header.indexOf('Department Code');
  const nameCol = header.indexOf('Department Name');
  const hodNameCol = header.indexOf('HoD Name');
  const hodEmailCol = header.indexOf('HoD Email');
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][codeCol]).toUpperCase() === sheetCode.toUpperCase()) {
      return {
        code: values[i][codeCol],
        name: values[i][nameCol],
        hodName: values[i][hodNameCol],
        hodEmail: values[i][hodEmailCol],
      };
    }
  }
  return null;
}

function uniqueEmails_(list) {
  const seen = {};
  const out = [];
  list.forEach((e) => {
    const v = String(e || '').trim();
    if (v && isValidEmail_(v) && !seen[v.toLowerCase()]) {
      seen[v.toLowerCase()] = true;
      out.push(v);
    }
  });
  return out;
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function logActivity_(sheetName, row, scholarName, fieldName, oldValue, newValue, notifiedNote) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let log = ss.getSheetByName('Activity Log');
  if (!log) {
    log = ss.insertSheet('Activity Log');
    log.appendRow(['Timestamp', 'Department Sheet', 'Row', 'Scholar Name', 'Field Changed', 'Old Value', 'New Value', 'Edited By (Google account)', 'Emails Sent To']);
  }
  const editor = Session.getActiveUser().getEmail() || '(unknown — script running as owner)';
  log.appendRow([new Date(), sheetName, row, scholarName, fieldName, oldValue, newValue, editor, notifiedNote]);
}

function logError_(err, e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let log = ss.getSheetByName('Activity Log');
    if (!log) return;
    log.appendRow([new Date(), e && e.range ? e.range.getSheet().getName() : '(unknown)', e && e.range ? e.range.getRow() : '', '', 'SCRIPT ERROR', '', '', '', String(err)]);
  } catch (_) {
    // last resort: nothing more we can do
  }
}

/**
 * Run this once manually from the Apps Script editor (select
 * setupTrigger from the function dropdown, click Run) to create the
 * installable onEdit trigger. You only need to do this once per sheet.
 */
function setupTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // remove any existing onEditInstallable triggers first, so re-running
  // this doesn't create duplicates
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'onEditInstallable') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEditInstallable').forSpreadsheet(ss).onEdit().create();
  Logger.log('Trigger installed.');
}

/**
 * Optional: run manually to send yourself a test email without editing
 * a real scholar's row. Useful to confirm Gmail sending works before
 * testing the real trigger.
 */
function sendTestEmail() {
  const me = Session.getActiveUser().getEmail();
  MailApp.sendEmail({
    to: me,
    subject: 'SSSIHL Research Portal — test email',
    body: 'If you are reading this, the Apps Script automation can send email successfully.',
  });
}
