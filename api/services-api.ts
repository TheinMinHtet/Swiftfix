import { coreApiClient } from "../axios/core-api-client";

type ServiceApiItem = {
    id?: string;
    name?: string;
    serviceName?: string;
    baseAmount?: number;
    priceFrom?: number;
    priceTo?: number;
    rating?: number;
    reviews?: number;
    description?: string;
    isPopular?: number;
};

function extractServices(payload: any): ServiceApiItem[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.result?.result?.services)) return payload.result.result.services;
    if (Array.isArray(payload?.result?.result)) return payload.result.result;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.result?.services)) return payload.result.services;
    if (Array.isArray(payload?.services)) return payload.services;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result?.data)) return payload.result.data;
    return [];
}

export const getServices = async (name?: string) => {
    try {
        const response = await coreApiClient.get("/services_output_api", {
            params: name ? { name } : undefined,
        });
        return extractServices(response.data);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 400) {
            const response = await coreApiClient.post(
                "/services_output_api",
                { input: name ? { name } : {} }
            );
            return extractServices(response.data);
        }
        if (status === 404 || status === 405) {
            const response = await coreApiClient.post(
                "/services_output_api",
                name ? { name } : undefined
            );
            return extractServices(response.data);
        }
        console.error("Services API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};
