/**
 * Ambassadors Router
 * ──────────────────
 * CRUD endpoints for managing ambassador accounts.
 */

const express = require('express');
const router = express.Router();
const dbService = require('../services/firebase');

// Bütün ambassadorları gətir
router.get('/', async (req, res) => {
    try {
        const ambassadors = await dbService.getAmbassadors();
        res.json(ambassadors);
    } catch (err) {
        console.error('Get ambassadors error:', err);
        res.status(500).json({ error: 'Ambassadorlar gətirilərkən xəta baş verdi.' });
    }
});

// ID-yə görə tək ambassador gətir
router.get('/:id', async (req, res) => {
    try {
        const ambassadors = await dbService.getAmbassadors();
        const ambassador = ambassadors.find(a => a.id === req.params.id);
        if (!ambassador) {
            return res.status(404).json({ error: 'Ambassador tapılmadı.' });
        }
        res.json(ambassador);
    } catch (err) {
        console.error('Get ambassador error:', err);
        res.status(500).json({ error: 'Ambassador gətirilərkən xəta baş verdi.' });
    }
});

// Yeni ambassador əlavə et
router.post('/', async (req, res) => {
    try {
        const { name, leader, phone, points, status, level } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Ad mütləq daxil edilməlidir.' });
        }

        // Səviyyə üzrə dərəcə hesablamaq üçün helper
        const getRate = (statusFlag, lvl) => {
            if (statusFlag === 'K') return 0.04;
            if (lvl >= 5)        return 0.10;
            if (lvl === 4)       return 0.09;
            if (lvl === 3)       return 0.08;
            if (lvl === 2)       return 0.07;
            if (lvl === 1)       return 0.06;
            return 0.04;
        };

        const lvlInt = parseInt(level) || 0;
        const statusStr = (status || 'A').trim();
        const rate = getRate(statusStr, lvlInt);
        
        let levelLabel = 'Kompanyon';
        if (statusStr !== 'K') {
            levelLabel = lvlInt > 0 ? `AMB ${lvlInt}` : 'AMB';
            if (statusStr === 'A+') levelLabel += ' ⭐';
        }

        const newAmbassador = {
            name: name.trim(),
            leader: (leader || 'Şirkət').trim(),
            phone: phone || '',
            points: parseFloat(points) || 0,
            status: statusStr,
            level: lvlInt,
            levelLabel: levelLabel,
            rate: rate,
            salesVolume: 0
        };

        const saved = await dbService.addAmbassador(newAmbassador);
        res.status(201).json(saved);
    } catch (err) {
        console.error('Add ambassador error:', err);
        res.status(500).json({ error: 'Ambassador əlavə edilərkən xəta baş verdi.' });
    }
});

// Ambassador məlumatlarını yenilə
router.put('/:id', async (req, res) => {
    try {
        const { name, leader, phone, points, status, level, salesVolume } = req.body;
        
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (leader !== undefined) updates.leader = leader.trim();
        if (phone !== undefined) updates.phone = phone;
        if (points !== undefined) updates.points = parseFloat(points) || 0;
        if (status !== undefined) updates.status = status.trim();
        if (level !== undefined) updates.level = parseInt(level) || 0;
        if (salesVolume !== undefined) updates.salesVolume = parseFloat(salesVolume) || 0;

        // Rate və levelLabel-i avtomatik yenilə
        if (updates.status !== undefined || updates.level !== undefined) {
            const currentAmbassadors = await dbService.getAmbassadors();
            const current = currentAmbassadors.find(a => a.id === req.params.id);
            if (!current) {
                return res.status(404).json({ error: 'Ambassador tapılmadı.' });
            }
            
            const finalStatus = updates.status !== undefined ? updates.status : current.status;
            const finalLevel = updates.level !== undefined ? updates.level : current.level;

            const getRate = (statusFlag, lvl) => {
                if (statusFlag === 'K') return 0.04;
                if (lvl >= 5)        return 0.10;
                if (lvl === 4)       return 0.09;
                if (lvl === 3)       return 0.08;
                if (lvl === 2)       return 0.07;
                if (lvl === 1)       return 0.06;
                return 0.04;
            };

            updates.rate = getRate(finalStatus, finalLevel);
            
            let levelLabel = 'Kompanyon';
            if (finalStatus !== 'K') {
                levelLabel = finalLevel > 0 ? `AMB ${finalLevel}` : 'AMB';
                if (finalStatus === 'A+') levelLabel += ' ⭐';
            }
            updates.levelLabel = levelLabel;
        }

        const updated = await dbService.updateAmbassador(req.params.id, updates);
        if (!updated) {
            return res.status(404).json({ error: 'Ambassador tapılmadı.' });
        }
        res.json(updated);
    } catch (err) {
        console.error('Update ambassador error:', err);
        res.status(500).json({ error: 'Ambassador yenilənərkən xəta baş verdi.' });
    }
});

// Ambassador-u sil
router.delete('/:id', async (req, res) => {
    try {
        const success = await dbService.deleteAmbassador(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Ambassador tapılmadı.' });
        }
        res.json({ success: true, message: 'Ambassador silindi.' });
    } catch (err) {
        console.error('Delete ambassador error:', err);
        res.status(500).json({ error: 'Ambassador silinərkən xəta baş verdi.' });
    }
});

module.exports = router;
