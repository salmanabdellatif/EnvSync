import http from "node:http";
import { URL } from "node:url";
import crypto from "node:crypto";

const PORT = 54321;

interface AuthResult {
  token: string;
  state: string;
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function startAuthServer(expectedSecret: string): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    let timeoutHandle: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timeoutHandle);
      if (server.listening) {
        server.close();
      }
    };

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "", `http://localhost:${PORT}`);

      // Enable CORS for frontend fetch() requests
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // Handle preflight
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (url.pathname !== "/callback") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Not found" }));
        return;
      }

      const token = url.searchParams.get("token");
      const stateParam = url.searchParams.get("state");

      if (!token || !stateParam) {
        cleanup();
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: false, error: "Missing parameters" }),
        );
        reject(new Error("Missing parameters"));
        return;
      }

      let secretsMatch = false;
      try {
        const decodedBuffer = Buffer.from(stateParam, "base64");
        const decodedJson = JSON.parse(decodedBuffer.toString());
        const receivedSecret = decodedJson.secret || "";

        // Timing-safe comparison to prevent timing attacks
        if (receivedSecret.length === expectedSecret.length) {
          secretsMatch = crypto.timingSafeEqual(
            Buffer.from(receivedSecret),
            Buffer.from(expectedSecret),
          );
        }
      } catch (e) {
        secretsMatch = false;
      }

      if (!secretsMatch) {
        cleanup();
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Invalid session" }));
        reject(new Error("State mismatch - possible CSRF attack"));
        return;
      }

      cleanup();

      // Return HTML success page (browser navigates here directly)
      const successHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EnvSync CLI - Authenticated</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #060608;
      color: #fafafa;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { text-align: center; padding: 2rem; }
    .icon {
      width: 64px; height: 64px;
      margin: 0 auto 1.5rem;
      background: rgba(34, 197, 94, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg { width: 32px; height: 32px; color: #22c55e; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
    p { color: #a1a1aa; margin-bottom: 1rem; }
    .close-hint { font-size: 0.875rem; color: #71717a; }
    .btn {
      margin-top: 1rem; padding: 0.5rem 1.5rem;
      background: #fafafa; color: #060608;
      border: none; border-radius: 6px;
      cursor: pointer; font-weight: 500;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1>CLI Authenticated!</h1>
    <p>You can close this tab and return to your terminal.</p>
    <p class="close-hint">This window will close automatically...</p>
    <button class="btn" onclick="window.close()">Close Window</button>
  </div>
  <script>setTimeout(() => window.close(), 3000);</script>
</body>
</html>`;

      res.writeHead(200, {
        "Content-Type": "text/html",
        Connection: "close",
      });
      res.end(successHtml);

      resolve({ token, state: stateParam });
    });

    server.listen(PORT);

    server.on("error", (err) => {
      clearTimeout(timeoutHandle);
      reject(err);
    });

    timeoutHandle = setTimeout(() => {
      cleanup();
      reject(new Error("Login timed out. Please try again."));
    }, 120000);
  });
}

export function buildLoginUrl(secret: string): string {
  const statePayload = JSON.stringify({ port: PORT, secret });
  const encodedState = Buffer.from(statePayload).toString("base64");
  // Use regular login page so users can use OAuth or email/password
  return `https://envsync.tech/login?cli_state=${encodedState}`;
}
