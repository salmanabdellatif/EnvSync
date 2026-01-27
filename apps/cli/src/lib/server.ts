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

      // Return JSON success response
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));

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
