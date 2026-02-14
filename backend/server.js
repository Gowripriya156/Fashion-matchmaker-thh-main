require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..','frontend'))); // Serve static files from root

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..','frontend','index.html'));
});

// API Proxy Route
app.post('/api/style', async (req, res) => {
    console.log(`Received API request from ${req.ip}`);
    try {
        const API_KEY = "AIzaSyAFHSNvHOr19ozNw2lKrOXOAoT56UHF7CQ";
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        // Robust error handling: Read text first to debug non-JSON errors (like 404/500 HTML)
        const rawText = await response.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            console.error('Non-JSON response from Gemini:', rawText);
            return res.status(500).json({ error: `Gemini API returned invalid response: ${rawText.substring(0, 200)}...` });
        }

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error || 'API Error' });
        }

        res.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(5000, () => {
    console.log(`Server running at http://localhost:${5000}`);
    console.log(`Open http://localhost:${5000}/ to test.`);
});
