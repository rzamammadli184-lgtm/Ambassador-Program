/**
 * Bonuses Router
 * ──────────────
 * Backend service for calculating personal commissions and team bonus cascades.
 */

const express = require('express');
const router = express.Router();
const dbService = require('../services/firebase');

// Bütün ambassadorlar üzrə bonusları hesabla
async function calculateAllBonuses() {
    const allAmbassadors = await dbService.getAmbassadors();
    const allTransactions = await dbService.getTransactions();

    // Ad üzrə sürətli axtarış xəritəsi (Name Map)
    const nameMap = {};
    allAmbassadors.forEach(a => {
        if (!a || !a.name) return; // null/undefined check
        nameMap[a.name] = {
            ...a,
            personalTransactions: [],
            teamEarningsFromOthers: [],
            komandaBonusTotal: 0,
            teshekkurBonus: 0,
            totalBonus: 0,
            earnedNow: 0,
            earnedFuture: 0
        };
    });

    const implicitTransactions = allAmbassadors.filter(a => parseFloat(a.points) > 0).map(a => ({
        id: 'legacy_' + a.id,
        sellerName: a.name,
        amount: parseFloat(a.points) || 0,
        date: a.contractDate || new Date().toISOString(),
        paymentStatus: 'paid'
    }));

    const combinedTransactions = [...allTransactions, ...implicitTransactions];

    // Tranzaksiyaları satan şəxsə görə qruplaşdır
    combinedTransactions.forEach(tr => {
        if (nameMap[tr.sellerName]) {
            nameMap[tr.sellerName].personalTransactions.push(tr);
        }
    });

    // Hər bir tranzaksiyanı iyerarxiya üzrə yuxarı ötür (Cascade calculation)
    allAmbassadors.forEach(seller => {
        if (!seller || !seller.name) return; // null check
        const sellerRecord = nameMap[seller.name];
        if (!sellerRecord || !sellerRecord.personalTransactions.length) return;

        sellerRecord.personalTransactions.forEach(tr => {
            let prevRate = sellerRecord.rate || 0.04;
            let leaderName = sellerRecord.leader;
            const visited = new Set([sellerRecord.name]);
            const cashRatio = tr.amount > 0 ? tr.cash / tr.amount : 1;

            // Şəxsi satışdan qazanc
            const personalEarning = tr.amount * prevRate;
            sellerRecord.teshekkurBonus += personalEarning;
            sellerRecord.earnedNow += personalEarning * cashRatio;
            sellerRecord.earnedFuture += personalEarning * (1 - cashRatio);

            // Alt şəbəkədən yuxarı iyerarxiyaya fərq faizinin ötürülməsi
            while (leaderName && nameMap[leaderName] && !visited.has(leaderName)) {
                visited.add(leaderName);
                const leader = nameMap[leaderName];
                const leaderRate = leader.rate || 0.04;

                if (leaderRate > prevRate) {
                    const diff = leaderRate - prevRate;
                    const amountEarned = tr.amount * diff;
                    leader.komandaBonusTotal += amountEarned;
                    
                    const earnedNow = amountEarned * cashRatio;
                    const earnedFuture = amountEarned - earnedNow;

                    leader.teamEarningsFromOthers.push({
                        id: tr.id,
                        sellerName: sellerRecord.name,
                        sellerLevelLabel: sellerRecord.levelLabel,
                        saleAmount: tr.amount,
                        buyer: tr.buyer,
                        cash: tr.cash,
                        credit: tr.credit,
                        months: tr.months,
                        diffRate: diff,
                        myEarningsTotal: amountEarned,
                        myEarningsNow: earnedNow,
                        myEarningsFuture: earnedFuture,
                        date: tr.date,
                        isSelf: false
                    });

                    leader.earnedNow += earnedNow;
                    leader.earnedFuture += earnedFuture;
                }

                prevRate = Math.max(prevRate, leaderRate);
                leaderName = leader.leader;
                
                // Maksimum faiz dərəcəsi (10%) dolduqda cascade-i saxla
                if (prevRate >= 0.10) break;
            }
        });
    });

    // Toplam bonusları hesabla
    Object.values(nameMap).forEach(a => {
        a.totalBonus = a.teshekkurBonus + a.komandaBonusTotal;
    });

    return nameMap;
}

// Bütün ambassadorların bonus xülasəsi
router.get('/', async (req, res) => {
    try {
        const bonusMap = await calculateAllBonuses();
        const result = Object.values(bonusMap).map(a => ({
            id: a.id,
            name: a.name,
            levelLabel: a.levelLabel,
            salesVolume: a.salesVolume,
            rate: a.rate,
            personalBonus: a.teshekkurBonus,
            teamBonus: a.komandaBonusTotal,
            totalBonus: a.totalBonus,
            earnedNow: a.earnedNow,
            earnedFuture: a.earnedFuture
        })).sort((a, b) => b.totalBonus - a.totalBonus);

        res.json(result);
    } catch (err) {
        console.error('Get all bonuses error:', err);
        res.status(500).json({ error: 'Bonus siyahısı hesablalanarkən xəta baş verdi.' });
    }
});

// Müəyyən ambassador üzrə detallı tranzaksiya və bonus tarixçəsi
router.get('/:name', async (req, res) => {
    try {
        const name = req.params.name.trim();
        const bonusMap = await calculateAllBonuses();
        const data = bonusMap[name];

        if (!data) {
            return res.status(404).json({ error: `Ambassador tapılmadı: ${name}` });
        }

        const transactionsList = [];

        // Şəxsi Satışlar
        data.personalTransactions.forEach(tr => {
            const cashRatio = tr.amount > 0 ? tr.cash / tr.amount : 1;
            const myEarningsTotal = tr.amount * (data.rate || 0.04);
            const myEarningsNow = myEarningsTotal * cashRatio;
            const myEarningsFuture = myEarningsTotal - myEarningsNow;

            transactionsList.push({
                id: tr.id,
                type: 'Şəxsi Satış',
                sellerName: data.name,
                sellerLevelLabel: data.levelLabel,
                saleAmount: tr.amount,
                buyer: tr.buyer,
                cash: tr.cash,
                credit: tr.credit,
                months: tr.months,
                myEarningsTotal,
                myEarningsNow,
                myEarningsFuture,
                date: tr.date,
                isSelf: true
            });
        });

        // Komanda Satışları
        data.teamEarningsFromOthers.forEach(t => {
            transactionsList.push({
                id: t.id,
                type: 'Komanda Satışı',
                sellerName: t.sellerName,
                sellerLevelLabel: t.sellerLevelLabel,
                saleAmount: t.saleAmount,
                buyer: t.buyer,
                cash: t.cash,
                credit: t.credit,
                months: t.months,
                myEarningsTotal: t.myEarningsTotal,
                myEarningsNow: t.myEarningsNow,
                myEarningsFuture: t.myEarningsFuture,
                diffRate: t.diffRate,
                date: t.date,
                isSelf: false
            });
        });

        // Tarixə görə sırala (yenidən köhnəyə)
        transactionsList.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            ambassador: {
                id: data.id,
                name: data.name,
                leader: data.leader,
                levelLabel: data.levelLabel,
                rate: data.rate,
                salesVolume: data.salesVolume,
                points: data.points
            },
            stats: {
                totalBonus: data.totalBonus,
                personalBonus: data.teshekkurBonus,
                teamBonus: data.komandaBonusTotal,
                earnedNow: data.earnedNow,
                earnedFuture: data.earnedFuture
            },
            transactions: transactionsList
        });
    } catch (err) {
        console.error('Get ambassador bonuses error:', err);
        res.status(500).json({ error: 'Fərdi bonuslar hesablanarkən xəta baş verdi.' });
    }
});

module.exports = router;
