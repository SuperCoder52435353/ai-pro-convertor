/**
 * AI Pro Converter - Brain Module
 * Core file processing and conversion logic
 */

const Brain = {
    currentFile: null,
    fileData: null,
    fileType: '',
    fileName: '',
    userStats: { files: 0, converts: 0, messages: 0 },

    /**
     * Initialize brain module
     */
    init() {
        this.setupFileInput();
        this.setupDragDrop();
    },

    /**
     * Setup file input handler
     */
    setupFileInput() {
        const fileInput = $('fileInput');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.processFile(file);
        });
    },

    /**
     * Setup drag and drop
     */
    setupDragDrop() {
        const uploadBox = document.querySelector('.upload-box');
        if (!uploadBox) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadBox.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        uploadBox.addEventListener('dragenter', () => {
            uploadBox.style.borderColor = '#667eea';
            uploadBox.style.background = 'rgba(102, 126, 234, 0.1)';
        });

        uploadBox.addEventListener('dragleave', () => {
            uploadBox.style.borderColor = '';
            uploadBox.style.background = '';
        });

        uploadBox.addEventListener('drop', (e) => {
            uploadBox.style.borderColor = '';
            uploadBox.style.background = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
    },

    /**
     * Process uploaded file
     */
    async processFile(file) {
        this.currentFile = file;
        this.fileName = file.name;
        this.fileType = file.name.split('.').pop().toLowerCase();

        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        // Show file info
        const fileResult = $('fileResult');
        fileResult.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 32px;">📄</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 5px;">✅ ${file.name}</div>
                    <div style="color: var(--gray); font-size: 13px;">
                        Size: ${fileSize} MB | Type: ${this.fileType.toUpperCase()}
                    </div>
                </div>
            </div>
        `;
        fileResult.classList.remove('hidden');

        // Update stats
        this.userStats.files++;
        this.updateStats();
        this.saveUserStats();

        // Log activity
        Utils.log(Auth.currentUser, `Fayl yuklandi: ${file.name}`, 'file');

        try {
            // Read file
            const arrayBuffer = await this.readFileAsArrayBuffer(file);

            // Process based on type
            if (['xlsx', 'xls', 'csv'].includes(this.fileType)) {
                await this.processExcel(arrayBuffer);
            } else if (this.fileType === 'docx' || this.fileType === 'doc') {
                await this.processWord(arrayBuffer);
            } else if (this.fileType === 'pdf') {
                await this.processPDF(arrayBuffer);
            } else if (this.fileType === 'txt') {
                await this.processText(arrayBuffer);
            } else if (['json', 'xml', 'html', 'css', 'js'].includes(this.fileType)) {
                await this.processCode(arrayBuffer);
            } else {
                Utils.notify('Bu format hali qo\'llab-quvvatlanmaydi!', 'error');
                return;
            }

            // Show format options
            this.showFormatOptions();

            // AI response
            AI.addMessage('ai', `✅ Fayl muvaffaqiyatli yuklandi: <b>${file.name}</b><br><br>📊 Fayl hajmi: ${fileSize} MB<br>📋 Format: ${this.fileType.toUpperCase()}<br><br>Endi qaysi formatga o'tkazamiz? Format tugmasini bosing! 👇`);

            Utils.notify('Fayl tayyor! Format tanlang.', 'success');
        } catch (error) {
            console.error('File processing error:', error);
            Utils.notify('Faylni o\'qib bo\'lmadi!', 'error');
            Utils.log(Auth.currentUser, `Fayl xatosi: ${error.message}`, 'error');
        }
    },

    /**
     * Read file as ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Process Excel files
     */
    async processExcel(arrayBuffer) {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Get data as array
        this.fileData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Also save as JSON for better processing
        this.fileData.json = XLSX.utils.sheet_to_json(firstSheet);
        this.fileData.workbook = workbook;
    },

    /**
     * Process Word documents
     */
    async processWord(arrayBuffer) {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        this.fileData = {
            html: result.value,
            text: result.value.replace(/<[^>]*>/g, '')
        };
    },

    /**
     * Process PDF files
     */
    async processPDF(arrayBuffer) {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        const pages = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            
            fullText += pageText + '\n\n';
            pages.push(pageText);
        }
        
        this.fileData = {
            text: fullText,
            pages: pages,
            pageCount: pdf.numPages
        };
    },

    /**
     * Process text files
     */
    async processText(arrayBuffer) {
        const decoder = new TextDecoder('utf-8');
        this.fileData = decoder.decode(arrayBuffer);
    },

    /**
     * Process code files (JSON, XML, HTML, CSS, JS)
     */
    async processCode(arrayBuffer) {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        
        this.fileData = {
            raw: text,
            formatted: this.formatCode(text, this.fileType)
        };
    },

    /**
     * Format code for better display
     */
    formatCode(code, type) {
        try {
            if (type === 'json') {
                return JSON.stringify(JSON.parse(code), null, 2);
            }
            return code;
        } catch {
            return code;
        }
    },

    /**
     * Show format conversion options
     */
    showFormatOptions() {
        const container = $('formatOptions');
        container.innerHTML = '';
        container.classList.remove('hidden');

        const formatMap = {
            'xlsx': ['PDF', 'CSV', 'TXT', 'HTML', 'JSON'],
            'xls': ['PDF', 'CSV', 'TXT', 'HTML', 'JSON'],
            'csv': ['XLSX', 'PDF', 'TXT', 'HTML', 'JSON'],
            'docx': ['PDF', 'TXT', 'HTML'],
            'doc': ['PDF', 'TXT', 'HTML'],
            'pdf': ['TXT', 'HTML'],
            'txt': ['PDF', 'DOCX', 'HTML'],
            'json': ['XLSX', 'CSV', 'TXT', 'HTML'],
            'xml': ['JSON', 'TXT', 'HTML'],
            'html': ['PDF', 'TXT', 'DOCX'],
            'css': ['TXT', 'HTML'],
            'js': ['TXT', 'HTML']
        };

        const formats = formatMap[this.fileType] || ['TXT', 'PDF'];

        formats.forEach(format => {
            const btn = document.createElement('div');
            btn.className = 'format-btn';
            btn.innerHTML = `<div style="font-size: 24px; margin-bottom: 5px;">${this.getFormatIcon(format)}</div>${format}`;
            btn.onclick = () => this.convertTo(format.toLowerCase());
            container.appendChild(btn);
        });
    },

    /**
     * Get format icon
     */
    getFormatIcon(format) {
        const icons = {
            'PDF': '📕',
            'CSV': '📊',
            'TXT': '📝',
            'HTML': '🌐',
            'JSON': '📋',
            'XLSX': '📗',
            'DOCX': '📘'
        };
        return icons[format] || '📄';
    },

    /**
     * Convert file to target format
     */
    async convertTo(targetFormat) {
        if (!this.fileData) {
            Utils.notify('Fayl yuklanmagan!', 'error');
            return;
        }

        // Show progress
        const progressBar = $('progressBar');
        const progressFill = $('progressFill');
        const progressText = $('progressText');
        
        progressBar.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Converting...';

        // Animate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
            }
        }, 50);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            let blob, filename;
            const baseName = this.fileName.split('.').slice(0, -1).join('.');

            switch (targetFormat) {
                case 'pdf':
                    blob = await this.convertToPDF();
                    filename = `${baseName}.pdf`;
                    break;
                case 'csv':
                    blob = await this.convertToCSV();
                    filename = `${baseName}.csv`;
                    break;
                case 'txt':
                    blob = await this.convertToTXT();
                    filename = `${baseName}.txt`;
                    break;
                case 'html':
                    blob = await this.convertToHTML();
                    filename = `${baseName}.html`;
                    break;
                case 'json':
                    blob = await this.convertToJSON();
                    filename = `${baseName}.json`;
                    break;
                case 'xlsx':
                    blob = await this.convertToXLSX();
                    filename = `${baseName}.xlsx`;
                    break;
                case 'docx':
                    blob = await this.convertToDOCX();
                    filename = `${baseName}.docx`;
                    break;
                default:
                    throw new Error('Unsupported format');
            }

            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            progressText.textContent = 'Complete!';

            // Download file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            // Hide progress after delay
            setTimeout(() => {
                progressBar.classList.add('hidden');
                progressFill.style.width = '0%';
                $('formatOptions').classList.add('hidden');
            }, 1000);

            // Update stats
            this.userStats.converts++;
            this.updateStats();
            this.saveUserStats();

            // Log activity
            Utils.log(Auth.currentUser, `Convert: ${this.fileName} → ${targetFormat.toUpperCase()}`, 'convert');

            // AI response
            AI.addMessage('ai', `🎉 Muvaffaqiyatli convert qilindi!<br><br>✅ <b>${filename}</b> yuklab olindi!<br><br>Yana fayl convert qilmoqchimisiz?`);

            Utils.notify('Convert muvaffaqiyatli! ✅', 'success');
        } catch (error) {
            clearInterval(progressInterval);
            progressBar.classList.add('hidden');
            
            console.error('Conversion error:', error);
            Utils.notify('Convert xatosi! Qayta urinib ko\'ring.', 'error');
            Utils.log(Auth.currentUser, `Convert xatosi: ${error.message}`, 'error');
        }
    },

    /**
     * Convert to PDF
     */
    async convertToPDF() {
        const { PDFDocument, StandardFonts, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let text = '';
        
        if (typeof this.fileData === 'string') {
            text = this.fileData;
        } else if (this.fileData.text) {
            text = this.fileData.text;
        } else if (Array.isArray(this.fileData)) {
            text = this.fileData.map(row => row.join(', ')).join('\n');
        } else if (this.fileData.html) {
            text = this.fileData.text;
        } else {
            text = JSON.stringify(this.fileData, null, 2);
        }

        const lines = text.split('\n');
        let page = pdfDoc.addPage([595, 842]); // A4 size
        let y = 800;
        const lineHeight = 14;
        const margin = 50;
        const maxWidth = 495;

        for (const line of lines) {
            if (y < 50) {
                page = pdfDoc.addPage([595, 842]);
                y = 800;
            }

            const wrappedLines = this.wrapText(line, font, 11, maxWidth);
            
            for (const wrappedLine of wrappedLines) {
                if (y < 50) {
                    page = pdfDoc.addPage([595, 842]);
                    y = 800;
                }
                
                page.drawText(wrappedLine, {
                    x: margin,
                    y: y,
                    size: 11,
                    font: font,
                    color: rgb(0, 0, 0)
                });
                
                y -= lineHeight;
            }
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    },

    /**
     * Wrap text for PDF
     */
    wrapText(text, font, fontSize, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const width = font.widthOfTextAtSize(testLine, fontSize);
            
            if (width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) lines.push(currentLine);
        return lines;
    },

    /**
     * Convert to CSV
     */
    async convertToCSV() {
        let csvContent = '';

        if (Array.isArray(this.fileData)) {
            csvContent = this.fileData.map(row => row.join(',')).join('\n');
        } else if (this.fileData.json) {
            const worksheet = XLSX.utils.json_to_sheet(this.fileData.json);
            csvContent = XLSX.utils.sheet_to_csv(worksheet);
        } else {
            csvContent = JSON.stringify(this.fileData);
        }

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    },

    /**
     * Convert to TXT
     */
    async convertToTXT() {
        let text = '';

        if (typeof this.fileData === 'string') {
            text = this.fileData;
        } else if (this.fileData.text) {
            text = this.fileData.text;
        } else if (Array.isArray(this.fileData)) {
            text = this.fileData.map(row => row.join('\t')).join('\n');
        } else {
            text = JSON.stringify(this.fileData, null, 2);
        }

        return new Blob([text], { type: 'text/plain;charset=utf-8;' });
    },

    /**
     * Convert to HTML
     */
    async convertToHTML() {
        let html = '';

        if (this.fileData.html) {
            html = this.fileData.html;
        } else if (Array.isArray(this.fileData)) {
            html = '<table border="1"><tbody>';
            this.fileData.forEach(row => {
                html += '<tr>';
                row.forEach(cell => {
                    html += `<td>${cell}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
        } else {
            html = `<pre>${JSON.stringify(this.fileData, null, 2)}</pre>`;
        }

        const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.fileName}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; }
        td { padding: 8px; }
    </style>
</head>
<body>${html}</body>
</html>`;

        return new Blob([fullHTML], { type: 'text/html;charset=utf-8;' });
    },

    /**
     * Convert to JSON
     */
    async convertToJSON() {
        let json = '';

        if (this.fileData.json) {
            json = JSON.stringify(this.fileData.json, null, 2);
        } else if (Array.isArray(this.fileData)) {
            json = JSON.stringify(this.fileData, null, 2);
        } else {
            json = JSON.stringify(this.fileData, null, 2);
        }

        return new Blob([json], { type: 'application/json;charset=utf-8;' });
    },

    /**
     * Convert to XLSX
     */
    async convertToXLSX() {
        let worksheet;

        if (Array.isArray(this.fileData)) {
            worksheet = XLSX.utils.aoa_to_sheet(this.fileData);
        } else if (this.fileData.json) {
            worksheet = XLSX.utils.json_to_sheet(this.fileData.json);
        } else {
            const data = [[JSON.stringify(this.fileData)]];
            worksheet = XLSX.utils.aoa_to_sheet(data);
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },

    /**
     * Convert to DOCX (simple text document)
     */
    async convertToDOCX() {
        // Simple DOCX creation - text only
        let text = '';
        if (typeof this.fileData === 'string') {
            text = this.fileData;
        } else if (this.fileData.text) {
            text = this.fileData.text;
        } else {
            text = JSON.stringify(this.fileData, null, 2);
        }

        // For now, return as text file (full DOCX needs more libraries)
        return new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    },

    /**
     * Update stats display
     */
    updateStats() {
        $('fileCount').textContent = this.userStats.files;
        $('convertCount').textContent = this.userStats.converts;
        $('msgCount').textContent = this.userStats.messages;
    },

    /**
     * Load user stats
     */
    loadUserStats(username) {
        this.userStats = Storage.load(`stats_${username}`, { files: 0, converts: 0, messages: 0 });
        this.updateStats();
    },

    /**
     * Save user stats
     */
    saveUserStats() {
        Storage.save(`stats_${Auth.currentUser}`, this.userStats);
    }
};

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    Brain.init();
});