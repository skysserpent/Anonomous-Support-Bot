const fs = require('fs');
const path = './backend/Authed_Users.json';

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify({ admins: [], staff: [] }, null, 2));
}

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
    // force-string all IDs
    const toStr = (arr) => Array.isArray(arr) ? arr.map(v => String(v)) : [];
    return {
      admins: toStr(raw.admins),
      staff:  toStr(raw.staff),
    };
  } catch {
    return { admins: [], staff: [] };
  }
}

function save(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

let data = load();

function isOwner(id) {
  const owner = process.env.OWNER_ID || process.env.OWNERID || process.env.OWNER || '';
  return String(id) === String(owner);
}

function isAdmin(id) {
  const sid = String(id);
  return isOwner(sid) || data.admins.includes(sid);
}

function isStaff(id) {
  const sid = String(id);
  return isAdmin(sid) || data.staff.includes(sid);
}

// Optional helpers if you call them elsewhere
async function addStaff(message, id) {
  const sid = String(id);
  if (!data.staff.includes(sid)) {
    data.staff.push(sid);
    save(data);
  }
  return message?.reply?.(`<@${sid}> added to staff.`);
}

async function removeStaff(message, id) {
  const sid = String(id);
  data.staff = data.staff.filter(x => x !== sid);
  save(data);
  return message?.reply?.(`<@${sid}> removed from staff.`);
}

module.exports = {
  isOwner,
  isAdmin,
  isStaff,
  addStaff,
  removeStaff,
  _reload: () => { data = load(); },
};
