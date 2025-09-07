// api/fetch.js
// Vercel / Next-style serverless function
export default async function handler(req, res) {
  try {
    // --- Basic validation ---
    const allowedFiles = new Set([
      'index.html',
      'style.css',
      'script.js',
      // add any other files you want to expose, e.g. 'manifest.json'
    ]);

    const file = (req.query.file || '').toString();
    if (!file) {
      return res.status(400).json({ error: 'missing file parameter' });
    }

    // ensure we only use the basename (prevent path traversal)
    const basename = file.split('/').pop();
    if (!allowedFiles.has(basename)) {
      return res.status(403).json({ error: 'file not allowed' });
    }

    // --- Read upstream config from environment variables ---
    const RAW_SERVER = process.env.RAW_SERVER_URL;       // e.g. "http://129.213.89.30:3300"
    const RAW_TOKEN  = process.env.RAW_ACCESS_TOKEN;    // secret token (do NOT commit)
    if (!RAW_SERVER || !RAW_TOKEN) {
      return res.status(500).json({ error: 'raw server not configured on this environment' });
    }

    // Build upstream URL and call it server-side (with secret header)
    const upstreamUrl = `${RAW_SERVER.replace(/\/$/, '')}/${encodeURIComponent(basename)}`;
    const upstream = await fetch(upstreamUrl, {
      headers: { 'X-RAW-ACCESS': RAW_TOKEN }
    });

    // Forward upstream non-OK statuses
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => upstream.statusText || '');
      return res.status(upstream.status).send(text || `Upstream error: ${upstream.status}`);
    }

    // Read body as buffer (works for text or binary)
    const arrayBuf = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // Simple mime type mapping by extension
    const ext = basename.split('.').pop().toLowerCase();
    const mimeMap = {
      html: 'text/html; charset=utf-8',
      css:  'text/css; charset=utf-8',
      js:   'application/javascript; charset=utf-8',
      json: 'application/json; charset=utf-8',
      zip:  'application/zip',
      png:  'image/png',
      jpg:  'image/jpeg',
      jpeg: 'image/jpeg',
      svg:  'image/svg+xml'
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    // Set response headers (you can adjust cache-control)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=60'); // tweak as needed

    // Send the raw buffer
    res.status(200).end(buffer);
  } catch (err) {
    console.error('api/fetch error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
}
