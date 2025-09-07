// api/fetch.js
export default async function handler(req, res) {
  const { file } = req.query;
  if (!file) return res.status(400).send("Missing file");

  const REMOTE_BASE = "http://129.213.89.30:3300"; // python server
  const targetUrl = `${REMOTE_BASE}/${file}`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).send("Upstream error");
    }

    res.setHeader("Content-Type", response.headers.get("content-type") || "text/plain");

    const body = await response.text();
    res.send(body);
  } catch (err) {
    res.status(500).send("Internal proxy error: " + err.message);
  }
}
