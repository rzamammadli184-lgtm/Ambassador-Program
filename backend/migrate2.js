const fs = require('fs');
const path = require('path');
const { saveAmbassador } = require('./services/firebase');

async function migrate() {
    console.log("Starting database migration directly to Firebase...");
    
    // Read database_inline.js
    const dbPath = path.join(__dirname, '../database_inline.js');
    let content = fs.readFileSync(dbPath, 'utf8');
    
    // Extract JSON part
    content = content.replace('// AzEstetik Database - Auto-generated\n', '');
    content = content.replace('window.RAW_DATABASE = ', '').trim();
    if(content.endsWith(';')) content = content.slice(0, -1);
    
    let rawDb;
    try {
        rawDb = JSON.parse(content);
        console.log("Successfully parsed database_inline.js");
    } catch(err) {
        console.error("Failed to parse JSON.");
        return;
    }
    
    function parseExcelDate(val) {
        if (!val) return '';
        if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val))) {
            const excelDays = parseInt(val);
            if (excelDays > 20000) {
                // Excel dates are days since Dec 30, 1899
                const date = new Date((excelDays - 25569) * 86400 * 1000);
                return date.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '/');
            }
        }
        return String(val).trim();
    }

    const rawAmb = rawDb.AMB || [];
    const map = new Map();

    function mergeObj(obj) {
        if (!obj.name) return;
        const key = obj.name.trim().toLowerCase();
        if (!map.has(key)) {
            obj.createdAt = new Date().getTime();
            obj.salesVolume = 0;
            if(!obj.id) obj.id = '';
            map.set(key, obj);
        } else {
            const existing = map.get(key);
            for (let k in obj) {
                if (obj[k] && !existing[k]) {
                    existing[k] = obj[k];
                }
            }
        }
    }

    rawAmb.filter(item => item.rowNum >= 4 && item.data.B && item.data.B.trim()).forEach(item => {
        const d = item.data;
        mergeObj({
            id: d.A || '', 
            name: (d.B || '').trim(), 
            points: parseFloat(d.C) || 0, 
            idCode: (d.D || '').trim(),
            leader: (d.E || '').trim(), 
            contractDate: parseExcelDate(d.F), 
            birthday: parseExcelDate(d.G),
            status: (d.H || '').trim(), 
            level: (d.I || '').trim(), 
            phone: (d.J || '').trim()
        });
    });

    ['Sayfa4', 'Grup 1', 'Grup 2', 'Grup 3', 'Grup 4'].forEach(sheetName => {
        if (!rawDb[sheetName]) return;
        rawDb[sheetName].filter(item => item.rowNum >= 4 && item.data.B && item.data.B.trim()).forEach(item => {
            const d = item.data;
            mergeObj({
                name: (d.B || '').trim(),
                points: parseFloat(d.C) || 0,
                leader: (d.D || '').trim(),
                contractDate: parseExcelDate(d.E),
                status: (d.F || '').trim(),
                level: (d.G || '').trim()
            });
        });
    });

    if (rawDb['Yeni Ambassadorlar']) {
        rawDb['Yeni Ambassadorlar'].filter(item => item.rowNum >= 2 && item.data.A && item.data.A.trim()).forEach(item => {
            const d = item.data;
            mergeObj({
                name: (d.A || '').trim(),
                points: parseFloat(d.B) || 0,
                contractDate: parseExcelDate(d.C),
                status: (d.D || '').trim(),
                level: (d.E || '').trim(),
                phone: (d.F || '').trim()
            });
        });
    }

    const ambassadors = Array.from(map.values());

    // Second pass: resolve leader idCodes to actual names for team building
    const idCodeMap = new Map();
    ambassadors.forEach(a => {
        if (a.idCode && a.idCode.trim()) {
            idCodeMap.set(a.idCode.trim(), a.name);
        }
    });

    ambassadors.forEach(a => {
        if (a.leader && idCodeMap.has(a.leader.trim())) {
            a.leader = idCodeMap.get(a.leader.trim());
        }
    });

    const { initFirebase, addAmbassador } = require('./services/firebase');
    initFirebase();
    
    let successCount = 0;
    
    // Clear old data
    try {
        await fetch('https://planning-with-ai-d0a36-default-rtdb.firebaseio.com/ambassadors.json', { method: 'DELETE' });
        console.log("Cleared old ambassadors.json");
    } catch(e) {}
    
    // Process in smaller batches or sequential to avoid Firebase rate limit if any
    for(let i = 0; i < ambassadors.length; i++) {
        const amb = ambassadors[i];
        try {
            // Using PUT to avoid duplicates using their existing ID if available, otherwise POST
            const method = amb.id ? 'PUT' : 'POST';
            const url = amb.id 
                ? `https://planning-with-ai-d0a36-default-rtdb.firebaseio.com/ambassadors/${amb.id}.json`
                : `https://planning-with-ai-d0a36-default-rtdb.firebaseio.com/ambassadors.json`;
            
            await fetch(url, {
                method: method,
                body: JSON.stringify(amb)
            });
            successCount++;
            if (successCount % 50 === 0) {
                console.log(`Migrated ${successCount} / ${ambassadors.length}`);
            }
        } catch(err) {
            console.error(`Error inserting ${amb.name}: ${err.message}`);
        }
    }
    
    console.log(`Migration complete! Successfully migrated ${successCount} records.`);
}

migrate();
