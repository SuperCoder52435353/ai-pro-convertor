/**
 * AI Pro Converter - AI Assistant Module
 * Intelligent chatbot and help system
 */

const AI = {
    responses: {},
    isTyping: false,

    /**
     * Initialize AI module
     */
    init() {
        this.loadResponses();
        this.setupMessageInput();
    },

    /**
     * Load AI response patterns
     */
    loadResponses() {
        this.responses = {
            greetings: [
                'Salom! 👋 Men AI Pro Converter assistentiman. Sizga qanday yordam bera olaman?',
                'Assalomu alaykum! 🌟 Fayllaringizni convert qilishda yordam beraman!',
                'Xush kelibsiz! 🚀 Qaysi faylni convert qilmoqchisiz?'
            ],
            help: `
                <div style="line-height: 1.8;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">📚 AI Pro Converter Qo'llanma</h3>
                    
                    <h4 style="margin-top: 20px; color: #667eea;">🔄 Convert Imkoniyatlari:</h4>
                    <ul style="margin-left: 20px;">
                        <li><strong>Excel/CSV</strong> → PDF, TXT, HTML, JSON</li>
                        <li><strong>Word</strong> → PDF, TXT, HTML</li>
                        <li><strong>PDF</strong> → TXT (matn chiqarish)</li>
                        <li><strong>TXT</strong> → PDF, DOCX, HTML</li>
                        <li><strong>JSON/XML</strong> → XLSX, CSV, HTML</li>
                        <li><strong>HTML/CSS/JS</strong> → PDF, TXT</li>
                    </ul>

                    <h4 style="margin-top: 20px; color: #667eea;">💡 Qanday ishlatish:</h4>
                    <ol style="margin-left: 20px;">
                        <li>Faylni yuklang (drag & drop yoki tugmani bosing)</li>
                        <li>Format tugmasini tanlang</li>
                        <li>Fayl avtomatik yuklab olinadi!</li>
                    </ol>

                    <h4 style="margin-top: 20px; color: #667eea;">📞 Yordam kerakmi?</h4>
                    <p>Admin bilan bog'lanish uchun "admin" yoki "muammo" deb yozing.</p>

                    <h4 style="margin-top: 20px; color: #667eea;">⚡ Tez Buyruqlar:</h4>
                    <ul style="margin-left: 20px;">
                        <li><strong>"excel"</strong> - Excel haqida ma'lumot</li>
                        <li><strong>"pdf"</strong> - PDF convert qilish</li>
                        <li><strong>"yordam"</strong> - To'liq qo'llanma</li>
                        <li><strong>"admin"</strong> - Admin bilan bog'lanish</li>
                    </ul>
                </div>
            `,
            excel: `
                <div style="line-height: 1.8;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">📊 Excel/CSV Convert</h3>
                    <p>Excel va CSV fayllarni quyidagi formatlarga o'tkazish mumkin:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>PDF</strong> - Professional hisobot uchun</li>
                        <li>✅ <strong>CSV</strong> - Boshqa dasturlarda ishlatish</li>
                        <li>✅ <strong>TXT</strong> - Oddiy matn sifatida</li>
                        <li>✅ <strong>HTML</strong> - Veb sahifa sifatida</li>
                        <li>✅ <strong>JSON</strong> - Dasturlash uchun</li>
                    </ul>
                    <p style="margin-top: 15px;">💡 <strong>Maslahat:</strong> Katta Excel fayllar uchun CSV formatini tavsiya etamiz!</p>
                </div>
            `,
            pdf: `
                <div style="line-height: 1.8;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">📕 PDF Convert</h3>
                    <p>PDF fayllardan matn chiqarib olish mumkin:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>TXT</strong> - Toza matn sifatida</li>
                        <li>✅ <strong>HTML</strong> - Formatlangan ko'rinishda</li>
                    </ul>
                    <p style="margin-top: 15px;">⚠️ <strong>Eslatma:</strong> Skanerlangan PDF'lardan matn chiqarib bo'lmaydi.</p>
                    <p style="margin-top: 10px;">💡 <strong>Maslahat:</strong> Eng yaxshi natija uchun toza PDF'larni yuklang!</p>
                </div>
            `,
            word: `
                <div style="line-height: 1.8;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">📘 Word Convert</h3>
                    <p>Word hujjatlarni quyidagi formatlarga o'tkazish mumkin:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>PDF</strong> - Universal format</li>
                        <li>✅ <strong>TXT</strong> - Oddiy matn</li>
                        <li>✅ <strong>HTML</strong> - Veb sahifa</li>
                    </ul>
                    <p style="margin-top: 15px;">💡 <strong>Maslahat:</strong> DOCX formatni tavsiya etamiz (yangi Word format)!</p>
                </div>
            `,
            unknown: [
                'Kechirasiz, tushunmadim. 🤔 "yordam" deb yozing yoki savol bering!',
                'Bu haqda bilmayman. Yordam kerakmi? "yordam" deb yozing! 💡',
                'Tushunmadim. Faylni yuklang yoki "yordam" deb yozing! 📁'
            ],
            thanks: [
                'Arzimaydi! 😊 Yana yordam kerakmi?',
                'Xursand bo\'ldim! 🎉 Boshqa savol bormi?',
                'Marhamat! ✨ Yana convert qilamizmi?'
            ]
        };
    },

    /**
     * Setup message input
     */
    setupMessageInput() {
        const input = $('messageInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    },

    /**
     * Add message to chat
     */
    addMessage(type, text) {
        const container = $('chatContainer');
        if (!container) return;

        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.innerHTML = text;
        
        container.appendChild(message);
        container.scrollTop = container.scrollHeight;

        // Update stats for user messages
        if (type === 'user') {
            Brain.userStats.messages++;
            Brain.updateStats();
            Brain.saveUserStats();
        }
    },

    /**
     * Send message
     */
    async sendMessage() {
        const input = $('messageInput');
        const message = input.value.trim();

        if (!message || this.isTyping) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';

        // Log message
        Utils.log(Auth.currentUser, `Xabar: ${message}`, 'message');

        // Show typing indicator
        this.showTyping();

        // Process message
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const response = await this.processMessage(message);
        
        // Hide typing and show response
        this.hideTyping();
        this.addMessage('ai', response);
    },

    /**
     * Process user message
     */
    async processMessage(message) {
        const lower = message.toLowerCase();

        // Greeting patterns
        if (this.matchPattern(lower, ['salom', 'assalom', 'hello', 'hi', 'hey'])) {
            return this.getRandomResponse(this.responses.greetings);
        }

        // Help request
        if (this.matchPattern(lower, ['yordam', 'help', 'qanday', 'qilib'])) {
            return this.responses.help;
        }

        // Excel info
        if (this.matchPattern(lower, ['excel', 'xlsx', 'xls', 'csv', 'jadval'])) {
            return this.responses.excel;
        }

        // PDF info
        if (this.matchPattern(lower, ['pdf'])) {
            return this.responses.pdf;
        }

        // Word info
        if (this.matchPattern(lower, ['word', 'docx', 'doc', 'hujjat'])) {
            return this.responses.word;
        }

        // Admin contact
        if (this.matchPattern(lower, ['admin', 'muammo', 'problem', 'xato', 'error'])) {
            return await this.handleAdminContact(message);
        }

        // Thanks
        if (this.matchPattern(lower, ['rahmat', 'thanks', 'tashakkur', 'spasibo'])) {
            return this.getRandomResponse(this.responses.thanks);
        }

        // Features list
        if (this.matchPattern(lower, ['format', 'qanday', 'nima'])) {
            return this.responses.help;
        }

        // File upload reminder
        if (this.matchPattern(lower, ['fayl', 'file', 'yukla'])) {
            return '📁 Faylni yuklash uchun o\'ng tarafdagi "Faylni yuklang" qismiga boring yoki faylni sudrab olib keling!';
        }

        // Default response
        return this.getRandomResponse(this.responses.unknown);
    },

    /**
     * Match message pattern
     */
    matchPattern(message, patterns) {
        return patterns.some(pattern => message.includes(pattern));
    },

    /**
     * Get random response
     */
    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    },

    /**
     * Handle admin contact request
     */
    async handleAdminContact(message) {
        // Save help request
        const helpRequests = Storage.load('helpRequests', []);
        
        helpRequests.push({
            user: Auth.currentUser,
            message: message,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleString('uz-UZ'),
            status: 'pending'
        });

        Storage.save('helpRequests', helpRequests);

        Utils.log(Auth.currentUser, `Yordam so'radi: ${message}`, 'help');

        return `
            <div style="line-height: 1.8;">
                <h3 style="color: #667eea; margin-bottom: 15px;">📧 Xabar Yuborildi</h3>
                <p>Sizning xabaringiz admin'ga yuborildi!</p>
                <p style="margin-top: 10px;"><strong>Xabar:</strong> ${message}</p>
                <p style="margin-top: 15px; color: var(--gray);">⏰ Admin tez orada javob beradi.</p>
                <p style="margin-top: 10px;">💡 Shu vaqtda fayllaringizni convert qilishda davom etishingiz mumkin!</p>
            </div>
        `;
    },

    /**
     * Show typing indicator
     */
    showTyping() {
        this.isTyping = true;
        const loader = $('chatLoader');
        if (loader) loader.classList.remove('hidden');
    },

    /**
     * Hide typing indicator
     */
    hideTyping() {
        this.isTyping = false;
        const loader = $('chatLoader');
        if (loader) loader.classList.add('hidden');
    },

    /**
     * Show help modal
     */
    showHelp() {
        this.addMessage('ai', this.responses.help);
        
        // Scroll to message
        const container = $('chatContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
};

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    AI.init();
});