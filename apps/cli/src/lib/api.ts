import axios from "axios";
import { configManager } from "./config.js";
const API_URL = "http://localhost:3000/api/v1";

function getAuthHeaders() {
  const token = configManager.getToken();
  return { Authorization: `Bearer ${token}` };
}

export async function verifyToken(token: string) {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
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

export async function getProjects() {
  const response = await axios.get(`${API_URL}/projects`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}
