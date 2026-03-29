import { ArrowLeft, Phone, Check, Truck } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ImageWithFallback } from "../figma/ImageWithFallback.jsx";
import { useEffect, useMemo, useState } from "react";
import { getOrders } from "../../../api/orders-api";
import { getProviders } from "../../../api/providers-api";
import { useI18n } from "../../utils/i18n.js";
import { submitPaymentAsync } from "./auth/query.js";
import { StartPay } from "../../utils/native-apis.js";

const parseTimeParts = (value) => {
  const timeText = (value || "").toString().trim();
  if (!timeText) return null;

  const amPmMatch = timeText.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = Number(amPmMatch[2] || "0");
    const meridiem = amPmMatch[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return { hours, minutes };
  }

  const twentyFourMatch = timeText.match(/^(\d{1,2})(?::(\d{2}))$/);
  if (twentyFourMatch) {
    return {
      hours: Number(twentyFourMatch[1]),
      minutes: Number(twentyFourMatch[2] || "0"),
    };
  }

  return null;
};

const formatCountdown = (remainingMs) => {
  const totalSeconds = Math.max(Math.floor(remainingMs / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const normalizeIdentifier = (value) => {
  return (value || "").toString().trim();
};

export function Tracking() {
  const { t, localizeDigits } = useI18n();
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [provider, setProvider] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const bookingSummary = location?.state?.bookingSummary || null;
  const normalizeServiceId = (value) => {
    return (value || "").toString().trim().toLowerCase();
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setOrderError("");
        const orders = await getOrders();
        const target = normalizeIdentifier(orderId || bookingSummary?.orderId);
        const matched = (orders || []).find((item) => {
          const recordId = normalizeIdentifier(
            item?.Mini_Shin__id__CST || item?.id,
          );
          const orderNo = normalizeIdentifier(
            item?.Mini_Shin__orderId__CST || item?.orderId,
          );
          return recordId === target || orderNo === target;
        });
        setOrder(matched || null);
      } catch (error) {
        console.error("Error fetching order:", error);
        setOrderError(t("tracking.error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [bookingSummary?.orderId, orderId, t]);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const providers = await getProviders();
        const providerId =
          order?.Mini_Shin__providerId__CST || order?.providerId || "";
        const serviceId = normalizeServiceId(
          order?.Mini_Shin__serviceId__CST || order?.serviceId || "",
        );
        let matched = null;
        if (providerId) {
          matched =
            (providers || []).find((item) => {
              const id =
                item?.Mini_Shin__providerId__CST ||
                item?.Mini_Shin__id__CST ||
                item?.id ||
                "";
              return id === providerId;
            }) || null;
        }
        if (!matched && serviceId) {
          matched =
            (providers || []).find((item) => {
              const providerServiceId = normalizeServiceId(
                item?.Mini_Shin__serviceId__CST || "",
              );
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

  const status = (
    order?.Mini_Shin__status__CST ||
    order?.status ||
    "pending"
  ).toLowerCase();
  const normalizedStatus =
    status === "cancel" || status === "canceled" || status === "rejected"
      ? "cancelled"
      : status;
  const statusStep = (
    order?.Mini_Shin__statusStep__CST ||
    order?.statusStep ||
    ""
  ).toLowerCase();
  const resolvedRecordId = normalizeIdentifier(
    order?.Mini_Shin__id__CST || order?.id,
  );
  const resolvedOrderNumber = normalizeIdentifier(
    order?.Mini_Shin__orderId__CST || order?.orderId || bookingSummary?.orderId,
  );
  const displayedServiceName =
    order?.Mini_Shin__serviceName__CST ||
    order?.service ||
    bookingSummary?.serviceName ||
    "Service";
  const displayedDate =
    order?.Mini_Shin__dateLabel__CST ||
    order?.dateLabel ||
    order?.Mini_Shin__date__CST ||
    order?.date ||
    bookingSummary?.date ||
    "";
  const displayedTime =
    order?.Mini_Shin__timeLabel__CST ||
    order?.timeLabel ||
    order?.Mini_Shin__time__CST ||
    order?.time ||
    bookingSummary?.time ||
    "";
  const displayedAddress =
    order?.Mini_Shin__address__CST ||
    order?.address ||
    bookingSummary?.address ||
    "-";
  const displayedAmount =
    order?.Mini_Shin__amountMMK__CST ??
    order?.amountMMK ??
    bookingSummary?.amountMMK ??
    0;
  const displayedExpiresAt =
    order?.Mini_Shin__expiresAt__CST ||
    order?.expiresAt ||
    bookingSummary?.expiresAt ||
    "";
  const expiryTimestamp = displayedExpiresAt
    ? new Date(displayedExpiresAt).getTime()
    : Number.NaN;
  const remainingMs = Number.isNaN(expiryTimestamp)
    ? 0
    : Math.max(expiryTimestamp - nowMs, 0);
  const isExpiredPending =
    normalizedStatus === "pending" &&
    !Number.isNaN(expiryTimestamp) &&
    nowMs > expiryTimestamp;
  const effectiveStatus = isExpiredPending ? "cancelled" : normalizedStatus;
  const isCancelledStatus = effectiveStatus === "cancelled";
  const countdownText = formatCountdown(remainingMs);
  const baseStatuses = useMemo(
    () => [
      {
        id: 1,
        label: t("tracking.pending"),
        description: t("tracking.pendingDescription"),
      },
      {
        id: 2,
        label: t("tracking.onTheWay"),
        description: t("tracking.onTheWayDescription"),
      },
      {
        id: 3,
        label: t("tracking.completed"),
        description: t("tracking.completedDescription"),
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!displayedExpiresAt || normalizedStatus !== "pending") return;

    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [displayedExpiresAt, normalizedStatus]);

  const currentStep = useMemo(() => {
    if (effectiveStatus === "completed") return 2;
    if (effectiveStatus === "confirmed") {
      if (statusStep === "on_the_way") return 1;
      if (statusStep === "assigned") return 1;
      return 1;
    }
    if (isCancelledStatus) return 0;
    return 0;
  }, [effectiveStatus, statusStep, isCancelledStatus]);

  const orderStatuses = baseStatuses.map((item, index) => {
    const isCompletedStep =
      effectiveStatus === "completed"
        ? index <= currentStep
        : index < currentStep;
    const isCurrentStep =
      effectiveStatus === "completed" || isCancelledStatus
        ? false
        : index === currentStep;

    return {
      ...item,
      completed: isCompletedStep,
      current: isCurrentStep,
    };
  });

  const showProvider = effectiveStatus === "confirmed";
  const showEta = effectiveStatus === "confirmed" && currentStep >= 1;
  const isPaidStatus =
    effectiveStatus === "confirmed" || effectiveStatus === "completed";
  const providerPhone =
    provider?.Mini_Shin__phone__CST || provider?.phone || "";
  const formatMMK = (amount) =>
    localizeDigits(
      `${(Number.isFinite(amount) ? amount : 0).toLocaleString()} MMK`,
    );

  const etaText = useMemo(() => {
    const date =
      order?.Mini_Shin__date__CST ||
      order?.date ||
      order?.Mini_Shin__dateLabel__CST ||
      order?.dateLabel;
    const time =
      order?.Mini_Shin__time__CST ||
      order?.time ||
      order?.Mini_Shin__timeLabel__CST ||
      order?.timeLabel;
    if (!date) return t("tracking.etaUnavailable");

    const scheduled = new Date(date);
    if (Number.isNaN(scheduled.getTime())) return t("tracking.etaUnavailable");

    const parsedTime = parseTimeParts(time);
    if (parsedTime) {
      scheduled.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
    } else {
      scheduled.setHours(0, 0, 0, 0);
    }

    const diffMs = scheduled.getTime() - Date.now();
    if (diffMs <= 0) return t("tracking.arrivingNow");
    const diffMinutes = Math.ceil(diffMs / 60000);
    if (diffMinutes < 60) return t("tracking.mins", { value: diffMinutes });
    const diffHours = Math.floor(diffMinutes / 60);
    const remMinutes = diffMinutes % 60;
    if (diffHours < 24) {
      return remMinutes > 0
        ? t("tracking.hoursMins", { hours: diffHours, minutes: remMinutes })
        : t("tracking.hours", { hours: diffHours });
    }
    const diffDays = Math.floor(diffHours / 24);
    return t("tracking.days", { days: diffDays });
  }, [order, t]);

  const handlePayment = async () => {
    // ORD-TimeStamp-12345678
    const paymentOrderId = `ORD-${Date.now()}`;

    console.log("orderId:", paymentOrderId);
    console.log("displayedServiceName:", displayedServiceName);
    console.log("displayedAmount:", displayedAmount);

    if (!paymentOrderId || !displayedServiceName || !displayedAmount) {
      setPaymentError(t("common.somethingWentWrong"));
      return;
    }

    try {
      setIsPaying(true);
      setPaymentError("");

      const res = await submitPaymentAsync(
        paymentOrderId,
        displayedServiceName,
        displayedAmount,
      );
      console.log("Payment response:", res);

      if (res?.resCode !== "0") {
        throw new Error(res?.resMsg || "Payment initialization failed.");
      }

      const rawRequest = res?.result?.rawRequest;
      const startPayPayload = {
        prepayId: rawRequest?.prepay_id || "",
        orderInfo: rawRequest?.orderinfo || "",
        sign: rawRequest?.sign || "",
        signType: rawRequest?.signType || "",
        useMiniResultFlag: true,
      };

      if (
        !startPayPayload.prepayId ||
        !startPayPayload.orderInfo ||
        !startPayPayload.sign ||
        !startPayPayload.signType
      ) {
        throw new Error("Payment response is missing required KBZPay fields.");
      }

      StartPay(startPayPayload, () => {
        console.log("Payment flow completed callback");
      });
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to start payment. Please try again.",
      );
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-white px-5 py-4 shadow-sm transition-colors dark:bg-slate-900/95 dark:shadow-slate-950/30">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors dark:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-200" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
            {t("tracking.title")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {localizeDigits(resolvedOrderNumber || resolvedRecordId || orderId)}
          </p>
        </div>
      </div>

      <div className="px-5 py-6">
        {isLoading && (
          <div className="mb-5 rounded-2xl bg-white p-5 text-gray-600 shadow-sm transition-colors dark:bg-slate-800 dark:text-slate-300 dark:shadow-slate-950/30">
            {t("tracking.loading")}
          </div>
        )}
        {!isLoading && orderError && (
          <div className="mb-5 rounded-2xl bg-white p-5 text-red-600 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
            {orderError}
          </div>
        )}

        {/* Status Timeline */}
        {!isLoading && !orderError && (
          <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
            <h2 className="mb-5 font-semibold text-gray-800 dark:text-slate-100">
              {t("tracking.serviceStatus")}
            </h2>
            <div className="space-y-5">
              {orderStatuses.map((timelineStatus, index) => (
                <div key={timelineStatus.id} className="flex gap-4">
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        timelineStatus.completed
                          ? "bg-blue-600"
                          : timelineStatus.current && index === 1
                            ? "bg-blue-600"
                            : timelineStatus.current
                              ? "bg-blue-100 border-2 border-blue-600"
                              : "bg-gray-100 dark:bg-slate-700"
                      }`}
                    >
                      {timelineStatus.completed ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : timelineStatus.current && index === 1 ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <div
                          className={`w-3 h-3 rounded-full ${
                            timelineStatus.current
                              ? "bg-blue-600"
                              : "bg-gray-300 dark:bg-slate-500"
                          }`}
                        />
                      )}
                    </div>
                    {index < orderStatuses.length - 1 && (
                      <div
                        className={`w-0.5 h-12 ${
                          timelineStatus.completed
                            ? "bg-blue-600"
                            : "bg-gray-200 dark:bg-slate-700"
                        }`}
                      />
                    )}
                  </div>

                  {/* Status Info */}
                  <div className="flex-1 pb-4">
                    <h3
                      className={`font-semibold ${
                        timelineStatus.completed || timelineStatus.current
                          ? "text-gray-800 dark:text-slate-100"
                          : "text-gray-400 dark:text-slate-500"
                      }`}
                    >
                      {timelineStatus.label}
                    </h3>
                    <p
                      className={`text-sm ${
                        timelineStatus.completed || timelineStatus.current
                          ? "text-gray-600 dark:text-slate-300"
                          : "text-gray-400 dark:text-slate-500"
                      }`}
                    >
                      {timelineStatus.description}
                    </p>
                    {timelineStatus.current && !isCancelledStatus && (
                      <div className="mt-2 inline-block bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                        {index === 0
                          ? t("tracking.pending")
                          : index === 1
                            ? t("tracking.onTheWay")
                            : t("tracking.completed")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!isLoading && !orderError && isCancelledStatus && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm mb-5">
            <p className="text-sm font-semibold text-red-700">
              {t("tracking.cancelledTitle")}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {t("tracking.cancelledBody")}
            </p>
          </div>
        )}
        {!isLoading &&
          !orderError &&
          effectiveStatus === "pending" &&
          displayedExpiresAt && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm mb-5">
              <p className="text-sm font-semibold text-amber-700">
                {t("tracking.awaitingPayment")}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {t("tracking.completePaymentBefore", {
                  time: new Date(displayedExpiresAt).toLocaleString(),
                })}
              </p>
              <p className="text-sm font-semibold text-amber-800 mt-2">
                {t("tracking.timeLeft", { time: countdownText })}
              </p>

              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handlePayment}
                disabled={isPaying}
              >
                {isPaying ? "Starting payment..." : "Pay with KBZPay"}
              </button>
              {paymentError && (
                <p className="mt-2 text-sm text-red-600">{paymentError}</p>
              )}
            </div>
          )}

        {/* Provider Profile */}
        {showProvider && !isLoading && !orderError && (
          <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
            <h2 className="mb-4 font-semibold text-gray-800 dark:text-slate-100">
              {t("tracking.serviceProvider")}
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <ImageWithFallback
                  src={
                    provider?.Mini_Shin__avatar__CST ||
                    "https://images.unsplash.com/photo-1605504836193-e77d3d9ede8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  }
                  alt="Provider"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-green-500 dark:border-slate-800" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-slate-100">
                  {provider?.Mini_Shin__name__CST || t("tracking.provider")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {provider?.Mini_Shin__specialty__CST ||
                    t("tracking.providerRole")}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  {t("tracking.experience", {
                    value: provider?.Mini_Shin__experience__CST ?? "N/A",
                  })}
                </p>
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  if (providerPhone) {
                    window.location.href = `tel:${providerPhone}`;
                  }
                }}
                disabled={!providerPhone}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">{t("tracking.call")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Service Details */}
        {!isLoading && !orderError && (order || bookingSummary) && (
          <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
            <h2 className="mb-4 font-semibold text-gray-800 dark:text-slate-100">
              {t("tracking.serviceDetails")}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  {t("tracking.serviceType")}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-slate-100">
                  {displayedServiceName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  {t("tracking.dateTime")}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-slate-100">
                  {localizeDigits(displayedDate)}
                  {displayedTime ? ", " : ""}
                  {localizeDigits(displayedTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  {t("tracking.address")}
                </span>
                <span className="text-right text-sm font-medium text-gray-800 dark:text-slate-100">
                  {localizeDigits(displayedAddress)}
                </span>
              </div>
              <div className="my-2 h-px bg-gray-200 dark:bg-slate-700" />
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800 dark:text-slate-100">
                  {t("tracking.totalAmount")}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${isPaidStatus ? "text-green-600" : "text-blue-600"}`}
                  >
                    {formatMMK(displayedAmount)}
                  </span>
                  {isPaidStatus && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {t("tracking.paid")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estimated Arrival */}
        {showEta && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 shadow-md">
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-2">
                {t("tracking.estimatedArrival")}
              </p>
              <p className="text-white text-3xl font-bold mb-1">{etaText}</p>
              <p className="text-blue-100 text-sm">
                {t("tracking.onWayToLocation")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
