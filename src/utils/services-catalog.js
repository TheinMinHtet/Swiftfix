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

  if (lowerName.includes("plumb")) return { icon: Wrench, color: "bg-blue-100 text-blue-600" };
  if (lowerName.includes("electric")) return { icon: Zap, color: "bg-yellow-100 text-yellow-600" };
  if (lowerName.includes("clean")) return { icon: Sparkles, color: "bg-green-100 text-green-600" };
  if (lowerName.includes("ac") || lowerName.includes("air")) return { icon: Wind, color: "bg-cyan-100 text-cyan-600" };
  if (lowerName.includes("appliance")) return { icon: Tv, color: "bg-purple-100 text-purple-600" };
  if (lowerName.includes("water") || lowerName.includes("gas")) return { icon: Droplet, color: "bg-sky-100 text-sky-600" };
  if (lowerName.includes("generator") || lowerName.includes("solar")) {
    return { icon: BatteryCharging, color: "bg-orange-100 text-orange-600" };
  }
  if (lowerName.includes("pest")) return { icon: Bug, color: "bg-red-100 text-red-600" };

  return { icon: Wrench, color: "bg-blue-100 text-blue-600" };
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
    unique.set(id, { id, name: name.trim(), ...getServiceMeta(name) });
  }

  return Array.from(unique.values());
}
