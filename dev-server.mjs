import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const port = Number.parseInt(process.env.PORT || "4173", 10);
const basePath = "/lecture-atlas";
const root = process.cwd();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

function safeFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath).replace(/^\/+/, "");
  const filePath = resolve(root, normalize(cleanPath));
  return filePath.startsWith(root) ? filePath : null;
}

function serveFile(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/" || url.pathname === "") {
    res.writeHead(302, { location: `${basePath}/` });
    res.end();
    return;
  }

  if (!url.pathname.startsWith(`${basePath}/`) && url.pathname !== basePath) {
    send(res, 404, "Not found");
    return;
  }

  const pathInsideApp = url.pathname === basePath
    ? "/"
    : url.pathname.slice(basePath.length);
  const requestPath = pathInsideApp.endsWith("/")
    ? `${pathInsideApp}index.html`
    : pathInsideApp;
  const filePath = [requestPath, `${requestPath}/index.html`]
    .map((candidate) => safeFilePath(candidate))
    .find((candidate) => candidate && existsSync(candidate) && statSync(candidate).isFile());

  if (!filePath) {
    send(res, 404, "Not found");
    return;
  }

  const contentType = mimeTypes[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "content-type": contentType });
  createReadStream(filePath).pipe(res);
}

createServer(serveFile).listen(port, () => {
  console.log(`Lecture Atlas preview: http://127.0.0.1:${port}${basePath}/`);
});
