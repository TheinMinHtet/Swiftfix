import { Search, MapPin, ChevronDown, Heart, Bell, Award } from "lucide-react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { useEffect, useState } from "react";
import { getServices } from "../../../api/services-api";
import { getAdvertisements } from "../../../api/ads-api";
import { mapApiServicesToCatalog } from "../../utils/services-catalog";
import { getUsers } from "../../../api/user-api";
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

export function Home() {
  const [userPoints, setUserPoints] = useState(0);
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
        const users = await getUsers("USR-1001");
        const user = users?.[0];
        const points = user?.Mini_Shin__points__CST ?? user?.points ?? 0;
        if (isMounted) setUserPoints(points);
      } catch (error) {
        console.error("Failed to load user points:", error);
        if (isMounted) setUserPoints(0);
      }
    };

    loadUserPoints();
    return () => {
      isMounted = false;
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-blue-600 px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-blue-100 text-sm">Welcome !</p>
            <h1 className="text-white text-2xl mt-1">Aung Ko Ko</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Top Right Icons */}
            <button className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors relative">
              <Heart className="w-5 h-5 text-white" />
            </button>
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
                  Current Points
                </p>
                <p className="text-yellow-900 font-semibold text-lg">
                  {userPoints} pts
                </p>
              </div>
            </div>
            <div>
              <span className="bg-white/80 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                Active
              </span>
            </div>
          </div>
        </Link>

        {/* Location Selector */}
        <button className="flex items-center gap-2 text-white mb-6">
          <MapPin className="w-5 h-5" />
          <span className="text-sm">Yangon, Downtown</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Search Bar */}
        <Link
          to="/services"
          state={{ focusSearch: true }}
          aria-label="Go to services search"
          className="w-full bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm text-left"
        >
          <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <span className="flex-1 text-sm text-gray-400">
            What service do you need?
          </span>
        </Link>
      </div>

      <div className="py-6">
        {/* Service Categories - Horizontal Scroll */}
        <div className="mb-6">
          <div className="px-5 mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Our Services
            </h2>
            <Link to="/services" className="text-blue-600 text-sm font-medium">
              See All
            </Link>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-5 mb-1">
              {isLoadingServices && (
                <div className="text-sm text-gray-500">Loading services...</div>
              )}
              {!isLoadingServices && servicesError && (
                <div className="text-sm text-red-500">{servicesError}</div>
              )}
              {filteredServices.map((service) => {
                const Icon = service.icon;
                return (
                  <Link
                    key={service.id}
                    to={`/service/${service.id}`}
                    className="flex-shrink-0 w-32 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`w-12 h-12 ${service.color} rounded-2xl flex items-center justify-center mb-2`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-gray-800 font-medium text-sm">
                      {service.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">Professional</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Advertisement Carousel */}
        <div className="mb-6">
          <div className="px-5 mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Advertisements
            </h2>
          </div>
          <div className="px-5">
            <Slider {...carouselSettings}>
              {isLoadingAds && (
                <div className="text-sm text-gray-500">
                  Loading advertisements...
                </div>
              )}
              {!isLoadingAds && adsError && (
                <div className="text-sm text-red-500">{adsError}</div>
              )}
              {!isLoadingAds &&
                !adsError &&
                advertisements.map((ad) => (
                  <div key={ad.id}>
                    <div
                      className={`bg-gradient-to-r ${ad.bgColor} rounded-2xl p-5 shadow-md overflow-hidden relative h-40`}
                    >
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                          <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
                            LIMITED TIME
                          </div>
                          <h3 className="text-white font-semibold text-xl mb-1">
                            {ad.title}
                          </h3>
                          <p className="text-white/90 text-sm">{ad.subtitle}</p>
                        </div>
                        <button className="bg-white text-blue-600 mt-2 px-3 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors w-fit">
                          Claim Now
                        </button>
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
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Popular Services
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {filteredServices.slice(0, 4).map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.id}
                  to={`/service/${service.id}`}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-gray-800 font-medium">{service.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">
                    Starting at 15,000 MMK
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
