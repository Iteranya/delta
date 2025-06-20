const fs = require('fs');
const WAWebJS = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { Client, LocalAuth } = WAWebJS;

class WhatsAppClient {
    constructor({ aiResponder, onLog = () => {}, onQR = () => {}, onStatus = () => {} } = {}) {
        this.onLog = onLog;
        this.onQR = onQR;
        this.onStatus = onStatus;

        this.aiResponder = aiResponder; // Injected dependency

        this.messageQueue = [];

        this.client = new Client({
            authStrategy: new LocalAuth({ dataPath: './whatsapp-sessions' }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('qr', async (qr) => {
            const qrDataUrl = await qrcode.toDataURL(qr);
            this.onQR(qrDataUrl);
            this.onLog('QR code received');
        });

        this.client.on('authenticated', () => this.onLog('Authenticated successfully'));
        this.client.on('auth_failure', msg => this.onLog(`Authentication failed: ${msg}`));
        this.client.on('ready', () => this.onStatus('Connected'));

        this.client.on('message', async (msg) => {
            this.onLog(`Msg from ${msg.from}: ${msg.body}`);
            if (msg.body === '!ping') {
                msg.reply('pong');
                return;
            }
            this.messageQueue.push(msg);
            this.processQueue();
        });
    }

    async processQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            await this.handleMessage(message);
        }
    }

    async handleMessage(message) {
        try {
            const history = await this.convertMessagesToChatArray(message);
            const response = await this.aiResponder.respondTo(message, history);
            await this.client.sendMessage(message.from, response);
            this.onLog(`Response sent: ${response}`);
        } catch (err) {
            this.onLog(`Handle message error: ${err.message}`);
        }
    }

    async convertMessagesToChatArray(message) {
        const chat = await message.getChat();
        const messages = await chat.fetchMessages({ limit: Infinity });
        return messages.map(m => ({
            role: m.fromMe ? 'assistant' : 'user',
            content: m.body
        }));
    }

    async sendMessage(number, text) {
        const wanumber = number + '@c.us';
        return this.client.sendMessage(wanumber, text);
    }

    initialize() {
        this.client.initialize();
    }
}

module.exports = WhatsAppClient;
