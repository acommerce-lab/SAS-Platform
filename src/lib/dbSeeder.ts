import { 
  db, 
  collection, 
  doc, 
  setDoc, 
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
    // Check if we've already seeded or if collections are empty
    const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
    if (!usersSnap.empty) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding database with default SAS data...');

    // 1. Seed Users
    for (const user of defaultUsers) {
      await setDoc(doc(db, 'users', user.id), user);
    }

    // 2. Seed Drivers
    for (const [carrierId, driverList] of Object.entries(defaultDrivers)) {
      for (const driver of driverList) {
        await setDoc(doc(db, 'drivers', driver.id), {
          ...driver,
          carrierId
        });
      }
    }

    // 3. Seed Trucks
    for (const [carrierId, truckList] of Object.entries(defaultTrucks)) {
      for (const truck of truckList) {
        await setDoc(doc(db, 'trucks', truck.id), {
          ...truck,
          carrierId
        });
      }
    }

    // 4. Seed Products
    for (const product of defaultProducts) {
      await setDoc(doc(db, 'products', product.id), product);
    }

    // 5. Seed Shipper Clients
    for (const client of defaultShipperClients) {
      await setDoc(doc(db, 'clients', client.id), client);
    }

    // 6. Seed Shipment Requests
    for (const shipment of defaultShipmentRequests) {
      await setDoc(doc(db, 'shipments', shipment.id), shipment);
    }

    // 7. Seed Waybills
    for (const waybill of defaultWaybills) {
      await setDoc(doc(db, 'waybills', waybill.id), waybill);
    }

    // 8. Seed System Settings
    await setDoc(doc(db, 'settings', 'global'), defaultSystemSettings);

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
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
