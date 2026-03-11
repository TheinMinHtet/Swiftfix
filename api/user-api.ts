import { coreApiClient } from "../axios/core-api-client";

export type UserApiItem = {
    Mini_Shin__userId__CST?: string;
    Mini_Shin__name__CST?: string;
    userId?: string;
    name?: string;
    id?: string;
};

function extractUsers(payload: any): UserApiItem[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.result?.result?.users)) return payload.result.result.users;
    if (Array.isArray(payload?.result?.users)) return payload.result.users;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.result?.result)) return payload.result.result;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result?.data)) return payload.result.data;
    return [];
}

export const getUsers = async (userId?: string) => {
    try {
        const response = await coreApiClient.get("/user_info_output_api", {
            params: userId ? { userId } : undefined,
        });
        return extractUsers(response.data);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 400) {
            const response = await coreApiClient.post(
                "/user_info_output_api",
                { input: userId ? { userId } : {} }
            );
            return extractUsers(response.data);
        }
        if (status === 404 || status === 405) {
            const response = await coreApiClient.post(
                "/user_info_output_api",
                userId ? { userId } : undefined
            );
            return extractUsers(response.data);
        }
        console.error("User info API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};
