import { coreApiClient } from "../axios/core-api-client";

export type ReviewApiItem = {
    id?: number | string;
    serviceId?: string | number;
    name?: string;
    rating?: number;
    comment?: string;
    date?: string;
    createdDate?: string;
    createdBy?: { name?: string };
    Mini_Shin__serviceId__CST?: string | number;
    Mini_Shin__rating__CST?: number;
    Mini_Shin__comment__CST?: string;
    Mini_Shin__date__CST?: string;
    Mini_Shin__name__CST?: string;
    Mini_Shin__reviewerName__CST?: string;
    Mini_Shin__id__CST?: number;
};

function extractReviews(payload: any): ReviewApiItem[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.result?.result?.reviews)) return payload.result.result.reviews;
    if (Array.isArray(payload?.result?.reviews)) return payload.result.reviews;
    if (Array.isArray(payload?.reviews)) return payload.reviews;
    if (Array.isArray(payload?.result?.result)) return payload.result.result;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result?.data)) return payload.result.data;
    return [];
}

export const getReviews = async (serviceId?: string) => {
    try {
        const response = await coreApiClient.get("/review_output_api", {
            params: serviceId ? { serviceId } : undefined,
        });
        return extractReviews(response.data);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 400) {
            const response = await coreApiClient.post(
                "/review_output_api",
                { input: serviceId ? { serviceId } : {} }
            );
            return extractReviews(response.data);
        }
        if (status === 404 || status === 405) {
            const response = await coreApiClient.post(
                "/review_output_api",
                serviceId ? { serviceId } : undefined
            );
            return extractReviews(response.data);
        }
        console.error("Reviews API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};

export type ReviewInput = {
    id: number;
    orderId: string;
    serviceId: string;
    userId: string;
    name: string;
    rating: number;
};

export const createReview = async (input: ReviewInput) => {
    try {
        const payload = { input, ...input };
        const response = await coreApiClient.post("/review_input_api", payload);
        return response.data;
    } catch (error: any) {
        console.error("Review create API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};
