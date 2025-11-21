/**
 * AI Pro Converter - Admin Panel Module
 * Complete admin control and monitoring system
 */

const Admin = {
    currentTab: 'users',
    refreshInterval: null,

    /**
     * Initialize admin panel
     */
    init() {
        this.loadDashboard();
        this.loadUsers();
        this.startAutoRefresh();
    },

    /**
     * Load dashboard statistics
     */
    loadDashboard() {
        const users = Storage.load('users', {});
        const logs = Storage.load('logs', []);
        const helpRequests = Storage.load('helpRequests', []);

        // Calculate stats
        const totalUsers = Object.keys(users).length;
        const totalConversions = logs.filter(log => log.type === 'convert').length;
        const totalMessages = logs.filter(log => log.type === 'message').length;
        const pendingHelp = helpRequests.filter(req => req.status === 'pending').length;

        // Update display
        $('totalUsers').textContent = totalUsers;
        $('totalConversions').textContent = totalConversions;
        $('totalMessages').textContent = totalMessages;
        $('helpRequests').textContent = pendingHelp;
    },

    /**
     * Show tab
     */
    showTab(tabName) {
        this.currentTab = tabName;

        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Hide all tabs
        ['usersTab', 'logsTab', 'helpTab', 'settingsTab'].forEach(tab => {
            const element = $(tab);
            if (element) element.classList.add('hidden');
        });

        // Show selected tab
        const selectedTab = $(`${tabName}Tab`);
        if (selectedTab) selectedTab.classList.remove('hidden');

        // Load tab content
        switch (tabName) {
            case 'users':
                this.loadUsers();
                break;
            case 'logs':
                this.loadLogs();
                break;
            case 'help':
                this.loadHelpRequests();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    },

    /**
     * Load users list
     */
    loadUsers() {
        const users = Storage.load('users', {});
        const logs = Storage.load('logs', []);
        const container = $('usersContainer');

        if (!container) return;

        let html = '';

        if (Object.keys(users).length === 0) {
            html = '<div style="text-align: center; padding: 50px; color: var(--gray);">👥 Hozircha foydalanuvchilar yo\'q</div>';
        } else {
            for (const [username, userData] of Object.entries(users)) {
                const userLogs = logs.filter(log => log.user === username);
                const conversions = userLogs.filter(log => log.type === 'convert').length;
                const messages = userLogs.filter(log => log.type === 'message').length;
                const lastLogin = new Date(userData.lastLogin).toLocaleString('uz-UZ');

                const statusClass = userData.blocked ? 'error' : 'success';
                const statusText = userData.blocked ? '🔴 Bloklangan' : '🟢 Faol';
                const actionBtn = userData.blocked ? 
                    `<button onclick="Admin.unblockUser('${username}')" class="btn-primary" style="padding: 8px 16px; font-size: 13px;">Blokdan chiqarish</button>` :
                    `<button onclick="Admin.blockUser('${username}')" class="btn-danger" style="padding: 8px 16px; font-size: 13px;">Bloklash</button>`;

                html += `
                    <div class="user-card">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <h3 style="margin-bottom: 10px; font-size: 18px;">👤 ${username}</h3>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0;">
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Status</div>
                                        <div style="font-weight: 600; margin-top: 3px;">${statusText}</div>
                                    </div>
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Oxirgi kirish</div>
                                        <div style="font-weight: 600; margin-top: 3px; font-size: 13px;">${lastLogin}</div>
                                    </div>
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Konversiyalar</div>
                                        <div style="font-weight: 600; margin-top: 3px; color: #667eea;">${conversions}</div>
                                    </div>
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Xabarlar</div>
                                        <div style="font-weight: 600; margin-top: 3px; color: #667eea;">${messages}</div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${actionBtn}
                                <button onclick="Admin.deleteUser('${username}')" class="btn-danger" style="padding: 8px 16px; font-size: 13px;">O'chirish</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = html;
    },

    /**
     * Search users
     */
    searchUsers() {
        const searchTerm = $('userSearch').value.toLowerCase();
        const users = Storage.load('users', {});
        const container = $('usersContainer');

        if (!searchTerm) {
            this.loadUsers();
            return;
        }

        const filtered = Object.entries(users).filter(([username]) => 
            username.toLowerCase().includes(searchTerm)
        );

        let html = '';
        if (filtered.length === 0) {
            html = '<div style="text-align: center; padding: 50px; color: var(--gray);">🔍 Foydalanuvchi topilmadi</div>';
        } else {
            // Similar rendering as loadUsers
            for (const [username, userData] of filtered) {
                html += `<div class="user-card"><h3>${username}</h3></div>`;
            }
        }

        container.innerHTML = html;
    },

    /**
     * Block user
     */
    blockUser(username) {
        if (!confirm(`${username} ni bloklaysizmi?`)) return;

        const users = Storage.load('users', {});
        if (users[username]) {
            users[username].blocked = true;
            Storage.save('users', users);
            
            Utils.log('admin', `User bloklandi: ${username}`, 'admin');
            Utils.notify(`${username} bloklandi!`, 'success');
            
            this.loadUsers();
            this.loadDashboard();
        }
    },

    /**
     * Unblock user
     */
    unblockUser(username) {
        if (!confirm(`${username} ni blokdan chiqarasizmi?`)) return;

        const users = Storage.load('users', {});
        if (users[username]) {
            users[username].blocked = false;
            Storage.save('users', users);
            
            Utils.log('admin', `User blokdan chiqarildi: ${username}`, 'admin');
            Utils.notify(`${username} blokdan chiqarildi!`, 'success');
            
            this.loadUsers();
            this.loadDashboard();
        }
    },

    /**
     * Delete user
     */
    deleteUser(username) {
        if (!confirm(`${username} ni o'chirasizmi? Bu amalni qaytarib bo'lmaydi!`)) return;

        const users = Storage.load('users', {});
        if (users[username]) {
            delete users[username];
            Storage.save('users', users);
            
            // Delete user stats
            Storage.remove(`stats_${username}`);
            
            Utils.log('admin', `User o'chirildi: ${username}`, 'admin');
            Utils.notify(`${username} o'chirildi!`, 'success');
            
            this.loadUsers();
            this.loadDashboard();
        }
    },

    /**
     * Load logs
     */
    loadLogs() {
        const logs = Storage.load('logs', []);
        const container = $('logContainer');

        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 50px; color: var(--gray);">📋 Hozircha loglar yo\'q</div>';
            return;
        }

        // Show latest logs first
        const sortedLogs = logs.slice().reverse();
        
        let html = '';
        sortedLogs.slice(0, 100).forEach(log => {
            const typeIcons = {
                'login': '🔐',
                'logout': '🚪',
                'convert': '🔄',
                'file': '📁',
                'message': '💬',
                'admin': '🛡️',
                'error': '❌',
                'help': '💡'
            };

            const icon = typeIcons[log.type] || '📝';
            
            html += `
                <div class="log-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 15px; align-items: center; flex: 1;">
                            <div style="font-size: 24px;">${icon}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">
                                    <span style="color: #667eea;">${log.user}</span> - ${log.action}
                                </div>
                                <div style="color: var(--gray); font-size: 13px;">${log.time}</div>
                            </div>
                        </div>
                        <div style="padding: 5px 12px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; font-size: 12px; color: #667eea;">
                            ${log.type}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Filter logs
     */
    filterLogs() {
        const filter = $('logFilter').value;
        const logs = Storage.load('logs', []);
        const container = $('logContainer');

        let filtered = logs;
        if (filter !== 'all') {
            filtered = logs.filter(log => log.type === filter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 50px; color: var(--gray);">🔍 Loglar topilmadi</div>';
            return;
        }

        // Re-render with filtered logs
        this.loadLogs();
    },

    /**
     * Clear logs
     */
    clearLogs() {
        if (!confirm('Barcha loglarni o\'chirasizmi?')) return;

        Storage.save('logs', []);
        Utils.notify('Loglar tozalandi!', 'success');
        this.loadLogs();
    },

    /**
     * Load help requests
     */
    loadHelpRequests() {
        const helpRequests = Storage.load('helpRequests', []);
        const container = $('helpContainer');

        if (!container) return;

        if (helpRequests.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 50px; color: var(--gray);">💬 Yordam so\'rovlari yo\'q</div>';
            return;
        }

        // Sort by newest first
        const sorted = helpRequests.slice().reverse();

        let html = '';
        sorted.forEach((req, index) => {
            const actualIndex = helpRequests.length - 1 - index;
            const statusColor = req.status === 'pending' ? '#f5576c' : '#4facfe';
            const statusText = req.status === 'pending' ? '⏳ Kutilmoqda' : '✅ Hal qilindi';

            html += `
                <div class="help-card">
                    <div style="display: flex; justify-content: between; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <h3 style="margin-bottom: 5px;">👤 ${req.user}</h3>
                            <div style="color: var(--gray); font-size: 13px;">${req.time}</div>
                        </div>
                        <div style="padding: 5px 15px; background: ${statusColor}20; color: ${statusColor}; border-radius: 8px; font-size: 13px; height: fit-content;">
                            ${statusText}
                        </div>
                    </div>
                    <div style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px; margin-bottom: 15px;">
                        <div style="color: var(--gray); font-size: 12px; margin-bottom: 5px;">Xabar:</div>
                        <div>${req.message}</div>
                    </div>
                    ${req.status === 'pending' ? `
                        <div style="display: flex; gap: 10px;">
                            <button onclick="Admin.resolveHelp(${actualIndex})" class="btn-primary" style="flex: 1; padding: 10px;">
                                ✅ Hal qilindi
                            </button>
                            <button onclick="Admin.deleteHelp(${actualIndex})" class="btn-danger" style="padding: 10px;">
                                🗑️ O'chirish
                            </button>
                        </div>
                    ` : `
                        <button onclick="Admin.deleteHelp(${actualIndex})" class="btn-danger" style="width: 100%; padding: 10px;">
                            🗑️ O'chirish
                        </button>
                    `}
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Resolve help request
     */
    resolveHelp(index) {
        const helpRequests = Storage.load('helpRequests', []);
        
        if (helpRequests[index]) {
            helpRequests[index].status = 'resolved';
            helpRequests[index].resolvedAt = new Date().toISOString();
            helpRequests[index].resolvedBy = 'admin';
            
            Storage.save('helpRequests', helpRequests);
            
            Utils.log('admin', `Yordam so'rovi hal qilindi: ${helpRequests[index].user}`, 'admin');
            Utils.notify('Yordam so\'rovi hal qilindi!', 'success');
            
            this.loadHelpRequests();
            this.loadDashboard();
        }
    },

    /**
     * Delete help request
     */
    deleteHelp(index) {
        if (!confirm('Bu so\'rovni o\'chirasizmi?')) return;

        const helpRequests = Storage.load('helpRequests', []);
        helpRequests.splice(index, 1);
        Storage.save('helpRequests', helpRequests);
        
        Utils.notify('So\'rov o\'chirildi!', 'success');
        this.loadHelpRequests();
        this.loadDashboard();
    },

    /**
     * Load settings
     */
    loadSettings() {
        const settingsTab = $('settingsTab');
        if (!settingsTab) return;

        settingsTab.innerHTML = `
            <div class="settings-panel">
                <h3 style="margin-bottom: 30px; font-size: 24px;">⚙️ Tizim Sozlamalari</h3>
                
                <div style="display: grid; gap: 20px;">
                    <div style="padding: 25px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 16px;">
                        <h4 style="margin-bottom: 15px; color: #667eea;">📊 Ma'lumotlar</h4>
                        <p style="color: var(--gray); margin-bottom: 20px;">
                            Barcha foydalanuvchi ma'lumotlari, loglar va statistikani eksport qiling
                        </p>
                        <button onclick="Admin.exportData()" class="btn-primary" style="padding: 12px 24px;">
                            📥 Ma'lumotlarni eksport qilish
                        </button>
                    </div>

                    <div style="padding: 25px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 16px;">
                        <h4 style="margin-bottom: 15px; color: #f5576c;">🗑️ Xavfli Zona</h4>
                        <p style="color: var(--gray); margin-bottom: 20px;">
                            DIQQAT: Bu barcha ma'lumotlarni o'chiradi. Bu amalni qaytarib bo'lmaydi!
                        </p>
                        <button onclick="Admin.clearAllData()" class="btn-danger" style="padding: 12px 24px;">
                            ⚠️ Barcha ma'lumotlarni o'chirish
                        </button>
                    </div>

                    <div style="padding: 25px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 16px;">
                        <h4 style="margin-bottom: 15px; color: #667eea;">📈 Statistika</h4>
                        ${this.getSystemStats()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get system statistics
     */
    getSystemStats() {
        const users = Storage.load('users', {});
        const logs = Storage.load('logs', []);
        const helpRequests = Storage.load('helpRequests', []);

        const totalUsers = Object.keys(users).length;
        const blockedUsers = Object.values(users).filter(u => u.blocked).length;
        const totalLogs = logs.length;
        const totalHelp = helpRequests.length;
        const pendingHelp = helpRequests.filter(r => r.status === 'pending').length;

        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Jami foydalanuvchilar</div>
                    <div style="font-size: 24px; font-weight: 700; color: #667eea; margin-top: 5px;">${totalUsers}</div>
                </div>
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Bloklangan</div>
                    <div style="font-size: 24px; font-weight: 700; color: #f5576c; margin-top: 5px;">${blockedUsers}</div>
                </div>
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Jami loglar</div>
                    <div style="font-size: 24px; font-weight: 700; color: #667eea; margin-top: 5px;">${totalLogs}</div>
                </div>
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Yordam so'rovlari</div>
                    <div style="font-size: 24px; font-weight: 700; color: #4facfe; margin-top: 5px;">${totalHelp} (${pendingHelp} pending)</div>
                </div>
            </div>
        `;
    },

    /**
     * Export all data
     */
    exportData() {
        const data = {
            users: Storage.load('users', {}),
            logs: Storage.load('logs', []),
            helpRequests: Storage.load('helpRequests', []),
            exported: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-converter-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Utils.log('admin', 'Ma\'lumotlar eksport qilindi', 'admin');
        Utils.notify('Ma\'lumotlar yuklab olindi!', 'success');
    },

    /**
     * Clear all data
     */
    clearAllData() {
        const confirmation = prompt('DIQQAT! Barcha ma\'lumotlar o\'chadi. Davom etish uchun "DELETE" deb yozing:');
        
        if (confirmation === 'DELETE') {
            Storage.clearAll();
            Utils.notify('Barcha ma\'lumotlar o\'chirildi!', 'success');
            
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            Utils.notify('Bekor qilindi', 'error');
        }
    },

    /**
     * Start auto refresh
     */
    startAutoRefresh() {
        // Refresh dashboard every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadDashboard();
        }, 30000);
    },

    /**
     * Stop auto refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
};

// Initialize when admin panel opens
window.addEventListener('DOMContentLoaded', () => {
    // Admin will be initialized when login is successful
});