import React, { useState } from 'react';
import { 
  Truck, 
  User, 
  Plus, 
  TrendingUp, 
  Users, 
  Activity, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar,
  AlertCircle,
  Hash,
  Coins
} from 'lucide-react';
import { 
  User as UserType, 
  Driver, 
  Truck as TruckType, 
  ShipmentRequest, 
  ShipmentStatus 
} from '../types';

interface CarrierPanelProps {
  carrierUser: UserType;
  drivers: Driver[];
  trucks: TruckType[];
  shipments: ShipmentRequest[];
  onAddDriverAndTruck: (driver: Omit<Driver, 'id'>, truck: Omit<TruckType, 'id' | 'driverId'>) => void;
  onUpdateShipmentStatus: (shipmentId: string, status: ShipmentStatus) => void;
}

export default function CarrierPanel({
  carrierUser,
  drivers,
  trucks,
  shipments,
  onAddDriverAndTruck,
  onUpdateShipmentStatus,
}: CarrierPanelProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Step 1: Driver Form
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  
  // Step 2: Truck Form
  const [plateNumber, setPlateNumber] = useState('');
  const [truckType, setTruckType] = useState('تبريد');
  const [truckCategory, setTruckCategory] = useState('تريلة');
  const [firstKmRate, setFirstKmRate] = useState(100);
  const [generalKmRate, setGeneralKmRate] = useState(3.0);

  // Filter shipments assigned to this carrier
  const carrierShipments = shipments.filter(s => s.assignedCarrierId === carrierUser.id);
  
  // Active/Completed stats
  const activeShipments = carrierShipments.filter(s => 
    s.status === ShipmentStatus.APPROVED || 
    s.status === ShipmentStatus.IN_TRANSIT
  );
  
  const completedShipments = carrierShipments.filter(s => 
    s.status === ShipmentStatus.DELIVERED
  );

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!driverName || !driverPhone || !driverLicense) {
        alert('الرجاء تعبئة جميع بيانات السائق للاستمرار.');
        return;
      }
      setWizardStep(2);
    }
  };

  const handlePrevStep = () => {
    setWizardStep(1);
  };

  const handleSubmitWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !firstKmRate || !generalKmRate) {
      alert('الرجاء تعبئة بيانات الشاحنة والأسعار.');
      return;
    }

    onAddDriverAndTruck(
      {
        name: driverName,
        phone: driverPhone,
        licenseNumber: driverLicense,
      },
      {
        plateNumber,
        type: truckType,
        category: truckCategory,
        firstKmRate: Number(firstKmRate),
        generalKmRate: Number(generalKmRate),
      }
    );

    // Reset forms
    setDriverName('');
    setDriverPhone('');
    setDriverLicense('');
    setPlateNumber('');
    setTruckType('تبريد');
    setTruckCategory('تريلة');
    setFirstKmRate(100);
    setGeneralKmRate(3.0);
    setWizardStep(1);
    setShowWizard(false);
  };

  // Get driver name by driver ID
  const getDriverName = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.name || 'سائق غير معرف';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">إجمالي الشاحنات والسائقين</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{trucks.length}</span>
            <span className="text-xs text-slate-400 block mt-1">شاحنة مفعلة بسائق خاص</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">الطلبات النشطة والموافق عليها</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-700 tracking-tight">{activeShipments.length}</span>
            <span className="text-xs text-slate-400 block mt-1">بانتظار التحميل أو في الطريق</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">الشحنات المكتملة</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">{completedShipments.length}</span>
            <span className="text-xs text-slate-400 block mt-1">تم تسليمها للمستلمين بنجاح</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-amber-700 font-bold tracking-wider uppercase block">ساس كابيتال</span>
            <p className="text-xs text-slate-400 mt-1">إجمالي الأرباح المتوقعة</p>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">
              {carrierShipments
                .filter(s => s.status === ShipmentStatus.DELIVERED || s.status === ShipmentStatus.APPROVED || s.status === ShipmentStatus.IN_TRANSIT)
                .reduce((acc, curr) => acc + (curr.estimatedBaseCost || 0), 0)
                .toLocaleString('ar-EG')}
            </span>
            <span className="text-xs text-slate-500 font-medium">ريال</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Management & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column (2/3): Trucks & Drivers + Wizard */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header section with add button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">إدارة الأسطول (الشاحنات والسائقين)</h2>
              <p className="text-sm text-slate-500 mt-0.5">النظام يتبع معيار (لا سائق بلا شاحنة ولا شاحنة بلا سائق)</p>
            </div>
            
            {!showWizard && (
              <button
                onClick={() => setShowWizard(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                إضافة سائق وشاحنة (معالج)
              </button>
            )}
          </div>

          {/* Add Wizard Modal/Card */}
          {showWizard && (
            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-300 animate-in zoom-in-95 duration-200 space-y-6">
              
              {/* Steps indicators */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    wizardStep === 1 ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    1
                  </span>
                  <span className={`text-xs font-semibold ${wizardStep === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                    بيانات السائق
                  </span>
                </div>
                <div className="w-12 h-0.5 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    wizardStep === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    2
                  </span>
                  <span className={`text-xs font-semibold ${wizardStep === 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                    بيانات الشاحنة والتسعير
                  </span>
                </div>
              </div>

              {/* Wizard Step 1: Driver Form */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-700" />
                      المرحلة الأولى: تعبئة معلومات السائق المفوض للعمل
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">اسم السائق الثلاثي *</label>
                        <input
                          type="text"
                          required
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          placeholder="مثال: صالح محمد الحربي"
                          className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">رقم الجوال *</label>
                        <input
                          type="tel"
                          required
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          placeholder="مثال: 0500000000"
                          className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">رقم رخصة القيادة (أو الإقامة) *</label>
                          <input
                            type="text"
                            required
                            value={driverLicense}
                            onChange={(e) => setDriverLicense(e.target.value)}
                            placeholder="رقم الرخصة المعتمد"
                            className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWizard(false)}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      التالي: بيانات الشاحنة
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Step 2: Truck Form */}
              {wizardStep === 2 && (
                <form onSubmit={handleSubmitWizard} className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-700" />
                      المرحلة الثانية: ربط الشاحنة المخصصة وتحديد تسعيرة الكيلومتر
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">رقم اللوحة *</label>
                        <input
                          type="text"
                          required
                          value={plateNumber}
                          onChange={(e) => setPlateNumber(e.target.value)}
                          placeholder="أ ب ج 1234"
                          className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">نوع الشحنات المتاح *</label>
                        <select
                          value={truckType}
                          onChange={(e) => setTruckType(e.target.value)}
                          className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                        >
                          <option value="تبريد">تبريد (برادات ومجمدات)</option>
                          <option value="سطحة">سطحة (سحب وشحن ثقيل)</option>
                          <option value="قفص">قفص (بضائع جافة ومغلقة)</option>
                          <option value="لور">لور (شحن عام)</option>
                          <option value="تانكر">تانكر (سوائل صهريج)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">فئة الشاحنة *</label>
                        <select
                          value={truckCategory}
                          onChange={(e) => setTruckCategory(e.target.value)}
                          className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                        >
                          <option value="دينة">دينة (صغيرة إلى متوسطة)</option>
                          <option value="قاطرة">قاطرة (وسط)</option>
                          <option value="تريلة">تريلة (شاحنة نقل كبيرة)</option>
                          <option value="وانيت">وانيت (خفيف)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">سعر الكيلومتر الأول (ريال) *</label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min="1"
                            value={firstKmRate}
                            onChange={(e) => setFirstKmRate(Number(e.target.value))}
                            className="w-full text-sm pl-12 pr-3 py-2 bg-white border border-amber-200 rounded-md focus:outline-amber-600"
                          />
                          <span className="absolute left-3 top-2 text-xs font-bold text-amber-700">ريال</span>
                        </div>
                        <p className="text-[10px] text-amber-800 mt-1">يغطي رسوم التحميل والإنطلاق للكيلو الأول.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">سعر الكيلومتر العام بعد الأول (ريال) *</label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            step="0.1"
                            min="0.1"
                            value={generalKmRate}
                            onChange={(e) => setGeneralKmRate(Number(e.target.value))}
                            className="w-full text-sm pl-12 pr-3 py-2 bg-white border border-amber-200 rounded-md focus:outline-amber-600"
                          />
                          <span className="absolute left-3 top-2 text-xs font-bold text-amber-700">ريال/كم</span>
                        </div>
                        <p className="text-[10px] text-amber-800 mt-1">يُحتسب لكل كم إضافي من نقطة التحميل للتفريغ.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                    >
                      السابق: تعديل بيانات السائق
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowWizard(false)}
                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        حفظ السائق والشاحنة معاً
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Grid of existing fleet */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">أسطول النقل المسجل حالياً</h3>
            </div>
            
            {trucks.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <span className="text-sm block font-medium">لا يوجد شاحنات مسجلة بعد</span>
                <span className="text-xs block text-slate-400 mt-1">ابدأ بإضافة شاحنة وسائق عبر معالج الربط</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {trucks.map((trk) => {
                  const driver = drivers.find(d => d.id === trk.driverId);
                  return (
                    <div key={trk.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Vehicle & Plate details */}
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-slate-900 text-white rounded-lg">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">{trk.plateNumber}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {trk.category} - {trk.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">السائق المعتمد:</span>
                              <span className="font-bold text-slate-700">{driver?.name || 'غير محدد'}</span>
                              <span className="text-slate-300 mx-1">|</span>
                              <span>جوال: {driver?.phone || '-'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Cost & Rates */}
                        <div className="flex items-center gap-6 self-start md:self-center">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">الكيلومتر الأول</span>
                            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">{trk.firstKmRate} ريال</span>
                          </div>
                          <div className="w-px h-8 bg-slate-200" />
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">الكيلومتر العام</span>
                            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">{trk.generalKmRate} ريال/كم</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right column (1/3): Active Shipments / Duties */}
        <div className="space-y-6">
          <div className="bg-slate-950 text-white p-6 rounded-xl relative overflow-hidden shadow-md">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <h3 className="font-bold text-lg text-white">الطلبات المسندة إليكم</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                تقوم شركة ساس بإسناد طلبات الشحن إليكم بناءً على ملاءمة الشاحنة والأسعار المعتمدة من طرفكم.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-700" />
              قائمة الشحنات الموكلة لكم ({carrierShipments.length})
            </h4>

            {carrierShipments.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span className="text-xs font-medium block">لا توجد طلبات مسندة لكم حالياً</span>
              </div>
            ) : (
              carrierShipments.map((shipment) => {
                const isApproved = shipment.status === ShipmentStatus.APPROVED;
                const isInTransit = shipment.status === ShipmentStatus.IN_TRANSIT;
                const isDelivered = shipment.status === ShipmentStatus.DELIVERED;
                const isPendingApproval = shipment.status === ShipmentStatus.PENDING_APPROVAL;

                return (
                  <div key={shipment.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-400">#{shipment.id}</span>
                      
                      {/* Status badges */}
                      {isPendingApproval && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          بانتظار قبول العميل للسعر
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          جاهز للتحميل والتوصيل
                        </span>
                      )}
                      {isInTransit && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          قيد النقل حالياً
                        </span>
                      )}
                      {isDelivered && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          مكتمل ومسلم
                        </span>
                      )}
                    </div>

                    {/* Cargo details */}
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-slate-400">المنتج:</span>
                        <span className="text-sm font-bold text-slate-800">{shipment.productName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{shipment.loadingLocation}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px]">الشاحنة المخصصة</span>
                          <span className="font-bold text-slate-700 mt-0.5 block">
                            {trucks.find(t => t.id === shipment.assignedTruckId)?.plateNumber || 'لوحة تجريبية'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">الأجرة المتوقعة</span>
                          <span className="font-bold text-amber-700 mt-0.5 block">
                            {shipment.estimatedBaseCost?.toLocaleString('ar-EG')} ريال
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Actions */}
                    {(isApproved || isInTransit) && (
                      <div className="pt-2 border-t border-slate-100">
                        {isApproved && (
                          <button
                            onClick={() => onUpdateShipmentStatus(shipment.id, ShipmentStatus.IN_TRANSIT)}
                            className="w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            تأكيد التحميل والبدء بالنقل (في الطريق)
                          </button>
                        )}
                        {isInTransit && (
                          <button
                            onClick={() => onUpdateShipmentStatus(shipment.id, ShipmentStatus.DELIVERED)}
                            className="w-full text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            تأكيد تسليم الشحنة للمستلم بنجاح
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
