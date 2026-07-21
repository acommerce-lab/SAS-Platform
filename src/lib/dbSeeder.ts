import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  limit, 
  query 
} from './firebase';
import { 
  defaultUsers, 
  defaultDrivers, 
  defaultTrucks, 
  defaultProducts, 
  defaultShipperClients, 
  defaultShipmentRequests, 
  defaultWaybills, 
  defaultSystemSettings 
} from '../data';

export async function seedDatabaseIfEmpty() {
  try {
    console.log('Checking database collections for SAS initial seed data...');

    // 1. Seed Users if admin missing
    const adminSnap = await getDoc(doc(db, 'users', 'admin-1'));
    if (!adminSnap.exists()) {
      for (const user of defaultUsers) {
        await setDoc(doc(db, 'users', user.id), user);
      }
    }

    // 2. Seed Drivers if empty
    const driversSnap = await getDocs(query(collection(db, 'drivers'), limit(1)));
    if (driversSnap.empty) {
      for (const [carrierId, driverList] of Object.entries(defaultDrivers)) {
        for (const driver of driverList) {
          await setDoc(doc(db, 'drivers', driver.id), { ...driver, carrierId });
        }
      }
    }

    // 3. Seed Trucks if empty
    const trucksSnap = await getDocs(query(collection(db, 'trucks'), limit(1)));
    if (trucksSnap.empty) {
      for (const [carrierId, truckList] of Object.entries(defaultTrucks)) {
        for (const truck of truckList) {
          await setDoc(doc(db, 'trucks', truck.id), { ...truck, carrierId });
        }
      }
    }

    // 4. Seed Products if empty
    const productsSnap = await getDocs(query(collection(db, 'products'), limit(1)));
    if (productsSnap.empty) {
      for (const product of defaultProducts) {
        await setDoc(doc(db, 'products', product.id), product);
      }
    }

    // 5. Seed Shipper Clients if empty
    const clientsSnap = await getDocs(query(collection(db, 'clients'), limit(1)));
    if (clientsSnap.empty) {
      for (const client of defaultShipperClients) {
        await setDoc(doc(db, 'clients', client.id), client);
      }
    }

    // 6. Seed Shipment Requests if empty
    const shipmentsSnap = await getDocs(query(collection(db, 'shipments'), limit(1)));
    if (shipmentsSnap.empty) {
      for (const shipment of defaultShipmentRequests) {
        await setDoc(doc(db, 'shipments', shipment.id), shipment);
      }
    }

    // 7. Seed Waybills if empty
    const waybillsSnap = await getDocs(query(collection(db, 'waybills'), limit(1)));
    if (waybillsSnap.empty) {
      for (const waybill of defaultWaybills) {
        await setDoc(doc(db, 'waybills', waybill.id), waybill);
      }
    }

    // 8. Seed System Settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'global'), defaultSystemSettings);
    }

    // 9. Seed Initial Notifications
    const initialNotif = {
      id: 'notif-initial',
      userId: 'admin-1',
      title: 'أهلاً بك في منصة ساس اللوجستية السحابية',
      message: 'تم تفعيل قاعدة بيانات فايربيس (Firestore) بنجاح. جميع البيانات تتوفر الآن بمزامنة حية ومباشرة.',
      createdAt: new Date().toISOString(),
      isRead: false
    };
    await setDoc(doc(db, 'notifications', initialNotif.id), initialNotif);

    // 10. Seed Initial Virtual Email
    const initialEmail = {
      id: 'email-initial',
      toEmail: 'admin@sas.sa',
      subject: 'تفعيل خوادم ساس اللوجستية السحابية',
      body: `مرحباً بك في منصة ساس السحابية الموحدة (SAS Logistics).
تم تفعيل نظام الربط مع Firebase وتجهيز قاعدة البيانات لعمليات النقل والتحقق الثنائي 2FA.
تمنياتنا لكم بعرض ناجح مع مدراء الشركة!`,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: 'system'
    };
    await setDoc(doc(db, 'virtual_emails', initialEmail.id), initialEmail);

    console.log('Database seeding completed successfully!');
  } catch (error: any) {
    if (error?.message?.includes('offline') || error?.message?.includes('unreachable') || error?.message?.includes('network')) {
      console.warn('Database seeding deferred (client is offline or network is unreachable).');
    } else {
      console.warn('Database seeding status:', error?.message || error);
    }
  }
}
