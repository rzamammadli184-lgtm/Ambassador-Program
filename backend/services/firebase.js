/**
 * Firebase Admin SDK & Database Service Provider
 * ──────────────────────────────────────────────
 * Firebase Realtime Database-ə REST API ilə qoşulur
 * Lokal fallback: data/db.json
 */

const fs = require('fs');
const path = require('path');

let useLocalDB = false; // default: Firebase REST
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://planning-with-ai-d0a36-default-rtdb.firebaseio.com';

// Lokal database faylının yolu
const dbJsonPath = path.join(__dirname, '../data/db.json');

// ── Init ─────────────────────────────────────────────────────
function initFirebase() {
    const dataDir = path.dirname(dbJsonPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dbJsonPath)) {
        const emptyData = { ambassadors: [], transactions: [], events: [], users: [] };
        fs.writeFileSync(dbJsonPath, JSON.stringify(emptyData, null, 2), { encoding: 'utf8' });
        console.log('📦 db.json yenidən yaradıldı (boş).');
    }

    useLocalDB = false;
    console.log('🟢 Firebase REST API aktiv edildi.');
    return true;
}

// ── Local DB helpers ─────────────────────────────────────────
function getLocalDB() {
    try {
        const fileContent = fs.readFileSync(dbJsonPath, 'utf8');
        return JSON.parse(fileContent);
    } catch (e) {
        return { ambassadors: [], transactions: [], events: [], users: [] };
    }
}

function saveLocalDB(data) {
    try {
        fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
        return true;
    } catch (e) {
        console.error('❌ DB yazılarkən xəta:', e.message);
        return false;
    }
}

// ── Rate / Level helpers ──────────────────────────────────────
const getRate = (statusFlag, lvl) => {
    if (statusFlag === 'K') return 0.04;
    if (lvl >= 5)           return 0.10;
    if (lvl === 4)          return 0.09;
    if (lvl === 3)          return 0.08;
    if (lvl === 2)          return 0.07;
    if (lvl === 1)          return 0.06;
    return 0.04;
};

const getLevelLabel = (statusStr, lvlInt) => {
    let label = 'Kompanyon';
    if (statusStr !== 'K') {
        label = lvlInt > 0 ? `AMB ${lvlInt}` : 'AMB';
        if (statusStr === 'A+') label += ' ⭐';
    }
    return label;
};

// ── Safe Firebase fetch wrapper ──────────────────────────────
async function firebaseFetch(path, options = {}) {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}${path}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) }
        });
        if (!res.ok) throw new Error(`Firebase HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(`❌ Firebase xətası (${path}):`, e.message);
        return null;
    }
}

// ── CRUD: Ambassadors ────────────────────────────────────────
async function getAmbassadors() {
    let rawList = [];
    if (!useLocalDB) {
        const val = await firebaseFetch('/ambassadors.json');
        if (val && typeof val === 'object') {
            rawList = Object.entries(val).map(([key, a]) => {
                if (a && a.name) { if (!a.id) a.id = key; return a; }
                return null;
            }).filter(Boolean);
        }
    } else {
        rawList = getLocalDB().ambassadors || [];
    }

    return rawList.map(a => {
        const lvlInt = parseInt(a.level) || 0;
        const statusStr = (a.status || 'A').trim();
        return {
            ...a,
            rate: a.rate !== undefined ? a.rate : getRate(statusStr, lvlInt),
            levelLabel: a.levelLabel || getLevelLabel(statusStr, lvlInt)
        };
    });
}

async function addAmbassador(ambassador) {
    if (!useLocalDB) {
        ambassador.createdAt = Date.now();
        const data = await firebaseFetch('/ambassadors.json', { method: 'POST', body: JSON.stringify(ambassador) });
        if (data && data.name) {
            ambassador.id = data.name;
            await firebaseFetch(`/ambassadors/${data.name}.json`, { method: 'PATCH', body: JSON.stringify({ id: data.name }) });
        }
        return ambassador;
    } else {
        const db = getLocalDB();
        if (!ambassador.id) ambassador.id = `AMB_${Math.floor(10000 + Math.random() * 90000)}`;
        ambassador.createdAt = Date.now();
        db.ambassadors.push(ambassador);
        saveLocalDB(db);
        return ambassador;
    }
}

async function updateAmbassador(id, updates) {
    if (!useLocalDB) {
        await firebaseFetch(`/ambassadors/${id}.json`, { method: 'PATCH', body: JSON.stringify(updates) });
        return await firebaseFetch(`/ambassadors/${id}.json`);
    } else {
        const db = getLocalDB();
        const idx = db.ambassadors.findIndex(a => a.id === id);
        if (idx !== -1) {
            db.ambassadors[idx] = { ...db.ambassadors[idx], ...updates };
            saveLocalDB(db);
            return db.ambassadors[idx];
        }
        return null;
    }
}

async function deleteAmbassador(id) {
    if (!useLocalDB) {
        await firebaseFetch(`/ambassadors/${id}.json`, { method: 'DELETE' });
        return true;
    } else {
        const db = getLocalDB();
        const filtered = db.ambassadors.filter(a => a.id !== id);
        if (filtered.length !== db.ambassadors.length) {
            db.ambassadors = filtered;
            saveLocalDB(db);
            return true;
        }
        return false;
    }
}

// ── CRUD: Transactions ───────────────────────────────────────
async function getTransactions() {
    if (!useLocalDB) {
        const val = await firebaseFetch('/transactions.json');
        return val && typeof val === 'object' ? Object.values(val) : [];
    }
    return getLocalDB().transactions || [];
}

async function addTransaction(transaction) {
    if (!useLocalDB) {
        transaction.createdAt = Date.now();
        const data = await firebaseFetch('/transactions.json', { method: 'POST', body: JSON.stringify(transaction) });
        if (data && data.name) {
            transaction.id = data.name;
            await firebaseFetch(`/transactions/${data.name}.json`, { method: 'PATCH', body: JSON.stringify({ id: data.name }) });
        }
        return transaction;
    } else {
        const db = getLocalDB();
        if (!transaction.id) transaction.id = 'TX_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        transaction.createdAt = Date.now();
        db.transactions.push(transaction);
        const ambIdx = db.ambassadors.findIndex(a => a.name === transaction.sellerName);
        if (ambIdx !== -1) {
            db.ambassadors[ambIdx].salesVolume = (db.ambassadors[ambIdx].salesVolume || 0) + parseFloat(transaction.amount);
        }
        saveLocalDB(db);
        return transaction;
    }
}

// ── CRUD: Events ─────────────────────────────────────────────
async function getEvents() {
    if (!useLocalDB) {
        const val = await firebaseFetch('/events.json');
        return val && typeof val === 'object' ? Object.values(val) : [];
    }
    return getLocalDB().events || [];
}

async function registerForEvent(eventId, participantData) {
    if (!useLocalDB) {
        participantData.registeredAt = Date.now();
        const data = await firebaseFetch(`/events/${eventId}/participants.json`, { method: 'POST', body: JSON.stringify(participantData) });
        if (data && data.name) participantData.id = data.name;
        return participantData;
    } else {
        const db = getLocalDB();
        const eventIdx = db.events.findIndex(e => e.id === eventId);
        if (eventIdx !== -1) {
            if (!db.events[eventIdx].participants) db.events[eventIdx].participants = [];
            if (!participantData.id) participantData.id = `PART_${Math.floor(10000 + Math.random() * 90000)}`;
            participantData.registeredAt = Date.now();
            db.events[eventIdx].participants.push(participantData);
            saveLocalDB(db);
            return participantData;
        }
        throw new Error('Event tapılmadı');
    }
}

// ── CRUD: Users ──────────────────────────────────────────────
async function getUsers() {
    if (!useLocalDB) {
        const val = await firebaseFetch('/users.json');
        return val && typeof val === 'object' ? Object.values(val) : [];
    }
    return getLocalDB().users || [];
}

async function addUser(user) {
    if (!useLocalDB) {
        await firebaseFetch(`/users/${user.uid}.json`, { method: 'PUT', body: JSON.stringify(user) });
        return user;
    } else {
        const db = getLocalDB();
        db.users = db.users || [];
        const existingIdx = db.users.findIndex(u => u.uid === user.uid || u.email === user.email);
        if (existingIdx !== -1) {
            db.users[existingIdx] = { ...db.users[existingIdx], ...user };
        } else {
            db.users.push(user);
        }
        saveLocalDB(db);
        return user;
    }
}

module.exports = {
    initFirebase,
    getAmbassadors,
    addAmbassador,
    updateAmbassador,
    deleteAmbassador,
    getTransactions,
    addTransaction,
    getEvents,
    registerForEvent,
    getUsers,
    addUser,
    isLocalMode: () => useLocalDB
};
