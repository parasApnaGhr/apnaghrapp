import { getMediaUrl } from "../utils/api";

export type NormalizedProperty = {
  id: string;
  title: string;
  location: string;
  city: string;
  areaName: string;
  rent: number;
  bhk: number | null;
  furnishing: string;
  propertyType: string;
  amenities: string[];
  images: string[];
  image: string;
  description: string;
  verified: boolean;
  hot: boolean;
  premium: boolean;
  latitude?: number | null;
  longitude?: number | null;
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN").format(Math.round(value));
};

export const normalizeProperty = (property: Record<string, any>): NormalizedProperty => {
  const images = Array.isArray(property?.images) ? property.images : [];
  const title = property?.title || "Untitled property";
  const areaName = property?.area_name || property?.area || "";
  const city = property?.city || "";
  const location = [areaName, city].filter(Boolean).join(", ") || "Location unavailable";

  return {
    id: property?.id || property?._id || "",
    title,
    location,
    city,
    areaName,
    rent: Number(property?.rent || property?.price || 0),
    bhk: typeof property?.bhk === "number" ? property.bhk : null,
    furnishing: property?.furnishing || "Semi-furnished",
    propertyType: property?.property_type || property?.type || "Apartment",
    amenities: Array.isArray(property?.amenities) ? property.amenities : [],
    images,
    image: images[0] ? getMediaUrl(images[0], "property") : getMediaUrl("", "property"),
    description: property?.description || "No description available yet.",
    verified: Boolean(property?.verified_owner || property?.verified),
    hot: Boolean(property?.is_hot),
    premium: Boolean(property?.premium_listing),
    latitude: property?.latitude,
    longitude: property?.longitude,
  };
};

export const getGreeting = (): string => {
  const hours = new Date().getHours();
  if (hours < 12) return "Good morning";
  if (hours < 18) return "Good afternoon";
  return "Good evening";
};
