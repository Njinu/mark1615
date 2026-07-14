/**
 * Local dev server — static site + Netlify-style function handlers.
 * Avoids Netlify CLI Edge Functions / Deno download (common on corporate networks).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8888);

const FUNCTION_NAMES = [
    'checkout-initialize',
    'checkout-verify',
    'get-order',
    'get-invoice',
    'paystack-webhook',
];

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function loadEnv() {
    const envPath = path.join(ROOT, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}

function parseQuery(url) {
    const i = url.indexOf('?');
    if (i === -1) return {};
    const params = {};
    for (const part of url.slice(i + 1).split('&')) {
        const [k, v] = part.split('=').map(decodeURIComponent);
        if (k) params[k] = v ?? '';
    }
    return params;
}

function getFunctionName(pathname) {
    const netlifyPrefix = '/.netlify/functions/';
    const apiPrefix = '/api/';
    if (pathname.startsWith(netlifyPrefix)) {
        return pathname.slice(netlifyPrefix.length).split('/')[0];
    }
    if (pathname.startsWith(apiPrefix)) {
        return pathname.slice(apiPrefix.length).split('/')[0];
    }
    return null;
}

async function invokeFunction(name, req, body) {
    if (!FUNCTION_NAMES.includes(name)) {
        return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
    }

    const mod = await import(`../netlify/functions/${name}.mjs`);
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
        if (v) headers[k] = Array.isArray(v) ? v[0] : v;
    }

    const event = {
        httpMethod: req.method || 'GET',
        headers,
        queryStringParameters: parseQuery(req.url || ''),
        body: body || null,
        path: req.url,
    };

    return mod.handler(event);
}

function serveStatic(urlPath) {
    let filePath = path.join(ROOT, decodeURIComponent(urlPath));
    if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return null;
    }
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(ROOT)) return null;
    return {
        data: fs.readFileSync(resolved),
        type: MIME[path.extname(resolved).toLowerCase()] || 'application/octet-stream',
    };
}

function send(res, statusCode, headers, body) {
    res.writeHead(statusCode, headers);
    if (body !== undefined && body !== null && body !== '') {
        res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
    } else {
        res.end();
    }
}

loadEnv();

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url || '/', `http://localhost:${PORT}`);
        const fn = getFunctionName(url.pathname);

        if (fn) {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = chunks.length ? Buffer.concat(chunks).toString('utf8') : null;
            const result = await invokeFunction(fn, req, body);
            send(res, result.statusCode, result.headers || { 'Content-Type': 'application/json' }, result.body);
            return;
        }

        let staticPath = url.pathname === '/' ? '/index.html' : url.pathname;
        const file = serveStatic(staticPath);
        if (file) {
            send(res, 200, { 'Content-Type': file.type }, file.data);
            return;
        }

        send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found');
    } catch (err) {
        console.error(err);
        send(res, 500, { 'Content-Type': 'application/json' }, JSON.stringify({ error: err.message }));
    }
});

server.listen(PORT, () => {
    console.log(`Mark 1615 dev server → http://localhost:${PORT}`);
    console.log(`Shop → http://localhost:${PORT}/shop.html`);
    console.log('(No Netlify CLI / Deno required)');
});
