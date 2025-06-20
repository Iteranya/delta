const express = require('express');
const router = express.Router();
const WhatsAppManager = require('../manager');

const manager = new WhatsAppManager(); // Singleton-style manager

// List all clients
router.get('/clients', (req, res) => {
    const clients = manager.listClients();
    res.json({ clients });
});

// Add a new client
router.post('/clients', (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Missing "id" in request body' });
    }

    const client = manager.addClient(id);
    res.json({ message: `Client '${id}' created` });
});

// Remove a client
router.delete('/clients/:id', (req, res) => {
    const { id } = req.params;

    manager.removeClient(id);
    res.json({ message: `Client '${id}' removed` });
});

// Send a message from a specific client
router.post('/clients/:id/message', async (req, res) => {
    const { id } = req.params;
    const { number, text } = req.body;

    if (!number || !text) {
        return res.status(400).json({ error: 'Missing "number" or "text" in body' });
    }

    try {
        await manager.sendMessageFromClient(id, number, text);
        res.json({ message: `Message sent from '${id}' to ${number}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Broadcast to all clients
router.post('/broadcast', (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Missing "text" in request body' });
    }

    manager.broadcastMessage(text);
    res.json({ message: 'Broadcast initiated' });
});

module.exports = router;
