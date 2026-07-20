import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Settings, 
  MapPin, 
  Truck, 
  Compass, 
  Search, 
  TrendingUp, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  User,
  Navigation,
  Globe,
  DollarSign
} from 'lucide-react';
import { 
  ShipmentRequest, 
  ShipmentStatus, 
  Truck as TruckType, 
  User as UserType, 
  Driver,
  SystemSettings 
} from '../types';

interface AdminPanelProps {
  adminUser: UserType;
  shipments: ShipmentRequest[];
  carriers: UserType[];
  allTrucks: Record<string, TruckType[]>;
  allDrivers: Record<string, Driver[]>;
  systemSettings: SystemSettings;
  onUpdateSystemSettings: (settings: SystemSettings) => void;
  onAssignCarrier: (
    shipmentId: string, 
    carrierId: string, 
    carrierName: string,
    truckId: string, 
    driverId: string, 
    distanceKm: number, 
    cost: number
  ) => void;
}

export default function AdminPanel({
  adminUser,
  shipments,
  carriers,
  allTrucks,
  allDrivers,
  systemSettings,
  onUpdateSystemSettings,
  onAssignCarrier,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'all-shipments' | 'settings'>('requests');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRequest | null>(null);
  
  // Estimation modal/calculator states
  const [distanceInput, setDistanceInput] = useState<number>(100);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [selectedCarrierRow, setSelectedCarrierRow] = useState<{
    carrierId: string;
    carrierName: string;
    truckId: string;
    driverId: string;
    cost: number;
  } | null>(null);

  // Settings states
  const [waybillHeader, setWaybillHeader] = useState(systemSettings.waybillHeader);
  const [waybillFooter, setWaybillFooter] = useState(systemSettings.waybillFooter);
  const [waybillTerms, setWaybillTerms] = useState(systemSettings.defaultTerms);

  // Filter shipments
  const pendingAssignmentShipments = useMemo(() => {
    return shipments.filter(s => s.status === ShipmentStatus.PENDING_ASSIGNMENT);
  }, [shipments]);

  // Google Maps Distance Calculator with mathematical Haversine backup
  const handleSimulateGoogleMaps = () => {
    if (!selectedShipment) return;
    setCalculatingDistance(true);

    const { loadingLat, loadingLng, deliveryLat, deliveryLng } = selectedShipment;

    // 1. If we have coordinates, check if standard Google Maps SDK is loaded
    if (loadingLat && loadingLng && deliveryLat && deliveryLng) {
      // @ts-ignore
      if (window.google && window.google.maps) {
        try {
          // @ts-ignore
          const service = new window.google.maps.DistanceMatrixService();
          service.getDistanceMatrix({
            origins: [{ lat: loadingLat, lng: loadingLng }],
            destinations: [{ lat: deliveryLat, lng: deliveryLng }],
            // @ts-ignore
            travelMode: window.google.maps.TravelMode.DRIVING,
          }, (response: any, status: any) => {
            if (status === 'OK' && response?.rows?.[0]?.elements?.[0]?.distance) {
              const meters = response.rows[0].elements[0].distance.value;
              const km = Number((meters / 1000).toFixed(1));
              setDistanceInput(km);
              setCalculatingDistance(false);
              setSelectedCarrierRow(null);
            } else {
              // Fallback to Haversine if Google Distance service returns error or not permitted
              calculateHaversine(loadingLat, loadingLng, deliveryLat, deliveryLng);
            }
          });
          return;
        } catch (err) {
          console.warn("Distance matrix service error:", err);
          calculateHaversine(loadingLat, loadingLng, deliveryLat, deliveryLng);
          return;
        }
      } else {
        // Calculate mathematically with Haversine immediately
        calculateHaversine(loadingLat, loadingLng, deliveryLat, deliveryLng);
        return;
      }
    }

    // 2. Fallback to smart textual estimation if coordinates are not available
    setTimeout(() => {
      let simulatedDist = 250; // default fallback
      const address = (selectedShipment.loadingLocation + " " + selectedShipment.productName).toLowerCase();
      
      // Smart estimates based on standard routes inside Saudi Arabia
      if (address.includes('جدة') || address.includes('الصفا')) {
        simulatedDist = 950;
      } else if (address.includes('الدمام') || address.includes('الشرقية') || address.includes('جبيل')) {
        simulatedDist = 410;
      } else if (address.includes('الخرج')) {
        simulatedDist = 85;
      } else if (address.includes('الرياض') && address.includes('الخرج')) {
        simulatedDist = 85;
      } else if (address.includes('الرياض')) {
        simulatedDist = 35;
      }

      setDistanceInput(simulatedDist);
      setCalculatingDistance(false);
      setSelectedCarrierRow(null); // Reset choice to force recalculating
    }, 800);
  };

  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    // Multiplied by 1.25 to estimate road winding/curves relative to straight line (Haversine)
    const simulatedDist = Number((d * 1.25).toFixed(1));
    setDistanceInput(simulatedDist);
    setCalculatingDistance(false);
    setSelectedCarrierRow(null);
  };

  // Find all trucks and drivers in system and calculate costs for each
  const calculatedCarrierRates = useMemo(() => {
    if (!selectedShipment || !distanceInput) return [];

    const list: Array<{
      carrierId: string;
      carrierName: string;
      truck: TruckType;
      driverName: string;
      driverPhone: string;
      calculatedCost: number;
    }> = [];

    // Loop through carriers
    carriers.forEach(carrier => {
      const carrierTrucks = allTrucks[carrier.id] || [];
      const carrierDrivers = allDrivers[carrier.id] || [];

      // Filter trucks compatible with requirements
      const compatibleTrucks = carrierTrucks.filter(t => 
        t.type === selectedShipment.truckType && 
        t.category === selectedShipment.truckCategory
      );

      compatibleTrucks.forEach(truck => {
        const driver = carrierDrivers.find(d => d.id === truck.driverId);
        
        // Calculate cost: First Km rate + (Distance - 1) * General Km rate
        const firstRate = truck.firstKmRate;
        const generalRate = truck.generalKmRate;
        const distance = Math.max(1, distanceInput);
        const calculatedCost = firstRate + (distance - 1) * generalRate;

        list.push({
          carrierId: carrier.id,
          carrierName: carrier.name,
          truck,
          driverName: driver?.name || 'سائق معتمد',
          driverPhone: driver?.phone || '',
          calculatedCost: Number(calculatedCost.toFixed(2)),
        });
      });
    });

    // Sort by cheapest
    return list.sort((a, b) => a.calculatedCost - b.calculatedCost);
  }, [selectedShipment, distanceInput, carriers, allTrucks, allDrivers]);

  // Handle setting system settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemSettings({
      ...systemSettings,
      waybillHeader,
      waybillFooter,
      defaultTerms: waybillTerms
    });
    alert('تم حفظ الإعدادات الافتراضية للبوليصة والمنصة بنجاح.');
  };

  const handleOpenAssignModal = (shipment: ShipmentRequest) => {
    setSelectedShipment(shipment);
    // Autofill initial distance
    setDistanceInput(120);
    setSelectedCarrierRow(null);
  };

  const handleConfirmAssignment = () => {
    if (!selectedShipment || !selectedCarrierRow) {
      alert('يرجى اختيار أحد الناقلين المتاحين في الجدول أولاً.');
      return;
    }

    onAssignCarrier(
      selectedShipment.id,
      selectedCarrierRow.carrierId,
      selectedCarrierRow.carrierName,
      selectedCarrierRow.truckId,
      selectedCarrierRow.driverId,
      distanceInput,
      selectedCarrierRow.cost
    );

    setSelectedShipment(null);
    setSelectedCarrierRow(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title & Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-amber-700 font-bold tracking-wider uppercase block">حساب الإشراف والدعم اللوجستي</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">منصة الإدارة والوساطة الموحدة</h1>
          <p className="text-sm text-slate-500">مرحباً {adminUser.name}. تحكم في طلبات الشحن، عيّن الناقلين، وخصّص بوالص الشحن ساس الموحدة.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all cursor-pointer ${
            activeTab === 'requests' 
              ? 'border-slate-950 text-slate-950' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            طلبات الشحن المعلقة بالوسطاء ({pendingAssignmentShipments.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('all-shipments')}
          className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all cursor-pointer ${
            activeTab === 'all-shipments' 
              ? 'border-slate-950 text-slate-950' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            سجل العمليات والطلبات العام ({shipments.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all cursor-pointer ${
            activeTab === 'settings' 
              ? 'border-slate-950 text-slate-950' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            إعدادات تخصيص بوليصة الشحن (Waybill)
          </span>
        </button>
      </div>

      {/* 1. Pending Assignment Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">بانتظار التدخل: طلبات الشحن المسجلة حديثاً</h3>
            </div>

            {pendingAssignmentShipments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <span className="text-sm font-extrabold block text-slate-900">جميع الطلبات معالجة بالكامل!</span>
                <span className="text-xs block text-slate-400 mt-1">لا توجد طلبات شحن برية جديدة تحتاج إلى تعيين مسافة أو ناقل حالياً.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingAssignmentShipments.map((shipment) => (
                  <div key={shipment.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      
                      {/* Left: details */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">#{shipment.id}</span>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            بانتظار تقدير المسافة والناقل
                          </span>
                          <span className="text-xs text-slate-400">
                            الشاحن: {shipment.shipperName}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">مواصفات الشحنة والمنتج</span>
                            <span className="font-bold text-slate-800 text-sm block mt-0.5">{shipment.productName} ({shipment.quantity})</span>
                            <span className="text-slate-500 block mt-1">النوع: {shipment.productType} | الفئة: {shipment.productCategory}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">متطلبات الشاحنة البرية</span>
                            <span className="font-bold text-slate-800 text-sm block mt-0.5">{shipment.truckCategory} - {shipment.truckType}</span>
                            <span className="text-slate-500 block mt-1">موقع التحميل: {shipment.loadingLocation}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="lg:w-64 shrink-0 flex flex-col justify-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(shipment)}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-all"
                        >
                          <Navigation className="w-4 h-4 text-amber-500" />
                          تقدير المسافة وتعيين الناقل
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. All Shipments Log */}
      {activeTab === 'all-shipments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">سجل العمليات اللوجستية العام (SAS)</h3>
            </div>

            {shipments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <span className="text-sm block">لا توجد شحنات بعد</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">الرقم المرجعي</th>
                      <th className="px-6 py-3.5">الشاحن</th>
                      <th className="px-6 py-3.5">البضاعة والكمية</th>
                      <th className="px-6 py-3.5">الناقل المعين</th>
                      <th className="px-6 py-3.5">المسافة (كم)</th>
                      <th className="px-6 py-3.5">التكلفة (ريال)</th>
                      <th className="px-6 py-3.5">حالة الشحنة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shipments.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-400 text-xs">#{s.id}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{s.shipperName}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">{s.productName}</span>
                          <span className="text-xs text-slate-400">{s.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {s.assignedCarrierName ? (
                            <span className="font-medium text-slate-800 block">{s.assignedCarrierName}</span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">بانتظار التخصيص</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">{s.distanceKm || '-'}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{s.estimatedBaseCost ? `${s.estimatedBaseCost.toLocaleString('ar-EG')} ريال` : '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === ShipmentStatus.APPROVED || s.status === ShipmentStatus.DELIVERED
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : s.status === ShipmentStatus.PENDING_APPROVAL
                              ? 'bg-amber-50 text-amber-800 border-amber-100'
                              : s.status === ShipmentStatus.IN_TRANSIT
                              ? 'bg-blue-50 text-blue-800 border-blue-100'
                              : s.status === ShipmentStatus.REJECTED
                              ? 'bg-rose-50 text-rose-800 border-rose-100'
                              : 'bg-slate-50 text-slate-800 border-slate-200'
                          }`}>
                            {s.status === ShipmentStatus.APPROVED && 'مقبول / بانتظار التحميل'}
                            {s.status === ShipmentStatus.PENDING_ASSIGNMENT && 'بانتظار الناقل'}
                            {s.status === ShipmentStatus.PENDING_APPROVAL && 'بانتظار العميل'}
                            {s.status === ShipmentStatus.IN_TRANSIT && 'في الطريق'}
                            {s.status === ShipmentStatus.DELIVERED && 'تم التسليم'}
                            {s.status === ShipmentStatus.REJECTED && 'مرفوض'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900">تخصيص مستند بوليصة الشحن الرسمية الموحدة</h2>
            <p className="text-xs text-slate-400 mt-0.5">يمكنك تغيير ترويسة، تذييل البوليصة، والشروط والأحكام القياسية لشركة ساس لتعكس المعايير الحكومية الجديدة</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ترويسة البوليصة (Header Info) *</label>
                <textarea
                  rows={3}
                  required
                  value={waybillHeader}
                  onChange={(e) => setWaybillHeader(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تذييل البوليصة ومعلومات التواصل *</label>
                <textarea
                  rows={3}
                  required
                  value={waybillFooter}
                  onChange={(e) => setWaybillFooter(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">شروط وأحكام النقل الافتراضية المطبوعة بالخلف *</label>
              <textarea
                rows={6}
                required
                value={waybillTerms}
                onChange={(e) => setWaybillTerms(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-slate-900 leading-relaxed font-mono"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm cursor-pointer transition-all"
              >
                حفظ التعديلات وتثبيتها بالبوالص
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignment Cost estimation overlay modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">بوابة حساب تسعيرة الشحن وتعيين الناقل</h3>
                <p className="text-xs text-slate-500 mt-0.5">طلب الشحن برقم: #{selectedShipment.id}</p>
              </div>
              <button onClick={() => setSelectedShipment(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Routing detail mapping */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">مسار التوصيل والمواقع</span>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold text-[10px]">من</span>
                      <span className="font-bold text-slate-700 truncate">{selectedShipment.loadingLocation}</span>
                    </div>
                    <div className="h-6 w-0.5 bg-slate-300 mr-2.5 border-dashed" />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-bold text-[10px]">إلى</span>
                      <span className="font-bold text-slate-700">العميل المستلم والموقع المسجل بالنظام</span>
                    </div>
                  </div>
                </div>

                {/* Google Maps Distance simulation box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">المسافة بخرائط جوجل</span>
                    <button
                      type="button"
                      onClick={handleSimulateGoogleMaps}
                      className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                    >
                      استعلام مباشر
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      required
                      min="1"
                      value={distanceInput}
                      onChange={(e) => {
                        setDistanceInput(Number(e.target.value));
                        setSelectedCarrierRow(null); // Reset choice
                      }}
                      className="w-full text-base px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-slate-900 font-bold text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">كيلومتر</span>
                  </div>
                  
                  {calculatingDistance && (
                    <span className="text-[10px] text-amber-800 block animate-pulse font-medium">جاري استعلام خرائط جوجل تقديرياً...</span>
                  )}
                </div>
              </div>

              {/* Compatible Carriers and calculated Cost Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">الناقلون المتوافقون مع نوع الشحنة وفئتها المحددة</h4>
                  <span className="text-xs text-slate-400">فئة الشاحنة: {selectedShipment.truckCategory} ({selectedShipment.truckType})</span>
                </div>

                {calculatedCarrierRates.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-lg text-center border border-slate-100">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-slate-600 block">لا يوجد ناقلون مسجلون يمتلكون فئة الشاحنة المطلوبة حالياً!</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">يرجى تسجيل شاحنة بهذا النوع لدى أحد الناقلين لإتمام التكليف.</span>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">اختر</th>
                          <th className="px-4 py-3">الناقل</th>
                          <th className="px-4 py-3">السائق المعتمد</th>
                          <th className="px-4 py-3">رقم لوحة الشاحنة</th>
                          <th className="px-4 py-3">التسعير الأساسي (الكيلو الأول / التالي)</th>
                          <th className="px-4 py-3">التكلفة الإجمالية المقدرة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {calculatedCarrierRates.map((row) => (
                          <tr 
                            key={row.truck.id} 
                            onClick={() => setSelectedCarrierRow({
                              carrierId: row.carrierId,
                              carrierName: row.carrierName,
                              truckId: row.truck.id,
                              driverId: row.truck.driverId,
                              cost: row.calculatedCost
                            })}
                            className={`cursor-pointer transition-colors ${
                              selectedCarrierRow?.truckId === row.truck.id ? 'bg-amber-50/50 font-bold' : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <input
                                type="radio"
                                name="carrier-choice"
                                checked={selectedCarrierRow?.truckId === row.truck.id}
                                readOnly
                                className="accent-amber-700"
                              />
                            </td>
                            <td className="px-4 py-3.5 text-slate-900 font-medium">{row.carrierName}</td>
                            <td className="px-4 py-3.5 text-slate-600">
                              <span className="block">{row.driverName}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{row.driverPhone}</span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-800">{row.truck.plateNumber}</td>
                            <td className="px-4 py-3.5 text-slate-500">
                              {row.truck.firstKmRate} ريال / {row.truck.generalKmRate} ريال
                            </td>
                            <td className="px-4 py-3.5 font-black text-slate-900">
                              {row.calculatedCost.toLocaleString('ar-EG')} ريال
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Submit Assignment & Notify Shipper */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="text-right">
                  {selectedCarrierRow && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">التكلفة الإجمالية المقترحة على الشاحن:</span>
                      <span className="text-lg font-black text-amber-700">{selectedCarrierRow.cost.toLocaleString('ar-EG')} ريال سعودي</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedShipment(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAssignment}
                    disabled={!selectedCarrierRow}
                    className="px-5 py-2.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                  >
                    إرسال العقد والتسعيرة للشاحن للموافقة
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
