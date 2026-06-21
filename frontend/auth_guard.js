/**
 * auth_guard.js — JWT-based session guard
 * Checks az_token from localStorage; redirects to index.html if invalid.
 */
(function() {
    const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api';

    // Pages that don't need authentication
    const PUBLIC_PAGES = ['index.html', '/'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (PUBLIC_PAGES.includes(currentPage)) return;

    const token = localStorage.getItem('az_token');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Lightweight JWT decode (not verify — backend verifies)
    function decodeJWT(t) {
        try {
            const payload = t.split('.')[1];
            return JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
        } catch(e) { return null; }
    }

    const decoded = decodeJWT(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('az_token');
        localStorage.removeItem('az_user');
        window.location.href = 'index.html';
        return;
    }

    // Store role for UI
    const user = JSON.parse(localStorage.getItem('az_user') || '{}');
    localStorage.setItem('user_role', decoded.role || 'user');

    // Role-based nav visibility
    document.addEventListener('DOMContentLoaded', () => {
        const role = decoded.role || 'user';
        document.querySelectorAll('[data-role-required]').forEach(el => {
            const required = el.getAttribute('data-role-required');
            if (required && role !== required) {
                el.style.display = 'none';
            }
        });

        // Update user display name if element exists
        const nameEl = document.getElementById('user-name');
        if (nameEl && user.fullName) nameEl.textContent = user.fullName;
        const emailEl = document.getElementById('user-email');
        if (emailEl && user.email) emailEl.textContent = user.email;
    });

    // Global logout function
    window.logoutUser = function() {
        localStorage.removeItem('az_token');
        localStorage.removeItem('az_user');
        localStorage.removeItem('user_role');
        window.location.href = 'index.html';
    };
})();
