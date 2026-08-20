import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { LoanRequest, UserProfile, UserRole, AppNotification } from '../types';
import { Equipment } from '../data/equipment';

// 1. Initialize Firebase App (Singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// 3. Initialize Firebase Auth
export const auth = getAuth(app);

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  LOANS: 'loans',
  EQUIPMENT: 'equipment',
  EQUIPMENT_OVERRIDES: 'equipment_overrides',
  ADMIN_EMAILS: 'admin_emails',
  NOTIFICATIONS: 'notifications'
};

// ==========================================
// Firestore Standard Error Handling & Health
// ==========================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Real-time Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Validate live connection to Firestore backend
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore live connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is currently offline or connecting...');
      return false;
    }
    // Any other response (like doc not found) means network connection is online
    return true;
  }
}

// ==========================================
// Authentication APIs
// ==========================================

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

/**
 * Register a new user with Email and Password
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  department: string,
  phone: string,
  role: UserRole = 'user'
): Promise<AuthResponse> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = userCredential.user;

    // Update display name in Firebase Auth
    if (displayName) {
      await updateProfile(fbUser, { displayName });
    }

    const userProfile: UserProfile = {
      id: fbUser.uid,
      name: displayName || email.split('@')[0],
      email: email.trim().toLowerCase(),
      role,
      department: department || 'คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น',
      phone: phone || '',
      avatarBg: role === 'admin' ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700'
    };

    // Save profile into Firestore 'users' collection
    await setDoc(doc(db, COLLECTIONS.USERS, fbUser.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { success: true, user: userProfile };
  } catch (error: any) {
    console.error('Firebase registration error:', error);
    let errorMsg = 'เกิดข้อผิดพลาดในการลงทะเบียน';
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'อีเมลนี้ถูกลงทะเบียนไว้แล้วในระบบ';
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = 'รูปแบบอีเมลไม่ถูกต้อง';
    } else if (error.code === 'auth/weak-password') {
      errorMsg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    } else if (error.message) {
      errorMsg = error.message;
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Sign In with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<AuthResponse> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = userCredential.user;

    // Fetch user profile from Firestore
    const userDocRef = doc(db, COLLECTIONS.USERS, fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    let userProfile: UserProfile;

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      userProfile = {
        id: fbUser.uid,
        name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        email: (data.email || fbUser.email || '').toLowerCase(),
        role: data.role || 'user',
        department: data.department || 'คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น',
        phone: data.phone || '',
        avatarBg: data.avatarBg || (data.role === 'admin' ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700')
      };
    } else {
      // Create user profile in Firestore if first time
      const isLakkch = fbUser.email?.toLowerCase() === 'lakkch@kku.ac.th';
      userProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || (isLakkch ? 'อ.ดร. ลักษณ์ชนก บุญญานุวัตร' : fbUser.email?.split('@')[0] || 'User'),
        email: (fbUser.email || '').toLowerCase(),
        role: isLakkch ? 'admin' : 'user',
        department: isLakkch ? 'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์' : 'คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น',
        phone: isLakkch ? '081-234-5678' : '',
        avatarBg: isLakkch ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700'
      };

      await setDoc(userDocRef, {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return { success: true, user: userProfile };
  } catch (error: any) {
    console.error('Firebase login error:', error);
    let errorMsg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMsg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = 'รูปแบบอีเมลไม่ถูกต้อง';
    } else if (error.code === 'auth/too-many-requests') {
      errorMsg = 'พยายามเข้าสู่ระบบผิดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่';
    } else if (error.message) {
      errorMsg = error.message;
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase sign out error:', error);
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: `ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมล ${email} เรียบร้อยแล้ว` };
  } catch (error: any) {
    console.error('Password reset error:', error);
    let msg = 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน';
    if (error.code === 'auth/user-not-found') {
      msg = 'ไม่พบบัญชีผู้ใช้งานที่ใช้อีเมลนี้';
    }
    return { success: false, error: msg };
  }
}

/**
 * Listen to Auth State change
 */
export function subscribeToAuth(
  onUserChanged: (user: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      onUserChanged(null);
      return;
    }

    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const profile: UserProfile = {
          id: fbUser.uid,
          name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: (data.email || fbUser.email || '').toLowerCase(),
          role: data.role || 'user',
          department: data.department || 'คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น',
          phone: data.phone || '',
          avatarBg: data.avatarBg || (data.role === 'admin' ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700')
        };
        onUserChanged(profile);
      } else {
        const isLakkch = fbUser.email?.toLowerCase() === 'lakkch@kku.ac.th';
        const profile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || (isLakkch ? 'อ.ดร. ลักษณ์ชนก บุญญานุวัตร' : fbUser.email?.split('@')[0] || 'User'),
          email: (fbUser.email || '').toLowerCase(),
          role: isLakkch ? 'admin' : 'user',
          department: isLakkch ? 'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์' : 'คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น',
          phone: isLakkch ? '081-234-5678' : '',
          avatarBg: isLakkch ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700'
        };
        onUserChanged(profile);
      }
    } catch (e) {
      console.error('Error in auth state change profile fetch:', e);
      onUserChanged(null);
    }
  });
}

// ==========================================
// Firestore Real-Time Database APIs for Loans
// ==========================================

/**
 * Subscribe to real-time updates for all loan requests in Firestore
 */
export function subscribeToFirestoreLoans(
  onLoansUpdated: (loans: LoanRequest[]) => void
): () => void {
  const loansRef = collection(db, COLLECTIONS.LOANS);
  const q = query(loansRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: LoanRequest[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        equipmentId: data.equipmentId || '',
        equipmentName: data.equipmentName || '',
        equipmentCode: data.equipmentCode || '',
        borrowerName: data.borrowerName || '',
        borrowerDept: data.borrowerDept || '',
        borrowerPhone: data.borrowerPhone || '',
        borrowerEmail: data.borrowerEmail || '',
        purpose: data.purpose || '',
        borrowDate: data.borrowDate || '',
        returnDate: data.returnDate || '',
        timePeriod: data.timePeriod || '',
        status: data.status || 'pending',
        createdAt: data.createdAt || new Date().toISOString(),
        approvedAt: data.approvedAt,
        returnedAt: data.returnedAt,
        rejectReason: data.rejectReason,
        conditionAfterReturn: data.conditionAfterReturn,
        userRating: data.userRating,
        userFeedback: data.userFeedback,
        userRatedAt: data.userRatedAt,
        approverRating: data.approverRating,
        approverFeedback: data.approverFeedback,
        approverRatedAt: data.approverRatedAt,
        adminNotes: data.adminNotes
      });
    });
    onLoansUpdated(list);
  }, (error) => {
    console.error('Firestore loans subscription error:', error);
  });
}

/**
 * Create or save a loan request to Firestore
 */
export async function saveLoanToFirestore(loan: LoanRequest): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LOANS, loan.id);
    await setDoc(docRef, {
      ...loan,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving loan to Firestore:', error);
    throw error;
  }
}

/**
 * Update partial fields of a loan request in Firestore
 */
export async function updateLoanInFirestore(
  loanId: string, 
  partial: Partial<LoanRequest>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LOANS, loanId);
    await updateDoc(docRef, {
      ...partial,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating loan ${loanId} in Firestore:`, error);
    throw error;
  }
}

/**
 * Delete a loan request from Firestore
 */
export async function deleteLoanFromFirestore(loanId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LOANS, loanId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting loan ${loanId} from Firestore:`, error);
    throw error;
  }
}

/**
 * Seed initial sample loans to Firestore if collection is empty
 */
export async function seedInitialLoansIfEmpty(initialLoans: LoanRequest[]): Promise<void> {
  try {
    const loansRef = collection(db, COLLECTIONS.LOANS);
    const snap = await getDocs(loansRef);
    if (snap.empty && initialLoans.length > 0) {
      console.log('Seeding initial loans to Firebase Firestore...');
      const batch = writeBatch(db);
      initialLoans.forEach((loan) => {
        const docRef = doc(db, COLLECTIONS.LOANS, loan.id);
        batch.set(docRef, {
          ...loan,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      console.log('Seeded initial loans successfully!');
    }
  } catch (error) {
    console.error('Error seeding initial loans:', error);
  }
}

// ==========================================
// Equipment Catalog in Firestore (Real-Time)
// ==========================================

/**
 * Subscribe to real-time updates for all Equipment in Firestore
 */
export function subscribeToFirestoreEquipment(
  onEquipmentUpdated: (equipment: Equipment[]) => void
): () => void {
  const eqRef = collection(db, COLLECTIONS.EQUIPMENT);
  const q = query(eqRef, orderBy('no', 'asc'));

  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const list: Equipment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          no: typeof data.no === 'number' ? data.no : 0,
          keyword: data.keyword || '',
          type: data.type || 'Other',
          deptCode: data.deptCode || 'VET',
          deptName: data.deptName || 'คณะสัตวแพทยศาสตร์',
          fiscalYear: typeof data.fiscalYear === 'number' ? data.fiscalYear : 2564,
          budgetSource: data.budgetSource || '',
          purpose: data.purpose || '',
          serialNo: data.serialNo || '',
          nameTh: data.nameTh || '',
          nameEn: data.nameEn || '',
          quantity: typeof data.quantity === 'number' ? data.quantity : 1,
          budget: typeof data.budget === 'number' ? data.budget : 0,
          specs: data.specs || '',
          location: data.location || '',
          manager: data.manager || '',
          phone: data.phone || '',
          email: data.email || '',
          status: data.status || 'ปกติ',
          image: data.image || docSnap.id
        });
      });
      onEquipmentUpdated(list);
    }
  }, (error) => {
    console.error('Firestore equipment subscription error:', error);
  });
}

/**
 * Seed initial equipment catalog to Firestore if collection is empty
 */
export async function seedEquipmentIfEmpty(initialEquipment: Equipment[]): Promise<void> {
  try {
    const eqRef = collection(db, COLLECTIONS.EQUIPMENT);
    const snap = await getDocs(eqRef);
    if (snap.empty && initialEquipment.length > 0) {
      console.log('Seeding equipment catalog to Firebase Firestore...');
      // Write in batches of max 100 items
      const chunkSize = 100;
      for (let i = 0; i < initialEquipment.length; i += chunkSize) {
        const chunk = initialEquipment.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          const docRef = doc(db, COLLECTIONS.EQUIPMENT, item.id);
          batch.set(docRef, {
            ...item,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
      console.log('Seeded equipment catalog successfully to Firestore!');
    }
  } catch (error) {
    console.error('Error seeding initial equipment catalog:', error);
  }
}

/**
 * Save or update single equipment item in Firestore
 */
export async function saveEquipmentItemToFirestore(item: Equipment): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EQUIPMENT, item.id);
    await setDoc(docRef, {
      ...item,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`Error saving equipment ${item.id} to Firestore:`, error);
    throw error;
  }
}

/**
 * Update partial equipment fields in Firestore
 */
export async function updateEquipmentInFirestore(
  equipmentId: string,
  partial: Partial<Equipment>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EQUIPMENT, equipmentId);
    await updateDoc(docRef, {
      ...partial,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating equipment ${equipmentId} in Firestore:`, error);
    throw error;
  }
}

// ==========================================
// Equipment Status Overrides in Firestore
// ==========================================

export function subscribeToEquipmentOverrides(
  onOverridesUpdated: (overrides: Record<string, string>) => void
): () => void {
  const ref = collection(db, COLLECTIONS.EQUIPMENT_OVERRIDES);
  return onSnapshot(ref, (snap) => {
    const map: Record<string, string> = {};
    snap.forEach((d) => {
      const data = d.data();
      if (data.status) {
        map[d.id] = data.status;
      }
    });
    onOverridesUpdated(map);
  }, (error) => {
    console.error('Equipment overrides error:', error);
  });
}

export async function saveEquipmentStatusToFirestore(equipmentId: string, status: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EQUIPMENT_OVERRIDES, equipmentId);
    await setDoc(docRef, {
      equipmentId,
      status,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving equipment status override:', error);
  }
}

// ==========================================
// Admin Emails in Firestore
// ==========================================

export function subscribeToAdminEmails(
  onAdminsUpdated: (emails: string[]) => void
): () => void {
  const docRef = doc(db, COLLECTIONS.ADMIN_EMAILS, 'config');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data.emails)) {
        onAdminsUpdated(data.emails);
      }
    }
  }, (error) => {
    console.error('Admin emails error:', error);
  });
}

export async function saveAdminEmailsToFirestore(emails: string[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ADMIN_EMAILS, 'config');
    await setDoc(docRef, {
      emails,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving admin emails to Firestore:', error);
  }
}

// ==========================================
// Notifications in Firestore
// ==========================================

export function subscribeToFirestoreNotifications(
  onNotifsUpdated: (notifications: AppNotification[]) => void
): () => void {
  const ref = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(ref, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const notifs: AppNotification[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notifs.push({
        id: docSnap.id,
        title: data.title || '',
        message: data.message || '',
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || 'info',
        isRead: data.isRead || false,
        loanId: data.loanId,
        equipmentName: data.equipmentName
      });
    });
    onNotifsUpdated(notifs);
  }, (error) => {
    console.error('Firestore notifications error:', error);
  });
}

export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
    await setDoc(docRef, {
      ...notif,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving notification to Firestore:', error);
  }
}

export async function updateNotificationReadStatusInFirestore(notifId: string, isRead: boolean): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notifId);
    await updateDoc(docRef, { isRead });
  } catch (error) {
    console.error('Error updating notification read status:', error);
  }
}
