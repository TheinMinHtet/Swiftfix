import { coreApiClient } from "../axios/core-api-client";

export type ProviderApiItem = {
    Mini_Shin__id__CST?: string;
    Mini_Shin__name__CST?: string;
    Mini_Shin__specialty__CST?: string;
    Mini_Shin__rating__CST?: number;
    Mini_Shin__completedJobs__CST?: number;
    Mini_Shin__avatar__CST?: string;
    Mini_Shin__phone__CST?: string;
    Mini_Shin__serviceId__CST?: string;
    id?: string;
};

function extractProviders(payload: any): ProviderApiItem[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.result?.result?.providers)) return payload.result.result.providers;
    if (Array.isArray(payload?.result?.providers)) return payload.result.providers;
    if (Array.isArray(payload?.providers)) return payload.providers;
    if (Array.isArray(payload?.result?.result)) return payload.result.result;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result?.data)) return payload.result.data;
    return [];
}

export const getProviders = async () => {
    try {
        const response = await coreApiClient.get("/provider_output_api");
        return extractProviders(response.data);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 400) {
            const response = await coreApiClient.post("/provider_output_api", { input: {} });
            return extractProviders(response.data);
        }
        if (status === 404 || status === 405) {
            const response = await coreApiClient.post("/provider_output_api");
            return extractProviders(response.data);
        }
        console.error("Providers API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};
