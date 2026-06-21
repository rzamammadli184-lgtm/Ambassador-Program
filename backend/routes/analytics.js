/**
 * Analytics Router
 * ────────────────
 * API endpoints for dashboard KPI stats, branch sales, and analytical summaries.
 */

const express = require('express');
const router = express.Router();
const dbService = require('../services/firebase');

router.get('/dashboard', async (req, res) => {
    try {
        const ambassadors = await dbService.getAmbassadors();
        const transactions = await dbService.getTransactions();

        // 1. Ümumi Statistika
        const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const totalCash = transactions.reduce((sum, t) => sum + parseFloat(t.cash || 0), 0);
        const totalCredit = transactions.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
        const activeCount = ambassadors.filter(a => a.salesVolume > 0).length;

        // Target (Aylıq Hədəf - Məsələn 350,000 ₼)
        const monthlyTarget = 350000;
        const targetProgress = (totalSales / monthlyTarget) * 100;

        // 2. Qruplar üzrə bölgü (Branch breakdown)
        // Hər qrup rəhbərinin altındakı ambassadorların satış həcmi cəmi
        const groupSales = {};
        ambassadors.forEach(a => {
            const leader = a.leader || 'Şirkət';
            if (!groupSales[leader]) {
                groupSales[leader] = {
                    leaderName: leader,
                    sales: 0,
                    memberCount: 0
                };
            }
            groupSales[leader].sales += parseFloat(a.salesVolume || 0);
            groupSales[leader].memberCount += 1;
        });

        const sortedGroups = Object.values(groupSales)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5); // Ən yaxşı 5 qrup

        // 3. Tarixi Satış Dinamikası (Son 7 gün)
        const dailySales = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            dailySales[dateKey] = 0;
        }

        transactions.forEach(t => {
            if (dailySales[t.date] !== undefined) {
                dailySales[t.date] += parseFloat(t.amount || 0);
            }
        });

        const salesTimeline = Object.keys(dailySales).map(date => ({
            date,
            amount: Math.round(dailySales[date])
        }));

        res.json({
            kpis: {
                totalSales: Math.round(totalSales),
                totalCash: Math.round(totalCash),
                totalCredit: Math.round(totalCredit),
                activeAmbassadors: activeCount,
                totalAmbassadors: ambassadors.length,
                target: monthlyTarget,
                progress: Math.min(Math.round(targetProgress * 10) / 10, 100)
            },
            topGroups: sortedGroups,
            salesTimeline
        });
    } catch (err) {
        console.error('Get dashboard analytics error:', err);
        res.status(500).json({ error: 'Analitika hesablanarkən xəta baş verdi.' });
    }
});

// Qrup rəhbərlərinin reytinqi (Leaderboard)
router.get('/leaderboard', async (req, res) => {
    try {
        const ambassadors = await dbService.getAmbassadors();
        
        const sorted = [...ambassadors]
            .filter(a => a.salesVolume > 0)
            .map(a => ({
                id: a.id,
                name: a.name,
                leader: a.leader,
                salesVolume: a.salesVolume,
                levelLabel: a.levelLabel,
                points: a.points
            }))
            .sort((a, b) => b.salesVolume - a.salesVolume)
            .slice(0, 15); // Top 15

        res.json(sorted);
    } catch (err) {
        console.error('Get leaderboard error:', err);
        res.status(500).json({ error: 'Liderlər siyahısı hesablanarkən xəta baş verdi.' });
    }
});

module.exports = router;
