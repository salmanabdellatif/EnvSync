export default function isTokenValid(token: string): boolean {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    // Check expiry
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
