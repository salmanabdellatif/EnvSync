import axios from "axios";

export async function verifyToken(token: string) {
  try {
    const response = await axios.get(`http://localhost:3000/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      "Token validation failed. The token received was invalid or expired."
    );
  }
}
