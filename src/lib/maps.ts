import type {
  GoogleMapsWindow,
  GPlaceResult,
  GGeocoderResult,
} from "@/lib/google-maps-types";

export type {
  GMap, GMarker, GMarkerOptions, GMapOptions,
  GLatLng, GLatLngLiteral,
  GPlaceResult, GGeocoderResult,
  GAutocompleteOptions, GLatLngBounds,
  GoogleMapsWindow,
  GMapMouseEvent,
  GAdvancedMarkerElement,
  GAdvancedMarkerElementOptions,
  GPlaceAutocompleteElement,
  GPlaceSelectEvent,
  GPlacePrediction,
  GPlaceFromPrediction,
} from "@/lib/google-maps-types";
export { GSymbolPath } from "@/lib/google-maps-types";

// ─── Typed window.google accessor ────────────────────────────────────────────
// Single cast in one place — every other file calls gmaps() cleanly.

export function gmaps(): GoogleMapsWindow["maps"] {
  return (window as unknown as { google: GoogleMapsWindow }).google.maps;
}

export function googleMapsLoaded(): boolean {
  const win = window as unknown as { google?: GoogleMapsWindow };
  return typeof window !== "undefined" && !!win.google?.maps;
}

// ─── Shared location type ─────────────────────────────────────────────────────

export interface PickedLocation {
  /** Full human-readable address e.g. "Tom Mboya St, Nairobi CBD, Nairobi" */
  formatted_address: string;
  lat: number;
  lng: number;
  /** Google Place ID — useful for future lookups / deduplication */
  place_id?: string;
  /** Named POI if the pin is on one, e.g. "Westgate Shopping Mall" */
  name?: string;
  road?: string;
  suburb?: string;
  city?: string;
  country?: string;
  postal_code?: string;
}

// ─── Singleton Maps SDK loader ────────────────────────────────────────────────

let mapsLoadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (mapsLoadPromise) return mapsLoadPromise;
  if (googleMapsLoaded()) {
    mapsLoadPromise = Promise.resolve();
    return mapsLoadPromise;
  }
  mapsLoadPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
    if (!key) {
      console.warn("[LocationPicker] NEXT_PUBLIC_GOOGLE_MAPS_KEY not set — Maps UI disabled");
      reject(new Error("No API key"));
      return;
    }
    // Use the callback pattern — fires only after the full SDK including
    // the places library is initialised, not just when the script tag loads.
    const callbackName = "__googleMapsReady";
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      resolve();
    };
    const script = document.createElement("script");
    // FIX: added loading=async (removes suboptimal performance warning)
    // FIX: added marker library (required for AdvancedMarkerElement)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,marker&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

// ─── Extract a PickedLocation from a Places / Geocoder result ─────────────────

type LocationSource = GPlaceResult | GGeocoderResult;

export function extractLocation(
  place: LocationSource,
  lat: number,
  lng: number,
): PickedLocation {
  const comps = place.address_components ?? [];
  const get = (...types: string[]) =>
    comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name;

  const name = "name" in place ? place.name : undefined;

  return {
    formatted_address:
      place.formatted_address ?? name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat,
    lng,
    place_id: place.place_id,
    name: name !== place.formatted_address ? name : undefined,
    road: get("route"),
    suburb: get("sublocality", "sublocality_level_1", "neighborhood"),
    city: get("locality", "administrative_area_level_2"),
    country: get("country"),
    postal_code: get("postal_code"),
  };
}

// ─── Nominatim reverse-geocode (free fallback, no API key needed) ─────────────

export async function reverseGeocodeNominatim(lat: number, lng: number): Promise<PickedLocation> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { "Accept-Language": "en" } },
  );
  const json = await res.json();
  const addr = json?.address ?? {};
  const parts = [
    addr.road ?? addr.pedestrian,
    addr.suburb ?? addr.neighbourhood ?? addr.quarter,
    addr.city ?? addr.town ?? addr.county,
  ].filter(Boolean);
  return {
    formatted_address:
      parts.join(", ") || json?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat,
    lng,
    road: addr.road ?? addr.pedestrian,
    suburb: addr.suburb ?? addr.neighbourhood,
    city: addr.city ?? addr.town ?? addr.county,
    country: addr.country,
    postal_code: addr.postcode,
  };
}

// ─── Format helpers ───────────────────────────────────────────────────────────

/** Short label for tight UI spaces: "Westgate Mall" or "Tom Mboya St, CBD" */
export function shortLabel(loc: PickedLocation): string {
  return (
    loc.name ??
    (loc.road
      ? `${loc.road}${loc.suburb ? `, ${loc.suburb}` : ""}`
      : loc.city ?? loc.formatted_address)
  );
}

/** Coordinate string for display */
export function coordsLabel(loc: PickedLocation): string {
  return `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
}