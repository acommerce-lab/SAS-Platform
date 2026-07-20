import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Users, 
  FileText, 
  Plus, 
  MapPin, 
  Phone, 
  ChevronRight, 
  AlertCircle, 
  Check, 
  X, 
  Info,
  Layers,
  Truck,
  Download,
  Printer
} from 'lucide-react';
import { 
  User as UserType, 
  Product, 
  ShipperClient, 
  ShipmentRequest, 
  ShipmentStatus,
  Waybill 
} from '../types';
import MapPicker from './MapPicker';

interface ShipperPanelProps {
  shipperUser: UserType;
  products: Product[];
  clients: ShipperClient[];
  shipments: ShipmentRequest[];
  waybills: Waybill[];
  onAddProduct: (product: Omit<Product, 'id' | 'shipperId'>) => void;
  onAddClient: (client: Omit<ShipperClient, 'id' | 'shipperId'>) => void;
  onAddShipmentRequest: (request: Omit<ShipmentRequest, 'id' | 'shipperId' | 'shipperName' | 'createdAt' | 'status'>) => void;
  onApproveShipmentAssignment: (shipmentId: string) => void;
  onRejectShipmentAssignment: (shipmentId: string) => void;
  onOpenWaybill: (waybillId: string) => void;
}

export default function ShipperPanel({
  shipperUser,
  products,
  clients,
  shipments,
  waybills,
  onAddProduct,
  onAddClient,
  onAddShipmentRequest,
  onApproveShipmentAssignment,
  onRejectShipmentAssignment,
  onOpenWaybill,
}: ShipperPanelProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'products' | 'clients'>('requests');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  // Form states for Product
  const [prodName, setProdName] = useState('');
  const [prodPackaging, setProdPackaging] = useState('');
  const [prodType, setProdType] = useState('');
  const [customProdType, setCustomProdType] = useState('');
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  
  const [prodCategory, setProdCategory] = useState('');
  const [customProdCategory, setCustomProdCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  // Form states for Client (Receiver)
  const [cliName, setCliName] = useState('');
  const [cliPhone, setCliPhone] = useState('');
  const [cliAddress, setCliAddress] = useState('');
  const [cliLat, setCliLat] = useState(24.7136);
  const [cliLng, setCliLng] = useState(46.6753);

  // Form states for Shipment Request
  const [reqClient, setReqClient] = useState('');
  const [reqLoadingLocation, setReqLoadingLocation] = useState('مستودعات الشاحن الرئيسية - الخرج طريق الملك فهد');
  const [reqLoadingLat, setReqLoadingLat] = useState(24.1504);
  const [reqLoadingLng, setReqLoadingLng] = useState(47.3072);
  const [reqProduct, setReqProduct] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqTruckType, setReqTruckType] = useState('تبريد');
  const [reqTruckCategory, setReqTruckCategory] = useState('تريلة');

  // Filter lists for current shipper
  const shipperProducts = useMemo(() => products.filter(p => p.shipperId === shipperUser.id), [products, shipperUser.id]);
  const shipperClients = useMemo(() => clients.filter(c => c.shipperId === shipperUser.id), [clients, shipperUser.id]);
  const shipperRequests = useMemo(() => shipments.filter(s => s.shipperId === shipperUser.id), [shipments, shipperUser.id]);

  // Unique types and categories remembered from shipper's products history
  const rememberedTypes = useMemo(() => {
    const types = shipperProducts.map(p => p.type).filter(Boolean);
    return Array.from(new Set(types));
  }, [shipperProducts]);

  const rememberedCategories = useMemo(() => {
    const categories = shipperProducts.map(p => p.category).filter(Boolean);
    return Array.from(new Set(categories));
  }, [shipperProducts]);

  // Handle Product Submission
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPackaging) {
      alert('يرجى تعبئة الحقول الأساسية للمنتج.');
      return;
    }

    const finalType = showCustomTypeInput ? customProdType : prodType;
    const finalCategory = showCustomCategoryInput ? customProdCategory : prodCategory;

    if (!finalType || !finalCategory) {
      alert('يرجى اختيار أو كتابة نوع وفئة المنتج.');
      return;
    }

    onAddProduct({
      name: prodName,
      packaging: prodPackaging,
      type: finalType,
      category: finalCategory
    });

    // Reset states
    setProdName('');
    setProdPackaging('');
    setProdType('');
    setCustomProdType('');
    setShowCustomTypeInput(false);
    setProdCategory('');
    setCustomProdCategory('');
    setShowCustomCategoryInput(false);
    setShowAddProductModal(false);
  };

  // Handle Client Submission
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliName || !cliPhone || !cliAddress) {
      alert('يرجى تعبئة جميع بيانات العميل المستلم.');
      return;
    }

    onAddClient({
      name: cliName,
      phone: cliPhone,
      address: cliAddress,
      lat: cliLat,
      lng: cliLng
    });

    setCliName('');
    setCliPhone('');
    setCliAddress('');
    setCliLat(24.7136);
    setCliLng(46.6753);
    setShowAddClientModal(false);
  };

  // Handle Shipment Request Submission
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqClient || !reqProduct || !reqQuantity || !reqLoadingLocation) {
      alert('الرجاء تعبئة جميع حقول طلب الشحن.');
      return;
    }

    const selectedProductObj = products.find(p => p.id === reqProduct);
    const selectedClientObj = clients.find(c => c.id === reqClient);

    if (!selectedProductObj || !selectedClientObj) {
      alert('خطأ في استيراد البيانات المحددة.');
      return;
    }

    onAddShipmentRequest({
      clientReceiverId: reqClient,
      loadingLocation: reqLoadingLocation,
      loadingLat: reqLoadingLat,
      loadingLng: reqLoadingLng,
      deliveryLat: selectedClientObj.lat,
      deliveryLng: selectedClientObj.lng,
      productName: selectedProductObj.name,
      productType: selectedProductObj.type,
      productCategory: selectedProductObj.category,
      quantity: reqQuantity,
      truckType: reqTruckType,
      truckCategory: reqTruckCategory,
    });

    // Reset Form
    setReqClient('');
    setReqProduct('');
    setReqQuantity('');
    setShowNewRequestForm(false);
  };

  // Helper to get status label and class
  const getStatusDetails = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.PENDING_ASSIGNMENT:
        return { label: 'بانتظار تعيين ناقل ومسافة', style: 'bg-slate-100 text-slate-800 border-slate-200' };
      case ShipmentStatus.PENDING_APPROVAL:
        return { label: 'بانتظار موافقتك على السعر والناقل', style: 'bg-amber-100 text-amber-900 border-amber-200 font-extrabold animate-pulse' };
      case ShipmentStatus.APPROVED:
        return { label: 'مقبول - تم إصدار بوليصة الشحن', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case ShipmentStatus.REJECTED:
        return { label: 'مرفوض من قبلك', style: 'bg-rose-50 text-rose-800 border-rose-200' };
      case ShipmentStatus.IN_TRANSIT:
        return { label: 'قيد النقل على الطريق', style: 'bg-blue-50 text-blue-800 border-blue-200' };
      case ShipmentStatus.DELIVERED:
        return { label: 'تم الاستلام والتسليم بنجاح', style: 'bg-slate-200 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title & Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">لوحة تحكم الشاحن</h1>
          <p className="text-sm text-slate-500 mt-0.5">أدر منتجاتك، عملاء التجزئة المحليين، واطلب شحناتك البرية في ثوانٍ معدودة.</p>
        </div>

        <button
          onClick={() => setShowNewRequestForm(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-extrabold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إنشاء طلب شحن جديد
        </button>
      </div>

      {/* Navigation tabs */}
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
            <FileText className="w-4 h-4" />
            طلبات الشحن وبوالص التأمين ({shipperRequests.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all cursor-pointer ${
            activeTab === 'products' 
              ? 'border-slate-950 text-slate-950' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            منتجاتي التجارية ({shipperProducts.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all cursor-pointer ${
            activeTab === 'clients' 
              ? 'border-slate-950 text-slate-950' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            المستلمون والعملاء المحليون ({shipperClients.length})
          </span>
        </button>
      </div>

      {/* New Shipment Request Form Modal */}
      {showNewRequestForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-base">تقديم طلب شحن بضائع محلي جديد</h2>
              <button 
                onClick={() => setShowNewRequestForm(false)} 
                className="p-1 rounded hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-6">
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">الخطوة 1: الأطراف والمنتج</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">العميل المستلم (تاجر التجزئة) *</label>
                    <select
                      required
                      value={reqClient}
                      onChange={(e) => setReqClient(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-slate-900"
                    >
                      <option value="">-- اختر من قائمة عملائك المضافين --</option>
                      {shipperClients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - {c.address}</option>
                      ))}
                    </select>
                    {shipperClients.length === 0 && (
                      <p className="text-[10px] text-amber-800 mt-1">يجب إضافة عميل أولاً من تبويب (المستلمون والعملاء).</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">المنتج المراد شحنه *</label>
                    <select
                      required
                      value={reqProduct}
                      onChange={(e) => setReqProduct(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-slate-900"
                    >
                      <option value="">-- اختر من قائمة منتجاتك --</option>
                      {shipperProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.packaging})</option>
                      ))}
                    </select>
                    {shipperProducts.length === 0 && (
                      <p className="text-[10px] text-amber-800 mt-1">يجب إضافة منتج أولاً من تبويب (منتجاتي التجارية).</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-4">
                  <MapPicker
                    label="موقع تحميل وشحن البضائع على الخريطة *"
                    value={reqLoadingLocation}
                    lat={reqLoadingLat}
                    lng={reqLoadingLng}
                    onChange={(address, lat, lng) => {
                      setReqLoadingLocation(address);
                      setReqLoadingLat(lat);
                      setReqLoadingLng(lng);
                    }}
                    placeholder="ابحث عن مستودعك أو انقر لتحديد الموقع"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الكمية الإجمالية وتفاصيل التعبئة *</label>
                  <input
                    type="text"
                    required
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(e.target.value)}
                    placeholder="مثال: 400 كرتون (إجمالي 3 طن) أو 10 طبالي خشبية"
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-slate-900"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">الخطوة 2: متطلبات الشاحنة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">نوع الشحنة المخصص *</label>
                    <select
                      value={reqTruckType}
                      onChange={(e) => setReqTruckType(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-slate-900"
                    >
                      <option value="تبريد">تبريد (برادات للمواد الغذائية والمجمدات)</option>
                      <option value="سطحة">سطحة (سحب وشحن ثقيل ومعدات)</option>
                      <option value="قفص">قفص (بضائع جافة ومغلقة ومحمية)</option>
                      <option value="لور">لور (شحن عام ومفتوح)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">فئة الشاحنة المطلوبة *</label>
                    <select
                      value={reqTruckCategory}
                      onChange={(e) => setReqTruckCategory(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-slate-900"
                    >
                      <option value="دينة">دينة (صغيرة إلى متوسطة)</option>
                      <option value="قاطرة">قاطرة (وسط)</option>
                      <option value="تريلة">تريلة (شاحنة شحن كبيرة)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRequestForm(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={shipperClients.length === 0 || shipperProducts.length === 0}
                  className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  إرسال الطلب لشركة ساس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      
      {/* 1. Requests and Waybills */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">تتبع طلبات الشحن النشطة وعروض الأسعار</h3>
            </div>

            {shipperRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <span className="text-sm block font-medium">لا توجد طلبات شحن مرسلة بعد</span>
                <span className="text-xs block text-slate-400 mt-1">ابدأ بطلب أول شحنة لتتلقى عروض الأسعار من الوسطاء</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {shipperRequests.map((req) => {
                  const statusInfo = getStatusDetails(req.status);
                  const linkedClient = clients.find(c => c.id === req.clientReceiverId);
                  const linkedWaybill = waybills.find(w => w.shipmentId === req.id);

                  return (
                    <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        
                        {/* Shipment Info */}
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-400">#{req.id}</span>
                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${statusInfo?.style}`}>
                              {statusInfo?.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              تم التقديم: {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">المنتج والكمية</span>
                              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{req.productName} ({req.quantity})</span>
                              <span className="text-xs text-slate-500 mt-1 block">الفئة: {req.productCategory} | نوع الشاحنة: {req.truckCategory} - {req.truckType}</span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">المستلم والوجهة</span>
                              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{linkedClient?.name || 'غير معروف'}</span>
                              <span className="text-xs text-slate-500 mt-1 block">العنوان: {linkedClient?.address || '-'}</span>
                            </div>
                          </div>

                          {/* Loading Location */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium">موقع التحميل:</span>
                            <span>{req.loadingLocation}</span>
                          </div>
                        </div>

                        {/* Cost & Approvals */}
                        <div className="lg:w-80 flex flex-col justify-between self-stretch border-t lg:border-t-0 lg:border-r border-slate-100 pt-4 lg:pt-0 lg:pr-6 gap-4">
                          {req.status === ShipmentStatus.PENDING_ASSIGNMENT && (
                            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-center">
                              <Info className="w-4 h-4 text-slate-400 mx-auto mb-1.5" />
                              <span className="text-xs font-bold text-slate-600 block">بانتظار مراجعة شركة ساس</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">سيتم حساب المسافة وتكليف ناقل فوراً.</span>
                            </div>
                          )}

                          {req.status === ShipmentStatus.PENDING_APPROVAL && (
                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-3">
                              <div className="text-center">
                                <span className="text-[10px] text-amber-800 font-black block">السعر والتكلفة الإجمالية</span>
                                <span className="text-2xl font-black text-amber-800 mt-0.5 block">
                                  {req.estimatedBaseCost?.toLocaleString('ar-EG')} <span className="text-xs font-bold">ريال</span>
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1">المسافة المقدرة: {req.distanceKm} كم</span>
                              </div>

                              <div className="text-xs text-slate-600 space-y-1 bg-white p-2 rounded border border-amber-100">
                                <span className="block text-[10px] text-slate-400">الناقل المعين:</span>
                                <span className="font-bold block text-slate-800">{req.assignedCarrierName}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => onApproveShipmentAssignment(req.id)}
                                  className="flex items-center justify-center gap-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  قبول العقد
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRejectShipmentAssignment(req.id)}
                                  className="flex items-center justify-center gap-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  رفض
                                </button>
                              </div>
                            </div>
                          )}

                          {(req.status === ShipmentStatus.APPROVED || req.status === ShipmentStatus.IN_TRANSIT || req.status === ShipmentStatus.DELIVERED) && (
                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between h-full">
                              <div className="text-center">
                                <span className="text-[10px] text-emerald-800 font-bold block">التكلفة النهائية المعتمدة</span>
                                <span className="text-xl font-black text-emerald-800 mt-0.5 block">
                                  {req.estimatedBaseCost?.toLocaleString('ar-EG')} ريال
                                </span>
                              </div>

                              {linkedWaybill && (
                                <button
                                  type="button"
                                  onClick={() => onOpenWaybill(linkedWaybill.id)}
                                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-amber-500" />
                                  عرض وطباعة البوليصة
                                </button>
                              )}
                            </div>
                          )}

                          {req.status === ShipmentStatus.REJECTED && (
                            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 text-center">
                              <X className="w-6 h-6 text-rose-600 mx-auto mb-1" />
                              <span className="text-xs font-bold text-rose-800 block">تم رفض العرض المالي</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">يمكنك تقديم طلب جديد بمتطلبات مختلفة.</span>
                            </div>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">إدارة المنتجات التجارية</h2>
              <p className="text-xs text-slate-400 mt-0.5">المنتجات التي تقوم بشحنها محلياً للعملاء</p>
            </div>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة منتج جديد
            </button>
          </div>

          {/* Grid of Products */}
          {shipperProducts.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <span className="text-sm font-medium block">لم تقم بإضافة منتجات بعد</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {shipperProducts.map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                        {p.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mt-3">{p.name}</h4>
                    <span className="text-xs text-slate-400 block mt-1">العبوة: {p.packaging}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>نوع المنتج:</span>
                    <span className="font-bold text-slate-700">{p.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Product Modal */}
          {showAddProductModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm">إضافة منتج تجاري جديد</h3>
                  <button onClick={() => setShowAddProductModal(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">اسم المنتج التجاري *</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="مثال: دقيق كويتي فاخر"
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">العبوة القياسية *</label>
                    <input
                      type="text"
                      required
                      value={prodPackaging}
                      onChange={(e) => setProdPackaging(e.target.value)}
                      placeholder="مثال: كيس وزن 10 كجم"
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                    />
                  </div>

                  {/* Type drop-down with history & add option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">نوع المنتج *</label>
                    {!showCustomTypeInput ? (
                      <select
                        value={prodType}
                        required={!showCustomTypeInput}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowCustomTypeInput(true);
                            setProdType('');
                          } else {
                            setProdType(e.target.value);
                          }
                        }}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                      >
                        <option value="">-- اختر نوعاً مستخدماً مسبقاً --</option>
                        {rememberedTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                        <option value="ADD_NEW" className="font-bold text-amber-700">+ إضافة نوع منتج جديد...</option>
                      </select>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          value={customProdType}
                          onChange={(e) => setCustomProdType(e.target.value)}
                          placeholder="اكتب نوع المنتج الجديد هنا"
                          className="w-full text-sm px-3 py-2 bg-amber-50/30 border border-amber-200 rounded-md focus:bg-white focus:outline-amber-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomTypeInput(false);
                            setCustomProdType('');
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                        >
                          الرجوع للاختيار من القائمة
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Category drop-down with history & add option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">فئة المنتج *</label>
                    {!showCustomCategoryInput ? (
                      <select
                        value={prodCategory}
                        required={!showCustomCategoryInput}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowCustomCategoryInput(true);
                            setProdCategory('');
                          } else {
                            setProdCategory(e.target.value);
                          }
                        }}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                      >
                        <option value="">-- اختر فئة مستخدمة مسبقاً --</option>
                        {rememberedCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="ADD_NEW" className="font-bold text-amber-700">+ إضافة فئة جديدة...</option>
                      </select>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          value={customProdCategory}
                          onChange={(e) => setCustomProdCategory(e.target.value)}
                          placeholder="اكتب الفئة الجديدة هنا"
                          className="w-full text-sm px-3 py-2 bg-amber-50/30 border border-amber-200 rounded-md focus:bg-white focus:outline-amber-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCategoryInput(false);
                            setCustomProdCategory('');
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                        >
                          الرجوع للاختيار من القائمة
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      حفظ المنتج
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Clients Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">عملاء تجارة الجملة والمستلمون</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">أضف شركاءك التجاريين في المدن الأخرى لتنظيم وتسريع عمليات طلب الشحن</p>
            </div>
            <button
              onClick={() => setShowAddClientModal(true)}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة مستلم/عميل جديد
            </button>
          </div>

          {/* List of Clients */}
          {shipperClients.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <span className="text-sm font-medium block">لم تقم بإضافة عملاء مستلمين بعد</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shipperClients.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{c.name}</h4>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>رقم الجوال: {c.phone}</span>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>عنوان التسليم: {c.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Client Modal */}
          {showAddClientModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm">إضافة مستلم محلي جديد</h3>
                  <button onClick={() => setShowAddClientModal(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleClientSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">اسم العميل المستلم (المحل أو التاجر) *</label>
                    <input
                      type="text"
                      required
                      value={cliName}
                      onChange={(e) => setCliName(e.target.value)}
                      placeholder="مثال: أسواق النجمة المركزية"
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">رقم الجوال الفعال *</label>
                    <input
                      type="tel"
                      required
                      value={cliPhone}
                      onChange={(e) => setCliPhone(e.target.value)}
                      placeholder="مثال: 0550000000"
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-slate-900"
                    />
                  </div>

                  <div className="border-t border-slate-200/60 pt-4">
                    <MapPicker
                      label="موقع وتفاصيل عنوان الاستلام على الخريطة *"
                      value={cliAddress}
                      lat={cliLat}
                      lng={cliLng}
                      onChange={(address, lat, lng) => {
                        setCliAddress(address);
                        setCliLat(lat);
                        setCliLng(lng);
                      }}
                      placeholder="ابحث عن المدينة/الحي أو انقر لتحديد الموقع"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddClientModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      حفظ المستلم
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
