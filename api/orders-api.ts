import { coreApiClient } from "../axios/core-api-client";

export type OrderApiItem = {
    Mini_Shin__id__CST?: string;
    Mini_Shin__orderId__CST?: string;
    Mini_Shin__serviceId__CST?: string;
    Mini_Shin__serviceName__CST?: string;
    Mini_Shin__dateLabel__CST?: string;
    Mini_Shin__timeLabel__CST?: string;
    Mini_Shin__status__CST?: string;
    Mini_Shin__statusStep__CST?: string;
    Mini_Shin__expiresAt__CST?: string;
    Mini_Shin__amountMMK__CST?: number;
    id?: string;
    orderId?: string;
    serviceId?: string;
    service?: string;
    dateLabel?: string;
    timeLabel?: string;
    status?: string;
    statusStep?: string;
    expiresAt?: string;
    amountMMK?: number;
};

const normalizeOrderIdentifier = (value: string | undefined) =>
    (value || "").toString().trim();

function extractOrders(payload: any): OrderApiItem[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.result?.result?.orders)) return payload.result.result.orders;
    if (Array.isArray(payload?.result?.orders)) return payload.result.orders;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.result?.result)) return payload.result.result;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result?.data)) return payload.result.data;
    return [];
}

export const getOrders = async () => {
    try {
        const response = await coreApiClient.get("/order_detail_output");
        return extractOrders(response.data);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 400) {
            const response = await coreApiClient.post("/order_detail_output", { input: {} });
            return extractOrders(response.data);
        }
        if (status === 404 || status === 405) {
            const response = await coreApiClient.post("/order_detail_output");
            return extractOrders(response.data);
        }
        console.error("Orders API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};

export type CreateOrderInput = {
    userId: string;
    providerId: string;
    serviceId: string;
    date: string;
    time: string;
    address: string;
    paymentMethod: string;
    redeemedPoints?: number;
    discountMMK?: number;
    phoneNumber: string;
    expiresAt?: string;
};

export type UpdateOrderStatusInput = {
    orderId: string;
    newStatus: string;
};

export const createOrder = async (input: CreateOrderInput) => {
    try {
        const payload = { input, ...input };
        const response = await coreApiClient.post("/order_input_api", payload);
        return response.data;
    } catch (error: any) {
        const status = error?.response?.status;
        console.error("Order create API error:", error?.response?.data || error?.message || error);
        throw error;
    }
};

export const updateOrderStatus = async (input: UpdateOrderStatusInput) => {
    const safeOrderId = normalizeOrderIdentifier(input.orderId);
    const safeNewStatus = (input.newStatus || "").toString().trim().toLowerCase();

    if (!safeOrderId || !safeNewStatus) {
        throw new Error("updateOrderStatus requires orderId and newStatus");
    }

    try {
        const payload = {
            input: {
                orderId: safeOrderId,
                newStatus: safeNewStatus,
            },
            orderId: safeOrderId,
            newStatus: safeNewStatus,
        };
        const response = await coreApiClient.post("/order_update_api", payload);
        return response.data;
    } catch (error: any) {
        console.error(
            "Order update API error:",
            error?.response?.data || error?.message || error,
        );
        throw error;
    }
};
