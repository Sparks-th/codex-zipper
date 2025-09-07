// /api/fetch.js

const REMOTE_BASE = "http://129.213.89.30:3300"; // Your Python server
const TOKEN = process.env.RAW_ACCESS_TOKEN;     // Vercel secret env

export default async function handler(req, res) {
  try {
    const { file } = req.query;

    // 1. If no file specified → serve index.html with injected assets
    if (!file) {
      const upstream = await fetch(`${REMOTE_BASE}/index.html`);
      let html = await upstream.text();

      // Inject proxied script + style
      html = html.replace(
        "</head>",
        `  <link rel="stylesheet" href="/api/fetch?file=style.css">
  <script src="/api/fetch?file=script.js" defer></script>
</head>`
      );

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    }

    // 2. Only allow script.css / style.js through proxy with token
    if (file === "script.js" || file === "style.css") {
      const upstream = await fetch(`${REMOTE_BASE}/${file}`, {
        headers: { "X-RAW-TOKEN": TOKEN }
      });

      if (!upstream.ok) {
        return res.status(upstream.status).send("Failed to fetch asset");
      }

      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "application/javascript; charset=utf-8"
          : "text/css; charset=utf-8"
      );

      const body = await upstream.text();
      return res.status(200).send(body);
    }

    // 3. Block everything else (prevent scraping other assets)
    return res.status(403).send("Forbidden");
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).send("Internal proxy error");
  }
}
