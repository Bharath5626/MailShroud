// Available domains
const domains = [
    "@1secmail.com",
    "@1secmail.org",
    "@1secmail.net",
    "@wwjmp.com",
    "@esiix.com",
    "@dcctb.com"
];

// GitHub Pages compatible proxy solutions
const PROXIES = [
    // No proxy (direct connection - may fail due to CORS)
    "",
    // GitHub-friendly proxies
    "https://api.allorigins.win/raw?url=",
    "https://thingproxy.freeboard.io/fetch/",
    "https://yacdn.org/proxy/"
];

// App state
let currentEmail = "";
let refreshInterval;
let lastRefreshTime = null;

// DOM elements
const emailInput = document.getElementById("tempEmail");
const copyBtn = document.getElementById("copyBtn");
const newBtn = document.getElementById("newBtn");
const inboxContent = document.getElementById("inboxContent");
const refreshStatus = document.getElementById("refreshStatus");
const themeToggle = document.querySelector(".theme-toggle");

// Initialize the app
function init() {
    generateNewEmail();
    setupEventListeners();
    checkDarkModePreference();
}

// GitHub Pages compatible fetch function
async function proxyFetch(url) {
    let lastError = null;
    
    for (const proxy of PROXIES) {
        try {
            const proxyUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
            const response = await fetch(proxyUrl, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                return response;
            }
            throw new Error(`Proxy responded with status ${response.status}`);
        } catch (error) {
            lastError = error;
            console.warn(`Proxy ${proxy} failed, trying next...`, error);
            continue;
        }
    }
    
    // If all proxies fail, try a direct connection with no-cors mode
    try {
        const response = await fetch(url, { mode: 'no-cors' });
        if (response.ok || response.type === 'opaque') {
            return response;
        }
    } catch (finalError) {
        throw lastError || finalError;
    }
    
    throw lastError || new Error("All connection attempts failed");
}

// [Rest of your existing functions remain the same...]
// generateNewEmail, checkInbox, renderEmailList, viewEmail, etc.

// Generate a new random email
function generateNewEmail() {
    const randomString = Math.random().toString(36).substring(2, 10);
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    currentEmail = randomString + randomDomain;
    emailInput.value = currentEmail;
    
    // Show loading state
    inboxContent.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Waiting for emails at <strong>${currentEmail}</strong></p>
        </div>
    `;
    
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Start checking for new emails every 3 seconds
    refreshInterval = setInterval(checkInbox, 3000);
    
    // Initial check
    checkInbox();
}

// Check the inbox for new emails
async function checkInbox() {
    if (!currentEmail) return;
    
    const [mailbox, domain] = currentEmail.split("@");
    const apiUrl = `https://www.1secmail.com/api/v1/?action=getMessages&login=${mailbox}&domain=${domain}`;
    
    try {
        const response = await proxyFetch(apiUrl);
        const emails = await response.json();
        lastRefreshTime = new Date();
        updateRefreshStatus();
        
        if (emails.length === 0) {
            inboxContent.innerHTML = `
                <div class="empty-state">
                    <p>No emails yet for <strong>${currentEmail}</strong></p>
                </div>
            `;
            return;
        }
        
        renderEmailList(emails);
    } catch (error) {
        console.error("Error checking inbox:", error);
        inboxContent.innerHTML = `
            <div class="empty-state">
                <p style="color: #ef4444;">Error loading emails. Trying again...</p>
                ${error.message.includes('CORS') ? '<p>Try enabling CORS in your browser or use a different network</p>' : ''}
            </div>
        `;
    }
}

// Render the list of emails
function renderEmailList(emails) {
    let html = `<ul class="email-list">`;
    
    emails.forEach(email => {
        const isUnread = !email.read;
        const from = email.from || "Unknown sender";
        const subject = email.subject || "(No subject)";
        const date = formatEmailDate(email.date);
        
        html += `
            <li class="email-item ${isUnread ? 'unread' : ''}" data-id="${email.id}">
                <div class="email-preview">
                    <span class="email-from" title="${from}">${from}</span>
                    <span class="email-subject" title="${subject}">${subject}</span>
                    <span class="email-date">${date}</span>
                </div>
            </li>
        `;
    });
    
    html += `</ul>`;
    inboxContent.innerHTML = html;
    
    // Add click event listeners to each email item
    document.querySelectorAll(".email-item").forEach(item => {
        item.addEventListener("click", () => viewEmail(item.dataset.id));
    });
}

// View a specific email
async function viewEmail(emailId) {
    const [mailbox, domain] = currentEmail.split("@");
    const apiUrl = `https://www.1secmail.com/api/v1/?action=readMessage&login=${mailbox}&domain=${domain}&id=${emailId}`;
    
    try {
        const response = await proxyFetch(apiUrl);
        const email = await response.json();
        renderEmailView(email);
    } catch (error) {
        console.error("Error viewing email:", error);
        inboxContent.innerHTML = `
            <div class="empty-state">
                <p style="color: #ef4444;">Error loading email. <button onclick="checkInbox()">Back to inbox</button></p>
            </div>
        `;
    }
}

// Render the full email view
function renderEmailView(email) {
    const from = email.from || "Unknown sender";
    const subject = email.subject || "(No subject)";
    const date = new Date(email.date).toLocaleString();
    const body = email.textBody || email.htmlBody || "<p>No content</p>";
    
    let attachmentsHtml = "";
    if (email.attachments && email.attachments.length > 0) {
        attachmentsHtml = `
            <div class="attachments">
                <h4>Attachments (${email.attachments.length})</h4>
                ${email.attachments.map(attach => `
                    <span class="attachment">
                        <i class="fas fa-paperclip"></i> ${attach.filename} (${formatFileSize(attach.size)})
                    </span>
                `).join("")}
            </div>
        `;
    }
    
    inboxContent.innerHTML = `
        <button class="btn btn-secondary" onclick="checkInbox()">
            <i class="fas fa-arrow-left"></i> Back to inbox
        </button>
        <div class="email-view">
            <h3>${subject}</h3>
            <p><strong>From:</strong> ${from}</p>
            <p><strong>Date:</strong> ${date}</p>
            ${attachmentsHtml}
            <div class="email-body">${body}</div>
        </div>
    `;
}

// Format email date as "X time ago"
function formatEmailDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Format file size in KB/MB
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

// Update the refresh status indicator
function updateRefreshStatus() {
    if (!lastRefreshTime) return;
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastRefreshTime) / 1000);
    
    refreshStatus.textContent = `Last refreshed ${diffInSeconds}s ago`;
    refreshStatus.style.color = diffInSeconds > 5 ? "#ef4444" : "#6b7280";
}

// Copy email to clipboard
async function copyEmailToClipboard() {
    try {
        await navigator.clipboard.writeText(currentEmail);
        
        // Update button to show success
        copyBtn.innerHTML = `<i class="fas fa-check"></i> Copied!`;
        copyBtn.style.backgroundColor = "#10b981";
        
        // Reset button after 2 seconds
        setTimeout(() => {
            copyBtn.innerHTML = `<i class="fas fa-copy"></i> Copy`;
            copyBtn.style.backgroundColor = "";
        }, 2000);
    } catch (error) {
        console.error("Failed to copy:", error);
        copyBtn.innerHTML = `<i class="fas fa-times"></i> Failed`;
        copyBtn.style.backgroundColor = "#ef4444";
        
        setTimeout(() => {
            copyBtn.innerHTML = `<i class="fas fa-copy"></i> Copy`;
            copyBtn.style.backgroundColor = "";
        }, 2000);
    }
}

// Toggle dark/light mode
function toggleDarkMode() {
    document.body.classList.toggle("dark");
    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
    
    // Save preference to localStorage
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("darkMode", isDark);
}

// Check for saved dark mode preference
function checkDarkModePreference() {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
        document.body.classList.add("dark");
        const icon = themeToggle.querySelector("i");
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
    }
}

// Set up event listeners
function setupEventListeners() {
    copyBtn.addEventListener("click", copyEmailToClipboard);
    newBtn.addEventListener("click", generateNewEmail);
    themeToggle.addEventListener("click", toggleDarkMode);
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);