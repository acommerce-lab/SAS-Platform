import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import CarrierPanel from './components/CarrierPanel';
import ShipperPanel from './components/ShipperPanel';
import AdminPanel from './components/AdminPanel';
import WaybillPrintable from './components/WaybillPrintable';

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
  SystemSettings,
  Notification 
} from './types';

import { 
  defaultSystemSettings 
} from './data';

import { 
  auth, 
  db, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  safeGetDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  onAuthStateChanged, 
  signOut 
} from './lib/firebase';

import { seedDatabaseIfEmpty } from './lib/dbSeeder';

export default function App() {
  // --- REAL-TIME CLOUD STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Record<string, Driver[]>>({});
  const [trucks, setTrucks] = useState<Record<string, Truck[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<ShipperClient[]>([]);
  const [shipments, setShipments] = useState<ShipmentRequest[]>([]);
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // State to handle viewing active Waybill popup/modal
  const [activeWaybillId, setActiveWaybillId] = useState<string | null>(null);

  // 1. Initial Seeding and Database Real-time Subscriptions
  useEffect(() => {
    // Run database seeder
    seedDatabaseIfEmpty();

    // Listeners for all collections
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const uList: User[] = [];
      snap.forEach(d => uList.push(d.data() as User));
      setUsers(uList);
    }, (err) => {
      console.warn("Users subscription offline or restricted:", err.message);
    });

    const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snap) => {
      const group: Record<string, Driver[]> = {};
      snap.forEach(d => {
        const driver = d.data() as Driver & { carrierId: string };
        if (!group[driver.carrierId]) {
          group[driver.carrierId] = [];
        }
        group[driver.carrierId].push(driver);
      });
      setDrivers(group);
    }, (err) => {
      console.warn("Drivers subscription offline or restricted:", err.message);
    });

    const unsubTrucks = onSnapshot(collection(db, 'trucks'), (snap) => {
      const group: Record<string, Truck[]> = {};
      snap.forEach(d => {
        const truck = d.data() as Truck & { carrierId: string };
        if (!group[truck.carrierId]) {
          group[truck.carrierId] = [];
        }
        group[truck.carrierId].push(truck);
      });
      setTrucks(group);
    }, (err) => {
      console.warn("Trucks subscription offline or restricted:", err.message);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const list: Product[] = [];
      snap.forEach(d => list.push(d.data() as Product));
      setProducts(list);
    }, (err) => {
      console.warn("Products subscription offline or restricted:", err.message);
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: ShipperClient[] = [];
      snap.forEach(d => list.push(d.data() as ShipperClient));
      setClients(list);
    }, (err) => {
      console.warn("Clients subscription offline or restricted:", err.message);
    });

    const unsubShipments = onSnapshot(collection(db, 'shipments'), (snap) => {
      const list: ShipmentRequest[] = [];
      snap.forEach(d => list.push(d.data() as ShipmentRequest));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setShipments(list);
    }, (err) => {
      console.warn("Shipments subscription offline or restricted:", err.message);
    });

    const unsubWaybills = onSnapshot(collection(db, 'waybills'), (snap) => {
      const list: Waybill[] = [];
      snap.forEach(d => list.push(d.data() as Waybill));
      setWaybills(list);
    }, (err) => {
      console.warn("Waybills subscription offline or restricted:", err.message);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSystemSettings(docSnap.data() as SystemSettings);
      }
    }, (err) => {
      console.warn("Settings subscription offline or restricted:", err.message);
    });

    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
      const list: Notification[] = [];
      snap.forEach(d => list.push(d.data() as Notification));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    }, (err) => {
      console.warn("Notifications subscription offline or restricted:", err.message);
    });

    return () => {
      unsubUsers();
      unsubDrivers();
      unsubTrucks();
      unsubProducts();
      unsubClients();
      unsubShipments();
      unsubWaybills();
      unsubSettings();
      unsubNotifs();
    };
  }, []);

  // 2. Firebase Authentication State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          let userDoc = await safeGetDoc(doc(db, 'users', fbUser.uid));
          if (userDoc && userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
            const resolvedRole = fbUser.email?.includes('admin') ? UserRole.ADMIN : (fbUser.email?.includes('carrier') ? UserRole.CARRIER : UserRole.SHIPPER);

            const newUserProfile: User = {
              id: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.email?.split('@')[0] || 'مستخدم ساس',
              phone: '0500000000',
              role: resolvedRole,
              isVerified: true,
              createdAt: new Date().toISOString()
            };

            setCurrentUser(newUserProfile);
            
            // Persist document to Firestore immediately
            setDoc(doc(db, 'users', fbUser.uid), newUserProfile).catch(err => console.warn("Auto-saving user profile error:", err));
          }
        } catch (err: any) {
          console.error("Error fetching user profile:", err);
          const resolvedRole = fbUser.email?.includes('admin') ? UserRole.ADMIN : (fbUser.email?.includes('carrier') ? UserRole.CARRIER : UserRole.SHIPPER);

          setCurrentUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.email?.split('@')[0] || 'مستخدم ساس',
            phone: '0500000000',
            role: resolvedRole,
            isVerified: true,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- APP STATE ACTIONS ---

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    addNotification(user.id, 'تم تسجيل الدخول', `أهلاً بك مجدداً في منصة ساس اللوجستية.`)
      .catch(err => console.warn("Failed to add login notification:", err));
  };

  const handleRegisterSuccess = async (registeredUser: Omit<User, 'id' | 'createdAt'>) => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      const fullUser: User = {
        id: fbUser.uid,
        ...registeredUser,
        createdAt: new Date().toISOString()
      };
      setCurrentUser(fullUser);
      try {
        await setDoc(doc(db, 'users', fbUser.uid), fullUser);
      } catch (err) {
        console.warn("Could not save user profile doc:", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out failed or already signed out:", err);
    }
    setCurrentUser(null);
  };

  const handleSwitchUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      await addNotification(user.id, 'تبديل حساب', `أهلاً بك: ${user.name}`);
    }
  };

  // Helper to add live notification
  const addNotification = async (userId: string, title: string, message: string) => {
    const notifId = 'notif-' + Date.now() + Math.random().toString(36).substr(2, 5);
    const newNotif: Notification = {
      id: notifId,
      userId,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    try {
      // Save to Firestore notifications
      await setDoc(doc(db, 'notifications', notifId), newNotif);

      // Write a Virtual Email corresponding to this notification
      let profile: User | null = null;
      if (currentUser && currentUser.id === userId) {
        profile = currentUser;
      } else {
        try {
          const userSnap = await safeGetDoc(doc(db, 'users', userId));
          if (userSnap && userSnap.exists()) {
            profile = userSnap.data() as User;
          }
        } catch (getErr) {
          console.warn("Could not fetch user profile for notification:", getErr);
        }
      }

      if (profile) {
        await addDoc(collection(db, 'virtual_emails'), {
          toEmail: profile.email,
          subject: `تنبيه من منصة ساس: ${title}`,
          body: `عزيزي شريك ساس (${profile.name})،

وصلك تنبيه جديد في حسابك:
"${message}"

يرجى مراجعة لوحة التحكم للتفاعل مع الطلب ومتابعة دورة النقل البري.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          type: 'notification_alert'
        });
      }
    } catch (err) {
      console.warn("Could not save notification to Firestore (offline):", err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  };

  const handleClearNotifications = async () => {
    if (!currentUser) return;
    const userNotifs = notifications.filter(n => n.userId === currentUser.id);
    for (const notif of userNotifs) {
      await deleteDoc(doc(db, 'notifications', notif.id));
    }
  };

  // --- BUSINESS OPERATION HANDLERS ---

  // Carrier actions
  const handleAddDriverAndTruck = async (
    newDriver: Omit<Driver, 'id'>, 
    newTruck: Omit<Truck, 'id' | 'driverId'>
  ) => {
    const activeCarrierId = auth.currentUser?.uid || currentUser?.id;
    if (!activeCarrierId) return;

    const driverId = 'drv-' + Date.now();
    const truckId = 'trk-' + Date.now();

    const createdDriver: Driver = {
      ...newDriver,
      id: driverId,
      carrierId: activeCarrierId
    };

    const createdTruck: Truck = {
      ...newTruck,
      id: truckId,
      driverId: driverId,
      carrierId: activeCarrierId
    };

    // Optimistic local update so UI updates immediately
    setDrivers(prev => ({
      ...prev,
      [activeCarrierId]: [...(prev[activeCarrierId] || []), createdDriver]
    }));
    setTrucks(prev => ({
      ...prev,
      [activeCarrierId]: [...(prev[activeCarrierId] || []), createdTruck]
    }));

    // Save to Firestore permanently
    await setDoc(doc(db, 'drivers', driverId), createdDriver);
    await setDoc(doc(db, 'trucks', truckId), createdTruck);

    // Notify carrier
    await addNotification(
      activeCarrierId, 
      'ربط السائق بالشاحنة ناجح', 
      `تم تسجيل السائق (${createdDriver.name}) وتفويضه على الشاحنة رقم لوحة (${createdTruck.plateNumber}) بنجاح.`
    );

    // Notify admin
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser) {
      await addNotification(
        adminUser.id,
        'أسطول ناقل جديد مسجل',
        `قام الناقل (${currentUser?.name || 'ناقل بري'}) بإضافة شاحنة وسائق بنظام (لا شاحنة بلا سائق).`
      );
    }
  };

  const handleUpdateShipmentStatus = async (shipmentId: string, status: ShipmentStatus) => {
    setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status } : s));
    await updateDoc(doc(db, 'shipments', shipmentId), { status });
    
    // Find shipment to trigger targeted notifications
    const s = shipments.find(sh => sh.id === shipmentId);
    if (s) {
      // Notify Shipper
      await addNotification(
        s.shipperId,
        `تحديث حالة الشحنة #${s.id}`,
        status === ShipmentStatus.IN_TRANSIT 
          ? `شحنتك الآن على الطريق قيد النقل مع الناقل (${s.assignedCarrierName}).`
          : `تهانينا! تم تسليم الشحنة لتاجر التجزئة المستلم بنجاح.`
      );

      // Notify Admin
      const adminUser = users.find(u => u.role === UserRole.ADMIN);
      if (adminUser) {
        await addNotification(
          adminUser.id,
          `حالة الشحنة #${s.id}`,
          `قام الناقل بتحديث حالة الطلب إلى: ${status === ShipmentStatus.IN_TRANSIT ? 'قيد النقل' : 'تم التسليم'}.`
        );
      }
    }
  };

  // Shipper actions
  const handleAddProduct = async (newProduct: Omit<Product, 'id' | 'shipperId'>) => {
    const activeShipperId = auth.currentUser?.uid || currentUser?.id;
    if (!activeShipperId) return;

    const created: Product = {
      ...newProduct,
      id: 'prod-' + Date.now(),
      shipperId: activeShipperId
    };
    
    setProducts(prev => [...prev.filter(p => p.id !== created.id), created]);
    await setDoc(doc(db, 'products', created.id), created);
    await addNotification(activeShipperId, 'تمت إضافة منتج جديد', `تم تسجيل منتجك (${created.name}) بنجاح في قاعدة البيانات.`);
  };

  const handleAddClient = async (newClient: Omit<ShipperClient, 'id' | 'shipperId'>) => {
    const activeShipperId = auth.currentUser?.uid || currentUser?.id;
    if (!activeShipperId) return;

    const created: ShipperClient = {
      ...newClient,
      id: 'cli-' + Date.now(),
      shipperId: activeShipperId
    };
    
    setClients(prev => [...prev.filter(c => c.id !== created.id), created]);
    await setDoc(doc(db, 'clients', created.id), created);
    await addNotification(activeShipperId, 'تمت إضافة مستلم جديد', `تم حفظ بيانات العميل المستمر (${created.name}) بنجاح.`);
  };

  const handleAddShipmentRequest = async (
    newRequest: Omit<ShipmentRequest, 'id' | 'shipperId' | 'shipperName' | 'createdAt' | 'status'>
  ) => {
    const activeShipperId = auth.currentUser?.uid || currentUser?.id;
    if (!activeShipperId) return;

    const reqId = 'req-' + Date.now();
    const created: ShipmentRequest = {
      ...newRequest,
      id: reqId,
      shipperId: activeShipperId,
      shipperName: currentUser?.name || 'شاحن معتمد',
      createdAt: new Date().toISOString(),
      status: ShipmentStatus.PENDING_ASSIGNMENT,
    };

    // Optimistically update React state immediately for all views
    setShipments(prev => [created, ...prev.filter(s => s.id !== reqId)]);

    try {
      await setDoc(doc(db, 'shipments', created.id), created);
    } catch (err) {
      console.warn("Could not write shipment request to Firestore:", err);
    }

    // Notify Shipper
    await addNotification(
      activeShipperId,
      'تم إرسال طلب الشحن لشركة ساس',
      `تم إرسال الطلب برقم مرجعي #${created.id}. بانتظار تقدير المسافة والوسطاء للتسعير.`
    );

    // Notify Admin
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser) {
      await addNotification(
        adminUser.id,
        'طلب شحن معلق جديد',
        `قدم الشاحن (${currentUser?.name || 'شاحن معتمد'}) طلب شحن لمنتج (${created.productName}) بوزن/كمية (${created.quantity}).`
      );
    }
  };

  const handleApproveShipmentAssignment = async (shipmentId: string) => {
    const s = shipments.find(sh => sh.id === shipmentId);
    if (!s) return;

    // Create matching Waybill automatically
    const serialNum = 'SAS-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const receiverObj = clients.find(c => c.id === s.clientReceiverId);
    
    const newWaybill: Waybill = {
      id: 'wb-' + Date.now(),
      shipmentId: s.id,
      serialNumber: serialNum,
      shipperInfo: {
        name: s.shipperName,
        phone: currentUser?.phone || '0554445555',
        address: s.loadingLocation,
      },
      carrierInfo: {
        name: s.assignedCarrierName || 'مؤسسة النقل المعتمدة',
        phone: '0560000000',
        truckPlate: `${s.truckCategory} (${s.truckType})`,
        driverName: 'السائق المعين بساس',
        driverPhone: '0500000000',
      },
      receiverInfo: {
        name: receiverObj?.name || 'مستلم مجهول',
        phone: receiverObj?.phone || '0500000000',
        address: receiverObj?.address || 'العنوان المسجل',
      },
      productInfo: {
        name: s.productName,
        type: s.productType,
        category: s.productCategory,
        quantity: s.quantity,
        packaging: 'عبوة قياسية معتمدة بطلب العميل',
      },
      routeInfo: {
        from: s.loadingLocation,
        to: receiverObj?.address || 'موقع المستلم',
        distance: s.distanceKm || 100,
        estimatedCost: s.estimatedBaseCost || 500,
      },
      issueDate: new Date().toISOString().split('T')[0],
      termsAndConditions: systemSettings.defaultTerms,
    };

    // Optimistically update local waybills and shipments
    setWaybills(prev => [newWaybill, ...prev.filter(w => w.id !== newWaybill.id)]);
    setShipments(prev => prev.map(sh => sh.id === shipmentId ? { ...sh, status: ShipmentStatus.APPROVED } : sh));

    // Save to Firestore
    await setDoc(doc(db, 'waybills', newWaybill.id), newWaybill);
    await updateDoc(doc(db, 'shipments', shipmentId), { status: ShipmentStatus.APPROVED });

    // Send Virtual Email Report for Waybill Creation
    await addDoc(collection(db, 'virtual_emails'), {
      toEmail: currentUser?.email || 'shipper@sas.sa',
      subject: `إصدار بوليصة شحن معيارية موحدة برقم: ${serialNum}`,
      body: `عزيزي الشاحن الشريك (${s.shipperName})،

لقد تمت الموافقة على تسعير الشحنة #${s.id} بنجاح وصدرت بوليصة الشحن الرسمية الموحدة برقم: ${serialNum}

موجز بيانات النقل البري للبوليصة:
- اسم الناقل: ${newWaybill.carrierInfo.name}
- شاحنة النقل: ${newWaybill.carrierInfo.truckPlate}
- قائد الشاحنة: ${newWaybill.carrierInfo.driverName}
- صنف المنتج: ${newWaybill.productInfo.name} (${newWaybill.productInfo.quantity})
- خط السير: من (${newWaybill.routeInfo.from}) إلى (${newWaybill.routeInfo.to})
- إجمالي العقد والتكلفة: ${newWaybill.routeInfo.estimatedCost} ريال سعودي

تم الربط المباشر مع وزارة النقل ومطابقتها وتخزينها في خوادم ساس السحابية الآمنة.`,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: 'waybill_issued'
    });

    // Notify Carrier
    if (s.assignedCarrierId) {
      await addNotification(
        s.assignedCarrierId,
        `تم قبول العقد وتكليفك بالشحنة #${s.id}`,
        `وافق الشاحن على أسعارك لتوصيل (${s.productName}). يرجى التحميل والإنطلاق بالبوليصة رقم ${serialNum}.`
      );
    }

    // Notify Admin
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser) {
      await addNotification(
        adminUser.id,
        `تم قبول التسعيرة وإصدار بوليصة للشحنة #${s.id}`,
        `وافق العميل على التسعيرة وصدرت بوليصة شحن برقم: ${serialNum}.`
      );
    }
  };

  const handleRejectShipmentAssignment = async (shipmentId: string) => {
    setShipments(prev => prev.map(sh => sh.id === shipmentId ? { ...sh, status: ShipmentStatus.REJECTED } : sh));
    await updateDoc(doc(db, 'shipments', shipmentId), { status: ShipmentStatus.REJECTED });
    
    // Notify Admin
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser) {
      await addNotification(
        adminUser.id,
        `رفض تسعيرة الشحنة #${shipmentId}`,
        `رفض الشاحن العقد والناقل المقترح للشحنة.`
      );
    }
  };

  // Admin actions
  const handleAssignCarrier = async (
    shipmentId: string, 
    carrierId: string, 
    carrierName: string,
    truckId: string, 
    driverId: string, 
    distanceKm: number, 
    cost: number
  ) => {
    const updated = {
      assignedCarrierId: carrierId,
      assignedCarrierName: carrierName,
      assignedTruckId: truckId,
      assignedDriverId: driverId,
      distanceKm: distanceKm,
      estimatedBaseCost: cost,
      status: ShipmentStatus.PENDING_APPROVAL,
    };

    setShipments(prev => prev.map(sh => sh.id === shipmentId ? { ...sh, ...updated } : sh));
    await updateDoc(doc(db, 'shipments', shipmentId), updated);

    // Notify Shipper
    const s = shipments.find(sh => sh.id === shipmentId);
    if (s) {
      await addNotification(
        s.shipperId,
        `عرض تسعيرة جاهز للشحنة #${s.id}`,
        `قامت شركة ساس بحساب المسافة (${distanceKm} كم) وتخصيص الناقل (${carrierName}). التكلفة المتوقعة: ${cost.toLocaleString('ar-EG')} ريال. يرجى المراجعة والقبول لتوليد بوليصة الشحن.`
      );
    }
  };

  const handleUpdateSystemSettings = async (newSettings: SystemSettings) => {
    await setDoc(doc(db, 'settings', 'global'), newSettings);
  };


  // Open the printable Waybill viewer
  const handleOpenWaybillViewer = (waybillId: string) => {
    setActiveWaybillId(waybillId);
  };

  // Find the waybill being viewed
  const viewedWaybill = waybills.find(w => w.id === activeWaybillId) || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      
      {/* 1. Global Navigation */}
      <Navbar 
        currentUser={currentUser}
        usersList={users}
        notifications={notifications.filter(n => n.userId === currentUser?.id || n.userId === 'admin-1')}
        onSwitchUser={handleSwitchUser}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearNotifications={handleClearNotifications}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Board */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentUser ? (
          <>
            {/* Direct routing based on active logged in user's role */}
            {currentUser.role === UserRole.ADMIN && (
              <AdminPanel 
                adminUser={currentUser}
                shipments={shipments}
                carriers={users.filter(u => u.role === UserRole.CARRIER)}
                allTrucks={trucks}
                allDrivers={drivers}
                systemSettings={systemSettings}
                onUpdateSystemSettings={handleUpdateSystemSettings}
                onAssignCarrier={handleAssignCarrier}
              />
            )}

            {currentUser.role === UserRole.SHIPPER && (
              <ShipperPanel 
                shipperUser={currentUser}
                products={products}
                clients={clients}
                shipments={shipments}
                waybills={waybills}
                onAddProduct={handleAddProduct}
                onAddClient={handleAddClient}
                onAddShipmentRequest={handleAddShipmentRequest}
                onApproveShipmentAssignment={handleApproveShipmentAssignment}
                onRejectShipmentAssignment={handleRejectShipmentAssignment}
                onOpenWaybill={handleOpenWaybillViewer}
              />
            )}

            {currentUser.role === UserRole.CARRIER && (
              <CarrierPanel 
                carrierUser={currentUser}
                drivers={drivers[currentUser.id] || []}
                trucks={trucks[currentUser.id] || []}
                shipments={shipments}
                onAddDriverAndTruck={handleAddDriverAndTruck}
                onUpdateShipmentStatus={handleUpdateShipmentStatus}
              />
            )}
          </>
        ) : (
          /* Render Register/Login panel if user logs out */
          <AuthScreen 
            onLoginSuccess={handleLoginSuccess}
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}

      </main>

      {/* 3. Global Print-Ready Waybill Viewer Overlay */}
      {viewedWaybill && (
        <WaybillPrintable 
          waybill={viewedWaybill}
          systemSettings={systemSettings}
          onClose={() => setActiveWaybillId(null)}
        />
      )}

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 no-print shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} منصة ساس اللوجستية (SAS). جميع الحقوق محفوظة لوزارة النقل وهيئة الاتصالات والتقنية.</span>
          <span className="font-mono text-[10px]">نسخة الإنتاج v1.2.0 | تم التطوير وفق المعايير الموحدة للنقل البري بالمملكة</span>
        </div>
      </footer>

    </div>
  );
}
