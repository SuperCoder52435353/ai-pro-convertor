/**
 * AI Pro Converter - Authentication & User Management
 * Professional login system with security features
 */

const CONFIG = {
    ADMIN_USER: 'agent',
    ADMIN_PASS: 'PASSWORDABDURAXMON'
};

const Auth = {
    currentUser: null,
    isAdmin: false,

    /**
     * Initialize authentication system
     */
    init() {
        this.initParticles();
        this.checkRememberedUser();
        this.setupEventListeners();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const passwordInput = $('passwordInput');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.login();
            });
        }
    },

    /**
     * Check for remembered user
     */
    checkRememberedUser() {
        const remembered = Storage.load('rememberedUser');
        if (remembered) {
            $('usernameInput').value = remembered;
            $('rememberMe').checked = true;
        }
    },

    /**
     * Login function
     */
    async login() {
        const username = $('usernameInput').value.trim();
        const password = $('passwordInput').value;

        if (!username || !password) {
            Utils.notify('Ism va parol kiriting!', 'error');
            return;
        }

        // Check if admin
        if (username === CONFIG.ADMIN_USER && password === CONFIG.ADMIN_PASS) {
            this.currentUser = username;
            this.isAdmin = true;
            this.loginAdmin();
            return;
        }

        // Check if user is blocked
        const users = Storage.load('users', {});
        if (users[username]?.blocked) {
            Utils.notify('Siz bloklangansiz! Admin bilan bog\'laning.', 'error');
            Utils.log(username, 'Bloklangan user login urinishi', 'error');
            return;
        }

        // Regular user login
        this.currentUser = username;
        this.isAdmin = false;
        
        // Save user data if new
        if (!users[username]) {
            users[username] = {
                created: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                blocked: false
            };
        } else {
            users[username].lastLogin = new Date().toISOString();
        }
        Storage.save('users', users);

        // Remember user if checked
        if ($('rememberMe').checked) {
            Storage.save('rememberedUser', username);
        }

        // Log activity
        Utils.log(username, 'Tizimga kirdi', 'login');

        // Show main app
        this.showMainApp();
    },

    /**
     * Login as admin
     */
    loginAdmin() {
        Utils.log(this.currentUser, 'Admin panelga kirdi', 'admin');
        Utils.notify('Admin panelga xush kelibsiz! 🛡️', 'success');
        
        Utils.showPage('adminPanel');
        Admin.init();
    },

    /**
     * Show main application
     */
    showMainApp() {
        Utils.showPage('mainApp');
        
        // Set username in header
        $('currentUsername').textContent = this.currentUser;

        // Load user stats
        Brain.loadUserStats(this.currentUser);

        // Show welcome message
        const greetings = [
            `Salom, ${this.currentUser}! 🚀 AI Pro Converter tayyor!`,
            `Xush kelibsiz, ${this.currentUser}! 🔥 Professional konverter xizmatida!`,
            `Assalomu alaykum, ${this.currentUser}! ✨ Qanday yordam kerak?`,
            `Hayrli kun, ${this.currentUser}! ⚡ Fayl convert qilamizmi?`,
            `Salom, ${this.currentUser}! 💼 Professional konverter sizning xizmatingizda!`
        ];

        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        AI.addMessage('ai', greeting + '<br><br>📁 Faylni yuklang va istalgan formatga o\'tkazing!<br><br>Men quyidagilarni qila olaman:<br>✅ Excel → PDF, CSV, TXT, HTML, JSON<br>✅ Word → PDF, TXT, HTML<br>✅ PDF → Matn chiqarish<br>✅ TXT → PDF, DOCX<br>✅ JSON, XML, HTML, CSS konvertatsiya<br><br>Yordam kerakmi? "yordam" deb yozing! 😊');

        Utils.notify(`Xush kelibsiz, ${this.currentUser}!`, 'success');
    },

    /**
     * Logout function
     */
    logout() {
        if (!confirm('Tizimdan chiqmoqchimisiz?')) return;

        Utils.log(this.currentUser, 'Tizimdan chiqdi', 'logout');

        // Reset state
        this.currentUser = null;
        this.isAdmin = false;

        // Clear inputs
        $('passwordInput').value = '';
        $('chatContainer').innerHTML = '';

        // Show login page
        Utils.showPage('loginPage');
        Utils.notify('Xayr! 👋', 'success');
    }
};

/**
 * Storage utilities
 */
const Storage = {
    /**
     * Save data to localStorage
     */
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify({
                value: value,
                timestamp: Date.now()
            }));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    /**
     * Load data from localStorage
     */
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return defaultValue;
            
            const parsed = JSON.parse(data);
            return parsed.value || defaultValue;
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove data from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    /**
     * Clear all data
     */
    clearAll() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

/**
 * Utility functions
 */
const Utils = {
    /**
     * Get element by ID
     */
    $(id) {
        return document.getElementById(id);
    },

    /**
     * Show notification
     */
    notify(message, type = 'success') {
        const container = $('notificationContainer') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type === 'error' ? 'error' : ''}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }, 4000);
    },

    /**
     * Create notification container
     */
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    },

    /**
     * Log activity
     */
    log(user, action, type = 'info') {
        const logs = Storage.load('logs', []);
        
        logs.push({
            user: user || 'unknown',
            action: action,
            type: type,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleString('uz-UZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        });

        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.shift();
        }

        Storage.save('logs', logs);
    },

    /**
     * Show page
     */
    showPage(pageId) {
        const pages = ['loginPage', 'mainApp', 'adminPanel'];
        pages.forEach(page => {
            const element = $(page);
            if (element) {
                element.classList.add('hidden');
            }
        });

        const targetPage = $(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }
    }
};

// Make $ globally available
window.$ = (id) => document.getElementById(id);

/**
 * Particles animation
 */
Auth.initParticles = function() {
    const canvas = $('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 100;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(102, 126, 234, 0.5)';
            ctx.fill();
        }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(102, 126, 234, ${1 - distance / 100})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    
    // Set pdfjsLib worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
});