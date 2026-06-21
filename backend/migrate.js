const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log("Starting database migration...");
    
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
        console.error("Failed to parse JSON. Reason:", err.message);
        // Let's print the first and last 100 characters to see what's wrong
        console.log("Start:", content.substring(0, 100));
        console.log("End:", content.substring(content.length - 100));
        return;
    }
    
    const rawAmb = rawDb.AMB || [];
    const ambassadors = rawAmb
        .filter(item => item.rowNum >= 4 && item.data.B && item.data.B.trim())
        .map(item => {
            const d = item.data;
            const rawG = String(d.G || '').replace(/[^\d.]/g, '');
            const salesVolume = parseFloat(rawG) || 0;
            return {
                id: d.A || '', 
                name: (d.B || '').trim(), 
                points: parseFloat(d.C) || 0, 
                idCode: (d.D || '').trim(),
                leader: (d.E || '').trim(), 
                contractDate: d.F || '', 
                birthday: d.G || '',
                status: (d.H || '').trim(), 
                level: (d.I || '').trim(), 
                phone: (d.J || '').trim(),
                salesVolume: salesVolume,
                createdAt: new Date().getTime()
            };
        });

    console.log(`Found ${ambassadors.length} valid ambassador records to migrate.`);
    
    // We will post directly to Firebase using the existing module to avoid HTTP overhead
    const { initFirebase } = require('./services/firebase');
    initFirebase();
    
    let successCount = 0;
    
    // Let's do batches to be safe or just sequential
    for(let i = 0; i < ambassadors.length; i++) {
        const amb = ambassadors[i];
        try {
            const res = await fetch('http://localhost:3001/api/ambassadors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(amb)
            });
            if(res.ok) {
                successCount++;
                if (successCount % 50 === 0) {
                    console.log(`Migrated ${successCount} / ${ambassadors.length}`);
                }
            } else {
                console.error(`Failed to insert ${amb.name}: ${await res.text()}`);
            }
        } catch(err) {
            console.error(`Error inserting ${amb.name}: ${err.message}`);
        }
    }
    
    console.log(`Migration complete! Successfully migrated ${successCount} records.`);
}

migrate();
