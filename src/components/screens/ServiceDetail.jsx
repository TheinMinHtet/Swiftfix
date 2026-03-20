import { ArrowLeft, Star, ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback.jsx";
import { getServices } from "../../../api/services-api";
import { getReviews } from "../../../api/reviews-api";

const formatReviewDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        setIsLoading(true);
        setError("");
        const services = await getServices();
        const matchedService = services.find((item) => {
          const routeId = (id || "").toString().trim();
          const serviceId =
            (item?.Mini_Shin__serviceId__CST || item?.serviceId || "").toString().trim();
          const recordId =
            (item?.Mini_Shin__id__CST || item?.id || "").toString().trim();
          return routeId === serviceId || routeId === recordId;
        });
        setService(matchedService || null);
      } catch (fetchError) {
        console.error("Error fetching service detail:", fetchError);
        setError("Unable to load service detail.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true);
        setReviewsError("");
        const data = await getReviews(id);
        const normalized = (data || []).map((review, index) => ({
          id: review.id ?? review.Mini_Shin__id__CST ?? `${review.Mini_Shin__serviceId__CST || "review"}-${index}`,
          serviceId: review.Mini_Shin__serviceId__CST ?? review.serviceId ?? "",
          name:
            review.Mini_Shin__name__CST ||
            review.Mini_Shin__reviewerName__CST ||
            review.name ||
            review.createdBy?.name ||
            "Anonymous",
          rating: Number(review.Mini_Shin__rating__CST ?? review.rating ?? 0),
          date: formatReviewDate(review.Mini_Shin__date__CST || review.date || review.createdDate),
          comment: review.Mini_Shin__comment__CST || review.comment || "",
        }));
        const filtered = normalized.filter((review) => {
          const routeId = (id || "").toString().trim();
          const reviewServiceId = (review.serviceId || "").toString().trim();
          return !routeId || !reviewServiceId || routeId === reviewServiceId;
        });
        setReviews(filtered);
      } catch (fetchError) {
        console.error("Error fetching reviews:", fetchError);
        setReviewsError("Unable to load reviews.");
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  const serviceName =
    service?.Mini_Shin__serviceName__CST ||
    service?.serviceName ||
    service?.Mini_Shin__name__CST ||
    service?.name ||
    "Service";
  const serviceDescription =
    service?.Mini_Shin__description__CST ||
    service?.description ||
    "No description available.";
  const fallbackRating = service?.Mini_Shin__rating__CST ?? service?.rating ?? 0;
  const fallbackReviews = service?.Mini_Shin__reviews__CST ?? service?.reviews ?? 0;
  const reviewCount = reviews.length;
  const reviewAverage =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((sum, item) => sum + (Number.isFinite(item.rating) ? item.rating : 0), 0) / reviewCount) * 10
        ) / 10
      : 0;
  const serviceRating = reviewCount > 0 ? reviewAverage : fallbackRating;
  const serviceReviews = reviewCount > 0 ? reviewCount : fallbackReviews;
  const priceFrom = service?.Mini_Shin__priceFrom__CST ?? service?.priceFrom;
  const priceTo = service?.Mini_Shin__priceTo__CST ?? service?.priceTo;
  const servicePriceRange =
    typeof priceFrom === "number" && typeof priceTo === "number"
      ? `${priceFrom.toLocaleString()} - ${priceTo.toLocaleString()} MMK`
      : typeof priceFrom === "number"
      ? `${priceFrom.toLocaleString()} MMK`
      : "Price unavailable";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <p className="text-gray-600">Loading service detail...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  // Fallback in case service is not found
  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Service Not Found</h1>
          <p className="text-gray-600 mb-4">The service you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link to="/" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">{serviceName}</h1>
      </div>

      {/* Service Image Banner */}
      <div className="relative h-56 bg-gray-200">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1556911220-bff31c812dba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
          alt={serviceName}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-5 py-6">
        {/* Service Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {serviceName}
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-700">
                {reviewCount > 0 ? serviceRating.toFixed(1) : serviceRating}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              ({serviceReviews} reviews)
            </span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {serviceDescription}
          </p>

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">PRICE RANGE</p>
            <p className="text-lg font-semibold text-blue-700">
              {servicePriceRange}
            </p>
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Customer Reviews</h3>
            <Link to={`/service/${id}/reviews`} className="text-blue-600 text-sm font-medium">
              See All
            </Link>
          </div>

          <div className="space-y-4">
            {isLoadingReviews && (
              <p className="text-sm text-gray-500">Loading reviews...</p>
            )}
            {!isLoadingReviews && reviewsError && (
              <p className="text-sm text-red-500">{reviewsError}</p>
            )}
            {!isLoadingReviews && !reviewsError && reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {review.name?.charAt(0) || "A"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{review.name}</p>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <Star
                        key={starValue}
                        className={`w-3 h-3 ${
                          starValue <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {!isLoadingReviews && !reviewsError && reviews.length === 0 && (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Book Now Button */}
        <Link
          to={`/booking/${id}`}
          className="bg-blue-600 text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-lg hover:bg-blue-700 transition-colors"
        >
          <span className="text-lg font-semibold">Book Now</span>
          <ChevronRight className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
