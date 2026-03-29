import { coreApiClient } from "../axios/core-api-client";

const sanitizeServiceName = (value: string) => {
  const cleaned = (value || "")
    .replace(/[^A-Za-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Service";
};

export const submitPayment = async (
  orderId: string,
  serviceName: string,
  amount: number,
) => {
  const safeOrderId = (orderId || "").toString().trim();
  const safeServiceName = sanitizeServiceName(
    (serviceName || "").toString().trim(),
  );
  const safeAmount = String(Number.isFinite(amount) ? amount : 0);

  const payload = {
    order_ref: safeOrderId,
    service_name: safeServiceName,
    amount: safeAmount,
  };

  console.log("Submitting payment with payload:", payload);

  const response = await coreApiClient.post("/pay", payload);
  console.log("Payment API response:", response.data);
  return response.data;
};
