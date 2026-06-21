const fs = require('fs');
let code = fs.readFileSync('services/firebase.js', 'utf8');

code = code.replace("const admin = require('firebase-admin');", "// Firebase Admin is not used, using REST API fallback");
code = code.replace("let db = null;", "let db = null;\nconst FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://planning-with-ai-d0a36-default-rtdb.firebaseio.com';");

const newInit = `function initFirebase() {
    const dataDir = path.dirname(dbJsonPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dbJsonPath)) {
        console.log('📦 db.json tapilmadi. database_inline.js-den doldurulur...');
        const initialData = parseDatabaseInline();
        fs.writeFileSync(dbJsonPath, JSON.stringify(initialData, null, 2), { encoding: 'utf8' });
    }

    useLocalDB = false;
    console.log('🟢 Firebase REST API aktiv edildi (Service Account olmadan birbasa qosulma).');
    return true;
}`;

code = code.replace(/function initFirebase\(\) \{[\s\S]*?\/\/ database_inline\.js faylini oxuyub parse edir/, newInit + "\n\n// database_inline.js faylini oxuyub parse edir");

code = code.replace(/async function getAmbassadors\(\) \{[\s\S]*?async function addAmbassador/, `async function getAmbassadors() {
    if (!useLocalDB) {
        const res = await fetch(\`\${FIREBASE_DB_URL}/ambassadors.json\`);
        const val = await res.json();
        return val ? Object.values(val) : [];
    } else {
        return getLocalDB().ambassadors || [];
    }
}

async function addAmbassador`);

code = code.replace(/async function addAmbassador\(ambassador\) \{[\s\S]*?async function updateAmbassador/, `async function addAmbassador(ambassador) {
    if (!useLocalDB) {
        ambassador.createdAt = Date.now();
        const res = await fetch(\`\${FIREBASE_DB_URL}/ambassadors.json\`, {
            method: 'POST',
            body: JSON.stringify(ambassador)
        });
        const { name } = await res.json();
        ambassador.id = name;
        await fetch(\`\${FIREBASE_DB_URL}/ambassadors/\${name}.json\`, {
            method: 'PATCH',
            body: JSON.stringify({id: name})
        });
        return ambassador;
    } else {
        const data = getLocalDB();
        if (!ambassador.id) ambassador.id = \`AMB_\${Math.floor(10000 + Math.random() * 90000)}\`;
        ambassador.createdAt = Date.now();
        data.ambassadors.push(ambassador);
        saveLocalDB(data);
        return ambassador;
    }
}

async function updateAmbassador`);

code = code.replace(/async function updateAmbassador\(id, updates\) \{[\s\S]*?async function deleteAmbassador/, `async function updateAmbassador(id, updates) {
    if (!useLocalDB) {
        await fetch(\`\${FIREBASE_DB_URL}/ambassadors/\${id}.json\`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        const res = await fetch(\`\${FIREBASE_DB_URL}/ambassadors/\${id}.json\`);
        return await res.json();
    } else {
        const data = getLocalDB();
        const idx = data.ambassadors.findIndex(a => a.id === id);
        if (idx !== -1) {
            data.ambassadors[idx] = { ...data.ambassadors[idx], ...updates };
            saveLocalDB(data);
            return data.ambassadors[idx];
        }
        return null;
    }
}

async function deleteAmbassador`);

code = code.replace(/async function deleteAmbassador\(id\) \{[\s\S]*?async function getTransactions/, `async function deleteAmbassador(id) {
    if (!useLocalDB) {
        await fetch(\`\${FIREBASE_DB_URL}/ambassadors/\${id}.json\`, { method: 'DELETE' });
        return true;
    } else {
        const data = getLocalDB();
        const filtered = data.ambassadors.filter(a => a.id !== id);
        if (filtered.length !== data.ambassadors.length) {
            data.ambassadors = filtered;
            saveLocalDB(data);
            return true;
        }
        return false;
    }
}

async function getTransactions`);

code = code.replace(/async function getTransactions\(\) \{[\s\S]*?async function addTransaction/, `async function getTransactions() {
    if (!useLocalDB) {
        const res = await fetch(\`\${FIREBASE_DB_URL}/transactions.json\`);
        const val = await res.json();
        return val ? Object.values(val) : [];
    } else {
        return getLocalDB().transactions || [];
    }
}

async function addTransaction`);

code = code.replace(/async function addTransaction\(transaction\) \{[\s\S]*?async function getEvents/, `async function addTransaction(transaction) {
    if (!useLocalDB) {
        transaction.createdAt = Date.now();
        const res = await fetch(\`\${FIREBASE_DB_URL}/transactions.json\`, {
            method: 'POST',
            body: JSON.stringify(transaction)
        });
        const { name } = await res.json();
        transaction.id = name;
        await fetch(\`\${FIREBASE_DB_URL}/transactions/\${name}.json\`, {
            method: 'PATCH',
            body: JSON.stringify({id: name})
        });
        return transaction;
    } else {
        const data = getLocalDB();
        if (!transaction.id) transaction.id = 'TX_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        transaction.createdAt = Date.now();
        data.transactions.push(transaction);
        const ambIdx = data.ambassadors.findIndex(a => a.name === transaction.sellerName);
        if (ambIdx !== -1) {
            data.ambassadors[ambIdx].salesVolume = (data.ambassadors[ambIdx].salesVolume || 0) + parseFloat(transaction.amount);
        }
        saveLocalDB(data);
        return transaction;
    }
}

async function getEvents`);

code = code.replace(/async function getEvents\(\) \{[\s\S]*?async function registerForEvent/, `async function getEvents() {
    if (!useLocalDB) {
        const res = await fetch(\`\${FIREBASE_DB_URL}/events.json\`);
        const val = await res.json();
        return val ? Object.values(val) : [];
    } else {
        return getLocalDB().events || [];
    }
}

async function registerForEvent`);

code = code.replace(/async function registerForEvent\(eventId, participantData\) \{[\s\S]*?async function getUsers/, `async function registerForEvent(eventId, participantData) {
    if (!useLocalDB) {
        participantData.registeredAt = Date.now();
        const res = await fetch(\`\${FIREBASE_DB_URL}/events/\${eventId}/participants.json\`, {
            method: 'POST',
            body: JSON.stringify(participantData)
        });
        const { name } = await res.json();
        participantData.id = name;
        await fetch(\`\${FIREBASE_DB_URL}/events/\${eventId}/participants/\${name}.json\`, {
            method: 'PATCH',
            body: JSON.stringify({id: name})
        });
        return participantData;
    } else {
        const data = getLocalDB();
        const eventIdx = data.events.findIndex(e => e.id === eventId);
        if (eventIdx !== -1) {
            if (!data.events[eventIdx].participants) data.events[eventIdx].participants = [];
            if (!participantData.id) participantData.id = \`PART_\${Math.floor(10000 + Math.random() * 90000)}\`;
            participantData.registeredAt = Date.now();
            data.events[eventIdx].participants.push(participantData);
            saveLocalDB(data);
            return participantData;
        }
        throw new Error('Event tapilmadi');
    }
}

async function getUsers`);

code = code.replace(/async function getUsers\(\) \{[\s\S]*?async function addUser/, `async function getUsers() {
    if (!useLocalDB) {
        const res = await fetch(\`\${FIREBASE_DB_URL}/users.json\`);
        const val = await res.json();
        return val ? Object.values(val) : [];
    } else {
        return getLocalDB().users || [];
    }
}

async function addUser`);

code = code.replace(/async function addUser\(user\) \{[\s\S]*?module\.exports = \{/, `async function addUser(user) {
    if (!useLocalDB) {
        await fetch(\`\${FIREBASE_DB_URL}/users/\${user.uid}.json\`, {
            method: 'PUT',
            body: JSON.stringify(user)
        });
        return user;
    } else {
        const data = getLocalDB();
        data.users = data.users || [];
        const existingIdx = data.users.findIndex(u => u.uid === user.uid || u.email === user.email);
        if (existingIdx !== -1) {
            data.users[existingIdx] = { ...data.users[existingIdx], ...user };
        } else {
            data.users.push(user);
        }
        saveLocalDB(data);
        return user;
    }
}

module.exports = {`);

fs.writeFileSync('services/firebase.js', code, 'utf8');
console.log('Rewrite complete');
