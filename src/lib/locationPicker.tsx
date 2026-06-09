import { useState, useRef, useEffect, useCallback } from "react";
import {
  Loader2,
  MapPin,
  Navigation,
  X,
  CheckCircle2,
  Building2,
  ChevronDown,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  type PickedLocation,
  type GLatLng,
  type GMap,
  type GAdvancedMarkerElement,
  type GMapMouseEvent,
  type GGeocoderResult,
  loadGoogleMaps,
  extractLocation,
  reverseGeocodeNominatim,
  shortLabel,
  coordsLabel,
  gmaps,
} from "@/lib/maps";

// ─── New Places library types ─────────────────────────────────────────────────

interface GPlaceResult {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: GLatLng;
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  fetchFields(opts: { fields: string[] }): Promise<{ place: GPlaceResult }>;
}

interface GPlacePrediction {
  placeId: string;
  text: { text: string };
  mainText: { text: string };
  secondaryText: { text: string };
  toPlace(): GPlaceResult;
}

interface GAutocompleteSuggestion {
  placePrediction: GPlacePrediction;
}

interface GPlacesLibrary {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(req: {
      input: string;
      sessionToken?: object;
      locationBias?: object;
      includedRegionCodes?: string[];
    }): Promise<{ suggestions: GAutocompleteSuggestion[] }>;
  };
  AutocompleteSessionToken: new () => object;
}

// ─── Internal suggestion shape ────────────────────────────────────────────────

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  placePrediction: GPlacePrediction;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation | null) => void;
  label?: string;
  confirmLabel?: string;
  hint?: string;
  compact?: boolean;
  boundsSW?: { lat: number; lng: number };
  boundsNE?: { lat: number; lng: number };
  defaultCenter?: { lat: number; lng: number };
  onConfirmed?: (loc: PickedLocation) => void;
  required?: boolean;
  disabled?: boolean;
}

// ─── Pin element ──────────────────────────────────────────────────────────────

// ─── Plus Code utilities ─────────────────────────────────────────────────────
const PLUS_CODE_RE =
  /[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}/i;

function isPlusCode(text: string): boolean {
  return PLUS_CODE_RE.test((text ?? "").trim());
}

function stripPlusCode(addr: string): string {
  return (addr ?? "")
    .replace(new RegExp(PLUS_CODE_RE.source + ",?\\s*", "gi"), "")
    .replace(/^[,\s]+/, "")
    .trim();
}

type AddrComp = { long_name?: string; longText?: string; types: string[] };

function buildReadableAddress(
  components: AddrComp[] | undefined,
  fallback: string,
): string {
  const nonPlus = (components ?? []).filter(
    (c) => !c.types.includes("plus_code"),
  );
  const text = (type: string) =>
    nonPlus.find((c) => c.types.includes(type))?.long_name ??
    nonPlus.find((c) => c.types.includes(type))?.longText ??
    "";

  const streetNum = text("street_number");
  const route = text("route");
  const hood =
    text("neighborhood") || text("sublocality_level_1") || text("sublocality");
  const city = text("locality");
  const admin =
    text("administrative_area_level_2") || text("administrative_area_level_1");

  const parts = [
    route ? (streetNum ? `${streetNum} ${route}` : route) : "",
    hood,
    city || admin,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : stripPlusCode(fallback) || fallback;
}

function createPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = [
    "width:22px",
    "height:22px",
    "border-radius:50%",
    "background:#f97316",
    "border:2.5px solid #ffffff",
    "box-shadow:0 1px 4px rgba(0,0,0,0.35)",
    "cursor:pointer",
  ].join(";");
  return el;
}

// ─────────────────────────────────────────────────────────────────────────────

export function LocationPicker({
  value,
  onChange,
  label = "Location",
  confirmLabel = "Location confirmed",
  hint,
  compact = false,
  boundsSW = { lat: -1.45, lng: 36.6 },
  boundsNE = { lat: -1.15, lng: 37.1 },
  defaultCenter = { lat: -1.286389, lng: 36.817223 },
  onConfirmed,
  required = false,
  disabled = false,
}: LocationPickerProps) {
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [selecting, setSelecting] = useState(false);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const markerRef = useRef<GAdvancedMarkerElement | null>(null);
  const placesLibRef = useRef<GPlacesLibrary | null>(null);
  const sessionTokRef = useRef<object | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerRef = useRef(defaultCenter);

  // ── Load Maps SDK, then eagerly load the places library ───────────────────
  useEffect(() => {
    loadGoogleMaps()
      .then(async () => {
        // importLibrary is the correct way to access new Places APIs
        const lib = await (
          window as unknown as {
            google: { maps: { importLibrary(n: string): Promise<unknown> } };
          }
        ).google.maps.importLibrary("places");
        placesLibRef.current = lib as GPlacesLibrary;
        setMapsReady(true);
      })
      .catch(() => setMapsError(true));
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const panTo = useCallback((lat: number, lng: number) => {
    if (!mapRef.current || !markerRef.current) return;
    const pos = { lat, lng };
    mapRef.current.panTo(pos);
    mapRef.current.setZoom(16);
    markerRef.current.position = pos;
    centerRef.current = pos;
  }, []);

  const commit = useCallback(
    (loc: PickedLocation) => {
      onChange(loc);
      panTo(loc.lat, loc.lng);
      onConfirmed?.(loc);
      setSearchText("");
      setSuggestions([]);
      setShowDropdown(false);
      setActiveIdx(-1);
    },
    [onChange, panTo, onConfirmed],
  );

  const geocodeLatLng = useCallback(
    (pos: GLatLng) => {
      setGeocoding(true);
      const { Geocoder } = gmaps();
      // new Geocoder().geocode({ location: pos }, (results, status) => {
      //   if (status === "OK" && results?.[0]) {
      //     commit(extractLocation(results[0], pos.lat(), pos.lng()));
      //   }
      //   setGeocoding(false);
      // });
      new Geocoder().geocode({ location: pos }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = extractLocation(results[0], pos.lat(), pos.lng());
          const readable = buildReadableAddress(
            results[0].address_components,
            loc.formatted_address,
          );
          commit({
            ...loc,
            formatted_address: readable,
            ...(isPlusCode(loc.name ?? "") && { name: readable }),
          });
        }
        setGeocoding(false);
      });
    },
    [commit],
  );

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapDivRef.current || mapRef.current) return;

    const center = value ? { lat: value.lat, lng: value.lng } : defaultCenter;
    centerRef.current = center;
    const g = gmaps();

    const map = new g.Map(mapDivRef.current, {
      center,
      zoom: value ? 15 : 13,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "cooperative",
      mapId: "qavaeat_location_picker",
      // NOTE: styles[] must NOT be used with mapId — cloud console controls styling
    });

    const marker = new g.marker.AdvancedMarkerElement({
      map,
      position: center,
      content: createPinElement(),
      gmpDraggable: !disabled,
    });

    if (!disabled) {
      marker.addListener("dragend", () => {
        const p = marker.position;
        if (!p) return;
        const lat =
          typeof (p as GLatLng).lat === "function"
            ? (p as GLatLng).lat()
            : (p as { lat: number }).lat;
        const lng =
          typeof (p as GLatLng).lng === "function"
            ? (p as GLatLng).lng()
            : (p as { lng: number }).lng;
        geocodeLatLng({ lat: () => lat, lng: () => lng } as GLatLng);
      });
      map.addListener("click", (e: GMapMouseEvent) => {
        if (!e.latLng) return;
        marker.position = e.latLng;
        geocodeLatLng(e.latLng);
      });
    }

    mapRef.current = map;
    markerRef.current = marker;
    setMapLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady]);

  // ── Fetch autocomplete suggestions ────────────────────────────────────────
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 2 || !placesLibRef.current) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const { AutocompleteSuggestion, AutocompleteSessionToken } =
      placesLibRef.current;

    // Reuse session token — reset it after a place is selected (in commit)
    if (!sessionTokRef.current) {
      sessionTokRef.current = new AutocompleteSessionToken();
    }

    try {
      const { suggestions: raw } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionTokRef.current,
          locationBias: {
            // Circle bias — center on current pin, 50 km radius
            center: centerRef.current,
            radius: 50_000,
          },
          includedRegionCodes: ["ke"],
        });

      const mapped: Suggestion[] = (raw ?? [])
        .filter((s) => s.placePrediction)
        .map((s) => ({
          placeId: s.placePrediction.placeId,
          mainText:
            s.placePrediction.mainText?.text ?? s.placePrediction.text.text,
          secondaryText: s.placePrediction.secondaryText?.text ?? "",
          placePrediction: s.placePrediction,
        }));

      setSuggestions(mapped);
      setShowDropdown(mapped.length > 0);
      setActiveIdx(-1);
    } catch (err) {
      console.error(
        "[LocationPicker] fetchAutocompleteSuggestions failed:",
        err,
      );
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchText(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchSuggestions(v), 220);
  };

  // ── Select a suggestion ───────────────────────────────────────────────────
  const selectSuggestion = useCallback(
    async (s: Suggestion) => {
      setSelecting(true);
      setShowDropdown(false);
      setSearchText(s.mainText);

      try {
        const place = s.placePrediction.toPlace();
        // fetchFields returns { place } — the same object, now populated
        await place.fetchFields({
          fields: [
            "displayName",
            "formattedAddress",
            "location",
            "id",
            "addressComponents",
          ],
        });

        // const lat = place.location?.lat() ?? 0;
        // const lng = place.location?.lng() ?? 0;

        // commit(
        //   extractLocation(
        //     {
        //       formatted_address: place.formattedAddress,
        //       name: place.displayName,
        //       place_id: place.id,
        //       geometry: place.location
        //         ? { location: place.location }
        //         : undefined,
        //       address_components: place.addressComponents?.map((c) => ({
        //         long_name: c.longText,
        //         short_name: c.shortText,
        //         types: c.types,
        //       })),
        //     },
        //     lat,
        //     lng,
        //   ),
        // );
        const lat = place.location?.lat() ?? 0;
        const lng = place.location?.lng() ?? 0;

        const normalizedComponents = place.addressComponents?.map((c) => ({
          long_name: c.longText,
          short_name: c.shortText,
          types: c.types,
        }));

        const cleanAddr = buildReadableAddress(
          normalizedComponents,
          place.formattedAddress ?? "",
        );
        const cleanName = isPlusCode(place.displayName ?? "")
          ? cleanAddr
          : (place.displayName ?? cleanAddr);

        commit(
          extractLocation(
            {
              formatted_address: cleanAddr,
              name: cleanName,
              place_id: place.id,
              geometry: place.location
                ? { location: place.location }
                : undefined,
              address_components: normalizedComponents,
            },
            lat,
            lng,
          ),
        );

        // Reset session token after a completed selection (billing best practice)
        sessionTokRef.current = null;
      } catch (err) {
        console.error("[LocationPicker] place fetchFields failed:", err);
        toast.error(
          "Couldn't load place details — tap the map to set location",
        );
      } finally {
        setSelecting(false);
      }
    },
    [commit],
  );

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = suggestions[activeIdx] ?? suggestions[0];
      if (target) void selectSuggestion(target);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  // ── GPS ────────────────────────────────────────────────────────────────────
  const handleGps = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          let loc: PickedLocation;
          if (mapsReady) {
            const { Geocoder } = gmaps();
            const results = await new Promise<GGeocoderResult[]>((res, rej) => {
              new Geocoder().geocode(
                { location: { lat, lng } },
                (r: GGeocoderResult[] | null, s: string) => {
                  if (s === "OK" && r?.length) res(r);
                  else rej(new Error(s ?? "No results"));
                },
              );
            });
            // loc = extractLocation(results[0]!, lat, lng);
            const rawLoc = extractLocation(results[0]!, lat, lng);
            const readable = buildReadableAddress(
              results[0]!.address_components,
              rawLoc.formatted_address,
            );
            loc = {
              ...rawLoc,
              formatted_address: readable,
              ...(isPlusCode(rawLoc.name ?? "") && { name: readable }),
            };
          } else {
            loc = await reverseGeocodeNominatim(lat, lng);
          }
          commit(loc);
        } catch {
          toast.error("Couldn't detect location — search or tap the map");
        } finally {
          setGeocoding(false);
        }
      },
      () => {
        toast.error("Location access denied — search or tap the map");
        setGeocoding(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleClear = () => {
    onChange(null);
    setSearchText("");
    setSuggestions([]);
    setShowDropdown(false);
    sessionTokRef.current = null;
    if (markerRef.current) {
      markerRef.current.position = defaultCenter;
      mapRef.current?.panTo(defaultCenter);
      mapRef.current?.setZoom(13);
    }
  };

  // ── Compact chip ───────────────────────────────────────────────────────────
  if (compact) {
    return (
      <button
        type="button"
        disabled={disabled}
        className="flex items-center gap-1.5 text-xs font-semibold border border-border rounded-xl px-3 py-1.5 bg-background hover:bg-muted transition-colors max-w-[220px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
        <span className="truncate text-foreground">
          {value ? shortLabel(value) : label}
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      </button>
    );
  }

  // ── Full picker ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2 w-full">
      <label className="text-xs font-black text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      {hint && !value && (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      )}

      {/* ── Map container ── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-border shadow-sm"
        style={{ height: "clamp(300px, 55vw, 440px)" }}
      >
        {/* ── Search overlay ── */}
        {!disabled && (
          <div
            className="absolute top-3 left-3 z-20"
            style={{ right: "calc(7rem + 0.75rem)" }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />

              <input
                ref={inputRef}
                type="text"
                value={searchText}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Search address…"
                autoComplete="off"
                className="w-full pl-9 pr-8 py-2 h-9 text-xs rounded-xl border border-border bg-background/95 backdrop-blur-sm text-foreground placeholder:text-muted-foreground shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />

              {selecting ? (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-primary z-10" />
              ) : searchText ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSearchText("");
                    setSuggestions([]);
                    setShowDropdown(false);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}

              {/* ── Suggestions dropdown ── */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.placeId}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void selectSuggestion(s)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                        i === activeIdx ? "bg-primary/10" : "hover:bg-muted/60"
                      } ${i > 0 ? "border-t border-border/50" : ""}`}
                    >
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {s.mainText}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {s.secondaryText}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── GPS button ── */}
        {/* ── GPS button ── */}
        {!disabled && (
          <button
            type="button"
            onClick={() => void handleGps()}
            disabled={geocoding}
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 h-9 px-3 rounded-xl bg-background/95 backdrop-blur-sm border border-border shadow-md text-foreground hover:bg-muted transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {geocoding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
                <span className="text-[11px] font-semibold text-primary">
                  Locating…
                </span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-[11px] font-semibold">My Location</span>
              </>
            )}
          </button>
        )}

        {/* ── Map loading skeleton ── */}
        {(mapLoading || !mapsReady) && !mapsError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/60 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-[11px] text-muted-foreground">Loading map…</p>
          </div>
        )}

        {/* ── Geocoding overlay ── */}
        {geocoding && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full border border-border shadow-md whitespace-nowrap">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            Resolving address…
          </div>
        )}

        {/* ── Map canvas ── */}
        <div ref={mapDivRef} className="w-full h-full" />

        {/* ── Bottom hint ── */}
        {!disabled && mapsReady && !mapLoading && (
          <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
            <p className="text-[10px] text-center text-foreground/70 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
              {value
                ? "Drag the pin or tap anywhere to adjust"
                : "Search above, use GPS, or tap the map"}
            </p>
          </div>
        )}

        {/* ── Maps error ── */}
        {mapsError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80 z-10 px-6 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">
              Map unavailable
            </p>
            <p className="text-[10px] text-muted-foreground">
              Check your API key or internet connection
            </p>
          </div>
        )}
      </div>

      {/* ── Confirmed address pill ── */}
      {value ? (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-0.5">
              {confirmLabel}
            </p>
            {/* {value.name && (
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                {value.name}
              </p>
            )} */}
            {/* Name — only show if it isn't itself a Plus Code */}

            {/* <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
              {value.formatted_address}
            </p> */}

            {value.name && !isPlusCode(value.name) && (
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                {value.name}
              </p>
            )}
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
              {stripPlusCode(value.formatted_address)}
            </p>
            {(value.road ?? value.suburb ?? value.city) && (
              <p className="text-[9px] text-emerald-600/80 dark:text-emerald-500 truncate mt-0.5">
                {[value.road, value.suburb, value.city, value.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="text-[9px] text-emerald-600/60 dark:text-emerald-600 mt-0.5 font-mono">
              {coordsLabel(value)}
              {value.place_id && (
                <span className="ml-2 opacity-70">
                  · {value.place_id.slice(0, 16)}…
                </span>
              )}
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-emerald-600/50 hover:text-destructive dark:text-emerald-600 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border bg-muted/20">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            No location set — search, use GPS, or tap the map
          </p>
        </div>
      )}
    </div>
  );
}
