/**
 * AzEstetik Firebase Service Layer
 * ─────────────────────────────────
 * Bu fayl Firebase Realtime Database və Push Notifications üçün
 * tam inteqrasiya təmin edir. Firebase konfiqurasiya kodlarınızı
 * aşağıdakı `firebaseConfig` obyektinə daxil edin.
 * 
 * Əgər Firebase hələ qoşulmayıbsa, sistem avtomatik olaraq
 * lokal məlumat bazası (database_inline.js) ilə işləyir.
 */

// ── Firebase Configuration ──────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyCB4ni5ARUDPL3Wj8kDMq1EHtOCzkdnkcI",
    authDomain: "planning-with-ai-d0a36.firebaseapp.com",
    databaseURL: "https://planning-with-ai-d0a36-default-rtdb.firebaseio.com",
    projectId: "planning-with-ai-d0a36",
    storageBucket: "planning-with-ai-d0a36.firebasestorage.app",
    messagingSenderId: "214396611272",
    appId: "1:214396611272:web:0d10423e72e03d54d5d3fd"
};


// ── Firebase Service ────────────────────────────────────────
const AzFirebase = (() => {
    let db = null;
    let messaging = null;
    let isConnected = false;
    let connectionListeners = [];

    // Firebase SDK yüklənib-yüklənmədiyini yoxla
    function isFirebaseAvailable() {
        return typeof firebase !== 'undefined' && firebaseConfig.apiKey !== 'YOUR_API_KEY';
    }

    // Firebase-i başlat
    function init() {
        if (!isFirebaseAvailable()) {
            console.log('🔶 Firebase konfiqurasiya olunmayıb. Lokal rejim aktiv.');
            _notifyConnection(false);
            return false;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.database();
            isConnected = true;
            console.log('✅ Firebase uğurla qoşuldu!');

            // Əlaqə vəziyyətini izlə
            db.ref('.info/connected').on('value', (snap) => {
                isConnected = snap.val() === true;
                _notifyConnection(isConnected);
                console.log(isConnected ? '🟢 Firebase Online' : '🔴 Firebase Offline');
            });

            return true;
        } catch (err) {
            console.error('❌ Firebase xətası:', err);
            _notifyConnection(false);
            return false;
        }
    }

    // ── Ambassadorlar ───────────────────────────────────────
    function getAmbassadors(callback) {
        if (!isConnected || !db) {
            // Lokal məlumat bazasından oxu
            const data = window.RAW_DATABASE || {};
            callback(_parseLocalData(data));
            return;
        }

        db.ref('ambassadors').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                callback(Object.values(data));
                // Lokal keşə yaz (offline üçün)
                localStorage.setItem('azestetik_ambassadors_cache', JSON.stringify(Object.values(data)));
            } else {
                // Firebase boşdursa, lokal datanı istifadə et
                const localData = window.RAW_DATABASE || {};
                callback(_parseLocalData(localData));
            }
        });
    }

    function addAmbassador(ambassador) {
        if (!isConnected || !db) {
            console.warn('Firebase qoşulu deyil. Məlumat lokal saxlanıldı.');
            _saveToOfflineQueue('add', ambassador);
            return Promise.resolve({ offline: true, data: ambassador });
        }

        const newRef = db.ref('ambassadors').push();
        ambassador.id = newRef.key;
        ambassador.createdAt = firebase.database.ServerValue.TIMESTAMP;
        return newRef.set(ambassador).then(() => {
            // Push bildirişi göndər
            _sendNotification('Yeni Ambassador!', ambassador.name + ' proqrama qoşuldu.');
            return { success: true, data: ambassador };
        });
    }

    function updateAmbassador(id, updates) {
        if (!isConnected || !db) {
            _saveToOfflineQueue('update', { id, ...updates });
            return Promise.resolve({ offline: true });
        }
        return db.ref('ambassadors/' + id).update(updates);
    }

    function deleteAmbassador(id) {
        if (!isConnected || !db) {
            _saveToOfflineQueue('delete', { id });
            return Promise.resolve({ offline: true });
        }
        return db.ref('ambassadors/' + id).remove();
    }

    // ── Events / Tədbirlər ──────────────────────────────────
    function registerForEvent(eventId, participantData) {
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
        if (!isConnected || !db) {
            // Check if there are local offline registrations (mock response for display)
            const queue = JSON.parse(localStorage.getItem('azestetik_offline_queue') || '[]');
            const localParticipants = queue
                .filter(q => q.action === 'register_event' && q.data.eventId === eventId)
                .map(q => q.data.participantData);
            callback(localParticipants);
            return;
        }

        db.ref('events/' + eventId + '/participants').once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                callback(Object.values(data));
            } else {
                callback([]);
            }
        });
    }

    // ── Push Notifications ──────────────────────────────────
    function initPushNotifications() {
        if (!isFirebaseAvailable() || !('Notification' in window)) {
            console.log('🔔 Push bildirişlər mövcud deyil.');
            return;
        }

        try {
            messaging = firebase.messaging();

            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('✅ Bildiriş icazəsi verildi.');
                    messaging.getToken().then((token) => {
                        console.log('📱 FCM Token:', token);
                        // Token-i serverə göndər (gələcək)
                        if (db) db.ref('fcm_tokens/' + _sanitizeToken(token)).set({ 
                            token, 
                            updatedAt: firebase.database.ServerValue.TIMESTAMP 
                        });
                    });
                } else {
                    console.log('🔕 Bildiriş icazəsi rədd edildi.');
                }
            });

            // Ön planda bildiriş al
            messaging.onMessage((payload) => {
                console.log('📩 Bildiriş alındı:', payload);
                _showInAppNotification(payload.notification.title, payload.notification.body);
            });
        } catch (err) {
            console.log('Push notifications quraşdırıla bilmədi:', err.message);
        }
    }

    // ── Offline Sync (Sinxronizasiya) ───────────────────────
    function syncOfflineQueue() {
        if (!isConnected || !db) return;

        const queue = JSON.parse(localStorage.getItem('azestetik_offline_queue') || '[]');
        if (queue.length === 0) return;

        console.log('🔄 ' + queue.length + ' offline əməliyyat sinxronizasiya olunur...');

        queue.forEach((item, index) => {
            switch (item.action) {
                case 'add':
                    addAmbassador(item.data);
                    break;
                case 'update':
                    updateAmbassador(item.data.id, item.data);
                    break;
                case 'delete':
                    deleteAmbassador(item.data.id);
                    break;
                case 'register_event':
                    registerForEvent(item.data.eventId, item.data.participantData);
                    break;
            }
        });

        localStorage.removeItem('azestetik_offline_queue');
        _showInAppNotification('Sinxronizasiya', queue.length + ' əməliyyat uğurla sinxronizasiya edildi!');
    }

    // ── Yardımçı Funksiyalar ────────────────────────────────
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
        // In-app toast notification
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

    function _sanitizeToken(token) {
        return token.replace(/[.#$[\]]/g, '_');
    }

    function _notifyConnection(status) {
        connectionListeners.forEach(cb => cb(status));
    }

    function onConnectionChange(callback) {
        connectionListeners.push(callback);
    }

    // ── Authentication (Giriş / Qeydiyyat) ─────────────────
    const SUPER_ADMIN_EMAILS = []; // Super Admin emailləri buraya əlavə ediləcək

    function registerUser(email, password, displayName) {
        if (!isFirebaseAvailable()) {
            return Promise.resolve({ success: false, error: 'Firebase aktiv deyil.' });
        }
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        } catch(e) {}

        return firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(cred => {
                // Profili yenilə
                return cred.user.updateProfile({ displayName: displayName }).then(() => {
                    // İstifadəçi məlumatlarını bazaya yaz
                    const role = SUPER_ADMIN_EMAILS.includes(email.toLowerCase()) ? 'superadmin' : 'user';
                    const userData = {
                        uid: cred.user.uid,
                        email: email,
                        displayName: displayName,
                        role: role,
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    };
                    if (db) db.ref('users/' + cred.user.uid).set(userData);
                    localStorage.setItem('azestetik_role', role);
                    localStorage.setItem('azestetik_user', JSON.stringify(userData));
                    return { success: true, user: cred.user, role: role };
                });
            })
            .catch(err => {
                let msg = 'Qeydiyyat xətası.';
                if (err.code === 'auth/email-already-in-use') msg = 'Bu email artıq qeydiyyatdadır.';
                if (err.code === 'auth/weak-password') msg = 'Şifrə çox zəifdir (min 6 simvol).';
                if (err.code === 'auth/invalid-email') msg = 'Email formatı yanlışdır.';
                return { success: false, error: msg };
            });
    }

    function loginUser(email, password) {
        if (!isFirebaseAvailable()) {
            return Promise.resolve({ success: false, error: 'Firebase aktiv deyil.' });
        }
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        } catch(e) {}

        return firebase.auth().signInWithEmailAndPassword(email, password)
            .then(cred => {
                // İstifadəçi rolunu bazadan oxu
                if (db) {
                    return db.ref('users/' + cred.user.uid).once('value').then(snap => {
                        const data = snap.val();
                        const role = data ? data.role : (SUPER_ADMIN_EMAILS.includes(email.toLowerCase()) ? 'superadmin' : 'user');
                        localStorage.setItem('azestetik_role', role);
                        localStorage.setItem('azestetik_user', JSON.stringify(data || { email, displayName: cred.user.displayName, role }));
                        return { success: true, user: cred.user, role: role };
                    });
                }
                return { success: true, user: cred.user, role: 'user' };
            })
            .catch(err => {
                let msg = 'Giriş xətası.';
                if (err.code === 'auth/user-not-found') msg = 'Bu email ilə hesab tapılmadı.';
                if (err.code === 'auth/wrong-password') msg = 'Şifrə yanlışdır.';
                if (err.code === 'auth/invalid-email') msg = 'Email formatı yanlışdır.';
                if (err.code === 'auth/too-many-requests') msg = 'Çox sayda cəhd. Zəhmət olmasa bir az gözləyin.';
                return { success: false, error: msg };
            });
    }

    function logoutUser() {
        if (!isFirebaseAvailable()) return Promise.resolve();
        return firebase.auth().signOut().then(() => {
            localStorage.removeItem('azestetik_user');
            localStorage.removeItem('azestetik_role');
            window.location.href = 'index.html';
        });
    }

    function getCurrentUser() {
        if (!isFirebaseAvailable()) return null;
        return firebase.auth().currentUser;
    }

    function onAuthChange(callback) {
        if (!isFirebaseAvailable()) return;
        firebase.auth().onAuthStateChanged(callback);
    }

    // Qorunan səhifələrdə istifadə ediləcək: icazəsiz girişi əngəllə
    function requireAuth() {
        if (!isFirebaseAvailable()) return;
        firebase.auth().onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'index.html';
            }
        });
    }

    return {
        init,
        getAmbassadors,
        addAmbassador,
        updateAmbassador,
        deleteAmbassador,
        registerForEvent,
        getEventParticipants,
        initPushNotifications,
        syncOfflineQueue,
        onConnectionChange,
        isConnected: () => isConnected,
        showNotification: _showInAppNotification,
        registerUser,
        loginUser,
        logoutUser,
        getCurrentUser,
        onAuthChange,
        requireAuth
    };
})();

// Avtomatik başlat
document.addEventListener('DOMContentLoaded', () => {
    AzFirebase.init();
    AzFirebase.initPushNotifications();

    // İnternet geri gəldikdə sinxronizasiya et
    window.addEventListener('online', () => {
        AzFirebase.syncOfflineQueue();
        AzFirebase.showNotification('İnternet', 'Bağlantı bərpa olundu!');
    });

    window.addEventListener('offline', () => {
        AzFirebase.showNotification('Xəbərdarlıq', 'İnternet bağlantısı kəsildi. Offline rejim aktiv.');
    });
});
