/**
 * Render API Keep-Alive Ping Script
 *
 * Keeps Render free tier backend instances awake by sending a lightweight health check request.
 * Render free web services go to sleep after 15 minutes of inactivity.
 *
 * Usage:
 *   node scripts/ping-api.js
 *   or RENDER_API_URL=https://your-api.onrender.com/api/health node scripts/ping-api.js
 */

const https = require("https");
const http = require("http");

const targetUrl = process.env.RENDER_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://fortifykitchen-api.onrender.com/api/health";
const pingIntervalMinutes = parseInt(process.env.PING_INTERVAL_MINUTES || "10", 10);

function ping() {
  const url = new URL(targetUrl.endsWith("/health") ? targetUrl : `${targetUrl.replace(/\/$/, "")}/api/health`);
  const client = url.protocol === "https:" ? https : http;

  console.log(`[${new Date().toISOString()}] Pinging Render API at ${url.href}...`);

  const req = client.get(url.href, { timeout: 15000 }, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log(`[${new Date().toISOString()}] ✅ API is awake! Response: ${data.trim()}`);
      } else {
        console.warn(`[${new Date().toISOString()}] ⚠️ API returned status ${res.statusCode}`);
      }
    });
  });

  req.on("error", (err) => {
    console.error(`[${new Date().toISOString()}] ❌ Ping failed: ${err.message}`);
  });

  req.on("timeout", () => {
    req.destroy();
    console.error(`[${new Date().toISOString()}] ⏱️ Request timed out after 15s (server may be waking up)`);
  });
}

// Initial ping
ping();

// If run continuously (e.g. background daemon)
if (process.argv.includes("--loop")) {
  console.log(`Loop mode enabled: Pinging every ${pingIntervalMinutes} minutes...`);
  setInterval(ping, pingIntervalMinutes * 60 * 1000);
}
