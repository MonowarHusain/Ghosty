const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Standard Node.js path module

const app = express();
app.use(cors());
app.use(express.json());

// 1. Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

const DISCORD_WEBHOOK = process.env.WEBHOOK_URL;

// 2. THE FIX: Explicitly send index.html when someone visits "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. The Message Route
app.post('/api/send', async (req, res) => {
    const { message } = req.body;
    if (!DISCORD_WEBHOOK) return res.status(500).json({ error: "Missing Webhook" });

    try {
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "👻 New Ghosty Message!",
                    description: message,
                    color: 7101671,
                    timestamp: new Date()
                }]
            })
        });
        if (response.ok) res.json({ success: true });
        else throw new Error("Discord Error");
    } catch (err) {
        res.status(500).json({ error: "Failed to send" });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log(`🚀 Live on http://localhost:3000`));
}

module.exports = app;