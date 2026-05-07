const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit'); // 1. Import the limiter

const app = express();

// Add a log to see the IP address for every request
const msgLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 1,
    handler: (req, res) => {
        console.log(`❌ BLOCKING SPAM FROM: ${req.ip}`); // This will show in your terminal
        res.status(429).json({ error: "Ghost is resting! Please wait 30 seconds. 👻" });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.WEBHOOK_URL;

// 3. Apply the limiter to the send route
app.post('/api/send', msgLimiter, async (req, res) => {
    const { message, deviceInfo } = req.body;

    // Extract Info (Vercel uses x-forwarded-for for IP)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "Local";
    const city = req.headers['x-vercel-ip-city'] || "Localhost";
    const country = req.headers['x-vercel-ip-country'] || "Local";

    if (!DISCORD_WEBHOOK) return res.status(500).json({ error: "Missing Webhook" });
    if (!message || message.length < 2) return res.status(400).json({ error: "Too short!" });

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "👻 Ghosty Intel Report",
                    description: `**Message:**\n> ${message}`,
                    color: 7101671,
                    fields: [
                        { name: "📍 Location", value: `${city}, ${country}`, inline: true },
                        { name: "🌐 IP Address", value: `||${ip}||`, inline: true },
                        { name: "📱 Device", value: deviceInfo?.platform || "Unknown", inline: true }
                    ],
                    footer: { text: "Spam Shield: ACTIVE 🛡️" },
                    timestamp: new Date()
                }]
            })
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to send" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Ghosty live on http://localhost:${PORT}`);
        console.log(`📡 Webhook connected: ${DISCORD_WEBHOOK ? "YES" : "NO"}`);
    });
}

module.exports = app;