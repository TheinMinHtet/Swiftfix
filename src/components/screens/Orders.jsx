import { useEffect, useMemo, useState } from "react";
import { Clock, CheckCircle, XCircle, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { getOrders } from "../../../api/orders-api";
import { getReviews } from "../../../api/reviews-api";
import { useI18n } from "../../utils/i18n.js";

const filters = ["all", "pending", "confirmed", "completed", "cancelled"];

const normalizeOrderStatus = (value, expiresAt) => {
  const status = (value || "").toString().trim().toLowerCase();
  if (status === "pending" && expiresAt) {
    const expiryTime = new Date(expiresAt).getTime();
    if (!Number.isNaN(expiryTime) && Date.now() > expiryTime) {
      return "cancelled";
    }
  }
  if (status === "cancel" || status === "canceled" || status === "rejected") {
    return "cancelled";
  }
  return status || "pending";
};

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

const getScheduledTimestamp = (order) => {
  const dateValue =
    order?.Mini_Shin__date__CST ||
    order?.date ||
    order?.Mini_Shin__dateLabel__CST ||
    order?.dateLabel;
  if (!dateValue) return Number.NaN;

  const scheduled = new Date(dateValue);
  if (Number.isNaN(scheduled.getTime())) return Number.NaN;

  const timeValue =
    order?.Mini_Shin__time__CST ||
    order?.time ||
    order?.Mini_Shin__timeLabel__CST ||
    order?.timeLabel;
  const parsedTime = parseTimeParts(timeValue);
  if (parsedTime) {
    scheduled.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
  }

  return scheduled.getTime();
};

const getOrderSortValue = (order) => {
  const latestCandidates = [
    order?.Mini_Shin__updatedDate__CST,
    order?.updatedDate,
    order?.Mini_Shin__createdDate__CST,
    order?.createdDate,
  ];

  for (const value of latestCandidates) {
    const timestamp = new Date(value || "").getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  const scheduledTimestamp = getScheduledTimestamp(order);
  if (!Number.isNaN(scheduledTimestamp)) {
    return scheduledTimestamp;
  }

  const fallbackId = order?.Mini_Shin__orderId__CST || order?.Mini_Shin__id__CST || order?.orderId || order?.id || "";
  const numericMatch = fallbackId.toString().match(/\d+/g);
  return numericMatch ? Number(numericMatch.join("")) : 0;
};

export function Orders() {
  const { t, localizeDigits } = useI18n();
  const [activeFilter, setActiveFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const actionButtonClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25";
  const secondaryActionButtonClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setOrdersError("");
        const data = await getOrders();
        const normalized = (data || [])
          .slice()
          .sort((a, b) => getOrderSortValue(b) - getOrderSortValue(a))
          .map((order) => {
            const recordId = order.Mini_Shin__id__CST || order.id || "";
            const orderNo = order.Mini_Shin__orderId__CST || recordId;
            return {
              id: recordId,
              orderNo,
              service: order.Mini_Shin__serviceName__CST || order.service || "",
              serviceId: order.Mini_Shin__serviceId__CST || order.serviceId || "",
              date: order.Mini_Shin__dateLabel__CST || order.dateLabel || "",
              time: order.Mini_Shin__timeLabel__CST || order.timeLabel || "",
              status: normalizeOrderStatus(
                order.Mini_Shin__status__CST || order.status,
                order.Mini_Shin__expiresAt__CST || order.expiresAt
              ),
              amountMMK: order.Mini_Shin__amountMMK__CST ?? order.amountMMK ?? 0,
            };
          });
        setOrders(normalized);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrdersError("Unable to load orders.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviews = await getReviews();
        const reviewed = new Set(
          (reviews || [])
            .map((review) => review.Mini_Shin__orderId__CST || review.orderId || "")
            .filter(Boolean),
        );
        setReviewedOrderIds(reviewed);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
  }, []);

  const formatMMK = (amount) =>
    localizeDigits(`${(Number.isFinite(amount) ? amount : 0).toLocaleString()} MMK`);

  const filteredOrders = useMemo(
    () =>
      activeFilter === "all"
        ? orders
        : orders.filter((order) => order.status === activeFilter),
    [activeFilter, orders],
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "confirmed":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-700";
      case "confirmed":
        return "bg-indigo-100 text-indigo-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors dark:bg-slate-900">
      <div className="bg-white px-5 py-6 shadow-sm transition-colors dark:bg-slate-900/95 dark:shadow-slate-950/30">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">{t("orders.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{t("orders.subtitle")}</p>
      </div>

      <div className="px-5 py-6">
        <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {t(`orders.filters.${filter}`)}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {isLoading && (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm transition-colors dark:bg-slate-800 dark:text-slate-400 dark:shadow-slate-950/30">
              {t("orders.loading")}
            </div>
          )}
          {!isLoading && ordersError && (
            <div className="rounded-2xl bg-white p-6 text-center text-red-500 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
              {t("orders.error")}
            </div>
          )}
          {!isLoading && !ordersError && filteredOrders.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm transition-colors dark:bg-slate-800 dark:text-slate-400 dark:shadow-slate-950/30">
              {activeFilter === "all"
                ? t("orders.noneAll")
                : t("orders.noneByFilter", { filter: t(`orders.filters.${activeFilter}`).toLowerCase() })}
            </div>
          ) : (
            !isLoading &&
            !ordersError &&
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-800 dark:shadow-slate-950/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-800 dark:text-slate-100">{order.service}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t("orders.orderId", { orderNo: order.orderNo || order.id })}</p>
                  </div>
                  <div className="flex items-center gap-2">{getStatusIcon(order.status)}</div>
                </div>

                <div className="mb-3 flex items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
                  <span>{localizeDigits(order.date)}</span>
                  <span>-</span>
                  <span>{localizeDigits(order.time)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {t(`orders.status.${order.status}`)}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-slate-100">{formatMMK(order.amountMMK)}</span>
                </div>

                {order.status === "pending" && (
                  <div className="mt-2 flex justify-end">
                    <Link
                      to={`/tracking/${order.orderNo || order.id}`}
                      className={actionButtonClass}
                    >
                      {t("orders.action.viewPending")}
                    </Link>
                  </div>
                )}

                {order.status === "confirmed" && (
                  <div className="mt-2 flex justify-end">
                    <Link
                      to={`/tracking/${order.orderNo || order.id}`}
                      className={actionButtonClass}
                    >
                      {t("orders.action.track")}
                    </Link>
                  </div>
                )}

                {order.status === "completed" && (
                  <div className="mt-2 flex justify-end gap-2 flex-wrap">
                    <Link
                      to={`/tracking/${order.orderNo || order.id}`}
                      className={secondaryActionButtonClass}
                    >
                      {t("orders.action.viewService")}
                    </Link>
                    {!reviewedOrderIds.has(order.orderNo || order.id) && (
                      <Link
                        to={`/rating/${order.id}?service=${encodeURIComponent(order.service)}&serviceId=${encodeURIComponent(order.serviceId)}&orderNo=${encodeURIComponent(order.orderNo || "")}`}
                        className={actionButtonClass}
                      >
                        <Star className="w-3.5 h-3.5 fill-blue-700 text-blue-700" />
                        {t("orders.action.writeReview")}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
