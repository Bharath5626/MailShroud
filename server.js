const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public")); // serve HTML/CSS/JS

app.get("/inbox", async (req, res) => {
  const { login, domain } = req.query;
  try {
    const response = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error("API fetch error:", err);
    res.status(500).send("Failed to fetch inbox");
  }
});

app.get("/email", async (req, res) => {
  const { id, login, domain } = req.query;
  try {
    const response = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error("Email fetch error:", err);
    res.status(500).send("Failed to fetch message");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
