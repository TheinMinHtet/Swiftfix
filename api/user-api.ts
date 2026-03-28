import { coreApiClient } from "../axios/core-api-client";

export type UserApiItem = {
    Mini_Shin__userId__CST?: string;
    Mini_Shin__fullName__CST?: string;
    Mini_Shin__msisdn__CST?: string;
    Mini_Shin__points__CST?: number;
    Mini_Shin__isActive__CST?: number;
    userId?: string;
    fullName?: string;
    msisdn?: string;
    points?: number;
    isActive?: number;
    id?: string;
};

export type NormalizedUser = {
    userId: string;
    fullName: string;
    msisdn: string;
    points: number;
    isActive: number;
    raw: UserApiItem | Record<string, any>;
};

export type SyncUserInput = {
    userId: string;
    fullName: string;
    msisdn: string;
    points?: number;
    isActive?: number;
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

export function normalizeUser(user?: UserApiItem | null): NormalizedUser {
    return {
        userId: user?.Mini_Shin__userId__CST || user?.userId || user?.id || "",
        fullName:
            user?.fullName ||
            user?.Mini_Shin__fullName__CST ||
            "",
        msisdn: user?.Mini_Shin__msisdn__CST || user?.msisdn || "",
        points: Number(user?.Mini_Shin__points__CST ?? user?.points ?? 0),
        isActive: Number(user?.Mini_Shin__isActive__CST ?? user?.isActive ?? 1),
        raw: user || {},
    };
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

export const createUser = async (input: SyncUserInput) => {
    const payload = {
        input: {
            userId: input.userId,
            fullname: input.fullName,
            msisdn: input.msisdn,
            points: input.points ?? 0,
            isActive: input.isActive ?? 1,
        },
        userId: input.userId,
        fullname: input.fullName,
        msisdn: input.msisdn,
        points: input.points ?? 0,
        isActive: input.isActive ?? 1,
    };

    try {
        const response = await coreApiClient.post("/user_info_input_api", payload);
        return response.data;
    } catch (error: any) {
        console.error("User create API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};

export const syncUserToBackend = async (input: SyncUserInput) => {
    const normalizedInput: SyncUserInput = {
        userId: input.userId,
        fullName: input.fullName,
        msisdn: input.msisdn,
        points: input.points ?? 0,
        isActive: input.isActive ?? 1,
    };

    const existingUsers = await getUsers(normalizedInput.userId).catch(() => []);
    const existingUser = existingUsers.find((item) => normalizeUser(item).userId === normalizedInput.userId);

    if (existingUser) {
        return {
            skipped: true,
            user: normalizeUser(existingUser),
        };
    }

    const created = await createUser(normalizedInput);
    return {
        skipped: false,
        result: created,
    };
};
