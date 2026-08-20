import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  History, 
  Sparkles, 
  Bell, 
  X, 
  CheckCircle2, 
  FlaskConical, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Info, 
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Menu,
  Sparkle
} from 'lucide-react';

// Data & Types
import { equipmentData, Equipment } from './data/equipment';
import { LoanRequest, TabType, AppNotification, UserRole, UserProfile } from './types';
import { getStoredLoans, saveLoans } from './data/mockLoans';
import { 
  subscribeToRealtimeDatabase, 
  broadcastEquipmentUpdate, 
  broadcastNotificationsUpdate, 
  broadcastAdminEmailsUpdate, 
  broadcastCurrentUserUpdate, 
  forceRealtimeSync 
} from './services/realtimeSync';
import {
  subscribeToFirestoreLoans,
  saveLoanToFirestore,
  updateLoanInFirestore,
  deleteLoanFromFirestore,
  seedInitialLoansIfEmpty,
  subscribeToFirestoreEquipment,
  seedEquipmentIfEmpty,
  updateEquipmentInFirestore,
  subscribeToAuth,
  logoutUser,
  subscribeToEquipmentOverrides,
  saveEquipmentStatusToFirestore,
  subscribeToAdminEmails,
  saveAdminEmailsToFirestore,
  subscribeToFirestoreNotifications,
  saveNotificationToFirestore,
  updateNotificationReadStatusInFirestore,
  validateFirestoreConnection
} from './services/firebase';

// Components
import { DashboardStats } from './components/DashboardStats';
import { DashboardCharts } from './components/DashboardCharts';
import { EquipmentList } from './components/EquipmentList';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { LoanRequestModal } from './components/LoanRequestModal';
import { LoanHistoryTab } from './components/LoanHistoryTab';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { AuthModal } from './components/AuthModal';
import { Flame, LogIn, LogOut, Radio } from 'lucide-react';

// Predefined default accounts
const DEFAULT_USER: UserProfile = {
  id: 'usr-kku-01',
  name: 'อ.ดร. ลักษณ์ชนก บุญญานุวัตร',
  email: 'lakkch@kku.ac.th',
  role: 'admin',
  department: 'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์',
  phone: '081-234-5678',
  avatarBg: 'from-blue-600 to-indigo-700'
};

const DEFAULT_ADMIN_EMAILS = [
  'lakkch@kku.ac.th',
  'vet_labadmin@kku.ac.th',
  'admin@kku.ac.th',
  'labmanager@kku.ac.th'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  
  // Admin emails list configured by administrator
  const [adminEmails, setAdminEmails] = useState<string[]>(() => {
    const stored = localStorage.getItem('vet_admin_emails');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.some((e: string) => e.trim().toLowerCase() === 'lakkch@kku.ac.th')) {
            const merged = ['lakkch@kku.ac.th', ...parsed];
            localStorage.setItem('vet_admin_emails', JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored admin emails', e);
      }
    }
    return DEFAULT_ADMIN_EMAILS;
  });

  // Current logged in user profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('vet_current_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          if (parsed.email.toLowerCase() === 'lakkch@kku.ac.th') {
            return { 
              ...parsed, 
              department: 'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์',
              role: parsed.role || 'admin'
            };
          }
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored current user', e);
      }
    }
    return DEFAULT_USER;
  });

  // Role is derived from whether current user's email is in the adminEmails list and their chosen active role
  const userRole: UserRole = useMemo(() => {
    const isEmailAdmin = adminEmails.some(
      e => e.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
    );
    if (!isEmailAdmin) return 'user';
    return currentUser.role || 'admin';
  }, [adminEmails, currentUser.email, currentUser.role]);

  // Session authentication state - required every time the page is loaded/visited
  const [isSessionAuthenticated, setIsSessionAuthenticated] = useState<boolean>(() => {
    try {
      const sessionAuth = sessionStorage.getItem('vet_session_signed_in');
      return sessionAuth === 'true';
    } catch {
      return false;
    }
  });

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  // Auth modal opens automatically on page load if user has not entered name & email for this session
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    try {
      const sessionAuth = sessionStorage.getItem('vet_session_signed_in');
      return sessionAuth !== 'true';
    } catch {
      return true;
    }
  });
  
  // Persistable equipment list state
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(() => {
    const stored = localStorage.getItem('vet_equipment_list');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored equipment list', e);
      }
    }
    return equipmentData;
  });

  const saveEquipment = (list: Equipment[]) => {
    setEquipmentList(list);
    localStorage.setItem('vet_equipment_list', JSON.stringify(list));
    broadcastEquipmentUpdate(list);
  };

  const updateEquipmentStatus = async (equipmentId: string, newStatus: string) => {
    const updated = equipmentList.map(item => {
      if (item.id === equipmentId) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    saveEquipment(updated);
    try {
      await saveEquipmentStatusToFirestore(equipmentId, newStatus);
      await updateEquipmentInFirestore(equipmentId, { status: newStatus });
    } catch (e) {
      console.error('Error syncing equipment status update to Firestore:', e);
    }
  };

  // Modal states
  const [selectedDetailItem, setSelectedDetailItem] = useState<Equipment | null>(null);
  const [selectedBorrowItem, setSelectedBorrowItem] = useState<Equipment | null>(null);
  
  // Custom toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Notifications states
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const stored = localStorage.getItem('vet_notifications');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored notifications', e);
      }
    }
    return [
      {
        id: 'notif-1',
        title: 'ระบบเชื่อมต่อ Firebase สำเร็จ (VetKKU)',
        message: 'เชื่อมต่อฐานข้อมูล Firestore และระบบ Authentication เรียบร้อยแล้ว ข้อมูลจะซิงค์แบบ Real-time',
        timestamp: new Date().toISOString(),
        type: 'success',
        isRead: false
      }
    ];
  });

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [livePopups, setLivePopups] = useState<AppNotification[]>([]);

  // Continuous Firebase Firestore & Multi-Client Real-Time Synchronization Engine
  useEffect(() => {
    // 1. Initial load from local database
    const initialLoans = getStoredLoans();
    setLoans(initialLoans);

    // 2. Seed initial loans & equipment catalog to Firestore if empty
    seedInitialLoansIfEmpty(initialLoans);
    seedEquipmentIfEmpty(equipmentData);

    // 3. Real-time Firebase Firestore Equipment Catalog Listener
    const unsubEquipment = subscribeToFirestoreEquipment((firestoreEquipment) => {
      if (firestoreEquipment && firestoreEquipment.length > 0) {
        setEquipmentList(firestoreEquipment);
        localStorage.setItem('vet_equipment_list', JSON.stringify(firestoreEquipment));
      }
    });

    // 4. Real-time Firebase Firestore Loans Listener
    const unsubLoans = subscribeToFirestoreLoans((firestoreLoans) => {
      if (firestoreLoans) {
        setLoans(firestoreLoans);
        saveLoans(firestoreLoans);
      }
    });

    // 5. Real-time Equipment Status Overrides from Firestore
    const unsubOverrides = subscribeToEquipmentOverrides((overrides) => {
      setEquipmentList(prev => {
        let changed = false;
        const updated = prev.map(item => {
          if (overrides[item.id] && overrides[item.id] !== item.status) {
            changed = true;
            return { ...item, status: overrides[item.id] };
          }
          return item;
        });
        if (changed) {
          localStorage.setItem('vet_equipment_list', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    });

    // 6. Real-time Admin Emails Listener from Firestore
    const unsubAdminEmails = subscribeToAdminEmails((emails) => {
      if (emails && emails.length > 0) {
        setAdminEmails(emails);
        localStorage.setItem('vet_admin_emails', JSON.stringify(emails));
      }
    });

    // 7. Real-time Notifications Listener from Firestore
    const unsubNotifs = subscribeToFirestoreNotifications((firestoreNotifs) => {
      if (firestoreNotifs && firestoreNotifs.length > 0) {
        setNotifications(firestoreNotifs);
        localStorage.setItem('vet_notifications', JSON.stringify(firestoreNotifs));
      }
    });

    // 8. Firebase Auth State Listener
    const unsubAuth = subscribeToAuth((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        localStorage.setItem('vet_current_user', JSON.stringify(fbUser));
        broadcastCurrentUserUpdate(fbUser);
      }
    });

    // 9. Cross-Tab Sync via BroadcastChannel
    const unsubscribeBroadcast = subscribeToRealtimeDatabase((msg) => {
      if (msg.type === 'LOANS_UPDATED' || msg.type === 'FULL_SYNC') {
        const latestLoans = getStoredLoans();
        setLoans(latestLoans);
      }
      if (msg.type === 'EQUIPMENT_UPDATED' || msg.type === 'FULL_SYNC') {
        const storedEq = localStorage.getItem('vet_equipment_list');
        if (storedEq) {
          try {
            setEquipmentList(JSON.parse(storedEq));
          } catch (e) {
            console.error('Realtime sync equipment parse error', e);
          }
        }
      }
    });

    return () => {
      unsubEquipment();
      unsubLoans();
      unsubOverrides();
      unsubAdminEmails();
      unsubNotifs();
      unsubAuth();
      unsubscribeBroadcast();
    };
  }, []);

  // Display toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const saveNotifications = (list: AppNotification[]) => {
    setNotifications(list);
    localStorage.setItem('vet_notifications', JSON.stringify(list));
    broadcastNotificationsUpdate(list);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    const updated = [newNotif, ...notifications];
    saveNotifications(updated);
    
    // Trigger real-time system slide-in popup
    setLivePopups(prev => [newNotif, ...prev]);

    // Play gentle notification chime sound using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context might be blocked by browser user-interaction policies
    }
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
    showToast('อ่านการแจ้งเตือนทั้งหมดแล้ว', 'info');
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
    showToast('ล้างประวัติการแจ้งเตือนทั้งหมดแล้ว', 'info');
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    saveNotifications(updated);
  };

  const removeLivePopup = (id: string) => {
    setLivePopups(prev => prev.filter(p => p.id !== id));
  };

  // Auto-dismiss live popups after 6 seconds
  useEffect(() => {
    if (livePopups.length > 0) {
      const timer = setTimeout(() => {
        setLivePopups(prev => prev.slice(0, prev.length - 1));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [livePopups]);

  // Handle switching user email and/or role mode
  const handleSwitchUserEmail = (newEmail: string, newName?: string, newDept?: string, forcedRole?: UserRole) => {
    const isEmailInAdminList = adminEmails.some(
      e => e.trim().toLowerCase() === newEmail.trim().toLowerCase()
    );

    const isLakkch = newEmail.trim().toLowerCase() === 'lakkch@kku.ac.th';
    const defaultName = isLakkch ? 'อ.ดร. ลักษณ์ชนก บุญญานุวัตร' : newEmail.split('@')[0];
    const defaultDept = isLakkch 
      ? 'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์' 
      : (isEmailInAdminList ? 'ฝ่ายห้องปฏิบัติการกลาง คณะสัตวแพทยศาสตร์' : 'คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น');

    const effectiveRole: UserRole = forcedRole 
      ? (forcedRole === 'admin' && !isEmailInAdminList ? 'user' : forcedRole)
      : (isEmailInAdminList ? 'admin' : 'user');

    const updatedUser: UserProfile = {
      id: `usr-${newEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
      name: newName || defaultName,
      email: newEmail,
      role: effectiveRole,
      department: newDept || defaultDept,
      phone: isLakkch ? '081-234-5678' : '08x-xxx-xxxx',
      avatarBg: effectiveRole === 'admin' ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700'
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('vet_current_user', JSON.stringify(updatedUser));
    broadcastCurrentUserUpdate(updatedUser);
    showToast(`สลับบัญชีเป็น ${newEmail} (โหมด ${effectiveRole === 'admin' ? 'Admin' : 'User'}) เรียบร้อยแล้ว`, 'info');
  };

  // Dedicated toggle role for current user
  const handleToggleUserRole = (targetRole?: UserRole) => {
    const isEmailInAdminList = adminEmails.some(
      e => e.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
    );

    if (!isEmailInAdminList && targetRole === 'admin') {
      showToast('อีเมลนี้ยังไม่อยู่ในรายชื่อ Admin กรุณาเพิ่มอีเมลในแท็บตั้งค่า Admin ก่อน', 'error');
      return;
    }

    const nextRole: UserRole = targetRole || (userRole === 'admin' ? 'user' : 'admin');
    
    const updatedUser: UserProfile = {
      ...currentUser,
      role: nextRole,
      avatarBg: nextRole === 'admin' ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700'
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('vet_current_user', JSON.stringify(updatedUser));
    broadcastCurrentUserUpdate(updatedUser);
    showToast(`สลับบทบาทเป็น "${nextRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ขอใช้งาน (User)'}" เรียบร้อยแล้ว`, 'success');
  };

  // Handle updating admin emails
  const handleUpdateAdminEmails = async (newAdminEmailsList: string[]) => {
    setAdminEmails(newAdminEmailsList);
    localStorage.setItem('vet_admin_emails', JSON.stringify(newAdminEmailsList));
    broadcastAdminEmailsUpdate(newAdminEmailsList);
    try {
      await saveAdminEmailsToFirestore(newAdminEmailsList);
    } catch (e) {
      console.error('Error saving admin emails to Firestore:', e);
    }
    showToast(`บันทึกรายชื่ออีเมลผู้ดูแลระบบ (Admin) ${newAdminEmailsList.length} บัญชีแล้ว (ซิงค์ Real-time)`, 'success');
  };

  // Calculate active borrowed equipment ids
  const activeBorrowedIds = useMemo(() => {
    return loans
      .filter(l => l.status === 'approved')
      .map(l => l.equipmentId);
  }, [loans]);

  // Unread notifications count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Action: Open detail modal
  const handleViewDetail = (item: Equipment) => {
    setSelectedDetailItem(item);
  };

  // Action: Open borrow form modal
  const handleStartBorrow = (item: Equipment) => {
    setSelectedDetailItem(null);
    setSelectedBorrowItem(item);
  };

  // Action: Submit new borrow request
  const handleSubmitBorrowForm = async (newRequestData: Omit<LoanRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: LoanRequest = {
      ...newRequestData,
      id: `REQ-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    const updatedLoans = [newRequest, ...loans];
    setLoans(updatedLoans);
    saveLoans(updatedLoans);
    setSelectedBorrowItem(null);

    // Save to Firebase Firestore
    try {
      await saveLoanToFirestore(newRequest);
    } catch (e) {
      console.error('Firebase save loan error:', e);
    }

    // Toast
    showToast(`ส่งคำขอใช้งาน "${newRequestData.equipmentName}" เรียบร้อยแล้ว (บันทึก Firestore Real-time)`, 'success');

    // System Notification
    const notifPayload = {
      title: 'ยื่นคำขอใช้งานเครื่องมือสำเร็จ',
      message: `ยื่นคำขอใช้งาน "${newRequestData.equipmentName}" วันที่ ${newRequestData.borrowDate} สำเร็จ กำลังรอเจ้าหน้าที่ตรวจสอบ`,
      type: 'info' as const,
      loanId: newRequest.id,
      equipmentName: newRequest.equipmentName
    };
    addNotification(notifPayload);
  };

  // Handle Auth Check-in success (both on initial page visit gate and from modal)
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsSessionAuthenticated(true);
    setIsAuthModalOpen(false);
    try {
      sessionStorage.setItem('vet_session_signed_in', 'true');
    } catch (e) {
      console.error('Session storage error:', e);
    }
    localStorage.setItem('vet_current_user', JSON.stringify(user));
    broadcastCurrentUserUpdate(user);
    showToast(`ยินดีต้อนรับคุณ ${user.name} (${user.email}) เข้าสู่ระบบ VetKKU`, 'success');
  };

  // Handle Logout / Switch session user
  const handleLogoutSession = () => {
    try {
      sessionStorage.removeItem('vet_session_signed_in');
    } catch (e) {
      console.error('Session storage error:', e);
    }
    setIsSessionAuthenticated(false);
    setIsAuthModalOpen(true);
    showToast('ลงชื่อออกจากระบบแล้ว กรุณาระบุชื่อและอีเมลก่อนเข้าใช้งานใหม่', 'info');
  };

  // Admin Action: Handle approve request
  const handleApproveLoan = async (id: string, adminNotes?: string) => {
    if (userRole !== 'admin') {
      showToast('ไม่สามารถดำเนินการได้: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์อนุมัติคำขอ', 'error');
      return;
    }
    const target = loans.find(l => l.id === id);
    if (!target) return;

    updateEquipmentStatus(target.equipmentId, 'กำลังใช้งาน');
    saveEquipmentStatusToFirestore(target.equipmentId, 'กำลังใช้งาน');

    const partialUpdate = {
      status: 'approved' as const,
      approvedAt: new Date().toISOString(),
      adminNotes: adminNotes || target.adminNotes
    };

    const updatedLoans = loans.map(loan => {
      if (loan.id === id) {
        addNotification({
          title: 'คำขอใช้งานได้รับการอนุมัติแล้ว',
          message: `คำขอใช้งาน "${loan.equipmentName}" ของ ${loan.borrowerName} ได้รับการอนุมัติเรียบร้อยแล้ว`,
          type: 'success',
          loanId: loan.id,
          equipmentName: loan.equipmentName
        });

        return {
          ...loan,
          ...partialUpdate
        };
      }
      return loan;
    });

    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    try {
      await updateLoanInFirestore(id, partialUpdate);
    } catch (e) {
      console.error('Firebase approve update error:', e);
    }

    showToast('อนุมัติคำขอใช้งานเรียบร้อยแล้ว (ซิงค์ Firebase Firestore)', 'success');
  };

  // User Action: Cancel my pending request
  const handleCancelMyRequest = async (id: string) => {
    const target = loans.find(l => l.id === id);
    if (!target) return;

    if (userRole !== 'admin' && target.borrowerEmail?.toLowerCase() !== currentUser.email.toLowerCase()) {
      showToast('คุณไม่มีสิทธิ์ยกเลิกคำขอของผู้อื่น', 'error');
      return;
    }

    const updatedLoans = loans.filter(l => l.id !== id);
    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    try {
      await deleteLoanFromFirestore(id);
    } catch (e) {
      console.error('Firebase delete loan error:', e);
    }

    showToast(`ยกเลิกคำขอใช้งาน "${target.equipmentName}" เรียบร้อยแล้ว`, 'info');
  };

  // Admin Action: Handle reject request
  const handleRejectLoan = async (id: string, reason: string) => {
    if (userRole !== 'admin') {
      showToast('ไม่สามารถดำเนินการได้: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์ปฏิเสธคำขอ', 'error');
      return;
    }
    const target = loans.find(l => l.id === id);
    if (!target) return;

    const partialUpdate = {
      status: 'rejected' as const,
      rejectReason: reason
    };

    const updatedLoans = loans.map(loan => {
      if (loan.id === id) {
        addNotification({
          title: 'คำขอใช้งานไม่ได้รับการอนุมัติ',
          message: `คำขอใช้งาน "${loan.equipmentName}" ไม่ผ่านการอนุมัติ (เหตุผล: ${reason || 'ตามเงื่อนไขของห้องปฏิบัติการ'})`,
          type: 'error',
          loanId: loan.id,
          equipmentName: loan.equipmentName
        });

        return {
          ...loan,
          ...partialUpdate
        };
      }
      return loan;
    });

    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    try {
      await updateLoanInFirestore(id, partialUpdate);
    } catch (e) {
      console.error('Firebase reject update error:', e);
    }

    showToast('ปฏิเสธคำขอเรียบร้อยแล้ว (ซิงค์ Firebase Firestore)', 'info');
  };

  // Admin Action: Handle return equipment
  const handleReturnLoan = async (id: string, condition?: string) => {
    if (userRole !== 'admin') {
      showToast('ไม่สามารถดำเนินการได้: สิทธิ์การบันทึกคืนและประเมินสภาพเครื่องมือสงวนไว้สำหรับผู้ดูแลระบบ', 'error');
      return;
    }
    const actualCondition = condition || 'ปกติพร้อมใช้งาน';
    const target = loans.find(l => l.id === id);
    if (!target) return;

    const newStatus = actualCondition === 'ชำรุดเสียหาย' ? 'ชำรุด' : actualCondition === 'ส่งซ่อมบำรุง' ? 'ส่งซ่อม' : 'ปกติ';
    updateEquipmentStatus(target.equipmentId, newStatus);
    saveEquipmentStatusToFirestore(target.equipmentId, newStatus);

    const partialUpdate = {
      status: 'returned' as const,
      returnedAt: new Date().toISOString(),
      conditionAfterReturn: actualCondition
    };

    const updatedLoans = loans.map(loan => {
      if (loan.id === id) {
        addNotification({
          title: 'บันทึกการส่งคืนอุปกรณ์สำเร็จ',
          message: `ส่งคืนเครื่องมือ "${loan.equipmentName}" เรียบร้อยแล้ว (สภาพเมื่อตรวจสอบ: ${actualCondition})`,
          type: 'info',
          loanId: loan.id,
          equipmentName: loan.equipmentName
        });

        return {
          ...loan,
          ...partialUpdate
        };
      }
      return loan;
    });

    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    try {
      await updateLoanInFirestore(id, partialUpdate);
    } catch (e) {
      console.error('Firebase return update error:', e);
    }

    showToast('บันทึกการรับคืนอุปกรณ์เรียบร้อยแล้ว (ซิงค์ Firebase Firestore)', 'success');
  };

  // Admin Action: Handle deleting request
  const handleDeleteRequest = async (id: string) => {
    if (userRole !== 'admin') {
      showToast('ไม่สามารถดำเนินการได้: สิทธิ์การลบประวัติสงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น', 'error');
      return;
    }
    const updatedLoans = loans.filter(l => l.id !== id);
    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    try {
      await deleteLoanFromFirestore(id);
    } catch (e) {
      console.error('Firebase delete request error:', e);
    }

    showToast('ลบรายการประวัติเรียบร้อยแล้ว (ซิงค์ Firebase Firestore)', 'info');
  };

  // Action: Handle rating & feedback for lab equipment service system (User & Approver evaluation)
  const handleRateLoan = async (id: string, rating: number, feedback?: string, evaluatorType: 'user' | 'approver' = 'user') => {
    const isApprover = evaluatorType === 'approver';
    const nowIso = new Date().toISOString();

    let partialUpdate: Partial<LoanRequest> = {};
    if (isApprover) {
      partialUpdate = {
        approverRating: rating,
        approverFeedback: feedback,
        approverRatedAt: nowIso
      };
    } else {
      partialUpdate = {
        userRating: rating,
        userFeedback: feedback,
        userRatedAt: nowIso,
        rating,
        ratingFeedback: feedback,
        ratedAt: nowIso
      };
    }

    const updatedLoans = loans.map(loan => {
      if (loan.id === id) {
        addNotification({
          title: isApprover ? 'บันทึกการประเมินระบบ (ผู้อนุมัติ) สำเร็จ' : 'บันทึกการประเมินระบบ (ผู้ใช้งาน) สำเร็จ',
          message: `บันทึกคะแนน ${rating} ดาว สำหรับระบบการใช้งาน "${loan.equipmentName}" เรียบร้อยแล้ว`,
          type: 'success',
          loanId: loan.id,
          equipmentName: loan.equipmentName
        });

        return {
          ...loan,
          ...partialUpdate
        };
      }
      return loan;
    });

    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    try {
      await updateLoanInFirestore(id, partialUpdate);
    } catch (e) {
      console.error('Firebase rating update error:', e);
    }

    showToast(`บันทึกคะแนนประเมินระบบ ${rating} ดาว (${isApprover ? 'ผู้อนุมัติ' : 'ผู้ใช้งาน'}) สำเร็จ`, 'success');
  };

  // Action: Handle simulating custom approval status notification
  const handleSimulateNotification = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' = 'info',
    loanId?: string,
    equipmentName?: string
  ) => {
    addNotification({
      title,
      message,
      type,
      loanId,
      equipmentName
    });
    showToast(`🔔 จำลองการแจ้งเตือน: ${title}`, type === 'warning' ? 'error' : type);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-vet-navy-900 selection:text-white">
      {/* Top Toast Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] pointer-events-auto"
          >
            <div className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 bg-white ${
              toast.type === 'success' 
                ? 'border-vet-olive-200 text-vet-olive-950' 
                : toast.type === 'error'
                ? 'border-rose-200 text-rose-900'
                : 'border-vet-navy-200 text-vet-navy-950'
            }`}>
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${
                toast.type === 'success' ? 'text-vet-olive-700' : 'text-vet-navy-700'
              }`} />
              <div className="flex-1 text-xs sm:text-sm font-semibold">
                {toast.message}
              </div>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time System Push Notification Popups */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {livePopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 30, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-auto bg-white border border-slate-200 p-4 rounded-xl shadow-xl flex items-start gap-3.5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-vet-navy-800" />
              
              <div className="shrink-0 mt-0.5">
                {popup.type === 'success' && (
                  <div className="w-8 h-8 rounded-lg bg-vet-olive-50 border border-vet-olive-200 flex items-center justify-center text-vet-olive-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {popup.type === 'error' && (
                  <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <X className="w-4 h-4" />
                  </div>
                )}
                {popup.type === 'info' && (
                  <div className="w-8 h-8 rounded-lg bg-vet-navy-50 border border-vet-navy-200 flex items-center justify-center text-vet-navy-700">
                    <Info className="w-4 h-4" />
                  </div>
                )}
                {popup.type === 'warning' && (
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {popup.title}
                  </h4>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-normal break-words">
                  {popup.message}
                </p>
                {popup.loanId && (
                  <button 
                    onClick={() => {
                      setActiveTab('loans');
                      removeLivePopup(popup.id);
                    }}
                    className="mt-2 text-[11px] font-bold text-vet-navy-800 hover:text-vet-olive-700 flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>ตรวจสอบสถานะคำขอ</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button 
                onClick={() => removeLivePopup(popup.id)}
                className="text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Fixed Top Navigation Header (Always fixed at top, ALWAYS visible across all screen sizes) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-b-2 border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Top Row: Brand & Identity + Actions */}
          <div className="flex items-center justify-between py-2.5 sm:py-3 gap-2 sm:gap-4 border-b border-slate-100/90">
            {/* Left: Brand & Faculty Identity */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-vet-navy-950 via-vet-navy-900 to-vet-olive-800 flex items-center justify-center text-white shadow-sm shrink-0 border border-vet-navy-800">
                <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-vet-navy-900 font-mono text-[10px] sm:text-xs tracking-wider font-extrabold uppercase bg-vet-navy-50 px-2 py-0.2 rounded border border-vet-navy-200/80 inline-flex items-center gap-1">
                    KKU VET FACULTY
                    <span className="inline-block w-1.5 h-1.5 bg-vet-olive-600 rounded-full animate-pulse" />
                  </span>
                </div>
                <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight leading-tight truncate mt-0.5">
                  ระบบเครื่องมือห้องปฏิบัติการ
                  <span className="hidden sm:inline-block ml-1.5 text-[11px] font-bold text-vet-olive-800 font-mono px-1.5 py-0.2 rounded bg-vet-olive-50 border border-vet-olive-200">
                    VET Lab system
                  </span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate hidden md:block">คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น</p>
              </div>
            </div>

            {/* Right: Role Switcher & Notifications */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
              {/* User Identification Status */}
              {!isSessionAuthenticated ? (
                <button
                  id="btn_user_identity_login"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-vet-navy-900 hover:bg-vet-navy-950 text-white transition-all cursor-pointer text-xs font-bold shadow-md animate-pulse"
                  title="กรุณาระบุชื่อ-นามสกุล และอีเมลก่อนเข้าใช้งานระบบ"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-300" />
                  <span>ลงชื่อเข้าใช้งาน</span>
                </button>
              ) : (
                <>
                  {/* Current User Badge (Clickable to edit/view details) */}
                  <button
                    id="btn_user_identity"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all cursor-pointer text-xs font-medium shadow-2xs text-left"
                    title={`เข้าสู่ระบบโดย: ${currentUser.name} (${currentUser.email}) - คลิกเพื่อดูหรือแก้ไขข้อมูล`}
                  >
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs ${
                      userRole === 'admin' ? 'bg-vet-navy-900' : 'bg-vet-olive-700'
                    }`}>
                      {userRole === 'admin' ? (
                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    <div className="text-left hidden sm:block max-w-[130px] md:max-w-[160px]">
                      <div className="text-[10px] text-slate-500 truncate leading-tight flex items-center gap-1">
                        <span className="truncate">{currentUser.email}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-[11px] truncate">
                        {currentUser.name || 'ผู้เข้าใช้งาน'}
                      </div>
                    </div>
                    <span className="sm:hidden font-bold text-xs">
                      {currentUser.name ? currentUser.name.split(' ')[0] : 'ผู้ใช้'}
                    </span>
                  </button>

                  {/* Role & Permission Management (Visible ONLY for Administrators) */}
                  {userRole === 'admin' && (
                    <button
                      id="btn_role_switcher"
                      onClick={() => setIsRoleModalOpen(true)}
                      className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl border border-vet-navy-300 bg-vet-navy-50/95 hover:bg-vet-navy-100 text-vet-navy-950 transition-all cursor-pointer text-xs font-bold shadow-2xs"
                      title="จัดการสิทธิ์อีเมล Admin และสิทธิ์การเข้าใช้งาน"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-vet-navy-800" />
                      <span>สิทธิ์ Admin</span>
                    </button>
                  )}

                  {/* Switch User / Logout Button */}
                  <button
                    id="btn_logout_session"
                    onClick={handleLogoutSession}
                    className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 transition-all cursor-pointer shadow-2xs"
                    title="ลงชื่อออก / เปลี่ยนผู้ใช้งาน (ระบุชื่อและอีเมลใหม่)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <button
                  id="notification_bell_btn"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`relative p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isNotifOpen 
                      ? 'bg-vet-navy-50 border-vet-navy-400 text-vet-navy-800 shadow-2xs' 
                      : 'bg-white border-slate-200 hover:border-vet-navy-300 hover:bg-slate-50 text-slate-700 shadow-2xs'
                  }`}
                  title="การแจ้งเตือน"
                >
                  <Bell className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${unreadCount > 0 ? 'text-vet-navy-800' : 'text-slate-600'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 border-2 border-white text-[9px] font-bold text-white shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Popover */}
                <AnimatePresence>
                  {isNotifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 8, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden origin-top-right text-slate-800"
                      >
                        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4.5 h-4.5 text-vet-navy-800" />
                            <span className="font-bold text-xs sm:text-sm text-slate-900">การแจ้งเตือน</span>
                            {unreadCount > 0 && (
                              <span className="bg-vet-olive-100 text-vet-olive-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                ใหม่ {unreadCount}
                              </span>
                            )}
                          </div>
                          {notifications.length > 0 && (
                            <button 
                              onClick={markAllNotificationsAsRead}
                              className="text-[11px] text-vet-navy-800 hover:text-vet-olive-700 font-semibold cursor-pointer"
                            >
                              อ่านทั้งหมด
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-left">
                          {notifications.length === 0 ? (
                            <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 mb-3">
                                <Bell className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-slate-700 text-xs sm:text-sm font-semibold">ไม่มีการแจ้งเตือนในขณะนี้</p>
                              <p className="text-slate-400 text-[10px] sm:text-xs mt-1">ประวัติการอนุมัติคำขอใช้งานจะปรากฏที่นี่</p>
                            </div>
                          ) : (
                            notifications.map((notif) => {
                              return (
                                <div 
                                  key={notif.id} 
                                  className={`p-3.5 sm:p-4 transition-all duration-200 flex gap-3 cursor-pointer hover:bg-slate-50 text-left ${
                                    !notif.isRead ? 'bg-vet-navy-50/50 border-l-2 border-vet-navy-800' : 'border-l-2 border-transparent'
                                  }`}
                                  onClick={() => {
                                    markNotificationAsRead(notif.id);
                                    if (notif.loanId) {
                                      setActiveTab('loans');
                                    }
                                    setIsNotifOpen(false);
                                  }}
                                >
                                  <div className="shrink-0 mt-0.5">
                                    {notif.type === 'success' && (
                                      <div className="w-7 h-7 rounded-lg bg-vet-olive-50 border border-vet-olive-200 flex items-center justify-center text-vet-olive-700">
                                        <Check className="w-4 h-4" />
                                      </div>
                                    )}
                                    {notif.type === 'error' && (
                                      <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                                        <X className="w-4 h-4" />
                                      </div>
                                    )}
                                    {notif.type === 'info' && (
                                      <div className="w-7 h-7 rounded-lg bg-vet-navy-50 border border-vet-navy-200 flex items-center justify-center text-vet-navy-700">
                                        <Info className="w-4 h-4" />
                                      </div>
                                    )}
                                    {notif.type === 'warning' && (
                                      <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                        <AlertTriangle className="w-4 h-4" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                                        {notif.title}
                                      </h4>
                                      <span className="text-[9px] text-slate-400 shrink-0 font-mono mt-0.5">
                                        {new Date(notif.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                      </span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-normal break-words">
                                      {notif.message}
                                    </p>
                                    
                                    {notif.loanId && (
                                      <div className="flex items-center space-x-1 mt-2 text-[10px] text-vet-navy-800 font-bold">
                                        <span>ดูรายละเอียดคำขอ</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {notifications.length > 0 && (
                          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[10px] text-slate-500 font-medium">
                              ทั้งหมด {notifications.length} รายการ
                            </span>
                            <button 
                              onClick={clearAllNotifications}
                              className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-semibold cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ล้างทั้งหมด</span>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bottom Row: ALWAYS-VISIBLE Main Navigation Menu Bar */}
          <div className="py-2.5 overflow-x-auto no-scrollbar">
            <nav className="flex items-center justify-start sm:justify-center space-x-2 sm:space-x-3 min-w-max">
              {/* Tab 1: Dashboard */}
              <button
                id="tab_dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 sm:space-x-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'bg-vet-navy-900 text-white shadow-md shadow-vet-navy-950/20 ring-2 ring-vet-navy-700/40'
                    : 'bg-slate-100/90 text-slate-700 hover:bg-vet-navy-50 hover:text-vet-navy-900 border border-slate-200/80'
                }`}
              >
                <LayoutDashboard className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${activeTab === 'dashboard' ? 'text-white' : 'text-vet-navy-700'} shrink-0`} />
                <span className="tracking-tight whitespace-nowrap">หน้าหลัก</span>
              </button>

              {/* Tab 2: Equipment */}
              <button
                id="tab_equipment"
                onClick={() => setActiveTab('equipment')}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 sm:space-x-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'equipment' || activeTab === 'schedule'
                    ? 'bg-vet-navy-900 text-white shadow-md shadow-vet-navy-950/20 ring-2 ring-vet-navy-700/40'
                    : 'bg-slate-100/90 text-slate-700 hover:bg-vet-olive-50 hover:text-vet-olive-900 border border-slate-200/80'
                }`}
              >
                <Briefcase className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${activeTab === 'equipment' || activeTab === 'schedule' ? 'text-white' : 'text-vet-olive-700'} shrink-0`} />
                <span className="tracking-tight whitespace-nowrap">รายการเครื่องมือ & การขอใช้งาน</span>
                <span className={`text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                  activeTab === 'equipment' || activeTab === 'schedule'
                    ? 'bg-vet-olive-700 text-white border border-vet-olive-500/40'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {equipmentList.length}
                </span>
              </button>

              {/* Tab 3: Loans */}
              <button
                id="tab_loans"
                onClick={() => setActiveTab('loans')}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 sm:space-x-2.5 cursor-pointer relative shrink-0 ${
                  activeTab === 'loans'
                    ? 'bg-vet-navy-900 text-white shadow-md shadow-vet-navy-950/20 ring-2 ring-vet-navy-700/40'
                    : 'bg-slate-100/90 text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-slate-200/80'
                }`}
              >
                <History className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${activeTab === 'loans' ? 'text-white' : 'text-amber-600'} shrink-0`} />
                <span className="tracking-tight whitespace-nowrap">
                  {userRole === 'admin' ? 'ทะเบียนคำขอใช้งาน' : 'การจองของฉัน'}
                </span>
                {loans.filter(l => l.status === 'pending' && (userRole === 'admin' || l.borrowerEmail?.toLowerCase() === currentUser.email.toLowerCase())).length > 0 && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${
                    activeTab === 'loans' ? 'bg-amber-400 text-amber-950 font-black' : 'bg-amber-500 text-white'
                  }`}>
                    {loans.filter(l => l.status === 'pending' && (userRole === 'admin' || l.borrowerEmail?.toLowerCase() === currentUser.email.toLowerCase())).length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area (pt-32 sm:pt-36 provides exact spacing for fixed 2-tier header) */}
      <div className="flex-1 flex flex-col min-h-screen pt-32 sm:pt-36">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="tab-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Welcome Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-vet-navy-200/90 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-xs">
                {/* Left: Info Text */}
                <div className="flex-1 space-y-3 sm:space-y-4 relative z-10 text-left">
                  <div className="inline-flex items-center space-x-2 bg-vet-olive-50 border border-vet-olive-200 px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-vet-olive-700" />
                    <span className="text-[10px] sm:text-xs font-bold text-vet-olive-900">ต้อนรับสู่ระบบเครื่องมือห้องปฏิบัติการ (VET Lab system)</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
                    บริการเครื่องมือวิจัยและเครื่องมือห้องปฏิบัติการประสิทธิภาพสูง
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    สนับสนุนการเรียนการสอน การวิจัย และการบริการวิชาการของคณาจารย์ บุคลากร และนักศึกษา คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <button 
                      onClick={() => setActiveTab('equipment')}
                      className="px-5 py-2.5 rounded-xl bg-vet-olive-700 hover:bg-vet-olive-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>เริ่มค้นหาเครื่องมือ & ดูผังปฏิทิน</span> &rarr;
                    </button>
                  </div>
                </div>

                {/* Right: Faculty Building Image */}
                <div className="w-full md:w-[360px] lg:w-[460px] shrink-0 aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative shadow-xs z-10">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1cE0Z4lgKnkZF-oWfKFsO9hBfEv7P_Aux" 
                    alt="คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null; 
                      e.currentTarget.src = "https://images.unsplash.com/photo-1579154204601-01588f351167?q=80&w=1470&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute bottom-2.5 right-2.5 bg-vet-navy-950/90 text-vet-olive-200 backdrop-blur-xs px-2.5 py-1 rounded-md border border-vet-navy-700 text-[10px] font-mono font-bold shadow-2xs">
                    KKU VET Lab system
                  </div>
                </div>
              </div>

              <DashboardStats 
                equipment={equipmentList} 
                loans={loans} 
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              <DashboardCharts 
                equipment={equipmentList} 
                loans={loans} 
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}

          {(activeTab === 'equipment' || activeTab === 'schedule') && (
            <motion.div
              key="tab-equipment"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <EquipmentList
                equipment={equipmentList}
                loans={loans}
                currentUser={currentUser}
                userRole={userRole}
                onViewDetail={handleViewDetail}
                onBorrow={handleStartBorrow}
                activeBorrowedIds={activeBorrowedIds}
              />
            </motion.div>
          )}

          {activeTab === 'loans' && (
            <motion.div
              key="tab-loans"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6 p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  <span className="p-2.5 bg-vet-navy-50 border border-vet-navy-200 rounded-xl text-vet-navy-800 shrink-0">
                    <History className="w-5 h-5 text-vet-navy-700" />
                  </span>
                  {userRole === 'admin'
                    ? 'ทะเบียนและประวัติการขอใช้งานเครื่องมือห้องปฏิบัติการทั้งหมด (Admin)'
                    : 'ทะเบียนคำขอและการจองเครื่องมือของฉัน'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
                  {userRole === 'admin'
                    ? 'สิทธิ์ผู้ดูแลระบบ (Admin): ตารางสรุปคำขอใช้งานอุปกรณ์ทั้งหมด สามารถกดอนุมัติ ปฏิเสธ หรือบันทึกส่งคืนพร้อมระบุสภาพเครื่องมือ'
                    : `สิทธิ์ผู้ใช้งานทั่วไป (${currentUser.email}): ตรวจสอบสถานะคำขอที่ยื่นไว้ และติดตามผลการอนุมัติจากเจ้าหน้าที่ห้องปฏิบัติการ`}
                </p>
              </div>

              <LoanHistoryTab
                loans={loans}
                currentUserRole={userRole}
                currentUser={currentUser}
                onApprove={handleApproveLoan}
                onReject={handleRejectLoan}
                onReturn={handleReturnLoan}
                onRateLoan={handleRateLoan}
                onDeleteRequest={handleDeleteRequest}
                onCancelMyRequest={handleCancelMyRequest}
                onSimulateNotification={handleSimulateNotification}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer inside content area */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium text-slate-700">ระบบสารสนเทศเครื่องมือห้องปฏิบัติการ (VET Lab system) คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น</p>
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-vet-navy-50 border border-vet-navy-200 rounded-full text-slate-700 font-medium text-xs shadow-2xs">
            <span>ผู้พัฒนาระบบ :</span>
            <span className="font-bold text-vet-navy-900">นางสาวลักขณา ฉันทะกลาง</span>
          </div>
          <p className="text-slate-400 text-[11px]">© {new Date().getFullYear()} Faculty of Veterinary Medicine, Khon Kaen University. All rights reserved.</p>
        </div>
      </footer>
    </div>

    {/* Admin Settings & Email RBAC Modal */}
    <AdminSettingsModal
      isOpen={isRoleModalOpen}
      onClose={() => setIsRoleModalOpen(false)}
      currentUser={currentUser}
      userRole={userRole}
      adminEmails={adminEmails}
      onUpdateAdminEmails={handleUpdateAdminEmails}
      onSwitchUserEmail={handleSwitchUserEmail}
      onToggleUserRole={handleToggleUserRole}
    />

    {/* Firebase Email Authentication & Identification Modal (Enforced on every page visit) */}
    <AuthModal
      isOpen={isAuthModalOpen || !isSessionAuthenticated}
      isMandatory={!isSessionAuthenticated}
      onClose={() => {
        if (isSessionAuthenticated) {
          setIsAuthModalOpen(false);
        }
      }}
      currentUser={currentUser}
      adminEmails={adminEmails}
      onAuthSuccess={handleAuthSuccess}
    />

    {/* Modals & Dialogs */}
    <AnimatePresence>
      {selectedDetailItem && (
        <EquipmentDetailModal
          item={selectedDetailItem}
          loans={loans}
          currentUser={currentUser}
          isBorrowed={activeBorrowedIds.includes(selectedDetailItem.id)}
          onClose={() => setSelectedDetailItem(null)}
          onBorrow={handleStartBorrow}
        />
      )}

      {selectedBorrowItem && (
        <LoanRequestModal
          isOpen={true}
          item={selectedBorrowItem}
          currentUser={currentUser}
          loans={loans}
          onClose={() => setSelectedBorrowItem(null)}
          onSubmit={handleSubmitBorrowForm}
        />
      )}
    </AnimatePresence>
    </div>
  );
}
