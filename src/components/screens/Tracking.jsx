import { ArrowLeft, Phone, Check } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ImageWithFallback } from "../figma/ImageWithFallback.jsx";
import { useEffect, useMemo, useState } from "react";
import { getOrders } from "../../../api/orders-api";
import { getProviders } from "../../../api/providers-api";

const baseStatuses = [
  { id: 1, label: "Requested", description: "Booking received" },
  { id: 2, label: "Confirmation", description: "Waiting for confirmation" },
  { id: 3, label: "On the Way", description: "Provider heading to location" },
  { id: 4, label: "Completed", description: "Service completed" },
];

export function Tracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [provider, setProvider] = useState(null);
  const normalizeServiceId = (value) => {
    return (value || "").toString().trim().toLowerCase();
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setOrderError("");
        const orders = await getOrders();
        const matched = (orders || []).find((item) => {
          const recordId = item?.Mini_Shin__id__CST || item?.id || "";
          const orderNo = item?.Mini_Shin__orderId__CST || "";
          const target = orderId || "";
          return recordId === target || orderNo === target;
        });
        setOrder(matched || null);
      } catch (error) {
        console.error("Error fetching order:", error);
        setOrderError("Unable to load order details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const providers = await getProviders();
        const providerId =
          order?.Mini_Shin__providerId__CST ||
          order?.providerId ||
          "";
        const serviceId = normalizeServiceId(
          order?.Mini_Shin__serviceId__CST ||
          order?.serviceId ||
          ""
        );
        let matched = null;
        if (providerId) {
          matched = (providers || []).find((item) => {
            const id =
              item?.Mini_Shin__providerId__CST ||
              item?.Mini_Shin__id__CST ||
              item?.id ||
              "";
            return id === providerId;
          }) || null;
        }
        if (!matched && serviceId) {
          matched = (providers || []).find((item) => {
            const providerServiceId = normalizeServiceId(item?.Mini_Shin__serviceId__CST || "");
            return providerServiceId === serviceId;
          }) || null;
        }
        setProvider(matched);
      } catch (error) {
        console.error("Error fetching provider:", error);
      }
    };

    if (order) {
      fetchProvider();
    }
  }, [order]);

  const status = (order?.Mini_Shin__status__CST || order?.status || "pending").toLowerCase();
  const statusStep = (order?.Mini_Shin__statusStep__CST || order?.statusStep || "").toLowerCase();
  const currentStep = useMemo(() => {
    if (status === "completed") return 3;
    if (status === "confirmed") {
      if (statusStep === "on_the_way") return 2;
      if (statusStep === "assigned") return 1;
      return 1;
    }
    if (status === "rejected") return 0;
    return 0;
  }, [status, statusStep]);

  const orderStatuses = baseStatuses.map((item, index) => ({
    ...item,
    completed: index < currentStep,
  }));

  const showProvider = status === "confirmed" || status === "completed";
  const showEta = status === "confirmed" && currentStep >= 2;
  const formatMMK = (amount) =>
    `${(Number.isFinite(amount) ? amount : 0).toLocaleString()} MMK`;

  const etaText = useMemo(() => {
    const date = order?.Mini_Shin__date__CST || order?.date;
    const time = order?.Mini_Shin__time__CST || order?.time;
    if (!date || !time) return "ETA not available";
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    let hours = 0;
    let minutes = 0;
    if (timeMatch) {
      hours = Number(timeMatch[1]);
      minutes = Number(timeMatch[2]);
      const meridiem = timeMatch[3].toUpperCase();
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
    }
    const scheduled = new Date(date);
    if (Number.isNaN(scheduled.getTime())) return "ETA not available";
    scheduled.setHours(hours, minutes, 0, 0);
    const diffMs = scheduled.getTime() - Date.now();
    if (diffMs <= 0) return "Arriving now";
    const diffMinutes = Math.ceil(diffMs / 60000);
    if (diffMinutes < 60) return `${diffMinutes} mins`;
    const diffHours = Math.floor(diffMinutes / 60);
    const remMinutes = diffMinutes % 60;
    if (diffHours < 24) {
      return remMinutes > 0 ? `${diffHours}h ${remMinutes}m` : `${diffHours}h`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }, [order]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link to="/" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800">Track Order</h1>
          <p className="text-xs text-gray-500">
            {order?.Mini_Shin__orderId__CST || orderId}
          </p>
        </div>
      </div>

      <div className="px-5 py-6">
        {isLoading && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-5 text-gray-600">
            Loading order...
          </div>
        )}
        {!isLoading && orderError && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-5 text-red-600">
            {orderError}
          </div>
        )}

        {/* Status Timeline */}
        {!isLoading && !orderError && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <h2 className="font-semibold text-gray-800 mb-5">Service Status</h2>
          <div className="space-y-5">
            {orderStatuses.map((status, index) => (
              <div key={status.id} className="flex gap-4">
                {/* Timeline Icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      status.completed
                        ? "bg-blue-600"
                        : index === currentStep
                        ? "bg-blue-100 border-2 border-blue-600"
                        : "bg-gray-100"
                    }`}
                  >
                    {status.completed ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === currentStep ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                  {index < orderStatuses.length - 1 && (
                    <div
                      className={`w-0.5 h-12 ${
                        status.completed ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>

                {/* Status Info */}
                <div className="flex-1 pb-4">
                  <h3
                    className={`font-semibold ${
                      status.completed || index === currentStep
                        ? "text-gray-800"
                        : "text-gray-400"
                    }`}
                  >
                    {status.label}
                  </h3>
                  <p
                    className={`text-sm ${
                      status.completed || index === currentStep
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {status.description}
                  </p>
                  {index === currentStep && status !== "rejected" && (
                    <div className="mt-2 inline-block bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                      {status === "pending" ? "Waiting for confirmation" : "In Progress"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Provider Profile */}
        {showProvider && !isLoading && !orderError && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">Service Provider</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <ImageWithFallback
                src={provider?.Mini_Shin__avatar__CST || "https://images.unsplash.com/photo-1605504836193-e77d3d9ede8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"}
                alt="Provider"
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">
                {provider?.Mini_Shin__name__CST || "Provider"}
              </h3>
              <p className="text-sm text-gray-500">
                {provider?.Mini_Shin__specialty__CST || "Service Provider"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Experience: {provider?.Mini_Shin__experience__CST ?? "N/A"}
              </p>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <button
  onClick={() => window.location.href = `tel:${provider?.Mini_Shin__phone__CST || "+959123456789"}`}
  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors"
>
  <Phone className="w-5 h-5" />
  <span className="font-medium">Call</span>
</button>
          </div>
        </div>
        )}

        {/* Service Details */}
        {!isLoading && !orderError && order && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">Service Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Service Type</span>
              <span className="text-sm font-medium text-gray-800">
                {order.Mini_Shin__serviceName__CST || order.service || "Service"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Date & Time</span>
              <span className="text-sm font-medium text-gray-800">
                {(order.Mini_Shin__dateLabel__CST || order.dateLabel || "")}
                {order.Mini_Shin__timeLabel__CST || order.timeLabel ? ", " : ""}
                {(order.Mini_Shin__timeLabel__CST || order.timeLabel || "")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Address</span>
              <span className="text-sm font-medium text-gray-800 text-right">
                {order.Mini_Shin__address__CST || order.address || "-"}
              </span>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex justify-between">
              <span className="font-semibold text-gray-800">Total Amount</span>
              <span className="font-semibold text-blue-600">
                {formatMMK(order.Mini_Shin__amountMMK__CST ?? order.amountMMK)}
              </span>
            </div>
          </div>
        </div>
        )}

        {/* Estimated Arrival */}
        {showEta && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 shadow-md">
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-2">Estimated Arrival</p>
              <p className="text-white text-3xl font-bold mb-1">{etaText}</p>
              <p className="text-blue-100 text-sm">Provider is on the way to your location</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
