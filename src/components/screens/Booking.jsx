import { ArrowLeft, Calendar, Clock, MapPin, CreditCard, Pencil, Phone, LocateFixed } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getServices } from "../../../api/services-api";
import { getUsers, normalizeUser } from "../../../api/user-api";
import { createOrder, getOrders } from "../../../api/orders-api";
import { getProviders } from "../../../api/providers-api";
import { useI18n } from "../../utils/i18n.js";
import { useUserStore } from "../../../store/user-store";

// Map points to the exact discount amounts from your Points system
const discountMap = {
  0: 0,
  50: 1000,
  100: 3000,
  250: 8000,
  500: 18000,
  1000: 40000,
};

const timeSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"];

const padNumber = (value) => value.toString().padStart(2, "0");

const formatLocalDateInput = (date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

const getPendingExpiryIso = () => {
  const expiry = new Date(Date.now() + 15 * 60 * 1000);
  return expiry.toISOString();
};

const formatCoordinates = (latitude, longitude) =>
  `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;

const getGeolocationErrorMessage = (error) => {
  switch (error?.code) {
    case 1:
      return "booking.gpsDenied";
    case 2:
      return "booking.gpsUnavailable";
    case 3:
      return "booking.gpsTimeout";
    default:
      return "booking.gpsFailed";
  }
};

const formatReverseGeocodedAddress = (addressParts) => {
  if (!addressParts) return "";

  const orderedParts = [
    addressParts.house_number,
    addressParts.road,
    addressParts.neighbourhood,
    addressParts.suburb,
    addressParts.city_district,
    addressParts.town,
    addressParts.village,
    addressParts.city,
    addressParts.municipality,
    addressParts.county,
    addressParts.state,
    addressParts.country,
  ]
    .filter(Boolean)
    .filter((part, index, array) => array.indexOf(part) === index);

  return orderedParts.join(", ");
};

const parseTimeSlot = (timeLabel) => {
  const timeMatch = (timeLabel || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return null;

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
};

const isPastTimeSlotForDate = (dateValue, timeLabel) => {
  if (!dateValue || !timeLabel) return false;

  const parsedTime = parseTimeSlot(timeLabel);
  if (!parsedTime) return false;

  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return false;

  const scheduledDate = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0, 0);
  return scheduledDate.getTime() <= Date.now();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeComparableText = (value) =>
  (value || "").toString().trim().toLowerCase();

const extractOrderIdFromCreateResponse = (response) => {
  const candidates = [
    response?.result?.orderId,
    response?.result?.Mini_Shin__orderId__CST,
    response?.result?.result?.orderId,
    response?.result?.result?.Mini_Shin__orderId__CST,
    response?.data?.orderId,
    response?.data?.Mini_Shin__orderId__CST,
    response?.orderId,
  ];

  return candidates.find((value) => normalizeComparableText(value)) || "";
};

const matchesCreatedOrder = (order, criteria) => {
  const orderUserId = normalizeComparableText(
    order?.Mini_Shin__userId__CST || order?.userId,
  );
  const orderProviderId = normalizeComparableText(
    order?.Mini_Shin__providerId__CST || order?.providerId,
  );
  const orderServiceId = normalizeComparableText(
    order?.Mini_Shin__serviceId__CST || order?.serviceId,
  );
  const orderDate = normalizeComparableText(
    order?.Mini_Shin__date__CST ||
      order?.date ||
      order?.Mini_Shin__dateLabel__CST ||
      order?.dateLabel,
  );
  const orderTime = normalizeComparableText(
    order?.Mini_Shin__time__CST ||
      order?.time ||
      order?.Mini_Shin__timeLabel__CST ||
      order?.timeLabel,
  );
  const orderAddress = normalizeComparableText(
    order?.Mini_Shin__address__CST || order?.address,
  );
  const orderPhone = normalizeComparableText(
    order?.Mini_Shin__phoneNumber__CST ||
      order?.phoneNumber ||
      order?.Mini_Shin__phone__CST ||
      order?.phone,
  );
  const orderExpiresAt = normalizeComparableText(
    order?.Mini_Shin__expiresAt__CST || order?.expiresAt,
  );

  return (
    orderUserId === criteria.userId &&
    orderProviderId === criteria.providerId &&
    orderServiceId === criteria.serviceId &&
    orderDate === criteria.date &&
    orderTime === criteria.time &&
    orderAddress === criteria.address &&
    orderPhone === criteria.phone &&
    (!criteria.expiresAt || orderExpiresAt === criteria.expiresAt)
  );
};

const resolveCreatedOrderId = async (response, criteria) => {
  const directOrderId = extractOrderIdFromCreateResponse(response);
  if (directOrderId) return directOrderId;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const orders = await getOrders();
    const matchedOrder = (orders || []).find((order) =>
      matchesCreatedOrder(order, criteria),
    );
    const matchedOrderId =
      matchedOrder?.Mini_Shin__orderId__CST ||
      matchedOrder?.orderId ||
      matchedOrder?.Mini_Shin__id__CST ||
      matchedOrder?.id ||
      "";

    if (normalizeComparableText(matchedOrderId)) {
      return matchedOrderId;
    }

    await sleep(750);
  }

  return "";
};

const createOrderResolutionError = () =>
  new Error("Created order could not be resolved from the backend response.");

export function Booking() {
  const { t, localizeDigits } = useI18n();
  const profile = useUserStore((state) => state.profile);
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [phone, setPhone] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [userId, setUserId] = useState("");
  const [currentPoints, setCurrentPoints] = useState(0);
  const [providers, setProviders] = useState([]);
  const [selectedRedeemPoints, setSelectedRedeemPoints] = useState(0);
  const [showRequiredError, setShowRequiredError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const today = useMemo(() => formatLocalDateInput(new Date()), []);
  const addressInputRef = useRef(null);

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
        if (profile.userId && !userId) {
          setUserId(profile.userId);
        }
        if (!phoneTouched && profile.msisdn) {
          setPhone(profile.msisdn);
          setDraftPhone(profile.msisdn);
        }
        setCurrentPoints(profile.points ?? 0);

        if (!profile.userId) return;

        const users = await getUsers(profile.userId);
        const firstUser = users?.[0];
        const normalized = normalizeUser(firstUser);
        const resolvedUserId = normalized.userId || profile.userId || "";
        const defaultAddress =
          firstUser?.Mini_Shin__address__CST ||
          firstUser?.address ||
          "";
        const defaultPhone = normalized.msisdn || profile.msisdn || "";
        const userPoints = normalized.points ?? profile.points ?? 0;
        if (!userId && resolvedUserId) {
          setUserId(resolvedUserId);
        }
        setCurrentPoints(userPoints);
        if (!addressTouched && defaultAddress) {
          setAddress(defaultAddress);
          setDraftAddress(defaultAddress);
        }
        if (!addressTouched && !defaultAddress) {
          setIsEditingAddress(true);
        }
        if (!phoneTouched && defaultPhone) {
          setPhone(defaultPhone);
          setDraftPhone(defaultPhone);
        }
      } catch (error) {
        console.error("Error fetching user info for address:", error);
        setCurrentPoints(profile.points ?? 0);
        if (!userId && profile.userId) {
          setUserId(profile.userId);
        }
      }
    };

    fetchUserAddress();
  }, [addressTouched, phoneTouched, profile.msisdn, profile.points, profile.userId, userId]);

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
  const availableTimeSlots = useMemo(
    () => timeSlots.filter((time) => !isPastTimeSlotForDate(selectedDate, time)),
    [selectedDate],
  );
  const isSelectedTimeInPast = isPastTimeSlotForDate(selectedDate, selectedTime);
  const hasAddressChanges = draftAddress.trim() !== address.trim();
  const hasAddressValue = draftAddress.trim() !== "" || address.trim() !== "";
  const addressNeedsConfirmation = isEditingAddress || hasAddressChanges;
  const hasPhoneChanges = draftPhone.trim() !== phone.trim();
  const phoneNeedsConfirmation = isEditingPhone || hasPhoneChanges;
  const isBookingInfoValid =
    selectedDate.trim() !== "" &&
    selectedTime.trim() !== "" &&
    !isSelectedTimeInPast &&
    address.trim() !== "" &&
    !addressNeedsConfirmation &&
    phone.trim() !== "" &&
    !phoneNeedsConfirmation;
  const dateMissing = showRequiredError && selectedDate.trim() === "";
  const timeMissing =
    showRequiredError && (selectedTime.trim() === "" || isSelectedTimeInPast);
  const addressMissing = showRequiredError && address.trim() === "";
  const phoneMissing = showRequiredError && phone.trim() === "";
  const formatMMK = (amount) =>
    localizeDigits(`${(Number.isFinite(amount) ? amount : 0).toLocaleString()} MMK`);

  useEffect(() => {
    if (selectedTime && isPastTimeSlotForDate(selectedDate, selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    if (!isEditingAddress) {
      setDraftAddress(address);
    }
  }, [address, isEditingAddress]);

  useEffect(() => {
    if (!isEditingPhone) {
      setDraftPhone(phone);
    }
  }, [phone, isEditingPhone]);

  if (isLoadingService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 dark:bg-slate-900">
        <p className="text-gray-600 dark:text-slate-300">{t("booking.loading")}</p>
      </div>
    );
  }

  if (serviceError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 dark:bg-slate-900">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold text-gray-800 dark:text-slate-100">{t("common.somethingWentWrong")}</h1>
          <p className="mb-4 text-gray-600 dark:text-slate-300">{serviceError}</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            {t("common.goBackHome")}
          </Link>
        </div>
      </div>
    );
  }

  // Fallback in case service is not found
  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 dark:bg-slate-900">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold text-gray-800 dark:text-slate-100">{t("booking.serviceNotFound")}</h1>
          <p className="mb-4 text-gray-600 dark:text-slate-300">{t("booking.serviceNotFoundBody")}</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            {t("common.goBackHome")}
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
      return (value || "").toString().trim().toLowerCase();
    };
    const normalizedServiceId = normalizeServiceId(serviceId);
    const onlineFirst = (providers || []).filter((provider) => {
      const providerServiceId = normalizeServiceId(
        provider?.Mini_Shin__serviceId__CST || provider?.serviceId || ""
      );
      return providerServiceId === normalizedServiceId && provider?.Mini_Shin__isOnline__CST === 1;
    });
    const anyMatch = (providers || []).filter((provider) => {
      const providerServiceId = normalizeServiceId(
        provider?.Mini_Shin__serviceId__CST || provider?.serviceId || ""
      );
      return providerServiceId === normalizedServiceId;
    });
    const selectedProvider = onlineFirst[0] || anyMatch[0] || null;
    const providerId =
      selectedProvider?.Mini_Shin__providerId__CST ||
      selectedProvider?.Mini_Shin__id__CST ||
      selectedProvider?.id ||
      service?.Mini_Shin__providerId__CST ||
      "";

    if (!userId || !providerId || !serviceId) {
      setIsSubmitting(false);
      setSubmitError(t("booking.missingInfo"));
      return;
    }

    const expiresAt = getPendingExpiryIso();
    const bookingPayload = {
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
      expiresAt,
    };
    createOrder(bookingPayload)
      .then(async (response) => {
        const orderIdFromApi = await resolveCreatedOrderId(response, {
          userId: normalizeComparableText(userId),
          providerId: normalizeComparableText(providerId),
          serviceId: normalizeComparableText(serviceId),
          date: normalizeComparableText(selectedDate),
          time: normalizeComparableText(selectedTime),
          address: normalizeComparableText(address),
          phone: normalizeComparableText(phone),
          expiresAt: normalizeComparableText(expiresAt),
        });
        if (!orderIdFromApi) {
          throw createOrderResolutionError();
        }

        navigate(`/tracking/${orderIdFromApi}`, {
          state: {
            bookingSummary: {
              serviceName:
                service?.Mini_Shin__serviceName__CST ||
                service?.serviceName ||
                service?.name ||
                "Service",
              date: selectedDate,
              time: selectedTime,
              address,
              amountMMK: totalPayable,
              expiresAt,
              orderId: orderIdFromApi,
            },
          },
        });
      })
      .catch((error) => {
        console.error("Failed to create order:", error);
        setSubmitError(
          error?.message === createOrderResolutionError().message
            ? "Booking was created, but we could not load the new order number yet. Please try again from Orders in a moment."
            : t("booking.failedCreate"),
        );
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t("booking.gpsUnsupported"));
      return;
    }

    setIsDetectingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : null;
        const gpsFallback = t("booking.currentGps", {
          coordinates: formatCoordinates(latitude, longitude),
          accuracy: roundedAccuracy,
        });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                Accept: "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error(`Reverse geocoding failed with status ${response.status}`);
          }

          const result = await response.json();
          const readableAddress =
            formatReverseGeocodedAddress(result?.address) ||
            result?.display_name ||
            gpsFallback;

          setAddress(readableAddress);
          setDraftAddress(readableAddress);
        } catch (error) {
          console.error("Failed to reverse geocode current location:", error);
          setAddress(gpsFallback);
          setDraftAddress(gpsFallback);
        } finally {
          setAddressTouched(true);
          setIsEditingAddress(false);
          setShowRequiredError(false);
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setLocationError(t(getGeolocationErrorMessage(error)));
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-white px-5 py-4 shadow-sm transition-colors dark:bg-slate-900/95 dark:shadow-slate-950/30">
        <Link to={`/service/${id}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors dark:bg-slate-800">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-200" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{t("booking.title")}</h1>
      </div>

      <div className="px-5 py-6">
        {/* Service Summary */}
        <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-slate-100">
            {service?.Mini_Shin__serviceName__CST || service?.serviceName || service?.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t("booking.serviceSummary")}</p>
        </div>

        {/* Date Picker */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-slate-100">{t("booking.selectDate")}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("booking.chooseDate")}</p>
            </div>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`block w-full min-w-0 max-w-full appearance-none px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white text-gray-800 dark:bg-slate-800 dark:text-slate-100 ${
              dateMissing
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-200 focus:ring-blue-500"
            }`}
            min={today}
          />
          {dateMissing && (
            <p className="text-xs text-red-600 mt-2">{t("booking.dateRequired")}</p>
          )}
        </div>

        {/* Time Picker */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-slate-100">{t("booking.selectTime")}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("booking.chooseTime")}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                disabled={!availableTimeSlots.includes(time)}
                className={`py-3 px-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedTime === time
                    ? "bg-blue-600 text-white"
                    : availableTimeSlots.includes(time)
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                    : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-60 dark:bg-slate-700 dark:text-slate-500"
                }`}
              >
                {localizeDigits(time)}
              </button>
            ))}
          </div>
          {timeMissing && (
            <p className="text-xs text-red-600 mt-2">
              {selectedTime.trim() !== "" && isSelectedTimeInPast
                ? t("booking.futureTime")
                : t("booking.timeRequired")}
            </p>
          )}
          {selectedDate === today && availableTimeSlots.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              {t("booking.noSlotsToday")}
            </p>
          )}
        </div>

        {/* Address Input */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-slate-100">{t("booking.serviceAddress")}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t("booking.whereCome")}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingLocation}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                {isDetectingLocation ? t("booking.locating") : t("booking.useCurrentLocation")}
              </button>
            </div>
          </div>
          <textarea
            ref={addressInputRef}
            value={isEditingAddress ? draftAddress : address}
            onChange={(e) => {
              setDraftAddress(e.target.value);
            }}
            placeholder={t("booking.enterAddress")}
            readOnly={!isEditingAddress}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 resize-none ${
              addressMissing
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-200 focus:ring-blue-500"
            } ${!isEditingAddress ? "cursor-default bg-gray-50 text-gray-500 dark:bg-slate-700 dark:text-slate-400" : "bg-white text-gray-800 dark:bg-slate-800 dark:text-slate-100"}`}
            rows={3}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {!isEditingAddress && hasAddressValue && (
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("booking.tapEditLocation")}</p>
            )}
            {isEditingAddress && hasAddressValue && (
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("booking.tapConfirmLocation")}</p>
            )}
            {hasAddressValue && (
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  disabled={isEditingAddress}
                  onClick={() => {
                    setIsEditingAddress(true);
                    setDraftAddress(address);
                    setAddressTouched(true);
                    setLocationError("");
                    setTimeout(() => addressInputRef.current?.focus(), 0);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t("booking.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddress(draftAddress);
                    setAddressTouched(true);
                    setIsEditingAddress(false);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 sm:flex-none"
                >
                  {hasAddressChanges ? (t("booking.save") || "Save") : (t("booking.confirm") || "Confirm")}
                </button>
              </div>
            )}
          </div>
          {locationError && (
            <p className="text-xs text-red-600 mt-2">{locationError}</p>
          )}
          {addressMissing && (
            <p className="text-xs text-red-600 mt-2">{t("booking.addressRequired")}</p>
          )}
          {showRequiredError && addressNeedsConfirmation && (
            <p className="text-xs text-red-600 mt-2">
              {t("booking.confirmAddress")}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-slate-100">{t("booking.phoneNumber")}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t("booking.phoneHint")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsEditingPhone(true);
                setDraftPhone(phone);
                setPhoneTouched(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("booking.edit")}
            </button>
            {isEditingPhone && (
              <button
                type="button"
                onClick={() => {
                  if (hasPhoneChanges) {
                    setPhone(draftPhone);
                  }
                  setPhoneTouched(true);
                  setIsEditingPhone(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
              >
                {t("booking.confirm")}
              </button>
            )}
          </div>
          <input
            type="tel"
            value={isEditingPhone ? draftPhone : phone}
            onChange={(e) => {
              setDraftPhone(e.target.value);
            }}
            placeholder={t("booking.enterPhone")}
            readOnly={!isEditingPhone}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
              phoneMissing
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-200 focus:ring-blue-500"
            } ${!isEditingPhone ? "cursor-default bg-gray-50 text-gray-500 dark:bg-slate-700 dark:text-slate-400" : "bg-white text-gray-800 dark:bg-slate-800 dark:text-slate-100"}`}
          />
          {!isEditingPhone && phone.trim() !== "" && (
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{t("booking.tapEditPhone")}</p>
          )}
          {phoneMissing && (
            <p className="text-xs text-red-600 mt-2">{t("booking.phoneRequired")}</p>
          )}
          {showRequiredError && phoneNeedsConfirmation && (
            <p className="text-xs text-red-600 mt-2">
              {t("booking.confirmPhone")}
            </p>
          )}
        </div>

        {/* Use Points */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-slate-100">{t("booking.usePoints")}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t("booking.havePoints", { count: currentPoints })}</p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {redeemOptions.map((points) => (
              <button
                key={points}
                onClick={() => setSelectedRedeemPoints(points)}
                className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedRedeemPoints === points
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                }`}
              >
                {points === 0 ? t("booking.noUse") : `${localizeDigits(points)} pts`}
              </button>
            ))}
          </div>

          <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
            {selectedRedeemPoints === 0
              ? t("booking.selectPoints")
              : t("booking.pointsApplied", { points: selectedRedeemPoints, amount: formatMMK(redeemDiscount) })}
          </p>
        </div>

        {/* Price Summary */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <h3 className="mb-3 font-semibold text-gray-800 dark:text-slate-100">{t("booking.priceSummary")}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-300">{t("booking.serviceFee")}</span>
              <span className="text-gray-800 dark:text-slate-100">{formatMMK(baseAmount)}</span>
            </div>
            {selectedRedeemPoints > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-300">{t("booking.pointsDiscount")}</span>
                <span className="text-green-600">- {formatMMK(redeemDiscount)}</span>
              </div>
            )}
            <div className="my-2 h-px bg-gray-200 dark:bg-slate-700" />
            <div className="flex justify-between">
              <span className="font-semibold text-gray-800 dark:text-slate-100">{t("booking.totalPayable")}</span>
              <span className="font-semibold text-blue-600 text-lg">{formatMMK(totalPayable)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100">{t("booking.paymentMethod")}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">KBZPay</p>
            </div>
          </div>
        </div>

        {/* Confirm Booking Button */}
        <button
          onClick={handleConfirmBooking}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white rounded-2xl px-6 py-4 font-semibold text-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t("booking.confirming") : t("booking.confirmBooking")}
        </button>
        {isSubmitting && (
          <p className="text-sm text-gray-500 mt-3">
            Loading your order number...
          </p>
        )}
        {submitError && (
          <p className="text-sm text-red-600 mt-3">{submitError}</p>
        )}
        {showRequiredError && (
          <p className="text-sm text-red-600 mt-3">
            {t("booking.requiredSummary")}
          </p>
        )}
      </div>
    </div>
  );
}
