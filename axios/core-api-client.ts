import axios from "axios";
// import { Envs } from "../../config/envs";
import { requestToken } from "../api/auth-api";
import { useAuthStore } from "../store/auth-store";

export const coreApiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

coreApiClient.interceptors.request.use((config) => {
    const accessToken = useAuthStore.getState().accessToken;
    config.headers["Content-Type"] = "application/json";
    if (accessToken) {
        config.headers["access-token"] = accessToken; // <-- Use "access-token" header
        if ("Authorization" in config.headers) {
            delete config.headers.Authorization;
        }
    }
    return config;
});

coreApiClient.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response &&
            !originalRequest?._retry &&
            (error.response.status === 401 || isUserDoesNotExistError(error))
        ) {
            originalRequest._retry = true;    
            try {
                const data = await requestToken();
                useAuthStore.getState().setAccessToken(data.access_token);
                originalRequest.headers["access-token"] = data.access_token; // <-- Use "access-token" header
                if ("Authorization" in originalRequest.headers) {
                    delete originalRequest.headers.Authorization;
                }
                return coreApiClient(originalRequest);
            } catch (tokenError) {
                return Promise.reject(tokenError);
            }
        }
        return Promise.reject(error);
    }   
);

function isUserDoesNotExistError(error: any): boolean {
    return error.response.status === 400 && error.response.data.resCode === "405230625";
}
