// /api/fetch.js

const REMOTE_BASE = "http://129.213.89.30:3300"; // Your Python server
const TOKEN = process.env.RAW_ACCESS_TOKEN;     // Vercel secret env

export default async function handler(req, res) {
  try {
    const { file } = req.query;
    console.log("Requested file:", file);
    console.log("Allowed files:", ["index.html", "script.js", "style.css"]);
    console.log("Token present:", !!TOKEN);

    // Whitelist
    const allowed = ["index.html", "script.js", "style.css"];
    if (!file || !allowed.includes(file)) {
      console.log("File request not allowed:", file);
      return res.status(403).send("Forbidden");
    }

    // Always forward with token
    console.log(`Fetching upstream: ${REMOTE_BASE}/${file}`);
    const upstream = await fetch(`${REMOTE_BASE}/${file}`, {
      headers: { "X-RAW-TOKEN": TOKEN }
    });

    console.log("Upstream response OK:", upstream.ok, "Status:", upstream.status);

    if (!upstream.ok) {
      console.log("Upstream fetch failed:", upstream.status);
   console.log("TOKEN value:", TOKEN); // REMOVE after debugging!
      return res.status(upstream.status).send("Failed to fetch asset");
    }

    // Set correct Content-Type
    if (file.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    } else if (file.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css; charset=utf-8");
    } else if (file.endsWith(".html")) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
    }

    const body = await upstream.text();
    console.log("Body length:", body.length);

    return res.status(200).send(body);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).send("Internal proxy error");
  }
}