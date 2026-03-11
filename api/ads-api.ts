import { coreApiClient } from "../axios/core-api-client";

export type AdvertisementApiItem = {
    id?: number | string;
    title?: string;
    subtitle?: string;
    image?: string;
    bgColor?: string;
    isActive?: boolean | number;
};

function extractAdvertisements(payload: any): AdvertisementApiItem[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.result?.result?.ads)) return payload.result.result.ads;
    if (Array.isArray(payload?.result?.result?.advertisements)) return payload.result.result.advertisements;
    if (Array.isArray(payload?.result?.result)) return payload.result.result;
    if (Array.isArray(payload?.result?.ads)) return payload.result.ads;
    if (Array.isArray(payload?.result?.advertisements)) return payload.result.advertisements;
    if (Array.isArray(payload?.advertisements)) return payload.advertisements;
    if (Array.isArray(payload?.ads)) return payload.ads;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result?.data)) return payload.result.data;
    return [];
}

export const getAdvertisements = async () => {
    try {
        const response = await coreApiClient.get("/ads_output_api");
        return extractAdvertisements(response.data);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 400) {
            const response = await coreApiClient.post("/ads_output_api", { input: {} });
            return extractAdvertisements(response.data);
        }
        if (status === 404 || status === 405) {
            const response = await coreApiClient.post("/ads_output_api");
            return extractAdvertisements(response.data);
        }
        console.error("Advertisements API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};
