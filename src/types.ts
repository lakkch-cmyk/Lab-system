import { Equipment } from './data/equipment';

export interface LoanRequest {
  id: string; // unique UUID or timestamp
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  borrowerName: string;
  borrowerDept: string;
  borrowerPhone: string;
  borrowerEmail: string;
  purpose: string;
  borrowDate: string;
  returnDate: string;
  timePeriod?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  createdAt: string;
  approvedAt?: string;
  returnedAt?: string;
  rejectReason?: string;
  conditionAfterReturn?: 'ปกติพร้อมใช้งาน' | 'ชำรุดเสียหาย' | 'ส่งซ่อมบำรุง' | string;
  // System Evaluation & Insights (ระบบประเมินความพึงพอใจการใช้งานระบบห้องปฏิบัติการ)
  userRating?: number; // 1-5 rating from user on the lab system
  userFeedback?: string; // User comments regarding lab booking & system service
  userRatedAt?: string; // ISO date timestamp
  approverRating?: number; // 1-5 rating from approver/admin on system service & workflow
  approverFeedback?: string; // Approver comments regarding lab service process
  approverRatedAt?: string; // ISO date timestamp
  // Backward-compatible aliases
  rating?: number;
  ratingFeedback?: string;
  ratedAt?: string;
  adminNotes?: string;
}

export type TabType = 'dashboard' | 'equipment' | 'schedule' | 'loans' | 'stats';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  avatarBg?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info' | 'error';
  isRead: boolean;
  loanId?: string;
  equipmentName?: string;
}
