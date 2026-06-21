/**
 * Transactions Router
 * ───────────────────
 * API endpoints for registering sales transactions.
 */

const express = require('express');
const router = express.Router();
const dbService = require('../services/firebase');

// Bütün tranzaksiyaları gətir (və ya sellerName-ə görə filtrlə)
router.get('/', async (req, res) => {
    try {
        const { seller } = req.query;
        let transactions = await dbService.getTransactions();
        
        if (seller) {
            transactions = transactions.filter(t => t.sellerName === seller);
        }
        
        res.json(transactions);
    } catch (err) {
        console.error('Get transactions error:', err);
        res.status(500).json({ error: 'Tranzaksiyalar gətirilərkən xəta baş verdi.' });
    }
});

// Yeni satış tranzaksiyası əlavə et
router.post('/', async (req, res) => {
    try {
        const { sellerName, buyer, amount, cash, credit, months } = req.body;
        
        if (!sellerName || !buyer || !amount) {
            return res.status(400).json({ error: 'Satan şəxs, alıcı və məbləğ sahələri mütləq doldurulmalıdır.' });
        }

        const saleAmount = parseFloat(amount);
        const cashAmt = parseFloat(cash) !== undefined ? parseFloat(cash) : saleAmount;
        const creditAmt = parseFloat(credit) || 0;
        const creditMonths = parseInt(months) || 0;
        const isCredit = creditAmt > 0 || creditMonths > 0;

        // Satan ambassador-un bazada mövcudluğunu yoxla
        const ambassadors = await dbService.getAmbassadors();
        const sellerExists = ambassadors.some(a => a.name === sellerName);
        if (!sellerExists) {
            return res.status(404).json({ error: `Ambassador tapılmadı: ${sellerName}` });
        }

        const newTrx = {
            sellerName: sellerName.trim(),
            buyer: buyer.trim(),
            amount: saleAmount,
            cash: cashAmt,
            credit: creditAmt,
            months: creditMonths,
            isCredit: isCredit,
            date: new Date().toISOString().split('T')[0]
        };

        const saved = await dbService.addTransaction(newTrx);
        res.status(201).json(saved);
    } catch (err) {
        console.error('Add transaction error:', err);
        res.status(500).json({ error: 'Tranzaksiya qeydə alınarkən xəta baş verdi.' });
    }
});

// Müştəri alış etdikdə (Kompanyon statusuna yüksəlmə)
router.post('/purchase', async (req, res) => {
    try {
        const { userId, productName, amount } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({ error: 'İstifadəçi ID və məbləğ tələb olunur.' });
        }

        const ambassadors = await dbService.getAmbassadors();
        const customer = ambassadors.find(a => a.id === userId);

        if (!customer) {
            return res.status(404).json({ error: 'Müştəri tapılmadı.' });
        }

        // Alış tranzaksiyasını yarat (Müştəri özü alır, ona görə sellerName və buyer eynidir və ya seller leader-dir)
        const newTrx = {
            sellerName: customer.leader || 'Şirkət',
            buyer: customer.name,
            amount: parseFloat(amount),
            productName: productName || 'Məhsul alışı',
            cash: parseFloat(amount),
            credit: 0,
            months: 0,
            isCredit: false,
            date: new Date().toISOString().split('T')[0]
        };

        const savedTrx = await dbService.addTransaction(newTrx);

        // Əgər istifadəçi "Müş" (Müştəri) idisə, onu avtomatik olaraq "K" (Kompanyon) et
        let isUpgraded = false;
        if (customer.status === 'Müş') {
            const updates = {
                status: 'K',
                levelLabel: 'Kompanyon',
                rate: 0.04
            };
            await dbService.updateAmbassador(customer.id, updates);
            
            // User cədvəlindəki rolunu da "user" (Kompanyon) olaraq yenilə
            const users = await dbService.getUsers();
            const dbUser = users.find(u => u.uid === userId);
            if (dbUser) {
                await dbService.addUser({ ...dbUser, role: 'user' });
            }
            
            isUpgraded = true;
        }

        res.status(200).json({ 
            success: true, 
            message: 'Alış uğurla tamamlandı.', 
            transaction: savedTrx,
            isUpgraded 
        });
    } catch (err) {
        console.error('Purchase error:', err);
        res.status(500).json({ error: 'Alış zamanı xəta baş verdi.' });
    }
});

module.exports = router;
