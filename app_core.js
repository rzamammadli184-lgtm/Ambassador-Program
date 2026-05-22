/**
 * AzEstetik App Core
 * ──────────────────
 * Haptic Feedback, Skeleton Loading, Modal System, Toast Notifications
 */

const AzCore = (() => {
    // ── Role System ─────────────────────────────────────────
    const ROLES = {
        'user': 1,
        'moderator': 2,
        'admin': 3,
        'superadmin': 4
    };

    function getRole() {
        return localStorage.getItem('azestetik_role') || 'user';
    }

    function setRole(roleKey) {
        if (!ROLES[roleKey]) roleKey = 'user';
        localStorage.setItem('azestetik_role', roleKey);
        applyRoleVisibility();
        haptic('medium');
        toast('Rol Dəyişdirildi', 'Siz indi ' + roleKey.toUpperCase() + ' rolundasınız.', 'info');
    }

    function hasAccess(requiredRoleKey) {
        const currentLevel = ROLES[getRole()] || 1;
        const requiredLevel = ROLES[requiredRoleKey] || 1;
        return currentLevel >= requiredLevel;
    }

    function applyRoleVisibility() {
        const currentRole = getRole();
        const currentLevel = ROLES[currentRole] || 1;
        
        document.querySelectorAll('[data-role-required]').forEach(el => {
            const reqRole = el.getAttribute('data-role-required');
            const reqLevel = ROLES[reqRole] || 1;
            if (currentLevel >= reqLevel) {
                el.style.display = el.getAttribute('data-original-display') || '';
            } else {
                if (el.style.display !== 'none') {
                    el.setAttribute('data-original-display', getComputedStyle(el).display);
                }
                el.style.display = 'none';
            }
        });
        
        // Update any role dropdowns if they exist
        const roleDropdowns = document.querySelectorAll('.role-switcher-select');
        roleDropdowns.forEach(sel => sel.value = currentRole);
    }
    // ── Haptic Feedback (Vibrasiya) ─────────────────────────
    function haptic(type = 'light') {
        if (!('vibrate' in navigator)) return;
        switch (type) {
            case 'light':   navigator.vibrate(10); break;
            case 'medium':  navigator.vibrate(25); break;
            case 'heavy':   navigator.vibrate([30, 10, 30]); break;
            case 'success': navigator.vibrate([10, 30, 10, 30, 50]); break;
            case 'error':   navigator.vibrate([50, 30, 50]); break;
            case 'tap':     navigator.vibrate(5); break;
        }
    }

    function initHaptics() {
        document.addEventListener('click', (e) => {
            const el = e.target.closest('a, button, .bottom-nav-item, .quick-action-btn, .stat-card, .nav-link, .lang-btn');
            if (el) haptic('tap');
        }, { passive: true });

        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') {
                haptic('light');
            }
        }, { passive: true });
    }

    // ── Skeleton Loading ────────────────────────────────────
    function showSkeletons() {
        document.querySelectorAll('[data-skeleton]').forEach(el => {
            el.classList.add('skeleton-active');
        });
    }

    function hideSkeletons() {
        document.querySelectorAll('.skeleton-active').forEach(el => {
            el.classList.remove('skeleton-active');
            el.style.animation = 'skeletonReveal 0.4s ease forwards';
        });
    }

    function createSkeletonCard(count = 4) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton-card"><div class="skeleton-line skeleton-line-sm"></div><div class="skeleton-line skeleton-line-lg"></div><div class="skeleton-line skeleton-line-md"></div></div>';
        }
        return html;
    }

    function createSkeletonTable(rows = 5) {
        let html = '<div class="skeleton-table">';
        for (let i = 0; i < rows; i++) {
            html += '<div class="skeleton-row"><div class="skeleton-cell skeleton-cell-avatar"></div><div class="skeleton-cell skeleton-cell-text"></div><div class="skeleton-cell skeleton-cell-short"></div></div>';
        }
        html += '</div>';
        return html;
    }

    // ── Glassmorphism Modal System ──────────────────────────
    function openModal(options = {}) {
        const {
            title = 'Modal',
            content = '',
            size = 'medium',
            onClose = null,
            actions = [],
            icon = null
        } = options;

        haptic('medium');

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'az-modal-overlay';

        // Modal
        const modal = document.createElement('div');
        modal.className = 'az-modal az-modal-' + size;

        // Header
        let headerHtml = '<div class="az-modal-header">';
        headerHtml += '<div class="az-modal-title">';
        if (icon) headerHtml += '<i data-lucide="' + icon + '"></i> ';
        headerHtml += title + '</div>';
        headerHtml += '<button class="az-modal-close" onclick="AzCore.closeModal()"><i data-lucide="x"></i></button>';
        headerHtml += '</div>';

        // Body
        let bodyHtml = '<div class="az-modal-body">' + content + '</div>';

        // Footer with actions
        let footerHtml = '';
        if (actions.length > 0) {
            footerHtml = '<div class="az-modal-footer">';
            actions.forEach(action => {
                const cls = action.primary ? 'az-btn-primary' : 'az-btn-secondary';
                footerHtml += '<button class="az-btn ' + cls + '" id="modal-action-' + (action.id || '') + '">' + action.label + '</button>';
            });
            footerHtml += '</div>';
        }

        modal.innerHTML = headerHtml + bodyHtml + footerHtml;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Bind action handlers
        actions.forEach(action => {
            if (action.onClick) {
                const btn = document.getElementById('modal-action-' + (action.id || ''));
                if (btn) btn.addEventListener('click', action.onClick);
            }
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(onClose);
        });

        // Close on Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') { closeModal(onClose); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            modal.classList.add('show');
        });

        // Lucide icons
        if (typeof lucide !== 'undefined') lucide.createIcons();

        return { overlay, modal };
    }

    function closeModal(onClose = null) {
        haptic('light');
        const overlay = document.querySelector('.az-modal-overlay.show');
        const modal = document.querySelector('.az-modal.show');
        if (modal) modal.classList.remove('show');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 350);
        }
        if (onClose) onClose();
    }

    // ── "Yeni Ambassador" Modal ─────────────────────────────
    function openAddAmbassadorModal() {
        const formContent = `
            <form id="add-ambassador-form" class="az-form">
                <div class="az-form-group">
                    <label>Ad Soyad</label>
                    <input type="text" id="amb-name" placeholder="Adı Soyadı Ata adı" required class="az-input" />
                </div>
                <div class="az-form-row">
                    <div class="az-form-group">
                        <label>Telefon</label>
                        <input type="tel" id="amb-phone" placeholder="055-XXX-XX-XX" class="az-input" />
                    </div>
                    <div class="az-form-group">
                        <label>Qrup Rəhbəri</label>
                        <input type="text" id="amb-leader" placeholder="Rəhbərin adı" class="az-input" />
                    </div>
                </div>
                <div class="az-form-row">
                    <div class="az-form-group">
                        <label>Status</label>
                        <select id="amb-status" class="az-input">
                            <option value="A">Aktiv (A)</option>
                            <option value="A+">Premium (A+)</option>
                            <option value="K">Passiv (K)</option>
                        </select>
                    </div>
                    <div class="az-form-group">
                        <label>Başlanğıc Bal</label>
                        <input type="number" id="amb-points" value="60" class="az-input" />
                    </div>
                </div>
            </form>
        `;

        openModal({
            title: 'Yeni Ambassador Əlavə Et',
            icon: 'user-plus',
            content: formContent,
            size: 'medium',
            actions: [
                {
                    id: 'cancel',
                    label: 'Ləğv et',
                    onClick: () => closeModal()
                },
                {
                    id: 'save',
                    label: '✓ Əlavə Et',
                    primary: true,
                    onClick: () => {
                        const name = document.getElementById('amb-name').value;
                        const phone = document.getElementById('amb-phone').value;
                        const leader = document.getElementById('amb-leader').value;
                        const status = document.getElementById('amb-status').value;
                        const points = parseFloat(document.getElementById('amb-points').value) || 60;

                        if (!name.trim()) {
                            document.getElementById('amb-name').style.borderColor = '#EF4444';
                            haptic('error');
                            return;
                        }

                        const ambassador = { name, phone, leader, status, points, contractDate: new Date().toLocaleDateString('az-AZ') };

                        if (typeof AzFirebase !== 'undefined') {
                            AzFirebase.addAmbassador(ambassador).then((res) => {
                                haptic('success');
                                if (typeof AzFirebase !== 'undefined') {
                                    AzFirebase.showNotification('Uğurlu!', name + ' ambassador olaraq əlavə edildi.');
                                }
                                closeModal();
                            });
                        } else {
                            haptic('success');
                            closeModal();
                        }
                    }
                }
            ]
        });
    }

    // ── Toast Notification ──────────────────────────────────
    function toast(title, body, type = 'info') {
        const iconMap = { info: 'info', success: 'check-circle', error: 'alert-circle', warning: 'alert-triangle' };
        const colorMap = { info: '#3B82F6', success: '#00A859', error: '#EF4444', warning: '#F59E0B' };

        const toastEl = document.createElement('div');
        toastEl.className = 'az-toast az-toast-' + type;
        toastEl.innerHTML = '<div class="az-toast-icon" style="color:' + colorMap[type] + '"><i data-lucide="' + iconMap[type] + '"></i></div><div><div class="az-toast-title">' + title + '</div><div class="az-toast-body">' + body + '</div></div><button class="az-toast-dismiss" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:14px;height:14px"></i></button>';

        document.body.appendChild(toastEl);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        requestAnimationFrame(() => toastEl.classList.add('show'));
        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 400);
        }, 5000);

        if (type === 'success') haptic('success');
        if (type === 'error') haptic('error');
    }

    // ── Init ────────────────────────────────────────────────
    function init() {
        initHaptics();
        showSkeletons();
        applyRoleVisibility();

        // Simulate data load delay then hide skeletons
        setTimeout(() => {
            hideSkeletons();
        }, 800);
    }

    document.addEventListener('DOMContentLoaded', init);

    // ── "Tədbir Qeydiyyatı" Modal ───────────────────────────
    function openEventRegistrationModal(eventId, eventName) {
        const formContent = `
            <div style="margin-bottom: 20px; text-align: center;">
                <h3 style="color: var(--primary); margin: 0 0 8px 0;">${eventName}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Zəhmət olmasa qeydiyyat formasını doldurun</p>
            </div>
            <form id="event-reg-form" class="az-form">
                <div class="az-form-group">
                    <label>Ad və Soyad</label>
                    <input type="text" id="reg-name" placeholder="Adınız və Soyadınız" required class="az-input" />
                </div>
                <div class="az-form-group">
                    <label>Əlaqə nömrəsi</label>
                    <input type="tel" id="reg-phone" placeholder="05X-XXX-XX-XX" required class="az-input" />
                </div>
                <div class="az-form-group">
                    <label>Filialınız / Region</label>
                    <input type="text" id="reg-branch" placeholder="Məsələn: Bakı filialı" class="az-input" />
                </div>
                <div class="az-form-group">
                    <label>Xüsusi qeydləriniz</label>
                    <textarea id="reg-notes" placeholder="Tədbir üçün hər hansı qeydiniz varmı?" class="az-input" style="min-height: 80px; resize: vertical;"></textarea>
                </div>
            </form>
        `;

        openModal({
            title: 'Onlayn Qeydiyyat',
            icon: 'calendar-check',
            content: formContent,
            size: 'medium',
            actions: [
                {
                    id: 'cancel',
                    label: 'Ləğv et',
                    onClick: () => closeModal()
                },
                {
                    id: 'save',
                    label: '✓ Qeydiyyatı Təsdiqlə',
                    primary: true,
                    onClick: () => {
                        const name = document.getElementById('reg-name').value;
                        const phone = document.getElementById('reg-phone').value;
                        const branch = document.getElementById('reg-branch').value;
                        const notes = document.getElementById('reg-notes').value;

                        if (!name.trim() || !phone.trim()) {
                            if (!name.trim()) document.getElementById('reg-name').style.borderColor = '#EF4444';
                            if (!phone.trim()) document.getElementById('reg-phone').style.borderColor = '#EF4444';
                            haptic('error');
                            toast('Xəta', 'Ad və əlaqə nömrəsi mütləqdir.', 'error');
                            return;
                        }

                        const participant = { name, phone, branch, notes };

                        if (typeof AzFirebase !== 'undefined' && AzFirebase.registerForEvent) {
                            AzFirebase.registerForEvent(eventId, participant).then((res) => {
                                haptic('success');
                                toast('Qeydiyyat Uğurludur!', 'Tədbirdə yeriniz təsdiqləndi.', 'success');
                                closeModal();
                            });
                        } else {
                            haptic('success');
                            toast('Lokal Qeydiyyat', 'Məlumatlar yadda saxlanıldı.', 'success');
                            closeModal();
                        }
                    }
                }
            ]
        });
    }

    // ── Admin: Qeydiyyatları Göstər Modal ───────────────────
    function openAdminRegistrationsModal(eventId) {
        if (!hasAccess('superadmin')) {
            toast('Xəta', 'Bu məlumatları görmək üçün Super Admin hüququnuz yoxdur.', 'error');
            return;
        }

        haptic('medium');
        openModal({
            title: 'Tədbir Qeydiyyatları',
            icon: 'users',
            size: 'large',
            content: '<div id="admin-reg-list" style="min-height: 200px;"><div style="text-align:center; padding: 40px; color: var(--text-muted);">Məlumatlar yüklənir... <i class="lucide lucide-loader" style="animation: spin 1s linear infinite;"></i></div></div>',
            actions: [{ id: 'close', label: 'Bağla', onClick: () => closeModal() }]
        });

        // Load participants from Firebase
        if (typeof AzFirebase !== 'undefined' && AzFirebase.getEventParticipants) {
            AzFirebase.getEventParticipants(eventId, (participants) => {
                const container = document.getElementById('admin-reg-list');
                if (!container) return;

                if (!participants || participants.length === 0) {
                    container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">Hələ heç kim qeydiyyatdan keçməyib.</div>';
                    return;
                }

                let html = '<div class="table-responsive"><table class="modern-table"><thead><tr><th>Ad Soyad</th><th>Telefon</th><th>Filial</th><th>Tarix</th></tr></thead><tbody>';
                participants.forEach(p => {
                    const dateStr = p.registeredAt ? new Date(p.registeredAt).toLocaleString('az-AZ') : 'Bilinmir';
                    html += `<tr>
                        <td><strong>${p.name}</strong><br><small style="color:var(--text-muted);">${p.notes || '-'}</small></td>
                        <td>${p.phone}</td>
                        <td>${p.branch || '-'}</td>
                        <td>${dateStr}</td>
                    </tr>`;
                });
                html += '</tbody></table></div>';
                container.innerHTML = html;
            });
        } else {
            document.getElementById('admin-reg-list').innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">Serverə qoşulma yoxdur və ya Firebase aktiv deyil.</div>';
        }
    }

    return {
        haptic,
        showSkeletons,
        hideSkeletons,
        createSkeletonCard,
        createSkeletonTable,
        openModal,
        closeModal,
        openAddAmbassadorModal,
        openEventRegistrationModal,
        toast
    };
})();
