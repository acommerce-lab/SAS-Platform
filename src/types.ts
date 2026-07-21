/**
 * Types and Interfaces for SAS Logistics Platform
 */

export enum UserRole {
  ADMIN = 'ADMIN', // SAS Logistics Support
  SHIPPER = 'SHIPPER', // الشاحن
  CARRIER = 'CARRIER', // الناقل
}

export enum ShipmentStatus {
  PENDING_ASSIGNMENT = 'PENDING_ASSIGNMENT', // بانتظار تعيين ناقل
  PENDING_APPROVAL = 'PENDING_APPROVAL', // بانتظار موافقة الشاحن على السعر والناقل
  APPROVED = 'APPROVED', // تم القبول وبانتظار التحميل (تم إصدار البوليصة)
  REJECTED = 'REJECTED', // تم رفض العرض من الشاحن
  IN_TRANSIT = 'IN_TRANSIT', // قيد النقل
  DELIVERED = 'DELIVERED', // تم التوصيل
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  carrierId?: string;
  name: string;
  licenseNumber: string;
  phone: string;
}

export interface Truck {
  id: string;
  carrierId?: string;
  plateNumber: string;
  type: string; // تبريد، سطحة، قفص، لور، الخ
  category: string; // دينة، قاطرة، تريلة، الخ
  driverId: string; // مرتبطة بسائق
  firstKmRate: number; // سعر الكيلومتر الأول
  generalKmRate: number; // سعر الكيلومتر العام
}

export interface Product {
  id: string;
  shipperId: string;
  name: string;
  packaging: string; // العبوة (كرتون، طبلية، الخ)
  type: string; // نوع المنتج (مواد غذائية، كيماويات، أثاث...)
  category: string; // فئة المنتج (مجمد، جاف، سائل...)
}

export interface ShipperClient {
  id: string;
  shipperId: string;
  name: string;
  phone: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface ShipmentRequest {
  id: string;
  shipperId: string;
  shipperName: string;
  clientReceiverId: string; // العميل المستلم
  loadingLocation: string; // موقع التحميل
  loadingLat?: number;
  loadingLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  productName: string;
  productType: string;
  productCategory: string;
  quantity: string;
  truckType: string; // نوع الشاحنة المطلوب
  truckCategory: string; // فئة الشاحنة المطلوبة
  createdAt: string;
  
  // Logistics calculations
  distanceKm?: number; // المسافة المقدرة
  estimatedBaseCost?: number; // التكلفة التقديرية بناء على الناقل المختار
  
  // Carrier assignment
  assignedCarrierId?: string; // معرف الناقل المعين
  assignedCarrierName?: string;
  assignedTruckId?: string;
  assignedDriverId?: string;
  
  status: ShipmentStatus;
}

export interface Waybill {
  id: string;
  shipmentId: string;
  serialNumber: string; // رقم تسلسلي معتمد
  shipperInfo: {
    name: string;
    phone: string;
    address: string;
  };
  carrierInfo: {
    name: string;
    phone: string;
    truckPlate: string;
    driverName: string;
    driverPhone: string;
  };
  receiverInfo: {
    name: string;
    phone: string;
    address: string;
  };
  productInfo: {
    name: string;
    type: string;
    category: string;
    quantity: string;
    packaging: string;
  };
  routeInfo: {
    from: string;
    to: string;
    distance: number;
    estimatedCost: number;
  };
  termsAndConditions: string; // الشروط والأحكام المطبوعة
  issueDate: string;
}

export interface SystemSettings {
  waybillHeader: string;
  waybillFooter: string;
  defaultTerms: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Notification {
  id: string;
  userId: string; // المستهدف بالاشعار
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}
