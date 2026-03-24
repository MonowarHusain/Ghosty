const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves your HTML/CSS/JS files

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.WEBHOOK_URL;

// Message Route
app.post('/api/send', async (req, res) => {
    const { message } = req.body;

    // 1. Validation
    if (!DISCORD_WEBHOOK) {
        console.error("❌ ERROR: WEBHOOK_URL is missing in environment variables.");
        return res.status(500).json({ error: "Server configuration error." });
    }

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
                    title: "👻 New Ghosty Message!",
                    description: `> ${message}`,
                    color: 7101671, // A cool purple/ghosty color
                    timestamp: new Date(),
                    footer: { text: "Sent via Ghosty Anonymous" }
                }]
            })
        });

        if (response.ok) {
            res.json({ success: true });
        } else {
            const errorData = await response.text();
            console.error("❌ Discord Error:", errorData);
            throw new Error("Discord API Error");
        }
    } catch (err) {
        console.error("❌ Catch Error:", err.message);
        res.status(500).json({ error: "Failed to send message." });
    }
});

// For Vercel Deployment: Export the app instead of just listening
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Ghosty is live on http://localhost:${PORT}`);
        console.log(`📡 Webhook Status: ${DISCORD_WEBHOOK ? "Connected" : "MISSING"}`);
    });
}

module.exports = app;