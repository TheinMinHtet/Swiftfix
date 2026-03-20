import { Wrench, Zap, Sparkles, Wind, Tv, Droplet, BatteryCharging, Bug } from "lucide-react";

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getServiceMeta(name) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("plumb")) {
    return {
      icon: Wrench,
      color: "bg-blue-100 text-blue-600",
      shortDescription: "Pipes, leaks, and fixture repairs",
    };
  }
  if (lowerName.includes("electric")) {
    return {
      icon: Zap,
      color: "bg-yellow-100 text-yellow-600",
      shortDescription: "Safe electrical repair and installation",
    };
  }
  if (lowerName.includes("clean")) {
    return {
      icon: Sparkles,
      color: "bg-green-100 text-green-600",
      shortDescription: "Home and office cleaning support",
    };
  }
  if (lowerName.includes("ac") || lowerName.includes("air")) {
    return {
      icon: Wind,
      color: "bg-cyan-100 text-cyan-600",
      shortDescription: "Cooling system service and maintenance",
    };
  }
  if (lowerName.includes("appliance")) {
    return {
      icon: Tv,
      color: "bg-purple-100 text-purple-600",
      shortDescription: "Fixes for home appliance issues",
    };
  }
  if (lowerName.includes("water") || lowerName.includes("gas")) {
    return {
      icon: Droplet,
      color: "bg-sky-100 text-sky-600",
      shortDescription: "Water and gas system support",
    };
  }
  if (lowerName.includes("generator") || lowerName.includes("solar")) {
    return {
      icon: BatteryCharging,
      color: "bg-orange-100 text-orange-600",
      shortDescription: "Power backup and energy solutions",
    };
  }
  if (lowerName.includes("pest")) {
    return {
      icon: Bug,
      color: "bg-red-100 text-red-600",
      shortDescription: "Protection from pests and insects",
    };
  }

  return {
    icon: Wrench,
    color: "bg-blue-100 text-blue-600",
    shortDescription: "Trusted help for everyday service needs",
  };
}

function extractServiceName(service) {
  if (!service) return null;
  if (typeof service === "string") return service;
  if (typeof service === "object") {
    return (
      service["Mini_Shin__serviceName__CST"] ||
      service.serviceName ||
      service.Mini_Shin__name__CST ||
      service.name ||
      null
    );
  }
  return null;
}

function formatMMK(amount) {
  return `${amount.toLocaleString()} MMK`;
}

function extractServicePriceData(service) {
  const baseAmount = service?.Mini_Shin__baseAmount__CST ?? service?.baseAmount;
  const priceFrom = service?.Mini_Shin__priceFrom__CST ?? service?.priceFrom;
  const priceTo = service?.Mini_Shin__priceTo__CST ?? service?.priceTo;

  const normalizedBaseAmount = typeof baseAmount === "number" ? baseAmount : null;
  const normalizedPriceFrom = typeof priceFrom === "number" ? priceFrom : null;
  const normalizedPriceTo = typeof priceTo === "number" ? priceTo : null;

  let priceLabel = "Price unavailable";

  if (normalizedBaseAmount !== null) {
    priceLabel = `Starting at ${formatMMK(normalizedBaseAmount)}`;
  } else if (normalizedPriceFrom !== null && normalizedPriceTo !== null) {
    priceLabel =
      normalizedPriceFrom === normalizedPriceTo
        ? formatMMK(normalizedPriceFrom)
        : `${formatMMK(normalizedPriceFrom)} - ${formatMMK(normalizedPriceTo)}`;
  } else if (normalizedPriceFrom !== null) {
    priceLabel = `Starting at ${formatMMK(normalizedPriceFrom)}`;
  }

  return {
    baseAmount: normalizedBaseAmount,
    priceFrom: normalizedPriceFrom,
    priceTo: normalizedPriceTo,
    priceLabel,
  };
}

function extractServiceDescription(service, fallbackDescription) {
  const description =
    service?.Mini_Shin__description__CST ||
    service?.description ||
    service?.Mini_Shin__shortDescription__CST ||
    service?.shortDescription ||
    "";

  if (typeof description === "string" && description.trim()) {
    return description.trim();
  }

  return fallbackDescription;
}

export function mapApiServicesToCatalog(rawServices) {
  if (!Array.isArray(rawServices)) return [];

  const unique = new Map();
  for (const service of rawServices) {
    const name = extractServiceName(service);
    if (!name) continue;
    const id =
      (typeof service?.Mini_Shin__serviceId__CST === "string" && service.Mini_Shin__serviceId__CST.trim()) ||
      (typeof service?.serviceId === "string" && service.serviceId.trim()) ||
      (typeof service?.Mini_Shin__id__CST === "string" && service.Mini_Shin__id__CST.trim()) ||
      (typeof service?.id === "string" && service.id.trim()) ||
      toSlug(name);
    if (!id || unique.has(id)) continue;
    const meta = getServiceMeta(name);
    unique.set(id, {
      id,
      name: name.trim(),
      ...meta,
      shortDescription: extractServiceDescription(service, meta.shortDescription),
      ...extractServicePriceData(service),
    });
  }

  return Array.from(unique.values());
}
