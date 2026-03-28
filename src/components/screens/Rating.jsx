import { useEffect, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createReview } from "../../../api/reviews-api";
import { getUsers, normalizeUser } from "../../../api/user-api";
import { getOrders } from "../../../api/orders-api";
import { getReviews } from "../../../api/reviews-api";
import { useUserStore } from "../../../store/user-store";

const DEFAULT_USER_ID = "";
const DEFAULT_USER_NAME = "";

export function Rating() {
  const profile = useUserStore((state) => state.profile);
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const serviceName = new URLSearchParams(location.search).get("service") || "";
  const serviceId = new URLSearchParams(location.search).get("serviceId") || "";
  const orderNoParam = new URLSearchParams(location.search).get("orderNo") || "";
  const [rating, setRating] = useState(0);
  const [showRatingError, setShowRatingError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [userName, setUserName] = useState(DEFAULT_USER_NAME);
  const [resolvedOrderId, setResolvedOrderId] = useState(orderId || "");
  const [resolvedServiceId, setResolvedServiceId] = useState(serviceId);
  const [resolvedUserId, setResolvedUserId] = useState(userId);
  const [isAlreadyReviewed, setIsAlreadyReviewed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fallbackId = profile.userId || DEFAULT_USER_ID;
        const fallbackName = profile.fullname || DEFAULT_USER_NAME;
        setUserId(fallbackId);
        setUserName(fallbackName);

        if (!profile.userId) return;

        const users = await getUsers(profile.userId);
        const firstUser = users?.[0];
        const normalized = normalizeUser(firstUser);
        const resolvedId = normalized.userId || fallbackId;
        const resolvedName = normalized.fullname || fallbackName;
        setUserId(resolvedId);
        setUserName(resolvedName);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    fetchUser();
  }, [profile.fullname, profile.userId]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orders = await getOrders();
        const matched = (orders || []).find((item) => {
          const recordId = item?.Mini_Shin__id__CST || item?.id || "";
          const orderNo = item?.Mini_Shin__orderId__CST || "";
          return recordId === (orderId || "") || orderNo === (orderId || "") || orderNo === orderNoParam;
        });
        if (matched) {
          const orderNo = matched.Mini_Shin__orderId__CST || orderId || "";
          const svcId = matched.Mini_Shin__serviceId__CST || serviceId || "";
          const usrId = matched.Mini_Shin__userId__CST || userId || "";
          setResolvedOrderId(orderNo || orderId || "");
          setResolvedServiceId(svcId);
          setResolvedUserId(usrId);
        } else {
          setResolvedOrderId(orderNoParam || orderId || "");
          setResolvedServiceId(serviceId || "");
          setResolvedUserId(userId || "");
        }
      } catch (error) {
        console.error("Failed to fetch order info:", error);
        setResolvedOrderId(orderNoParam || orderId || "");
        setResolvedServiceId(serviceId || "");
        setResolvedUserId(userId || "");
      }
    };

    fetchOrder();
  }, [orderId, orderNoParam, serviceId, userId]);

  useEffect(() => {
    const checkExistingReview = async () => {
      try {
        const reviews = await getReviews();
        const targetOrderId = resolvedOrderId || orderId || "";
        const exists = (reviews || []).some((review) => {
          const reviewOrderId =
            review.Mini_Shin__orderId__CST ||
            review.orderId ||
            "";
          return reviewOrderId === targetOrderId;
        });
        setIsAlreadyReviewed(exists);
      } catch (error) {
        console.error("Failed to check existing review:", error);
      }
    };

    if (resolvedOrderId || orderId) {
      checkExistingReview();
    }
  }, [resolvedOrderId, orderId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setShowRatingError(true);
      return;
    }
    if (isAlreadyReviewed) {
      setShowRatingError(false);
      setSubmitError("This order is already reviewed.");
      return;
    }
    if (!resolvedServiceId) {
      setShowRatingError(false);
      setSubmitError("Missing service ID. Please retry from Orders.");
      return;
    }

    setShowRatingError(false);
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await createReview({
        id: Math.floor(10000 + Math.random() * 90000),
        orderId: resolvedOrderId || orderId || "",
        serviceId: resolvedServiceId,
        userId: resolvedUserId || userId,
        name: userName,
        rating,
      });
      navigate(`/service/${resolvedServiceId}/reviews`);
    } catch (error) {
      console.error("Failed to submit review:", error);
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 transition-colors dark:bg-slate-900">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-white px-5 py-4 shadow-sm transition-colors dark:bg-slate-900/95 dark:shadow-slate-950/30">
        <Link
          to="/orders"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors dark:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-200" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Rate Service</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">Order #{resolvedOrderId || orderId}</p>
          {serviceName && <p className="text-xs text-gray-500 dark:text-slate-400">{serviceName}</p>}
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <h2 className="mb-3 font-semibold text-gray-800 dark:text-slate-100">Rate Your Experience</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((starValue) => (
              <button
                key={starValue}
                onClick={() => setRating(starValue)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors dark:bg-slate-700"
              >
                <Star
                  className={`w-5 h-5 ${
                    starValue <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400 dark:text-slate-400"
                  }`}
                />
              </button>
            ))}
          </div>
          {showRatingError && (
            <p className="text-xs text-red-600 mt-2">Please select a rating.</p>
          )}
        {submitError && (
          <p className="text-xs text-red-600 mt-2">{submitError}</p>
        )}
        {isAlreadyReviewed && (
          <p className="text-xs text-amber-600 mt-2">
            You already submitted a review for this order.
          </p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full rounded-2xl px-6 py-4 font-semibold text-lg shadow-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isAlreadyReviewed ? "Review Submitted" : isSubmitting ? "Submitting..." : "Submit Rating"}
      </button>
      </div>
    </div>
  );
}
