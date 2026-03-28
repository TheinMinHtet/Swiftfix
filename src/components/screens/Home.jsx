import { Search, Award } from "lucide-react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { useEffect, useState } from "react";
import { getServices } from "../../../api/services-api";
import { getAdvertisements } from "../../../api/ads-api";
import { mapApiServicesToCatalog } from "../../utils/services-catalog";
import { getUsers, normalizeUser } from "../../../api/user-api";
import { ThemeToggle } from "../ThemeToggle.jsx";
import { LanguageToggle } from "../LanguageToggle.jsx";
import { useI18n } from "../../utils/i18n.js";
import { useUserStore } from "../../../store/user-store";
const advertisementFallbackColors = [
  "from-cyan-600 to-blue-600",
  "from-purple-600 to-pink-600",
  "from-orange-600 to-red-600",
];

const advertisementGradientClasses = {
  "from-green-400 to-blue-400": "from-green-400 to-blue-400",
  "from-orange-500 to-red-500": "from-orange-500 to-red-500",
  "from-cyan-600 to-blue-600": "from-cyan-600 to-blue-600",
  "from-purple-600 to-pink-600": "from-purple-600 to-pink-600",
  "from-orange-600 to-red-600": "from-orange-600 to-red-600",
};

const resolveAdvertisementGradient = (bgColor, index) =>
  advertisementGradientClasses[bgColor] ||
  advertisementFallbackColors[index % advertisementFallbackColors.length];

function renderServiceTitle(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return name;
  }

  const firstLine = words[0];
  const secondLine = words.slice(1).join(" ");

  return (
    <>
      <span className="block">{firstLine}</span>
      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={name}>
        {secondLine}
      </span>
    </>
  );
}

export function Home() {
  const { t, localizeDigits, language } = useI18n();
  const profile = useUserStore((state) => state.profile);
  const [userPoints, setUserPoints] = useState(0);
  const [userName, setUserName] = useState(profile.fullName || "");
  const [filteredServices, setFilteredServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [advertisements, setAdvertisements] = useState([]);
  const [isLoadingAds, setIsLoadingAds] = useState(true);
  const [adsError, setAdsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadUserPoints = async () => {
      try {
        const fallbackPoints = profile.points ?? 0;
        const fallbackName = profile.fullName || "";
        if (isMounted) {
          setUserPoints(fallbackPoints);
          setUserName(fallbackName);
        }

        if (!profile.userId) return;

        const users = await getUsers(profile.userId);
        const user = users?.[0];
        const normalized = normalizeUser(user);
        if (isMounted) {
          setUserPoints(normalized.points);
          setUserName(normalized.fullName || fallbackName);
        }
      } catch (error) {
        console.error("Failed to load user points:", error);
        if (isMounted) {
          setUserPoints(profile.points ?? 0);
          setUserName(profile.fullName || "");
        }
      }
    };

    loadUserPoints();
    return () => {
      isMounted = false;
    };
  }, [profile.fullName, profile.points, profile.userId]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        setServicesError("");
        const services = await getServices();
        const catalog = mapApiServicesToCatalog(services);
        setFilteredServices(catalog);
      } catch (error) {
        console.error("Error fetching services:", error);
        setServicesError("Unable to load services.");
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        setIsLoadingAds(true);
        setAdsError("");
        const ads = await getAdvertisements();
        const normalized = (ads || [])
          .filter(
            (ad) =>
              ad &&
              (ad.Mini_Shin__isActive__CST === undefined ||
                ad.Mini_Shin__isActive__CST === true ||
                ad.Mini_Shin__isActive__CST === 1 ||
                ad.isActive === undefined ||
                ad.isActive === true ||
                ad.isActive === 1),
          )
          .map((ad, index) => ({
            id: ad.Mini_Shin__id__CST ?? ad.id ?? index,
            title: ad.Mini_Shin__title__CST || ad.title || "Special Offer",
            subtitle: ad.Mini_Shin__subtitle__CST || ad.subtitle || "",
            image: ad.Mini_Shin__image__CST || ad.image || "",
            bgColor: resolveAdvertisementGradient(
              ad.Mini_Shin__bgColor__CST || ad.bgColor,
              index,
            ),
          }));
        setAdvertisements(normalized);
      } catch (error) {
        console.error("Error fetching advertisements:", error);
        setAdsError("Unable to load advertisements.");
      } finally {
        setIsLoadingAds(false);
      }
    };

    fetchAdvertisements();
  }, []);

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
  };

  const popularServices = filteredServices.filter((service) => service.isPopular === true);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 transition-colors dark:bg-slate-900">
      {/* Header Section */}
      <div className="bg-blue-600 px-5 pt-12 pb-8 rounded-b-3xl dark:bg-blue-950">
        <div className="mb-4 flex items-start justify-between gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="mb-6 w-full">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-[2px]">
            <p className="text-blue-100 text-sm">{t("home.welcome")}</p>
            <h1 className="mt-1 text-white text-2xl">{userName || "SwiftFix User"}</h1>
          </div>
        </div>

        {/* Points Card */}
        <Link
          to="/points"
          className="block bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl px-4 py-3 mb-4 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-yellow-900 text-xs font-medium">
                  {t("home.currentPoints")}
                </p>
                <p className="text-yellow-900 font-semibold text-lg">
                  {localizeDigits(userPoints)} pts
                </p>
              </div>
            </div>
            <div>
              <span className="bg-white/80 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                {t("home.active")}
              </span>
            </div>
          </div>
        </Link>

        {/* Search Bar */}
        <Link
          to="/services"
          state={{ focusSearch: true }}
          aria-label="Go to services search"
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition-colors dark:bg-slate-800"
        >
          <Search className="h-5 w-5 text-gray-400 dark:text-slate-400" aria-hidden="true" />
          <span className="flex-1 text-sm text-gray-400 dark:text-slate-400">
            {t("home.searchPlaceholder")}
          </span>
        </Link>
      </div>

      <div className="py-6">
        {/* Service Categories - Horizontal Scroll */}
        <div className="mb-6">
          <div className="px-5 mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              {t("home.ourServices")}
            </h2>
            <Link to="/services" className="text-blue-600 text-sm font-medium">
              {t("home.seeAll")}
            </Link>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-5 mb-1">
              {isLoadingServices && (
                <div className="text-sm text-gray-500 dark:text-slate-400">{t("home.loadingServices")}</div>
              )}
              {!isLoadingServices && servicesError && (
                <div className="text-sm text-red-500">{t("home.unableServices")}</div>
              )}
              {filteredServices.map((service) => {
                const Icon = service.icon;
                return (
                  <Link
                    key={service.id}
                    to={`/service/${service.id}`}
                    className="flex-shrink-0 w-32 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-800 dark:shadow-slate-950/30"
                  >
                    <div
                      className={`w-12 h-12 ${service.color} rounded-2xl flex items-center justify-center mb-2`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-slate-100">
                      {service.name}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Advertisement Carousel */}
        <div className="mb-6">
          <div className="px-5 mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              {t("home.advertisements")}
            </h2>
          </div>
          <div className="px-5">
            <Slider {...carouselSettings}>
              {isLoadingAds && (
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {t("home.loadingAdvertisements")}
                </div>
              )}
              {!isLoadingAds && adsError && (
                <div className="text-sm text-red-500">{t("home.unableAdvertisements")}</div>
              )}
              {!isLoadingAds &&
                !adsError &&
                advertisements.map((ad) => (
                  <div key={ad.id}>
                    <div
                      className={`bg-gradient-to-r ${ad.bgColor} rounded-2xl p-5 shadow-md overflow-hidden relative h-40`}
                    >
                      <div className="relative z-10 flex flex-col h-full justify-center">
                        <div>
                          <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
                            LIMITED TIME
                          </div>
                          <h3 className="text-white font-semibold text-xl mb-1">
                            {ad.title}
                          </h3>
                          <p className="text-white/90 text-sm">{ad.subtitle}</p>
                        </div>
                      </div>
                      {ad.image && (
                        <div
                          className="absolute right-0 top-0 w-1/2 h-full opacity-20"
                          style={{
                            backgroundImage: `url(${ad.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
            </Slider>
          </div>
        </div>

        {/* Footer Services Section */}
        <div className="px-5">
          <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-slate-100">
            {language === "my" ? "လူကြိုက်များသော ဝန်ဆောင်မှုများ" : t("home.popularServices")}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {popularServices.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.id}
                  to={`/service/${service.id}`}
                  className="rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-800 dark:shadow-slate-950/30"
                >
                  <div
                    className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="min-h-10 leading-5 font-medium text-gray-800 dark:text-slate-100">
                    {renderServiceTitle(service.name)}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {service.priceLabel}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
