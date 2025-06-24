const domain = "1secmail.com";
let login = "";
let currentEmail = "";
let autoRefreshInterval = null;

// Generate random email
function generateEmail() {
  login = Math.random().toString(36).substring(2, 10);
  currentEmail = `${login}@${domain}`;
  document.getElementById("tempEmail").value = currentEmail;
  document.getElementById("inboxContent").innerHTML = `<p>Checking inbox...</p>`;
  fetchInbox();

  // Auto-refresh every 10 sec
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(fetchInbox, 10000);
}

// Copy email
function copyEmail() {
  const email = document.getElementById("tempEmail").value;
  navigator.clipboard.writeText(email)
    .then(() => alert("Copied to clipboard!"));
}

// Fetch inbox message list
function fetchInbox() {
  if (!login) return;

  fetch(`/inbox?login=${login}&domain=${domain}`)
    .then(res => res.json())
    .then(messages => {
      if (!Array.isArray(messages) || messages.length === 0) {
        document.getElementById("inboxContent").innerHTML = "<p>No new emails yet.</p>";
        return;
      }

      const inboxHTML = messages.map(msg => `
        <div class="email-item">
          <div><strong>From:</strong> ${msg.from}</div>
          <div><strong>Subject:</strong> ${msg.subject}</div>
          <button onclick="readMessage(${msg.id})">Read</button>
        </div>
      `).join('');
      document.getElementById("inboxContent").innerHTML = inboxHTML;
    })
    .catch(err => {
      console.error("Inbox fetch failed:", err);
      document.getElementById("inboxContent").innerHTML = `<p style="color:red;">Failed to fetch inbox</p>`;
    });
}

// Read full message
function readMessage(msgId) {
  const url = `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${msgId}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const content = `
        <div class="email-body">
          <h4>${data.subject}</h4>
          <p><strong>From:</strong> ${data.from}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <hr>
          <div>${data.htmlBody || data.textBody || "<em>No content</em>"}</div>
        </div>
      `;
      document.getElementById("inboxContent").innerHTML = content;
    })
    .catch(err => {
      console.error("Failed to load message", err);
      alert("Error loading message.");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generateBtn").addEventListener("click", generateEmail);
  document.getElementById("copyBtn").addEventListener("click", copyEmail);
});
