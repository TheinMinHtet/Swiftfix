import { coreApiClient } from "../axios/core-api-client";

export const getUserInfo = async () => {
    try {
        const response = await coreApiClient.get("/user");
        return response.data;
    } catch (error) {
        console.error("Error fetching user info:", error);
        throw error;
    }
};