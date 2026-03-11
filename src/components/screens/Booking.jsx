import { ArrowLeft, Calendar, Clock, MapPin, Upload, CreditCard } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getServices } from "../../../api/services-api";
import { getUsers } from "../../../api/user-api";
import { createOrder } from "../../../api/orders-api";
import { getProviders } from "../../../api/providers-api";

// Map points to the exact discount amounts from your Points system
const discountMap = {
  0: 0,
  50: 1000,
  100: 3000,
  250: 8000,
  500: 18000,
  1000: 40000,
};

export function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [userId, setUserId] = useState("");
  const [providers, setProviders] = useState([]);
  const [selectedRedeemPoints, setSelectedRedeemPoints] = useState(0);
  const [showRequiredError, setShowRequiredError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        setIsLoadingService(true);
        setServiceError("");

        const services = await getServices();
        const matchedService = services.find((item) => {
          const routeId = (id || "").toString().trim();
          const serviceId =
            (item?.Mini_Shin__serviceId__CST || item?.serviceId || "").toString().trim();
          const recordId =
            (item?.Mini_Shin__id__CST || item?.id || "").toString().trim();
          return routeId === serviceId || routeId === recordId;
        });

        if (matchedService) {
          setService(matchedService);
        } else {
          setService(null);
        }
      } catch (error) {
        console.error("Error fetching service for booking:", error);
        setServiceError("Unable to load service details.");
      } finally {
        setIsLoadingService(false);
      }
    };

    fetchService();
  }, [id]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await getProviders();
        setProviders(data || []);
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    };

    fetchProviders();
  }, []);

  useEffect(() => {
    const fetchUserAddress = async () => {
      try {
        const users = await getUsers();
        const firstUser = users?.[0];
        const resolvedUserId =
          firstUser?.Mini_Shin__userId__CST ||
          firstUser?.userId ||
          firstUser?.id ||
          "";
        const defaultAddress =
          firstUser?.Mini_Shin__address__CST ||
          firstUser?.address ||
          [firstUser?.Mini_Shin__township__CST || firstUser?.township, firstUser?.Mini_Shin__city__CST || firstUser?.city]
            .filter(Boolean)
            .join(", ");
        const defaultPhone =
          firstUser?.Mini_Shin__phone__CST ||
          firstUser?.phone ||
          "";
        if (!userId && resolvedUserId) {
          setUserId(resolvedUserId);
        }
        if (!addressTouched && defaultAddress) {
          setAddress(defaultAddress);
        }
        if (!phoneTouched && defaultPhone) {
          setPhone(defaultPhone);
        }
      } catch (error) {
        console.error("Error fetching user info for address:", error);
      }
    };

    fetchUserAddress();
  }, [addressTouched, phoneTouched, userId]);

  const currentPoints = 1250;
  //const pointsToKyats = 30; // 100 points = 3,000 Ks
  const baseAmount =
    service?.Mini_Shin__baseAmount__CST ??
    service?.baseAmount ??
    service?.Mini_Shin__priceFrom__CST ??
    service?.priceFrom ??
    0;
  const subtotal = baseAmount;
  //const redeemDiscount = selectedRedeemPoints * pointsToKyats;
  const redeemDiscount = discountMap[selectedRedeemPoints] || 0;
  const totalPayable = Math.max(subtotal - redeemDiscount, 0);
  const redeemOptions = [0, 50, 100, 250, 500, 1000].filter(
  (points) =>
    points <= currentPoints &&
    (discountMap[points] || 0) <= subtotal
);
  const isBookingInfoValid =
    selectedDate.trim() !== "" &&
    selectedTime.trim() !== "" &&
    address.trim() !== "" &&
    phone.trim() !== "";
  const dateMissing = showRequiredError && selectedDate.trim() === "";
  const timeMissing = showRequiredError && selectedTime.trim() === "";
  const addressMissing = showRequiredError && address.trim() === "";
  const phoneMissing = showRequiredError && phone.trim() === "";
  const formatMMK = (amount) =>
    `${(Number.isFinite(amount) ? amount : 0).toLocaleString()} MMK`;

  if (isLoadingService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <p className="text-gray-600">Loading booking...</p>
      </div>
    );
  }

  if (serviceError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-4">{serviceError}</p>
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
          <p className="text-gray-600 mb-4">The service you're trying to book doesn't exist.</p>
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

  const handleConfirmBooking = () => {
    if (!isBookingInfoValid) {
      setShowRequiredError(true);
      return;
    }

    setShowRequiredError(false);
    setSubmitError("");
    setIsSubmitting(true);
    const serviceId =
      service?.Mini_Shin__serviceId__CST ||
      service?.serviceId ||
      id ||
      "";
    const normalizeServiceId = (value) => {
      const raw = (value || "").toString().trim().toLowerCase();
      if (raw === "electrical") return "electrician";
      return raw;
    };
    const normalizedServiceId = normalizeServiceId(serviceId);
    const onlineFirst = (providers || []).filter((provider) => {
      const providerServiceId = normalizeServiceId(provider?.Mini_Shin__serviceId__CST || "");
      return providerServiceId === normalizedServiceId && provider?.Mini_Shin__isOnline__CST === 1;
    });
    const anyMatch = (providers || []).filter((provider) => {
      const providerServiceId = normalizeServiceId(provider?.Mini_Shin__serviceId__CST || "");
      return providerServiceId === normalizedServiceId;
    });
    const selectedProvider = onlineFirst[0] || anyMatch[0] || null;
    const providerId =
      selectedProvider?.Mini_Shin__providerId__CST ||
      selectedProvider?.Mini_Shin__id__CST ||
      service?.Mini_Shin__providerId__CST ||
      "";

    if (!userId || !providerId || !serviceId) {
      setIsSubmitting(false);
      setSubmitError("Missing user, provider, or service information.");
      return;
    }

    createOrder({
      userId,
      providerId,
      serviceId,
      date: selectedDate,
      time: selectedTime,
      address,
      paymentMethod: "KBZPay",
      redeemedPoints: selectedRedeemPoints || 0,
      discountMMK: redeemDiscount || 0,
      phoneNumber: phone,
    })
      .then((response) => {
        const orderIdFromApi =
          response?.result?.orderId ||
          response?.result?.Mini_Shin__orderId__CST ||
          response?.result?.id ||
          response?.orderId ||
          "";
        navigate(`/tracking/${orderIdFromApi || "ORD-NEW"}`);
      })
      .catch((error) => {
        console.error("Failed to create order:", error);
        setSubmitError("Failed to create order. Please try again.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link to={`/service/${id}`} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Book Service</h1>
      </div>

      <div className="px-5 py-6">
        {/* Service Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {service?.Mini_Shin__serviceName__CST || service?.serviceName || service?.name}
          </h2>
          <p className="text-sm text-gray-500">Professional service at your doorstep</p>
        </div>

        {/* Date Picker */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Select Date</h3>
              <p className="text-xs text-gray-500">Choose your preferred date</p>
            </div>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
              dateMissing
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-200 focus:ring-blue-500"
            }`}
            min={new Date().toISOString().split('T')[0]}
          />
          {dateMissing && (
            <p className="text-xs text-red-600 mt-2">Date is required.</p>
          )}
        </div>

        {/* Time Picker */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Select Time</h3>
              <p className="text-xs text-gray-500">Choose your preferred time slot</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"].map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-3 px-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedTime === time
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          {timeMissing && (
            <p className="text-xs text-red-600 mt-2">Time is required.</p>
          )}
        </div>

        {/* Address Input */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Service Address</h3>
              <p className="text-xs text-gray-500">Where should we come?</p>
            </div>
          </div>
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (!addressTouched) setAddressTouched(true);
            }}
            placeholder="Enter your full address..."
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 resize-none ${
              addressMissing
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-200 focus:ring-blue-500"
            }`}
            rows={3}
          />
          {addressMissing && (
            <p className="text-xs text-red-600 mt-2">Service Address is required.</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Phone Number</h3>
              <p className="text-xs text-gray-500">We will contact you if needed</p>
            </div>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (!phoneTouched) setPhoneTouched(true);
            }}
            placeholder="Enter your phone number..."
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
              phoneMissing
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-200 focus:ring-blue-500"
            }`}
          />
          {phoneMissing && (
            <p className="text-xs text-red-600 mt-2">Phone number is required.</p>
          )}
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Upload Photo (Optional)</h3>
              <p className="text-xs text-gray-500">Help us understand the issue</p>
            </div>
          </div>
          <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
            <Upload className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">Click to upload</span>
          </button>
        </div>

        {/* Use Points */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Use Points</h3>
            <p className="text-xs text-gray-500">You have {currentPoints} pts</p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {redeemOptions.map((points) => (
              <button
                key={points}
                onClick={() => setSelectedRedeemPoints(points)}
                className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedRedeemPoints === points
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {points === 0 ? "No Use" : `${points} pts`}
              </button>
            ))}
          </div>

          <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
            {selectedRedeemPoints === 0
              ? "Select points to get discount based on your reward tier."
              : `${selectedRedeemPoints} points applied = ${formatMMK(redeemDiscount)} discount`}
          </p>
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Price Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee</span>
              <span className="text-gray-800">{formatMMK(baseAmount)}</span>
            </div>
            {selectedRedeemPoints > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Points Discount</span>
                <span className="text-green-600">- {formatMMK(redeemDiscount)}</span>
              </div>
            )}
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex justify-between">
              <span className="font-semibold text-gray-800">Total Payable</span>
              <span className="font-semibold text-blue-600 text-lg">{formatMMK(totalPayable)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">Payment Method</h3>
              <p className="text-xs text-gray-500">KBZPay</p>
            </div>
          </div>
        </div>

        {/* Confirm Booking Button */}
        <button
          onClick={handleConfirmBooking}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white rounded-2xl px-6 py-4 font-semibold text-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Confirming..." : "Confirm Booking"}
        </button>
        {submitError && (
          <p className="text-sm text-red-600 mt-3">{submitError}</p>
        )}
        {showRequiredError && (
          <p className="text-sm text-red-600 mt-3">
            Please fill Date, Time, Service Address, and Phone Number before confirming booking.
          </p>
        )}
      </div>
    </div>
  );
}
