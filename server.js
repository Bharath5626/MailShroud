const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ✅ Use fetch workaround for CommonJS
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Email inbox API route
app.get('/inbox', async (req, res) => {
  const { login, domain } = req.query;
  const url = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // ✅ helps avoid 403
      }
    });

    const text = await response.text();
    console.log("RAW RESPONSE FROM 1SECMAIL:", text);

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (jsonErr) {
      console.error("❌ JSON parse failed:", jsonErr);
      res.status(502).send("Received non-JSON from 1secmail (maybe blocked or down)");
    }

  } catch (err) {
    console.error("API fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// ✅ Serve frontend on /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
