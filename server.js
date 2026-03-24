const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves your HTML/CSS

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.WEBHOOK_URL;

app.post('/api/send', async (req, res) => {
    const { message } = req.body;

    // 1. Basic Validation
    if (!message || message.length < 2) {
        return res.status(400).json({ error: "Message is too short!" });
    }

    if (message.length > 500) {
        return res.status(400).json({ error: "Message is too long!" });
    }

    try {
        // 2. Send to Discord
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "📩 New Anonymous Message",
                    description: message,
                    color: 16711812, // Hot pink color
                    timestamp: new Date()
                }]
            })
        });

        if (response.ok) {
            res.json({ success: true });
        } else {
            throw new Error("Discord API Error");
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to send message." });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));