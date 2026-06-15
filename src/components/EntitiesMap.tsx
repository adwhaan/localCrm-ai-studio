import React, { useEffect, useState, useMemo } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin as MapPinPin, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Building, MapPin, Search, AlertCircle, Globe, Shield, Activity, Compass } from "lucide-react";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.trim().length > 10;

interface EntitiesMapProps {
  entities: any[];
  onSelectEntity: (entity: any) => void;
}

export function EntitiesMap({ entities, onSelectEntity }: EntitiesMapProps) {
  if (!hasValidKey) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto my-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3.5 mb-6 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Shield className="w-6 h-6 text-indigo-400 shrink-0" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Google Maps API Key Required</h3>
            <p className="text-xs text-slate-400">Regional coverage and geospatial visualizations require a valid Google Maps Platform credential.</p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300 font-sans">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
            <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[9.5px] block font-mono">Step 1: Get Google Maps Key</span>
            <p className="text-slate-300">
              Obtain an API key from the GCP Console with <strong className="text-white">Maps JavaScript API</strong> and the <strong className="text-white">Geocoding API</strong> enabled.
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-350 hover:underline inline-flex items-center gap-1 font-bold ml-1.5"
              >
                Get a Key <Globe className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
            <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[9.5px] block font-mono">Step 2: Save Secret Workspace Variable</span>
            <p className="text-slate-300">
              Paste the key directly into AI Studio Secrets:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-0.5 text-[11px] text-slate-400">
              <li>Open <strong className="text-slate-200">Settings</strong> (⚙️ gear icon, top-right panel corner)</li>
              <li>Select <strong className="text-slate-200">Secrets</strong></li>
              <li>Add a new secret named <code className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">GOOGLE_MAPS_PLATFORM_KEY</code></li>
              <li>Paste your key code, and press <strong className="text-slate-200">Enter / Save</strong></li>
            </ol>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              Note: The environment control plane automatically triggers a container rebuild when the secrets are changed - no manual page refresh is needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar directory listing */}
        <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-[500px]">
          <div className="mb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              Territory Roster ({entities.length})
            </h4>
            <p className="text-[10px] text-slate-500">Click any company card to center bounding coordinates</p>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: "thin" }}>
            {entities.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No matching accounts in active viewport filters.
              </div>
            ) : (
              entities.map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => onSelectEntity(ent)}
                  className="w-full text-left bg-white hover:bg-slate-100/90 border border-slate-200 p-2.5 rounded-lg transition duration-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 group block"
                >
                  <div className="font-extrabold text-xs text-slate-900 truncate group-hover:text-indigo-600 transition">
                    {ent.name}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{ent.location || "No HQ Address Defined"}</span>
                  </div>
                  {ent.tier && (
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[8px] font-extrabold uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                        {ent.tier}
                      </span>
                      {ent.City && (
                        <span className="text-[9px] text-slate-400 font-medium truncate font-mono">
                          {ent.City}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Map Canvas Component */}
        <div className="lg:col-span-3 border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[500px] relative bg-slate-100 flex flex-col justify-between">
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs border border-slate-200 py-1 px-2.5 rounded-lg text-[9.5px] font-mono text-slate-600 z-10 font-bold flex items-center gap-1.5 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: "6s" }} />
            REAL-TIME GEOSPATIAL LAYOUT ACTIVE
          </div>

          <APIProvider apiKey={API_KEY} version="weekly">
            <MapContainer entities={entities} onSelectEntity={onSelectEntity} />
          </APIProvider>
        </div>
      </div>
    </div>
  );
}

// Separate container inside APIProvider to access SDK libraries safely through vis.gl hooks
function MapContainer({ entities, onSelectEntity }: { entities: any[]; onSelectEntity: (entity: any) => void }) {
  const geocodingLib = useMapsLibrary("geocoding");
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 39.8283, lng: -98.5795 }); // Default USA Center
  const [zoom, setZoom] = useState<number>(3);
  const [geocodedPins, setGeocodedPins] = useState<Record<string, { lat: number; lng: number; error?: boolean }>>({});
  const [hoveredEntity, setHoveredEntity] = useState<any | null>(null);

  // Parse or geocode each location as they are queried/loaded
  useEffect(() => {
    if (!geocodingLib) return;

    entities.forEach((ent) => {
      const loc = (ent.location || "").trim();
      const lookupAddress = [loc, ent.City, ent.Postalcode].filter(Boolean).join(", ");
      if (!lookupAddress) return;

      // Avoid double-geocoding already analyzed or errored locations
      if (geocodedPins[ent.id]) return;

      // If location matches coordinates format (lat, lng), use directly
      const isCoords = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(loc);
      if (isCoords) {
        const [latStr, lngStr] = loc.split(",");
        setGeocodedPins((prev) => ({
          ...prev,
          [ent.id]: { lat: parseFloat(latStr), lng: parseFloat(lngStr) }
        }));
        return;
      }

      // Geocode using official SDK client
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ address: lookupAddress }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const geom = results[0].geometry.location;
          setGeocodedPins((prev) => ({
            ...prev,
            [ent.id]: { lat: geom.lat(), lng: geom.lng() }
          }));
        } else {
          // Flag fallback or soft random coordinates so pins do not render stacked on exactly 0,0
          setGeocodedPins((prev) => ({
            ...prev,
            [ent.id]: { 
              lat: 39.8283 + (Math.random() - 0.5) * 8, 
              lng: -98.5795 + (Math.random() - 0.5) * 15, 
              error: true 
            }
          }));
        }
      });
    });
  }, [geocodingLib, entities, geocodedPins]);

  // Handle re-centering when corporate cards are selected
  const handlePinClicked = (ent: any) => {
    onSelectEntity(ent);
    const pin = geocodedPins[ent.id];
    if (pin) {
      setMapCenter({ lat: pin.lat, lng: pin.lng });
      setZoom(11);
    }
  };

  // Center on multiple markers gracefully
  useEffect(() => {
    if (entities.length === 1 && entities[0]) {
      const singlePin = geocodedPins[entities[0].id];
      if (singlePin) {
        setMapCenter({ lat: singlePin.lat, lng: singlePin.lng });
        setZoom(10);
      }
    } else if (entities.length > 1) {
      const pinValues = Object.keys(geocodedPins).map((key) => geocodedPins[key]);
      const validPins = pinValues.filter((p) => p && !p.error);
      if (validPins.length > 0) {
        const sumLat = validPins.reduce((sum, p) => sum + p.lat, 0);
        const sumLng = validPins.reduce((sum, p) => sum + p.lng, 0);
        setMapCenter({ lat: sumLat / validPins.length, lng: sumLng / validPins.length });
        setZoom(validPins.length === 1 ? 9 : validPins.length < 5 ? 5 : 4);
      }
    }
  }, [entities, geocodedPins]);

  return (
    <>
      <GoogleMap
        center={mapCenter}
        zoom={zoom}
        onCenterChanged={(ev) => setMapCenter(ev.detail.center)}
        onZoomChanged={(ev) => setZoom(ev.detail.zoom)}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        style={{ width: "100%", height: "100%" }}
        disableDefaultUI={false}
      >
        {entities.map((ent) => {
          const pin = geocodedPins[ent.id];
          if (!pin) return null;

          const isHovered = hoveredEntity?.id === ent.id;

          return (
            <AdvancedMarker
              key={ent.id}
              position={{ lat: pin.lat, lng: pin.lng }}
              onClick={() => handlePinClicked(ent)}
              onMouseEnter={() => setHoveredEntity(ent)}
              onMouseLeave={() => setHoveredEntity(null)}
            >
              <MapPinPin
                background={
                  ent.tier === "Strategic" ? "#6366f1" : // Indigo
                  ent.tier === "Enterprise" ? "#ca8a04" : // Amber/Yellow
                  "#10b981" // Emerald
                }
                glyphColor="#ffffff"
                borderColor={isHovered ? "#000000" : "#ffffff"}
                scale={isHovered ? 1.25 : 1.0}
              />
            </AdvancedMarker>
          );
        })}
      </GoogleMap>

      {/* Floating Info Panels for on-map hovered item */}
      {hoveredEntity && geocodedPins[hoveredEntity.id] && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-slate-900/95 text-white border border-slate-800 p-4 rounded-xl shadow-2xl text-xs backdrop-blur-md max-w-sm flex items-start gap-3 z-10 animate-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400 shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex justify-between items-start gap-2">
              <h5 className="font-extrabold text-sm truncate tracking-tight">{hoveredEntity.name}</h5>
              {hoveredEntity.Rating !== undefined && hoveredEntity.Rating !== null && (
                <span className="text-[9.5px] font-mono text-amber-400 font-bold">★ {hoveredEntity.Rating}.0</span>
              )}
            </div>
            <p className="text-[10px] text-slate-350 flex items-center gap-1 font-semibold truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {hoveredEntity.location} {hoveredEntity.City ? `(${hoveredEntity.City})` : ""}
            </p>
            <div className="flex gap-2 items-center mt-2.5 pt-2 border-t border-slate-800 text-[9px] font-mono tracking-wider">
              <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded font-bold uppercase">
                {hoveredEntity.tier}
              </span>
              <span className="text-slate-450 uppercase shrink-0">
                {hoveredEntity.industry}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
