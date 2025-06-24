const domains = [
  "@1secmail.com",
  "@dcctb.com",
  "@esiix.com",
  "@wwjmp.com"
];

let currentEmail = "";
let inboxInterval;

function generateEmail() {
  const username = Math.random().toString(36).substring(2, 10);
  const domain = domains[0];
  return `${username}@${domain}`;
}

function updateUI() {
  currentEmail = generateEmail();
  document.getElementById("tempEmail").value = currentEmail;

  document.getElementById("inboxContent").innerHTML = `
    <p><strong>Generated email:</strong> ${currentEmail}</p>
    <p><em>Inbox is active. Waiting for emails...</em></p>
    <p style="color: gray; font-size: 0.9em;">Emails will appear here if sent to the address.</p>
  `;

  clearInterval(inboxInterval);
  inboxInterval = setInterval(() => {
    if (currentEmail) fetchInbox();
  }, 5000);
}

function copyEmail() {
  const emailInput = document.getElementById("tempEmail");
  emailInput.select();
  navigator.clipboard.writeText(emailInput.value);
}

function fetchInbox() {
  const [login, domain] = currentEmail.split('@');
  fetch(`/inbox?login=${login}&domain=${domain}`)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        document.getElementById("inboxContent").innerHTML = "<p>No emails yet.</p>";
        return;
      }

      let html = "<ul>";
      data.forEach(msg => {
        html += `<li>
          <strong>${msg.from}</strong> - ${msg.subject}
          <button onclick="readEmail(${msg.id})">Read</button>
        </li>`;
      });
      html += "</ul>";
      document.getElementById("inboxContent").innerHTML = html;
    })
    .catch(err => console.error("Inbox fetch failed:", err));
}

function readEmail(id) {
  const [login, domain] = currentEmail.split('@');
  fetch(`/email?id=${id}&login=${login}&domain=${domain}`)
    .then(res => res.json())
    .then(data => {
      const body = data.htmlBody || data.textBody || "(No content)";
      document.getElementById("inboxContent").innerHTML = `
        <h4>${data.subject}</h4>
        <p><strong>From:</strong> ${data.from}</p>
        <hr>
        <div>${body}</div>
        <br><button onclick="fetchInbox()">← Back to Inbox</button>
      `;
    })
    .catch(err => console.error("Failed to fetch email:", err));
}

document.getElementById("generateBtn").addEventListener("click", updateUI);
document.getElementById("copyBtn").addEventListener("click", copyEmail);
