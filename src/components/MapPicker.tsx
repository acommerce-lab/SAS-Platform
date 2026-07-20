import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, Info, Settings, Compass } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

// Read API Key from build-time definition or environment variables
const MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(MAPS_API_KEY) && MAPS_API_KEY !== 'YOUR_API_KEY' && MAPS_API_KEY.length > 10;

interface MapPickerProps {
  label: string;
  value: string;
  lat?: number;
  lng?: number;
  onChange: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
}

// Major cities and neighborhoods in Saudi Arabia for high-fidelity fallback suggestions
const MOCK_SAUDI_PLACES = [
  { name: 'الرياض - حي الياسمين (مستودعات شمال الرياض)', lat: 24.8156, lng: 46.6389 },
  { name: 'الخرج - المنطقة الصناعية (مستودعات الشاحن الرئيسية)', lat: 24.1504, lng: 47.3072 },
  { name: 'جدة - حي الحمراء (منطقة ميناء جدة الإسلامي)', lat: 21.5169, lng: 39.1558 },
  { name: 'الدمام - المدينة الصناعية الثانية', lat: 26.2415, lng: 49.9865 },
  { name: 'مكة المكرمة - العزيزية (مركز الشحن الرئيسي)', lat: 21.4111, lng: 39.8661 },
  { name: 'المدينة المنورة - طريق الهجرة (مجمع لوجستي)', lat: 24.4215, lng: 39.6015 },
  { name: 'القصيم - بريدة (المنطقة الزراعية والتمور)', lat: 26.3260, lng: 43.9750 },
  { name: 'الجبيل - المنطقة الصناعية الأولى', lat: 27.0097, lng: 49.5630 },
];

export default function MapPicker({
  label,
  value,
  lat = 24.7136, // Default Riyadh lat
  lng = 46.6753, // Default Riyadh lng
  onChange,
  placeholder = 'اختر موقعاً أو ابحث على الخريطة...',
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);
  const [addressText, setAddressText] = useState(value);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showMockSuggestions, setShowMockSuggestions] = useState(false);
  const [googleSuggestions, setGoogleSuggestions] = useState<any[]>([]);
  const [showGoogleSuggestions, setShowGoogleSuggestions] = useState(false);

  const autocompleteServiceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  // Sync state with parent value on initialization
  useEffect(() => {
    if (lat && lng && (lat !== 24.7136 || lng !== 46.6753)) {
      setCurrentLat(lat);
      setCurrentLng(lng);
    }
    if (value) {
      setAddressText(value);
    }
  }, [lat, lng, value]);

  // Google Maps SDK Autocomplete & Geocoder initializers
  const initGoogleServices = (mapInstance: any) => {
    if (!mapInstance || !window.google) return;
    try {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
      if (!geocoderRef.current) {
        geocoderRef.current = new window.google.maps.Geocoder();
      }
      setIsMapLoaded(true);
    } catch (e) {
      console.warn('Failed to initialize Google Maps services:', e);
    }
  };

  // Handle textual search queries
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const queryStr = e.target.value;
    setSearchQuery(queryStr);

    if (!queryStr.trim()) {
      setGoogleSuggestions([]);
      setShowGoogleSuggestions(false);
      setShowMockSuggestions(false);
      return;
    }

    if (hasValidKey && autocompleteServiceRef.current && window.google) {
      // Query Google Places Autocomplete API safely
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: queryStr,
            componentRestrictions: { country: 'sa' },
            language: 'ar',
          },
          (predictions: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setGoogleSuggestions(predictions);
              setShowGoogleSuggestions(true);
            } else {
              setGoogleSuggestions([]);
              setShowGoogleSuggestions(false);
            }
          }
        );
      } catch (err) {
        console.error('Autocomplete prediction error:', err);
      }
    } else {
      // Fallback: Filter mock Saudi places based on query
      setShowMockSuggestions(true);
    }
  };

  // Select a suggestion from google places
  const selectGoogleSuggestion = (placeId: string, description: string) => {
    if (!geocoderRef.current || !window.google) return;
    
    geocoderRef.current.geocode({ placeId }, (results: any, status: any) => {
      if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
        const loc = results[0].geometry.location;
        const newLat = loc.lat();
        const newLng = loc.lng();
        
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        setAddressText(description);
        setSearchQuery('');
        setShowGoogleSuggestions(false);
        onChange(description, newLat, newLng);
      }
    });
  };

  // Select a suggestion from mock places
  const selectMockSuggestion = (place: typeof MOCK_SAUDI_PLACES[0]) => {
    setCurrentLat(place.lat);
    setCurrentLng(place.lng);
    setAddressText(place.name);
    setSearchQuery('');
    setShowMockSuggestions(false);
    onChange(place.name, place.lat, place.lng);
  };

  // When Google Map marker is dragged
  const handleMarkerDragEnd = (e: any) => {
    if (!e.latLng) return;
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    
    setCurrentLat(newLat);
    setCurrentLng(newLng);

    if (geocoderRef.current && window.google) {
      // Reverse geocode to get friendly text
      geocoderRef.current.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
        if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
          const address = results[0].formatted_address;
          setAddressText(address);
          onChange(address, newLat, newLng);
        } else {
          const coordinateStr = `الموقع عند الإحداثيات (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`;
          setAddressText(coordinateStr);
          onChange(coordinateStr, newLat, newLng);
        }
      });
    } else {
      const coordinateStr = `إحداثيات مخصصة (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`;
      setAddressText(coordinateStr);
      onChange(coordinateStr, newLat, newLng);
    }
  };

  // Map clicked to position marker
  const handleMapClick = (e: any) => {
    if (!e.detail?.latLng) return;
    const newLat = e.detail.latLng.lat;
    const newLng = e.detail.latLng.lng;
    
    setCurrentLat(newLat);
    setCurrentLng(newLng);

    if (geocoderRef.current && window.google) {
      geocoderRef.current.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
        if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
          const address = results[0].formatted_address;
          setAddressText(address);
          onChange(address, newLat, newLng);
        }
      });
    } else {
      const coordinateStr = `إحداثيات مخصصة (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`;
      setAddressText(coordinateStr);
      onChange(coordinateStr, newLat, newLng);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        {hasValidKey ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            نظام الخرائط الحية مفعّل
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            النمط التفاعلي المستقل
          </span>
        )}
      </div>

      {/* Input Address display with search field */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <MapPin className="w-4 h-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={addressText}
          onChange={(e) => {
            setAddressText(e.target.value);
            onChange(e.target.value, currentLat, currentLng);
          }}
          placeholder="أدخل العنوان التفصيلي أو استخدم الخريطة للتحديد..."
          className="w-full text-sm pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-slate-950 font-medium"
        />
      </div>

      {/* Search Input Container */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="ابحث عن مدينة، حي، أو مستودع في السعودية..."
          className="w-full text-xs pr-9 pl-4 py-2 border border-slate-200 bg-white rounded-lg focus:outline-slate-950 shadow-xs"
        />

        {/* Google Places Autocomplete Suggestions */}
        {showGoogleSuggestions && googleSuggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {googleSuggestions.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => selectGoogleSuggestion(item.place_id, item.description)}
                className="w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{item.description}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mock Places Autocomplete Suggestions */}
        {showMockSuggestions && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {MOCK_SAUDI_PLACES.filter(p => p.name.includes(searchQuery)).map((place, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectMockSuggestion(place)}
                className="w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-950">{place.name}</span>
              </button>
            ))}
            {MOCK_SAUDI_PLACES.filter(p => p.name.includes(searchQuery)).length === 0 && (
              <div className="px-4 py-3 text-center text-xs text-slate-400">
                لا توجد نتائج مطابقة، سيتم حفظ ما تكتبه في العنوان اليدوي أعلاه.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actual Google Map Panel */}
      {hasValidKey ? (
        <div className="relative h-48 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
          <APIProvider apiKey={MAPS_API_KEY} version="weekly">
            <Map
              center={{ lat: currentLat, lng: currentLng }}
              zoom={12}
              onClick={handleMapClick}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              onMapsLoaded={(e) => initGoogleServices(e)}
              style={{ width: '100%', height: '100%' }}
            >
              <AdvancedMarker
                position={{ lat: currentLat, lng: currentLng }}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
              >
                <Pin background="#d97706" glyphColor="#fff" borderColor="#78350f" />
              </AdvancedMarker>
            </Map>
          </APIProvider>

          {/* Quick instructions tag */}
          <div className="absolute bottom-2 right-2 bg-slate-900/80 text-[10px] text-white px-2 py-1 rounded backdrop-blur-xs">
            انقر في أي مكان أو اسحب الدبوس البرتقالي لتحديث العنوان
          </div>
        </div>
      ) : (
        /* Highly styled mock maps interface with clickable coordinate grid */
        <div className="relative h-48 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-950 text-slate-300 flex flex-col justify-between p-4">
          
          {/* Subtle Grid illustration backdrop */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle, #f59e0b 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }} />
          
          {/* Mock Map graphical elements */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Concentric rings to simulate radar/location */}
            <div className="w-32 h-32 rounded-full border border-amber-500/20 animate-ping absolute duration-1000" />
            <div className="w-16 h-16 rounded-full border border-amber-500/30 absolute" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute animate-pulse shadow-lg shadow-amber-500/50" />
            
            {/* Visual simulation of routes */}
            <svg className="absolute w-full h-full opacity-30 stroke-amber-500 stroke-dasharray-4" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 0,20 Q 30,50 60,30 T 100,80" fill="none" strokeWidth="0.5" />
              <path d="M 10,90 Q 50,40 90,10" fill="none" strokeWidth="0.3" />
            </svg>
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 max-w-[70%]">
              <span className="block text-[9px] font-bold text-amber-500 uppercase tracking-widest">إحداثيات محددة حالياً</span>
              <span className="block text-[11px] font-mono font-medium text-slate-100 mt-0.5">
                خط العرض: {currentLat.toFixed(5)} | خط الطول: {currentLng.toFixed(5)}
              </span>
            </div>

            <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-400 flex items-center gap-1 text-[10px]">
              <Settings className="w-3 h-3 text-amber-500 shrink-0" />
              <span>معاينة خريطة مستقلة</span>
            </div>
          </div>

          {/* Fallback configuration hint banner */}
          <div className="relative z-10 bg-slate-900/95 border border-amber-900/40 p-2.5 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="block text-[10px] font-black text-amber-500">ملاحظة لإدارة المنصة:</span>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                لتفعيل خرائط Google Maps والبحث التلقائي بالـ GPS وحساب المسافات الفعلية آلياً، يرجى التوجه إلى <strong className="text-amber-500">الإعدادات (أعلى اليمين) ⚙️ ← الأسرار</strong> وإضافة مفتاح <code>GOOGLE_MAPS_PLATFORM_KEY</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
