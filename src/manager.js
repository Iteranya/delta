import WhatsAppClient from "./whatsapp";
import { enqueueMessage, startPipeline } from "../controller/pipeline.js";

class WhatsAppManager {
    constructor() {
        this.clients = new Map(); // Map<id, WhatsAppClient>
        startPipeline(); // Let the pipeline start chewing messages
    }

    addClient(id, config = {}) {
        if (this.clients.has(id)) {
            console.warn(`[Manager] Client '${id}' already exists.`);
            return this.clients.get(id);
        }

        const client = new WhatsAppClient({
            sessionId: id,
            onMessage: (msg) => this._handleIncomingMessage(id, msg),
            onStatus: (status) => console.log(`[${id}] STATUS: ${status}`),
            onLog: (log) => console.log(`[${id}] ${log}`),
            ...config
        });

        this.clients.set(id, client);
        console.log(`[Manager] Client '${id}' added and initialized.`);
        return client;
    }

    removeClient(id) {
        const client = this.clients.get(id);
        if (client) {
            client.destroy && client.destroy(); // Add a destroy() method to WhatsAppClient if needed
            this.clients.delete(id);
            console.log(`[Manager] Client '${id}' removed.`);
        } else {
            console.warn(`[Manager] Client '${id}' not found.`);
        }
    }

    broadcastMessage(text) {
        this.clients.forEach((client, id) => {
            client.sendMessageToDefault(text)
                .then(() => console.log(`[${id}] Message sent.`))
                .catch(err => console.error(`[${id}] Error sending message:`, err));
        });
    }

    sendMessageFromClient(id, number, text) {
        const client = this.clients.get(id);
        if (!client) {
            console.error(`[Manager] Client '${id}' not found.`);
            return;
        }

        return client.sendMessage(number, text);
    }

    listClients() {
        return Array.from(this.clients.keys());
    }

    getClient(id) {
        return this.clients.get(id);
    }

     _handleIncomingMessage(clientId, message) {
        enqueueMessage(clientId, message); // Let pipeline handle it
    }
}

module.exports = WhatsAppManager;
