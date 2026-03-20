import { authApiClient } from "../axios/auth-api-client";

export async function requestToken() {
    const formData = new URLSearchParams();
    formData.append("client_id", import.meta.env.VITE_CLIENT_ID);
    formData.append("client_secret", import.meta.env.VITE_CLIENT_SECRET);
    formData.append("grant_type", "client_credentials");

    const response = await authApiClient.post("/oauth2/token", formData);
    return response.data;
}