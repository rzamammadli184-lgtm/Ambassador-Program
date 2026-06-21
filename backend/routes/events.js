/**
 * Events Router
 * ─────────────
 * API endpoints for event registrations and participant list retrieval.
 */

const express = require('express');
const router = express.Router();
const dbService = require('../services/firebase');

// Bütün tədbirləri gətir
router.get('/', async (req, res) => {
    try {
        const events = await dbService.getEvents();
        res.json(events);
    } catch (err) {
        console.error('Get events error:', err);
        res.status(500).json({ error: 'Tədbirlər gətirilərkən xəta baş verdi.' });
    }
});

// Tədbir üzrə bütün qeydiyyatdan keçmiş iştirakçıları gətir
router.get('/:eventId/participants', async (req, res) => {
    try {
        const { eventId } = req.params;
        const events = await dbService.getEvents();
        const event = events.find(e => e.id === eventId);
        
        if (!event) {
            return res.status(404).json({ error: 'Tədbir tapılmadı.' });
        }
        
        // Həm firebase, həm də lokal obyekt strukturlarını dəstəklə
        const participants = event.participants 
            ? (Array.isArray(event.participants) ? event.participants : Object.values(event.participants))
            : [];
            
        res.json(participants);
    } catch (err) {
        console.error('Get event participants error:', err);
        res.status(500).json({ error: 'İştirakçılar gətirilərkən xəta baş verdi.' });
    }
});

// Tədbirə yeni iştirakçı qeydiyyatı
router.post('/:eventId/register', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { name, phone, branch, notes } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ error: 'Ad və əlaqə nömrəsi daxil edilməlidir.' });
        }

        const events = await dbService.getEvents();
        const eventExists = events.some(e => e.id === eventId);
        if (!eventExists) {
            return res.status(404).json({ error: 'Tədbir tapılmadı.' });
        }

        const participantData = {
            name: name.trim(),
            phone: phone.trim(),
            branch: (branch || '').trim(),
            notes: (notes || '').trim()
        };

        const saved = await dbService.registerForEvent(eventId, participantData);
        res.status(201).json(saved);
    } catch (err) {
        console.error('Event registration error:', err);
        res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi.' });
    }
});

module.exports = router;
