import { 
  UserRole, 
  ShipmentStatus, 
  User, 
  Driver, 
  Truck, 
  Product, 
  ShipperClient, 
  ShipmentRequest, 
  Waybill,
  SystemSettings 
} from './types';

// Pre-seeded Users
export const defaultUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@sas.sa',
    name: 'ساس للدعم اللوجستي - الإدارة',
    phone: '0501112222',
    role: UserRole.ADMIN,
    isVerified: true,
    createdAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'shipper-1',
    email: 'shipper1@global.com',
    name: 'شركة تجارة الجملة العالمية',
    phone: '0554445555',
    role: UserRole.SHIPPER,
    isVerified: true,
    createdAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'carrier-1',
    email: 'carrier1@express.sa',
    name: 'مؤسسة السهم السريع للنقليات',
    phone: '0567778888',
    role: UserRole.CARRIER,
    isVerified: true,
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'carrier-2',
    email: 'carrier2@coldchain.sa',
    name: 'شركة سلسلة التبريد اللوجستية',
    phone: '0543332211',
    role: UserRole.CARRIER,
    isVerified: true,
    createdAt: '2026-01-18T14:00:00Z',
  }
];

// Pre-seeded Drivers for Carrier 1 and Carrier 2
export const defaultDrivers: Record<string, Driver[]> = {
  'carrier-1': [
    { id: 'drv-101', name: 'أحمد محمود العتيبي', licenseNumber: 'DL-998877', phone: '0501234567' },
    { id: 'drv-102', name: 'محمد عبد الله الشمري', licenseNumber: 'DL-445566', phone: '0559876543' },
    { id: 'drv-103', name: 'سليمان خالد الدوسري', licenseNumber: 'DL-112233', phone: '0531112223' }
  ],
  'carrier-2': [
    { id: 'drv-201', name: 'ياسر طارق الحربي', licenseNumber: 'DL-773344', phone: '0544445551' },
    { id: 'drv-202', name: 'عصام كمال فيصل', licenseNumber: 'DL-665511', phone: '0566667772' }
  ]
};

// Pre-seeded Trucks for Carrier 1 and Carrier 2
export const defaultTrucks: Record<string, Truck[]> = {
  'carrier-1': [
    { 
      id: 'trk-101', 
      plateNumber: 'أ ب ج 1234', 
      type: 'سطحة', 
      category: 'تريلة', 
      driverId: 'drv-101', 
      firstKmRate: 150, 
      generalKmRate: 3.5 
    },
    { 
      id: 'trk-102', 
      plateNumber: 'د هـ و 5678', 
      type: 'قفص', 
      category: 'قاطرة', 
      driverId: 'drv-102', 
      firstKmRate: 120, 
      generalKmRate: 3.0 
    },
    { 
      id: 'trk-103', 
      plateNumber: 'ز ح ط 9012', 
      type: 'سطحة', 
      category: 'دينة', 
      driverId: 'drv-103', 
      firstKmRate: 80, 
      generalKmRate: 2.2 
    }
  ],
  'carrier-2': [
    { 
      id: 'trk-201', 
      plateNumber: 'ي ك ل 7777', 
      type: 'تبريد', 
      category: 'تريلة', 
      driverId: 'drv-201', 
      firstKmRate: 200, 
      generalKmRate: 4.5 
    },
    { 
      id: 'trk-202', 
      plateNumber: 'م ن هـ 8888', 
      type: 'تبريد', 
      category: 'دينة', 
      driverId: 'drv-202', 
      firstKmRate: 110, 
      generalKmRate: 3.0 
    }
  ]
};

// Pre-seeded Products for Shipper 1
export const defaultProducts: Product[] = [
  {
    id: 'prod-1',
    shipperId: 'shipper-1',
    name: 'حليب طويل الأجل نادك كرتون',
    packaging: 'كرتون (12 علبة * 1 لتر)',
    type: 'مواد غذائية',
    category: 'مبرّد / جاف',
  },
  {
    id: 'prod-2',
    shipperId: 'shipper-1',
    name: 'كيبلات نحاسية معزولة مقاس 16 مم',
    packaging: 'بكرة خشبية كبيرة',
    type: 'مواد كهربائية وصناعية',
    category: 'ثقيل / جاف',
  },
  {
    id: 'prod-3',
    shipperId: 'shipper-1',
    name: 'تمور خلاص الأحساء الفاخرة',
    packaging: 'صندوق كرتوني (8 كجم)',
    type: 'مواد غذائية',
    category: 'مبرّد',
  }
];

// Pre-seeded Wholesaler Clients for Shipper 1
export const defaultShipperClients: ShipperClient[] = [
  {
    id: 'cli-1',
    shipperId: 'shipper-1',
    name: 'مؤسسة خالد بن عبد العزيز للمواد الغذائية بالجملة',
    phone: '0599991111',
    address: 'الرياض - حي الملز - شارع الستين',
  },
  {
    id: 'cli-2',
    shipperId: 'shipper-1',
    name: 'شركة التوريدات الكهربائية الشرقية المحدودة',
    phone: '0588882222',
    address: 'الدمام - الخضرية - المنطقة الصناعية',
  },
  {
    id: 'cli-3',
    shipperId: 'shipper-1',
    name: 'أسواق النجمة للمواد الغذائية والاستهلاك',
    phone: '0577773333',
    address: 'جدة - حي الصفا - طريق الأمير ماجد',
  }
];

// Pre-seeded Shipment Requests
export const defaultShipmentRequests: ShipmentRequest[] = [
  {
    id: 'req-1',
    shipperId: 'shipper-1',
    shipperName: 'شركة تجارة الجملة العالمية',
    clientReceiverId: 'cli-1',
    loadingLocation: 'مستودعات الشاحن الرئيسية - الخرج طريق الملك فهد',
    productName: 'تمور خلاص الأحساء الفاخرة',
    productType: 'مواد غذائية',
    productCategory: 'مبرّد',
    quantity: '500 صندوق (إجمالي 4 طن)',
    truckType: 'تبريد',
    truckCategory: 'تريلة',
    createdAt: '2026-07-18T08:30:00Z',
    status: ShipmentStatus.PENDING_ASSIGNMENT,
  },
  {
    id: 'req-2',
    shipperId: 'shipper-1',
    shipperName: 'شركة تجارة الجملة العالمية',
    clientReceiverId: 'cli-2',
    loadingLocation: 'مستودع الصناعية الثالثة - الرياض',
    productName: 'كيبلات نحاسية معزولة مقاس 16 مم',
    productType: 'مواد كهربائية وصناعية',
    productCategory: 'ثقيل / جاف',
    quantity: '20 بكرة خشبية',
    truckType: 'سطحة',
    truckCategory: 'تريلة',
    createdAt: '2026-07-19T09:15:00Z',
    distanceKm: 395,
    estimatedBaseCost: 1532.5, // 150 + (394 * 3.5)
    assignedCarrierId: 'carrier-1',
    assignedCarrierName: 'مؤسسة السهم السريع للنقليات',
    assignedTruckId: 'trk-101',
    assignedDriverId: 'drv-101',
    status: ShipmentStatus.PENDING_APPROVAL,
  },
  {
    id: 'req-3',
    shipperId: 'shipper-1',
    shipperName: 'شركة تجارة الجملة العالمية',
    clientReceiverId: 'cli-3',
    loadingLocation: 'مستودعات الشاحن الرئيسية - الخرج طريق الملك فهد',
    productName: 'حليب طويل الأجل نادك كرتون',
    productType: 'مواد غذائية',
    productCategory: 'مبرّد / جاف',
    quantity: '1200 كرتون',
    truckType: 'تبريد',
    truckCategory: 'تريلة',
    createdAt: '2026-07-15T11:00:00Z',
    distanceKm: 980,
    estimatedBaseCost: 4605.5, // 200 + (979 * 4.5)
    assignedCarrierId: 'carrier-2',
    assignedCarrierName: 'شركة سلسلة التبريد اللوجستية',
    assignedTruckId: 'trk-201',
    assignedDriverId: 'drv-201',
    status: ShipmentStatus.APPROVED,
  }
];

// Pre-seeded Waybills
export const defaultWaybills: Waybill[] = [
  {
    id: 'wb-1',
    shipmentId: 'req-3',
    serialNumber: 'SAS-2026-0089',
    shipperInfo: {
      name: 'شركة تجارة الجملة العالمية',
      phone: '0554445555',
      address: 'مستودعات الشاحن الرئيسية - الخرج طريق الملك فهد',
    },
    carrierInfo: {
      name: 'شركة سلسلة التبريد اللوجستية',
      phone: '0543332211',
      truckPlate: 'ي ك ل 7777 (تبريد - تريلة)',
      driverName: 'ياسر طارق الحربي',
      driverPhone: '0544445551',
    },
    receiverInfo: {
      name: 'أسواق النجمة للمواد الغذائية والاستهلاك',
      phone: '0577773333',
      address: 'جدة - حي الصفا - طريق الأمير ماجد',
    },
    productInfo: {
      name: 'حليب طويل الأجل نادك كرتون',
      type: 'مواد غذائية',
      category: 'مبرّد / جاف',
      quantity: '1200 كرتون',
      packaging: 'كرتون (12 علبة * 1 لتر)',
    },
    routeInfo: {
      from: 'الخرج (مستودعات الشاحن)',
      to: 'جدة (أسواق النجمة)',
      distance: 980,
      estimatedCost: 4605.5,
    },
    issueDate: '2026-07-16',
    termsAndConditions: `بند 1: تتعهد شركة النقل بإيصال البضاعة الموضحة أعلاه بالحالة المستلمة نفسها وخلال الوقت المتفق عليه.
بند 2: لا تقع على عاتق وسيط الشحن (ساس) أي مسؤولية مباشرة عن التلفيات الناتجة عن الحوادث المرورية الخارجة عن الإرادة ما لم يثبت إهمال السائق.
بند 3: يجب على الشاحن مطابقة الكمية والمواصفات عند التحميل والتوقيع على نموذج الاستلام من السائق.
بند 4: يحق للمستلم فحص الشحنة ظاهرياً قبل التوقيع على الاستلام النهائي للبضاعة وتدوين أي ملاحظات خطية.
بند 5: يلتزم الشاحن بدفع رسوم الوساطة المقررة وفق الفواتير الصادرة من شركة ساس خلال 15 يوماً من التوصيل.`,
  }
];

// Default System settings
export const defaultSystemSettings: SystemSettings = {
  waybillHeader: 'شركة ساس للدعم اللوجستي المحدودة\nترخيص هيئة النقل رقم: 4410992\nبوليصة شحن معيارية موحدة لعمليات الشحن البري المحلي والمدني',
  waybillFooter: 'المركز الرئيسي: الرياض، المملكة العربية السعودية - هاتف: 9200112233 - البريد الإلكتروني: support@sas.sa',
  defaultTerms: `بند 1: الشروط والأحكام العامة لخدمات النقل البري المحلي لشركة ساس اللوجستية.
بند 2: تتعهد شركة النقل بتوفير شاحنة مجهزة وفق متطلبات الشحنة (مثل درجات التبريد المعتمدة لمواد الغذاء).
بند 3: أي تأخير ناتج عن خلل فني في شاحنات الناقل يتحمل الناقل مسؤوليته الكاملة بما في ذلك تلف البضاعة القابلة للتلف.
بند 4: يقر الشاحن بأن البضائع المسلمة للنقل لا تحتوي على مواد محظورة أو خطرة ومخالفة لأنظمة المملكة العربية السعودية.
بند 5: تعتبر هذه البوليصة مستنداً رسمياً لإثبات استلام الشحنة وإتمام عملية النقل فور توقيع المستلم والناقل عليها.
بند 6: تخضع أي خلافات ناتجة عن هذه البوليصة للأنظمة السائدة في المملكة العربية السعودية والجهات القضائية المختصة.`,
  primaryColor: '#0F172A', // Slate 900
  secondaryColor: '#B45309', // Amber 700
};
