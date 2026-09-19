export const registrationHeaders = ['Team Name', 'Team Leader Name', 'Team Leader Email', 'Number of Team members'];
export const registrationTemplate = `${registrationHeaders.join(',')}\r\nExample Team,Example Leader,leader@example.com,4\r\n`;

// Handles quoted commas, escaped quotes, CRLF, BOM, and embedded newlines.
export function parseRegistrationCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const records = [];
  let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else cell += char;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(cell); cell = ''; closed = false;
      if (char !== ',') { records.push(row); row = []; if (char === '\r' && text[i + 1] === '\n') i++; }
    } else if (char === '"' && cell === '' && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error('Invalid CSV quoting. Export the file as CSV and try again.');
      cell += char;
    }
  }
  if (quoted) throw new Error('A quoted CSV field is not closed.');
  if (cell || closed || row.length) { row.push(cell); records.push(row); }
  const nonempty = records.filter(record => record.some(value => value.trim()));
  const header = nonempty.shift()?.map(value => value.trim());
  if (!header || new Set(header).size !== header.length || registrationHeaders.some(name => !header.includes(name))) {
    throw new Error(`Required columns: ${registrationHeaders.join(', ')}`);
  }
  if (!nonempty.length) throw new Error('The CSV contains no teams.');
  if (nonempty.length > 500) throw new Error('Upload no more than 500 teams at a time.');
  const seen = new Set();
  return nonempty.map((record, index) => {
    const [teamName, leaderName, leaderEmail, size] = registrationHeaders.map(name => (record[header.indexOf(name)] || '').trim());
    const email = leaderEmail.toLowerCase();
    const teamSize = Number(size);
    const errors = [];
    if (record.length !== header.length) errors.push('Column count does not match header');
    if (!teamName || teamName.length > 150) errors.push('Team name must be 1–150 characters');
    if (!leaderName || leaderName.length > 150) errors.push('Leader name must be 1–150 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid leader email');
    if (!/^\d+$/.test(size) || !Number.isSafeInteger(teamSize) || teamSize < 1) errors.push('Team size must be a positive whole number');
    if (seen.has(email)) errors.push('Duplicate leader email in this file');
    seen.add(email);
    return { row: index + 2, body: { teamName, leaderName, leaderEmail: email, teamSize }, status: errors.length ? 'Invalid' : 'Ready', message: errors.join('; ') };
  });
}
