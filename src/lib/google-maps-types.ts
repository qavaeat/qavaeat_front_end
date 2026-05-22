export interface GLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GLatLng {
  lat(): number;
  lng(): number;
}

export type GLatLngBounds = object

export interface GMapMouseEvent {
  latLng: GLatLng | null;
}

// ─── Address components ───────────────────────────────────────────────────────

export interface GAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// ─── Map ─────────────────────────────────────────────────────────────────────

export interface GMapOptions {
  center?: GLatLngLiteral;
  zoom?: number;
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  gestureHandling?: string;
  styles?: object[];
  /** Required for AdvancedMarkerElement — use any unique string e.g. "map" */
  mapId?: string;
}

// REPLACE the GMap interface with:
export interface GMap {
  panTo(pos: GLatLngLiteral | GLatLng): void;
  setZoom(zoom: number): void;
  addListener(event: string, handler: (event: GMapMouseEvent) => void): void;
}

// ─── Legacy Marker (kept — not yet discontinued) ──────────────────────────────

export interface GMarkerIcon {
  path: GSymbolPath;
  scale: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
}

export interface GMarkerOptions {
  map?: GMap;
  position?: GLatLngLiteral | GLatLng;
  draggable?: boolean;
  icon?: GMarkerIcon;
}

export interface GMarker {
  setPosition(pos: GLatLngLiteral | GLatLng | null): void;
  getPosition(): GLatLng | null | undefined;
  addListener(event: string, handler: (...args: unknown[]) => void): void;
}

// ─── AdvancedMarkerElement (replaces Marker) ──────────────────────────────────

export interface GAdvancedMarkerElementOptions {
  map?: GMap;
  position?: GLatLngLiteral | GLatLng;
  /** Custom HTML element for the pin; omit for the default red pin */
  content?: HTMLElement;
  /** Allow the user to drag the marker */
  gmpDraggable?: boolean;
}

// REPLACE the GAdvancedMarkerElement interface with:
export interface GAdvancedMarkerElement {
  position: GLatLngLiteral | GLatLng | null;
  map: GMap | null;
  addListener(event: string, handler: (...args: unknown[]) => void): void;
}

// ─── Symbol path enum values ──────────────────────────────────────────────────
// Typed as a const object instead of an enum to avoid namespace issues.

export type GSymbolPath = 0 | 1 | 2 | 3 | 4;

export const GSymbolPath = {
  CIRCLE: 0,
  FORWARD_CLOSED_ARROW: 1,
  FORWARD_OPEN_ARROW: 2,
  BACKWARD_CLOSED_ARROW: 3,
  BACKWARD_OPEN_ARROW: 4,
} as const satisfies Record<string, GSymbolPath>;

// ─── Geocoder ────────────────────────────────────────────────────────────────

export interface GGeocoderResult {
  formatted_address: string;
  place_id: string;
  address_components: GAddressComponent[];
  geometry: { location: GLatLng };
}

export type GGeocoderCallback = (
  results: GGeocoderResult[] | null,
  status: string,
) => void;

export interface GGeocoder {
  geocode(
    req: { location?: GLatLngLiteral | GLatLng; address?: string },
    cb: GGeocoderCallback,
  ): void;
}

// ─── Places ───────────────────────────────────────────────────────────────────

export interface GPlaceResult {
  formatted_address?: string;
  name?: string;
  place_id?: string;
  geometry?: { location: GLatLng };
  address_components?: GAddressComponent[];
}

export interface GAutocompleteOptions {
  bounds?: GLatLngBounds;
  fields?: string[];
  types?: string[];
}

/** Legacy Autocomplete — kept for reference but no longer instantiated */
export interface GAutocomplete {
  getPlace(): GPlaceResult;
  addListener(event: string, handler: () => void): void;
}

/**
 * PlaceAutocompleteElement — the new element-based autocomplete.
 * Extends HTMLElement so it can be appended to the DOM directly.
 * The `gmp-placeselect` event fires when the user picks a suggestion.
 */
export interface GPlaceAutocompleteElement {
  style: CSSStyleDeclaration;
  addEventListener(
    type: "gmp-placeselect",
    listener: (e: GPlaceSelectEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
}
export interface GPlacePrediction {
  toPlace(): GPlaceFromPrediction;
}

export interface GPlaceFromPrediction {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: GLatLng;
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  fetchFields(opts: { fields: string[] }): Promise<void>;
}

export interface GPlaceSelectEvent extends Event {
  placePrediction: GPlacePrediction;
}

// ─── The window.google shape (only what we access) ───────────────────────────

export interface GoogleMapsWindow {
  maps: {
    Map: new (el: HTMLElement, opts?: GMapOptions) => GMap;
    Marker: new (opts?: GMarkerOptions) => GMarker;
    Geocoder: new () => GGeocoder;
    LatLng: new (lat: number, lng: number) => GLatLng;
    LatLngBounds: new (sw: GLatLngLiteral, ne: GLatLngLiteral) => GLatLngBounds;
    SymbolPath: typeof GSymbolPath;
    /** New marker library — loaded via libraries=marker */
    marker: {
      AdvancedMarkerElement: new (opts?: GAdvancedMarkerElementOptions) => GAdvancedMarkerElement;
    };
   places: {
  Autocomplete: new (
    input: HTMLInputElement,
    opts?: GAutocompleteOptions,
  ) => GAutocomplete;
  PlaceAutocompleteElement: new (opts?: {
    locationBias?: GLatLngBounds;
    requestedLanguage?: string;
    types?: string[];
  }) => GPlaceAutocompleteElement;
};
  };
}