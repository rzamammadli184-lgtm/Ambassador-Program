/**
 * AzEstetik Hybrid Database Service Layer
 * ───────────────────────────────────────
 * Bu fayl həm Express Backend API ilə, həm də birbaşa Firebase və ya
 * lokal statik database (database_inline.js) ilə işləyə bilər.
 * 
 * Sistem avtomatik olaraq backend-i yoxlayır, taparsa API-dan istifadə edir,
 * tapmazsa client-side Firebase və ya lokal statik rejimə keçir.
 */

// ── Firebase Configuration (Fallback üçün) ──────────────────
const firebaseConfig = {
    apiKey: "AIzaSyCB4ni5ARUDPL3Wj8kDMq1EHtOCzkdnkcI",
    authDomain: "planning-with-ai-d0a36.firebaseapp.com",
    databaseURL: "https://planning-with-ai-d0a36-default-rtdb.firebaseio.com",
    projectId: "planning-with-ai-d0a36",
    storageBucket: "planning-with-ai-d0a36.firebasestorage.app",
    messagingSenderId: "214396611272",
    appId: "1:214396611272:web:0d10423e72e03d54d5d3fd"
};

const AzFirebase = (() => {
    let db = null;
    let messaging = null;
    let isConnected = false;
    let useBackend = false;
    let connectionListeners = [];

    const isDevServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = (window.location.protocol === 'file:' || (isDevServer && window.location.port !== '3001')) 
        ? 'http://localhost:3001/api' 
        : '/api';

    // API-yə müraciət köməkçisi
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP error ${response.status}`);
        }
        return await response.json();
    }

    function isFirebaseAvailable() {
        return typeof firebase !== 'undefined' && firebaseConfig.apiKey !== 'YOUR_API_KEY';
    }

    // Başlanğıc yoxlamaları
    async function init() {
        // 1. Öncə backend serverini yoxla
        try {
            const res = await fetch(API_BASE + '/health');
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'OK') {
                    useBackend = true;
                    isConnected = true;
                    console.log('🟢 AzEstetik Backend API Server aktivdir. API rejimində işləyir.');
                    _notifyConnection(true);
                    
                    // Backend-dən gələn offline queue-ni sinxronizasiya et
                    syncOfflineQueue();
                    return true;
                }
            }
        } catch (e) {
            console.log('⚠️ Backend server tapılmadı. Client-side Firebase-ə yoxlanılır.');
        }

        // 2. Backend tapılmazsa, birbaşa Firebase-i yoxla
        if (!isFirebaseAvailable()) {
            console.log('🔶 Firebase konfiqurasiya olunmayıb. Lokal statik rejim aktivdir.');
            _notifyConnection(false);
            return false;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.database();
            isConnected = true;
            console.log('✅ Firebase SDK birbaşa qoşuldu!');

            db.ref('.info/connected').on('value', (snap) => {
                isConnected = snap.val() === true;
                _notifyConnection(isConnected);
                console.log(isConnected ? '🟢 Firebase Online' : '🔴 Firebase Offline');
            });

            return true;
        } catch (err) {
            console.error('❌ Firebase qoşulma xətası:', err);
            _notifyConnection(false);
            return false;
        }
    }

    // ── Ambassadorlar ───────────────────────────────────────
    async function getAmbassadors(callback) {
        if (useBackend) {
            try {
                const data = await apiRequest('/ambassadors');
                callback(data);
                localStorage.setItem('azestetik_ambassadors_cache', JSON.stringify(data));
                return;
            } catch (err) {
                console.error('Backend-dən ambassadorları alarkən xəta:', err);
            }
        }

        if (!isConnected || !db) {
            // Keş və ya statik local datadan oxu
            const cached = localStorage.getItem('azestetik_ambassadors_cache');
            if (cached) {
                callback(JSON.parse(cached));
            } else {
                const data = window.RAW_DATABASE || {};
                callback(_parseLocalData(data));
            }
            return;
        }

        db.ref('ambassadors').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const arr = Object.values(data);
                callback(arr);
                localStorage.setItem('azestetik_ambassadors_cache', JSON.stringify(arr));
            } else {
                const localData = window.RAW_DATABASE || {};
                callback(_parseLocalData(localData));
            }
        });
    }

    async function addAmbassador(ambassador) {
        if (useBackend) {
            try {
                const saved = await apiRequest('/ambassadors', 'POST', ambassador);
                _sendNotification('Yeni Ambassador!', ambassador.name + ' proqrama qoşuldu.');
                return { success: true, data: saved };
            } catch (err) {
                console.error('Backend əlavə etmə xətası:', err);
                _saveToOfflineQueue('add', ambassador);
                return { offline: true, data: ambassador };
            }
        }

        if (!isConnected || !db) {
            console.warn('Firebase qoşulu deyil. Məlumat lokal saxlanıldı.');
            _saveToOfflineQueue('add', ambassador);
            return Promise.resolve({ offline: true, data: ambassador });
        }

        const newRef = db.ref('ambassadors').push();
        ambassador.id = newRef.key;
        ambassador.createdAt = firebase.database.ServerValue.TIMESTAMP;
        return newRef.set(ambassador).then(() => {
            _sendNotification('Yeni Ambassador!', ambassador.name + ' proqrama qoşuldu.');
            return { success: true, data: ambassador };
        });
    }

    async function updateAmbassador(id, updates) {
        if (useBackend) {
            try {
                await apiRequest(`/ambassadors/${id}`, 'PUT', updates);
                return { success: true };
            } catch (err) {
                console.error('Backend yeniləmə xətası:', err);
                _saveToOfflineQueue('update', { id, ...updates });
                return { offline: true };
            }
        }

        if (!isConnected || !db) {
            _saveToOfflineQueue('update', { id, ...updates });
            return Promise.resolve({ offline: true });
        }
        return db.ref('ambassadors/' + id).update(updates);
    }

    async function deleteAmbassador(id) {
        if (useBackend) {
            try {
                await apiRequest(`/ambassadors/${id}`, 'DELETE');
                return { success: true };
            } catch (err) {
                console.error('Backend silmə xətası:', err);
                _saveToOfflineQueue('delete', { id });
                return { offline: true };
            }
        }

        if (!isConnected || !db) {
            _saveToOfflineQueue('delete', { id });
            return Promise.resolve({ offline: true });
        }
        return db.ref('ambassadors/' + id).remove();
    }

    // ── Events / Tədbirlər ──────────────────────────────────
    async function registerForEvent(eventId, participantData) {
        if (useBackend) {
            try {
                const saved = await apiRequest(`/events/${eventId}/register`, 'POST', participantData);
                _sendNotification('Qeydiyyat Uğurludur!', participantData.name + ' - Tədbirə qeydiyyatınız təsdiqləndi.');
                return { success: true, data: saved };
            } catch (err) {
                console.error('Backend event qeydiyyat xətası:', err);
                _saveToOfflineQueue('register_event', { eventId, participantData });
                return { offline: true, data: participantData };
            }
        }

        if (!isConnected || !db) {
            _saveToOfflineQueue('register_event', { eventId, participantData });
            return Promise.resolve({ offline: true, data: participantData });
        }
        
        const newRef = db.ref('events/' + eventId + '/participants').push();
        participantData.id = newRef.key;
        participantData.registeredAt = firebase.database.ServerValue.TIMESTAMP;
        
        return newRef.set(participantData).then(() => {
            _sendNotification('Qeydiyyat Uğurludur!', participantData.name + ' - Tədbirə qeydiyyatınız təsdiqləndi.');
            return { success: true, data: participantData };
        });
    }

    function getEventParticipants(eventId, callback) {
        if (useBackend) {
            apiRequest(`/events/${eventId}/participants`)
                .then(callback)
                .catch(() => callback([]));
            return;
        }

        if (!isConnected || !db) {
            const queue = JSON.parse(localStorage.getItem('azestetik_offline_queue') || '[]');
            const localParticipants = queue
                .filter(q => q.action === 'register_event' && q.data.eventId === eventId)
                .map(q => q.data.participantData);
            callback(localParticipants);
            return;
        }

        db.ref('events/' + eventId + '/participants').once('value').then((snapshot) => {
            const data = snapshot.val();
            callback(data ? Object.values(data) : []);
        });
    }

    // ── Sinxronizasiya və offline idarəetmə ────────────────
    function syncOfflineQueue() {
        if (!isConnected) return;
        const queue = JSON.parse(localStorage.getItem('azestetik_offline_queue') || '[]');
        if (queue.length === 0) return;

        console.log('🔄 ' + queue.length + ' offline əməliyyat sinxronizasiya olunur...');
        
        let promises = [];
        queue.forEach(item => {
            let p;
            if (useBackend) {
                if (item.action === 'add') p = apiRequest('/ambassadors', 'POST', item.data);
                else if (item.action === 'update') p = apiRequest(`/ambassadors/${item.data.id}`, 'PUT', item.data);
                else if (item.action === 'delete') p = apiRequest(`/ambassadors/${item.data.id}`, 'DELETE');
                else if (item.action === 'register_event') p = apiRequest(`/events/${item.data.eventId}/register`, 'POST', item.data.participantData);
            } else if (db) {
                if (item.action === 'add') p = addAmbassador(item.data);
                else if (item.action === 'update') p = updateAmbassador(item.data.id, item.data);
                else if (item.action === 'delete') p = deleteAmbassador(item.data.id);
                else if (item.action === 'register_event') p = registerForEvent(item.data.eventId, item.data.participantData);
            }
            if (p) promises.push(p.catch(e => console.error('Sync error:', e)));
        });

        Promise.all(promises).then(() => {
            localStorage.removeItem('azestetik_offline_queue');
            _showInAppNotification('Sinxronizasiya', queue.length + ' əməliyyat uğurla sinxronizasiya edildi!');
        });
    }

    function _parseLocalData(data) {
        const rawAmb = data.AMB || [];
        const headerRow = rawAmb.find(r => r.rowNum === 3);
        if (!headerRow) return [];

        return rawAmb.filter(r => r.rowNum > 3).map(r => ({
            name: r.data.B || '',
            points: parseFloat(r.data.C) || 0,
            id: r.data.D || '',
            leader: r.data.E || '',
            contractDate: r.data.F || '',
            status: r.data.H || '',
            ambassadorCount: parseInt(r.data.I) || 0,
            phone: r.data.J || ''
        }));
    }

    function _saveToOfflineQueue(action, data) {
        const queue = JSON.parse(localStorage.getItem('azestetik_offline_queue') || '[]');
        queue.push({ action, data, timestamp: Date.now() });
        localStorage.setItem('azestetik_offline_queue', JSON.stringify(queue));
    }

    function _sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: 'assets/azestetik_app_icon.png',
                badge: 'assets/azestetik_app_icon.png',
                vibrate: [100, 50, 100]
            });
        }
    }

    function _showInAppNotification(title, body) {
        const toast = document.createElement('div');
        toast.className = 'az-toast';
        toast.innerHTML = '<div class="az-toast-title">' + title + '</div><div class="az-toast-body">' + body + '</div>';
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.classList.add('show'); });
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    function _sanitizeToken(token) { return token.replace(/[.#$[\]]/g, '_'); }
    function _notifyConnection(status) { connectionListeners.forEach(cb => cb(status)); }
    function onConnectionChange(callback) { connectionListeners.push(callback); }

    // ── Authentication ──────────────────────────────────────
    async function registerUser(email, password, displayName) {
        if (useBackend) {
            try {
                const data = await apiRequest('/auth/register', 'POST', { email, password, displayName });
                localStorage.setItem('azestetik_role', data.role);
                localStorage.setItem('azestetik_user', JSON.stringify(data.user));
                return { success: true, user: data.user, role: data.role };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        // Fallback to Firebase
        if (!isFirebaseAvailable()) return { success: false, error: 'Firebase aktiv deyil.' };
        
        return firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(cred => {
                return cred.user.updateProfile({ displayName }).then(() => {
                    const role = email.trim().toLowerCase() === 'admin@azestetik.az' ? 'superadmin' : 'user';
                    const userData = { uid: cred.user.uid, email, displayName, role, createdAt: Date.now() };
                    if (db) db.ref('users/' + cred.user.uid).set(userData);
                    localStorage.setItem('azestetik_role', role);
                    localStorage.setItem('azestetik_user', JSON.stringify(userData));
                    return { success: true, user: cred.user, role };
                });
            })
            .catch(err => ({ success: false, error: err.message }));
    }

    async function loginUser(email, password) {
        const cleanEmail = email.trim().toLowerCase();
        
        // Demo Bypass
        if (cleanEmail === 'demo@example.com') {
            const role = 'user';
            localStorage.setItem('azestetik_role', role);
            localStorage.setItem('azestetik_user', JSON.stringify({ email: cleanEmail, displayName: 'Demo User', role }));
            return { success: true, user: { email: cleanEmail }, role };
        }
        if (cleanEmail === 'admin@azestetik.az' || cleanEmail === 'admin@azestetik.com') {
            const role = 'superadmin';
            localStorage.setItem('azestetik_role', role);
            localStorage.setItem('azestetik_user', JSON.stringify({ email: cleanEmail, displayName: 'Admin', role }));
            return { success: true, user: { email: cleanEmail }, role };
        }

        if (useBackend) {
            try {
                const data = await apiRequest('/auth/login', 'POST', { email, password });
                localStorage.setItem('azestetik_role', data.role);
                localStorage.setItem('azestetik_user', JSON.stringify(data.user));
                return { success: true, user: data.user, role: data.role };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        if (!isFirebaseAvailable()) return { success: false, error: 'Firebase aktiv deyil.' };

        return firebase.auth().signInWithEmailAndPassword(email, password)
            .then(cred => {
                if (db) {
                    return db.ref('users/' + cred.user.uid).once('value').then(snap => {
                        const data = snap.val();
                        const role = data ? data.role : (cleanEmail === 'admin@azestetik.az' ? 'superadmin' : 'user');
                        localStorage.setItem('azestetik_role', role);
                        localStorage.setItem('azestetik_user', JSON.stringify(data || { email, displayName: cred.user.displayName, role }));
                        return { success: true, user: cred.user, role };
                    });
                }
                return { success: true, user: cred.user, role: 'user' };
            })
            .catch(err => ({ success: false, error: err.message }));
    }

    function logoutUser() {
        localStorage.removeItem('azestetik_user');
        localStorage.removeItem('azestetik_role');
        
        if (isFirebaseAvailable()) {
            return firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            });
        }
        window.location.href = 'index.html';
        return Promise.resolve();
    }

    function getCurrentUser() {
        const u = localStorage.getItem('azestetik_user');
        return u ? JSON.parse(u) : null;
    }

    function onAuthChange(callback) {
        if (isFirebaseAvailable()) {
            firebase.auth().onAuthStateChanged(callback);
        }
    }

    function requireAuth() {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
        }
    }

    return {
        init,
        getAmbassadors,
        addAmbassador,
        updateAmbassador,
        deleteAmbassador,
        registerForEvent,
        getEventParticipants,
        initPushNotifications: () => {}, // push notifications disabled or fallback
        syncOfflineQueue,
        onConnectionChange,
        isConnected: () => isConnected,
        showNotification: _showInAppNotification,
        registerUser,
        loginUser,
        logoutUser,
        getCurrentUser,
        onAuthChange,
        requireAuth,
        useBackend: () => useBackend,
        getAPIUrl: () => API_BASE
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    AzFirebase.init();
    window.addEventListener('online', () => {
        AzFirebase.syncOfflineQueue();
        AzFirebase.showNotification('İnternet', 'Bağlantı bərpa olundu!');
    });
    window.addEventListener('offline', () => {
        AzFirebase.showNotification('Xəbərdarlıq', 'İnternet bağlantısı kəsildi. Offline rejim aktiv.');
    });
});
