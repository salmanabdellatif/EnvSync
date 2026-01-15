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

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const token = url.searchParams.get("token");
      const stateParam = url.searchParams.get("state");

      if (!token || !stateParam) {
        cleanup();
        res.writeHead(400);
        res.end("Missing parameters");
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
            Buffer.from(expectedSecret)
          );
        }
      } catch (e) {
        secretsMatch = false;
      }

      if (!secretsMatch) {
        cleanup();
        res.writeHead(400);
        res.end(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
              <h1 style="color: #e74c3c;">Authentication Error</h1>
              <p>The login session expired or was invalid.</p>
              <p style="color: #666;">Please close this tab and try again from your terminal.</p>
            </body>
          </html>`);
        reject(new Error("State mismatch - possible CSRF attack"));
        return;
      }

      cleanup();

      // Token received - verification happens in login.ts
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>Authentication Received</h1>
            <p>Verifying your credentials...</p>
            <p style="color: #666;">Please check your terminal for the login result.</p>
            <p style="color: #999; font-size: 14px;">You can close this tab.</p>
          </body>
        </html>
      `);

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
  return `http://localhost:3001/login/cli?state=${encodedState}`;
}
