// /api/fetch.js
export default async function handler(req, res) {
  try {
    const { file } = req.query;
    if (!file) {
      return res.status(400).send("Missing file parameter");
    }

    // Remote Python file server
    const REMOTE_BASE = "http://129.213.89.30:3300";

    // Secure header from Vercel environment
    const RAW_ACCESS_TOKEN = process.env.RAW_ACCESS_TOKEN;

    const targetUrl = `${REMOTE_BASE}/${file}`;

    const response = await fetch(targetUrl, {
      headers: {
        "X-RAW-ACCESS": RAW_ACCESS_TOKEN,
      },
    });

    if (!response.ok) {
      return res.status(response.status).send("Upstream fetch failed");
    }

    // Detect file type and set correct headers
    let contentType = "text/plain";
    if (file.endsWith(".js")) {
      contentType = "application/javascript; charset=utf-8";
    } else if (file.endsWith(".css")) {
      contentType = "text/css; charset=utf-8";
    } else if (file.endsWith(".html")) {
      contentType = "text/html; charset=utf-8";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1hr

    const body = await response.text();
    res.send(body);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Internal proxy error");
  }
}
