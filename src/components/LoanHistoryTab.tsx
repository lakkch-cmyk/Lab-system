import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeftRight, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Check, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  Undo2,
  Trash2,
  ShieldCheck,
  UserCheck,
  Ban,
  Table as TableIcon,
  LayoutGrid,
  Info,
  ChevronRight,
  Download,
  Star,
  Sparkles,
  BarChart3,
  MessageSquare,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LoanRequest, UserRole, UserProfile } from '../types';
import { RatingFeedbackModal } from './RatingFeedbackModal';

interface LoanHistoryTabProps {
  loans: LoanRequest[];
  currentUserRole?: UserRole;
  currentUser?: UserProfile;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onReturn: (id: string, condition?: string) => void;
  onRateLoan?: (id: string, rating: number, feedback?: string, evaluatorType?: 'user' | 'approver') => void;
  onDeleteRequest?: (id: string) => void;
  onCancelMyRequest?: (id: string) => void;
}

export const LoanHistoryTab: React.FC<LoanHistoryTabProps> = ({ 
  loans, 
  currentUserRole = 'user',
  currentUser,
  onApprove, 
  onReject, 
  onReturn,
  onRateLoan,
  onDeleteRequest,
  onCancelMyRequest
}) => {
  const isAdmin = currentUserRole === 'admin';
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'pending' | 'approved' | 'history'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [returnId, setReturnId] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>('ปกติพร้อมใช้งาน');
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  
  // Rating modal state with specified perspective
  const [selectedLoanToRate, setSelectedLoanToRate] = useState<LoanRequest | null>(null);
  const [ratePerspective, setRatePerspective] = useState<'user' | 'approver'>('user');

  // Toggle admin insights panel
  const [showInsightsPanel, setShowInsightsPanel] = useState<boolean>(true);

  // Base loans accessible to this user role
  const accessibleLoans = useMemo(() => {
    if (isAdmin) {
      return loans;
    }
    if (!currentUser) return [];
    return loans.filter(loan => {
      const emailMatch = loan.borrowerEmail && currentUser.email &&
        loan.borrowerEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase();
      const nameMatch = loan.borrowerName && currentUser.name &&
        loan.borrowerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
      return Boolean(emailMatch || nameMatch);
    });
  }, [loans, isAdmin, currentUser]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: accessibleLoans.length,
      pending: accessibleLoans.filter(l => l.status === 'pending').length,
      approved: accessibleLoans.filter(l => l.status === 'approved').length,
      returned: accessibleLoans.filter(l => l.status === 'returned').length,
      rejected: accessibleLoans.filter(l => l.status === 'rejected').length,
    };
  }, [accessibleLoans]);

  // Admin evaluation insights statistics
  const evaluationStats = useMemo(() => {
    const returnedLoans = loans.filter(l => l.status === 'returned');
    
    // User ratings
    const userRated = returnedLoans.filter(l => Boolean(l.userRating || l.rating));
    const userAvg = userRated.length > 0
      ? userRated.reduce((sum, l) => sum + (l.userRating || l.rating || 0), 0) / userRated.length
      : 0;

    // Approver ratings
    const approverRated = returnedLoans.filter(l => Boolean(l.approverRating));
    const approverAvg = approverRated.length > 0
      ? approverRated.reduce((sum, l) => sum + (l.approverRating || 0), 0) / approverRated.length
      : 0;

    return {
      totalReturned: returnedLoans.length,
      userRatedCount: userRated.length,
      userAvgRating: userAvg,
      approverRatedCount: approverRated.length,
      approverAvgRating: approverAvg
    };
  }, [loans]);

  // Filter loans based on active sub-tab and search term
  const filteredLoans = useMemo(() => {
    return accessibleLoans.filter(loan => {
      if (activeSubTab === 'pending' && loan.status !== 'pending') return false;
      if (activeSubTab === 'approved' && loan.status !== 'approved') return false;
      if (activeSubTab === 'history' && loan.status !== 'returned' && loan.status !== 'rejected') return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        loan.borrowerName.toLowerCase().includes(term) ||
        loan.equipmentName.toLowerCase().includes(term) ||
        loan.equipmentCode.toLowerCase().includes(term) ||
        loan.borrowerDept.toLowerCase().includes(term) ||
        loan.purpose.toLowerCase().includes(term)
      );
    });
  }, [accessibleLoans, activeSubTab, searchTerm]);

  const handleStartReject = (id: string) => {
    setRejectId(id);
    setRejectReason('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectId) {
      onReject(rejectId, rejectReason.trim() || 'ข้อมูลไม่ครบถ้วนหรือไม่ระบุวัตถุประสงค์แน่ชัด');
      setRejectId(null);
      setRejectReason('');
    }
  };

  const handleStartReturn = (id: string) => {
    setReturnId(id);
    setReturnCondition('ปกติพร้อมใช้งาน');
    setRejectId(null);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (returnId) {
      onReturn(returnId, returnCondition);
      setReturnId(null);
    }
  };

  const handleOpenRating = (loan: LoanRequest, perspective: 'user' | 'approver') => {
    setSelectedLoanToRate(loan);
    setRatePerspective(perspective);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredLoans.length > 0 ? filteredLoans : accessibleLoans;
    
    if (dataToExport.length === 0) {
      setExportNotification('ไม่มีข้อมูลคำขอสำหรับส่งออก');
      setTimeout(() => setExportNotification(null), 3500);
      return;
    }

    const getStatusThai = (status: LoanRequest['status']) => {
      switch (status) {
        case 'pending': return 'รออนุมัติ';
        case 'approved': return 'อนุมัติ (กำลังใช้งาน)';
        case 'returned': return 'ส่งคืนสำเร็จ';
        case 'rejected': return 'ปฏิเสธคำขอ';
        default: return status;
      }
    };

    const escapeCSV = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // CSV Header row with separate User vs Approver system ratings
    const headers = [
      'ลำดับ',
      'รหัสคำขอ',
      'สถานะคำขอ',
      'รหัสเครื่องมือ',
      'ชื่อเครื่องมือห้องปฏิบัติการ',
      'ชื่อ-นามสกุล ผู้ขอใช้',
      'หน่วยงาน/สังกัด/ภาควิชา',
      'เบอร์โทรศัพท์',
      'อีเมลผู้ขอใช้',
      'วันที่เริ่มขอใช้',
      'วันที่กำหนดส่งคืน',
      'ช่วงเวลาที่ขอใช้',
      'วัตถุประสงค์การใช้งาน',
      'วันที่ยื่นคำขอ',
      'วันที่ส่งคืนจริง',
      'สภาพเครื่องมือเมื่อรับคืน',
      'คะแนนประเมินระบบจากผู้ใช้ (1-5 ดาว)',
      'ข้อเสนอแนะระบบจากผู้ใช้',
      'คะแนนประเมินระบบจากผู้อนุมัติ (1-5 ดาว)',
      'ข้อเสนอแนะระบบจากผู้อนุมัติ',
      'สาเหตุที่ปฏิเสธคำขอ (ถ้ามี)'
    ];

    const rows = dataToExport.map((item, index) => [
      escapeCSV(index + 1),
      escapeCSV(item.id),
      escapeCSV(getStatusThai(item.status)),
      escapeCSV(item.equipmentCode),
      escapeCSV(item.equipmentName),
      escapeCSV(item.borrowerName),
      escapeCSV(item.borrowerDept),
      escapeCSV(item.borrowerPhone || '-'),
      escapeCSV(item.borrowerEmail || '-'),
      escapeCSV(item.borrowDate),
      escapeCSV(item.returnDate),
      escapeCSV(item.timePeriod || 'ทั้งวัน'),
      escapeCSV(item.purpose),
      escapeCSV(item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : '-'),
      escapeCSV(item.returnedAt ? new Date(item.returnedAt).toLocaleString('th-TH') : '-'),
      escapeCSV(item.conditionAfterReturn || '-'),
      escapeCSV((item.userRating || item.rating) ? `${item.userRating || item.rating} ดาว` : '-'),
      escapeCSV(item.userFeedback || item.ratingFeedback || '-'),
      escapeCSV(item.approverRating ? `${item.approverRating} ดาว` : '-'),
      escapeCSV(item.approverFeedback || '-'),
      escapeCSV(item.rejectReason || '-')
    ]);

    // Prepend UTF-8 BOM for Excel Thai language support
    const csvContent = '\uFEFF' + [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานทะเบียนคำขอและการประเมินระบบ_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotification(`ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว (${dataToExport.length} รายการ)`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to get styling configurations based on loan status
  const getStatusConfig = (status: LoanRequest['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'รออนุมัติ',
          subLabel: 'รอดำเนินการตรวจสอบ',
          borderLeft: 'border-l-4 border-l-amber-500',
          bgRow: 'bg-amber-50/40 hover:bg-amber-100/50',
          bgCard: 'border-amber-200/90 hover:border-amber-400',
          headerBg: 'bg-amber-50/80 border-amber-200/60',
          badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-400/30',
          dotColor: 'bg-amber-500',
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
        };
      case 'approved':
        return {
          label: 'อนุมัติแล้ว',
          subLabel: 'อยู่ระหว่างการใช้งาน',
          borderLeft: 'border-l-4 border-l-vet-navy-800',
          bgRow: 'bg-vet-navy-50/40 hover:bg-vet-navy-100/50',
          bgCard: 'border-vet-navy-200/90 hover:border-vet-navy-400',
          headerBg: 'bg-vet-navy-50/80 border-vet-navy-200/60',
          badgeClass: 'bg-vet-navy-100 text-vet-navy-900 border border-vet-navy-300 ring-1 ring-vet-navy-500/30',
          dotColor: 'bg-vet-navy-800',
          icon: <ArrowLeftRight className="w-3.5 h-3.5 mr-1 text-vet-navy-800 shrink-0" />
        };
      case 'returned':
        return {
          label: 'ส่งคืนสำเร็จ',
          subLabel: 'เสร็จสิ้นกระบวนการ',
          borderLeft: 'border-l-4 border-l-vet-olive-700',
          bgRow: 'bg-vet-olive-50/30 hover:bg-vet-olive-100/40',
          bgCard: 'border-vet-olive-200/90 hover:border-vet-olive-400',
          headerBg: 'bg-vet-olive-50/70 border-vet-olive-200/60',
          badgeClass: 'bg-vet-olive-100 text-vet-olive-900 border border-vet-olive-300 ring-1 ring-vet-olive-500/30',
          dotColor: 'bg-vet-olive-700',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-vet-olive-700 shrink-0" />
        };
      case 'rejected':
        return {
          label: 'ปฏิเสธคำขอ',
          subLabel: 'ไม่อนุมัติการขอใช้',
          borderLeft: 'border-l-4 border-l-rose-500',
          bgRow: 'bg-rose-50/40 hover:bg-rose-100/50',
          bgCard: 'border-rose-200/90 hover:border-rose-400',
          headerBg: 'bg-rose-50/80 border-rose-200/60',
          badgeClass: 'bg-rose-100 text-rose-900 border border-rose-300 ring-1 ring-rose-500/30',
          dotColor: 'bg-rose-500',
          icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600 shrink-0" />
        };
      default:
        return {
          label: status,
          subLabel: '',
          borderLeft: 'border-l-4 border-l-slate-300',
          bgRow: 'bg-white hover:bg-slate-50',
          bgCard: 'border-slate-200 hover:border-slate-300',
          headerBg: 'bg-slate-50 border-slate-200',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotColor: 'bg-slate-400',
          icon: null
        };
    }
  };

  const getStatusBadge = (status: LoanRequest['status']) => {
    const config = getStatusConfig(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${config.badgeClass} shadow-2xs`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner for CSV Export */}
      <AnimatePresence>
        {exportNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3.5 bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-bold"
          >
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-200" />
              <span>{exportNotification}</span>
            </div>
            <button onClick={() => setExportNotification(null)} className="p-1 hover:bg-emerald-800 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN ONLY: Evaluation & Quality Insights Center */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-vet-navy-950 via-vet-navy-900 to-vet-olive-950 rounded-2xl p-5 sm:p-6 text-white border border-vet-navy-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-vet-navy-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-vet-olive-500/20 border border-vet-olive-400/30 rounded-xl text-vet-olive-300">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  ศูนย์ข้อมูลเชิงลึกการประเมินระบบห้องปฏิบัติการ (Lab System Feedback Insights)
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    ข้อมูลหลังบ้าน (Admin Only)
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  รวบรวมคะแนนความพึงพอใจการใช้งานระบบและการประสานงานจากทั้งผู้ขอใช้งานและผู้อนุมัติเพื่อยกระดับงานบริการ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInsightsPanel(!showInsightsPanel)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vet-navy-800 hover:bg-vet-navy-700 text-slate-200 text-xs font-semibold rounded-xl border border-vet-navy-600 transition-colors cursor-pointer w-fit shrink-0"
            >
              <span>{showInsightsPanel ? 'ซ่อนสถิติย่อ' : 'แสดงสถิติย่อ'}</span>
              {showInsightsPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showInsightsPanel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              {/* Stat 1: User System Score */}
              <div className="bg-vet-navy-900/80 border border-vet-navy-700/90 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-vet-olive-400" />
                  คะแนนประเมินระบบโดยผู้ใช้งาน
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                    {evaluationStats.userRatedCount > 0 ? evaluationStats.userAvgRating.toFixed(1) : '-'}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-vet-navy-700/60">
                  <span>ประเมินแล้ว</span>
                  <span className="font-bold text-slate-200">{evaluationStats.userRatedCount} คำขอ</span>
                </div>
              </div>

              {/* Stat 2: Approver System Score */}
              <div className="bg-vet-navy-900/80 border border-vet-navy-700/90 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-vet-olive-400" />
                  คะแนนประเมินระบบโดยผู้อนุมัติ
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-vet-olive-300">
                    {evaluationStats.approverRatedCount > 0 ? evaluationStats.approverAvgRating.toFixed(1) : '-'}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-vet-navy-700/60">
                  <span>ประเมินแล้ว</span>
                  <span className="font-bold text-slate-200">{evaluationStats.approverRatedCount} คำขอ</span>
                </div>
              </div>

              {/* Stat 3: Total Completed Cycle */}
              <div className="bg-vet-navy-900/80 border border-vet-navy-700/90 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-vet-olive-400" />
                  รายการที่ส่งคืนเสร็จสมบูรณ์
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    {evaluationStats.totalReturned}
                  </span>
                  <span className="text-xs text-slate-400">รายการ</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-vet-navy-700/60">
                  <span>พร้อมรับการประเมิน</span>
                  <span className="font-bold text-slate-200">100%</span>
                </div>
              </div>

              {/* Stat 4: System Insight Advice */}
              <div className="bg-vet-olive-950/50 border border-vet-olive-700/50 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-vet-olive-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  เป้าหมายคุณภาพระบบ
                </span>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                  เน้นความสะดวกในการจอง ความถูกต้องของข้อมูล และความตรงต่อเวลาในการส่งมอบเครื่องมือ
                </p>
                <div className="mt-2 pt-2 border-t border-vet-olive-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-vet-olive-300">นโยบายความลับ</span>
                  <span className="text-vet-olive-400 font-medium">เก็บบันทึกหลังบ้าน</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tabs & Filtering Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'all', label: 'ทั้งหมด', count: accessibleLoans.length },
            { id: 'pending', label: 'รออนุมัติ', count: statusCounts.pending, color: 'text-amber-700 bg-amber-50 border-amber-200' },
            { id: 'approved', label: 'อนุมัติแล้ว', count: statusCounts.approved, color: 'text-vet-navy-800 bg-vet-navy-50 border-vet-navy-200' },
            { id: 'history', label: 'ประวัติ (ส่งคืน/ปฏิเสธ)', count: statusCounts.returned + statusCounts.rejected, color: 'text-vet-olive-800 bg-vet-olive-50 border-vet-olive-200' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-vet-navy-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[11px] font-mono ${
                activeSubTab === tab.id
                  ? 'bg-vet-olive-700 text-white font-bold'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, View Mode, & CSV Export */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัส, ผู้ขอ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-vet-navy-700/20 focus:border-vet-navy-700 text-slate-900"
            />
          </div>

          {/* Table / Cards toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              title="มุมมองตาราง"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-vet-navy-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="มุมมองการ์ด"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'cards' ? 'bg-white text-vet-navy-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            title="ส่งออกรายงาน Excel (CSV)"
            className="px-3.5 py-2 bg-vet-olive-700 hover:bg-vet-olive-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table or Card List with Color Coding */}
      {filteredLoans.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500 text-sm flex flex-col items-center justify-center">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-3" />
          <p className="font-bold text-slate-800">
            {isAdmin ? 'ไม่พบรายการคำขอที่ตรงตามเงื่อนไข' : 'ไม่พบรายการคำขอหรือการจองของท่าน'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'ทดลองเปลี่ยนหมวดหมู่ตัวกรอง หรือตรวจสอบคำค้นหาอีกครั้ง' 
              : 'ท่านยังไม่มีประวัติคำขอในสถานะนี้ หรือสามารถเลือกเครื่องมือห้องปฏิบัติการเพื่อยื่นคำขอใหม่ได้ทันที'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW WITH COLOR CODING */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 pl-4 pr-3 sm:pl-5 sm:pr-4">สถานะ & แถบสี</th>
                  <th className="py-3.5 px-3">เครื่องมือห้องปฏิบัติการ</th>
                  <th className="py-3.5 px-3">ผู้ขอใช้ & หน่วยงาน</th>
                  <th className="py-3.5 px-3">ระยะเวลาขอใช้</th>
                  <th className="py-3.5 px-3">วัตถุประสงค์ & การประเมินระบบ</th>
                  <th className="py-3.5 pr-4 pl-3 sm:pr-5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLoans.map((loan) => {
                  const statusConf = getStatusConfig(loan.status);
                  const isOwner = currentUser && (
                    loan.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
                    loan.borrowerName?.toLowerCase() === currentUser.name?.toLowerCase()
                  );

                  const userRatingVal = loan.userRating || loan.rating;
                  const userFeedbackVal = loan.userFeedback || loan.ratingFeedback;

                  return (
                    <React.Fragment key={loan.id}>
                      <tr className={`transition-colors ${statusConf.borderLeft} ${statusConf.bgRow}`}>
                        {/* 1. Status Column */}
                        <td className="py-3.5 pl-4 pr-3 sm:pl-5 sm:pr-4 align-top">
                          <div className="flex flex-col items-start gap-1.5">
                            {getStatusBadge(loan.status)}
                            <span className="text-[10px] text-slate-500">
                              ยื่น: {formatDate(loan.createdAt)}
                            </span>
                            {isOwner && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                คำขอของฉัน
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Equipment Column */}
                        <td className="py-3.5 px-3 align-top min-w-[200px]">
                          <div>
                            <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded inline-block mb-1">
                              {loan.equipmentCode}
                            </span>
                            <p className="font-bold text-slate-900 text-xs leading-snug">
                              {loan.equipmentName}
                            </p>
                            {loan.timePeriod && (
                              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100 mt-1 inline-block">
                                ช่วง: {loan.timePeriod}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Borrower Column */}
                        <td className="py-3.5 px-3 align-top min-w-[180px]">
                          <div>
                            <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-xs">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{loan.borrowerName}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{loan.borrowerDept}</p>
                            <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                              {loan.borrowerPhone && (
                                <p className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{loan.borrowerPhone}</span>
                                </p>
                              )}
                              {loan.borrowerEmail && (
                                <p className="flex items-center space-x-1 truncate">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span className="truncate">{loan.borrowerEmail}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 4. Dates Column */}
                        <td className="py-3.5 px-3 align-top min-w-[150px]">
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex items-center space-x-1 text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>เริ่ม: {formatDate(loan.borrowDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>คืน: {formatDate(loan.returnDate)}</span>
                            </div>
                          </div>
                        </td>

                        {/* 5. Purpose & System Ratings Column */}
                        <td className="py-3.5 px-3 align-top min-w-[220px]">
                          <div className="space-y-2">
                            <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed font-medium">
                              {loan.purpose}
                            </p>
                            
                            {/* Rejection notice */}
                            {loan.status === 'rejected' && loan.rejectReason && (
                              <div className="p-1.5 bg-rose-100/70 rounded-lg border border-rose-200 text-[10px] text-rose-800 flex items-start gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                                <span><strong>เหตุผล:</strong> {loan.rejectReason}</span>
                              </div>
                            )}

                            {/* Returned condition & Backend System Ratings */}
                            {loan.status === 'returned' && (
                              <div className="space-y-1.5 text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500">สภาพหลังคืน:</span>
                                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                                    loan.conditionAfterReturn === 'ปกติพร้อมใช้งาน'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : loan.conditionAfterReturn === 'ส่งซ่อมบำรุง'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}>
                                    {loan.conditionAfterReturn || 'ปกติพร้อมใช้งาน'}
                                  </span>
                                </div>

                                {/* ADMIN VIEW: Shows both User & Approver System Evaluations */}
                                {isAdmin && (
                                  <div className="space-y-1.5 pt-1">
                                    {/* User System Evaluation */}
                                    <div className="p-1.5 bg-blue-50/80 rounded-lg border border-blue-200/80">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-blue-900 flex items-center gap-1">
                                          <UserCheck className="w-3 h-3 text-blue-600" />
                                          ผู้ใช้ประเมินระบบ:
                                        </span>
                                        {userRatingVal ? (
                                          <div className="flex items-center gap-1">
                                            <div className="flex items-center">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                  key={star}
                                                  className={`w-2.5 h-2.5 ${star <= userRatingVal ? 'text-amber-500 fill-amber-400' : 'text-slate-200 fill-slate-100'}`}
                                                />
                                              ))}
                                            </div>
                                            <span className="font-bold text-amber-900">{userRatingVal}/5</span>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic">รอผู้ใช้ประเมิน</span>
                                        )}
                                      </div>
                                      {userFeedbackVal && (
                                        <p className="text-[10px] text-slate-600 italic line-clamp-1 mt-0.5">
                                          &ldquo;{userFeedbackVal}&rdquo;
                                        </p>
                                      )}
                                    </div>

                                    {/* Approver System Evaluation */}
                                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800 flex items-center gap-1">
                                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                          ผู้อนุมัติประเมิน:
                                        </span>
                                        {loan.approverRating ? (
                                          <div className="flex items-center gap-1">
                                            <div className="flex items-center">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                  key={star}
                                                  className={`w-2.5 h-2.5 ${star <= loan.approverRating! ? 'text-indigo-500 fill-indigo-400' : 'text-slate-200 fill-slate-100'}`}
                                                />
                                              ))}
                                            </div>
                                            <span className="font-bold text-indigo-900">{loan.approverRating}/5</span>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenRating(loan, 'approver')}
                                            className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                                          >
                                            + บันทึกประเมิน
                                          </button>
                                        )}
                                      </div>
                                      {loan.approverFeedback && (
                                        <p className="text-[10px] text-slate-600 italic line-clamp-1 mt-0.5">
                                          &ldquo;{loan.approverFeedback}&rdquo;
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* USER VIEW (Private self-evaluation only) */}
                                {!isAdmin && isOwner && (
                                  <div className="pt-1">
                                    {userRatingVal ? (
                                      <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex items-center justify-between">
                                        <span className="font-medium flex items-center gap-1">
                                          <Check className="w-3 h-3 text-emerald-600" />
                                          ประเมินระบบแล้ว ({userRatingVal}/5 ดาว)
                                        </span>
                                        {onRateLoan && (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenRating(loan, 'user')}
                                            className="text-[9px] text-blue-700 font-bold hover:underline cursor-pointer"
                                          >
                                            แก้ไข
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      onRateLoan && (
                                        <button
                                          id={`btn_table_rate_${loan.id}`}
                                          type="button"
                                          onClick={() => handleOpenRating(loan, 'user')}
                                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                        >
                                          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                                          <span>⭐ ประเมินความพึงพอใจการใช้งานระบบ</span>
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 6. Actions Column */}
                        <td className="py-3.5 pr-4 pl-3 sm:pr-5 align-top text-right min-w-[140px]">
                          {isAdmin ? (
                            <div className="flex flex-col items-end gap-1.5">
                              {loan.status === 'pending' && (
                                <>
                                  <button
                                    id={`btn_table_approve_${loan.id}`}
                                    onClick={() => onApprove(loan.id)}
                                    className="w-full py-1 px-2.5 bg-vet-olive-700 hover:bg-vet-olive-800 text-white rounded-lg font-bold transition-all flex items-center justify-center space-x-1 shadow-2xs cursor-pointer text-[11px]"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>อนุมัติ</span>
                                  </button>
                                  <button
                                    id={`btn_table_reject_${loan.id}`}
                                    onClick={() => handleStartReject(loan.id)}
                                    className="w-full py-1 px-2.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1 cursor-pointer text-[11px]"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>ปฏิเสธ</span>
                                  </button>
                                </>
                              )}

                              {loan.status === 'approved' && (
                                <button
                                  id={`btn_table_return_${loan.id}`}
                                  onClick={() => handleStartReturn(loan.id)}
                                  className="w-full py-1.5 px-2.5 bg-vet-navy-900 hover:bg-vet-navy-950 text-white rounded-lg font-bold transition-all flex items-center justify-center space-x-1 shadow-2xs cursor-pointer text-[11px]"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                  <span>รับคืนอุปกรณ์</span>
                                </button>
                              )}

                              {loan.status === 'returned' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRating(loan, 'approver')}
                                  className="w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 border border-slate-300 cursor-pointer text-[10px]"
                                >
                                  <Star className="w-3 h-3 text-amber-500" />
                                  <span>{loan.approverRating ? 'แก้ไขประเมิน' : 'ประเมินระบบ'}</span>
                                </button>
                              )}

                              {(loan.status === 'returned' || loan.status === 'rejected') && onDeleteRequest && (
                                <button
                                  onClick={() => onDeleteRequest(loan.id)}
                                  className="py-1 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center space-x-1 text-[10px] cursor-pointer"
                                  title="ลบประวัติ"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>ลบ</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              {loan.status === 'pending' && isOwner && onCancelMyRequest && (
                                <button
                                  onClick={() => onCancelMyRequest(loan.id)}
                                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>ยกเลิกคำขอ</span>
                                </button>
                              )}
                              {loan.status === 'approved' && (
                                <span className="text-[10px] font-bold text-blue-700">กำลังใช้งาน</span>
                              )}
                              {loan.status === 'returned' && (
                                <span className="text-[10px] font-bold text-emerald-700">เสร็จสิ้น</span>
                              )}
                              {loan.status === 'rejected' && (
                                <span className="text-[10px] font-bold text-rose-700">ถูกปฏิเสธ</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Inline Reject Form for Table View */}
                      {isAdmin && rejectId === loan.id && (
                        <tr className="bg-rose-50 border-b border-rose-200">
                          <td colSpan={6} className="p-4">
                            <form onSubmit={handleConfirmReject} className="space-y-2">
                              <div className="flex items-center space-x-1.5 text-rose-800 font-bold text-xs">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <span>ระบุสาเหตุที่ปฏิเสธคำขอ #{loan.equipmentCode} ({loan.equipmentName})</span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  required
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="เช่น ตารางการใช้งานทับซ้อน หรือ อยู่ระหว่างส่งซ่อมบำรุง..."
                                  className="flex-1 px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  ยืนยันปฏิเสธ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectId(null)}
                                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}

                      {/* Inline Return Form for Table View */}
                      {isAdmin && returnId === loan.id && (
                        <tr className="bg-emerald-50 border-b border-emerald-200">
                          <td colSpan={6} className="p-4">
                            <form onSubmit={handleConfirmReturn} className="space-y-2">
                              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>บันทึกส่งคืนเครื่องมือ #{loan.equipmentCode}: โปรดระบุสภาพการใช้งานหลังคืน</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {[
                                  { value: 'ปกติพร้อมใช้งาน', label: 'ปกติพร้อมใช้งาน', color: 'border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50' },
                                  { value: 'ส่งซ่อมบำรุง', label: 'ส่งซ่อมบำรุง', color: 'border-amber-300 text-amber-800 bg-white hover:bg-amber-50' },
                                  { value: 'ชำรุดเสียหาย', label: 'ชำรุดเสียหาย', color: 'border-rose-300 text-rose-800 bg-white hover:bg-rose-50' }
                                ].map(opt => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setReturnCondition(opt.value)}
                                    className={`px-3 py-1.5 border rounded-lg font-semibold text-xs cursor-pointer ${
                                      returnCondition === opt.value
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                        : opt.color
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                                <div className="ml-auto flex gap-2">
                                  <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    ยืนยันส่งคืน
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReturnId(null)}
                                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW WITH MATCHING COLOR CODING */
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredLoans.map((loan) => {
              const statusConf = getStatusConfig(loan.status);
              const isOwner = currentUser && (
                loan.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
                loan.borrowerName?.toLowerCase() === currentUser.name?.toLowerCase()
              );

              const userRatingVal = loan.userRating || loan.rating;
              const userFeedbackVal = loan.userFeedback || loan.ratingFeedback;

              return (
                <motion.div
                  key={loan.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`bg-white rounded-2xl border ${statusConf.bgCard} ${statusConf.borderLeft} shadow-xs overflow-hidden transition-all duration-200`}
                >
                  {/* Header of loan card */}
                  <div className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${statusConf.headerBg}`}>
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-[10px] font-bold bg-white text-blue-700 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
                        {loan.equipmentCode}
                      </span>
                      <h4 className="font-bold text-slate-900 leading-tight text-sm">
                        {loan.equipmentName}
                      </h4>
                      {isOwner && (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          คำขอของฉัน
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-slate-500 text-[10px] hidden sm:inline">
                        ยื่นคำขอเมื่อ {formatDate(loan.createdAt)}
                      </span>
                      {getStatusBadge(loan.status)}
                    </div>
                  </div>

                  {/* Body of loan card */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 text-xs text-slate-600">
                    {/* Left Column - Borrower Bio */}
                    <div className="md:col-span-4 space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 pr-0 md:pr-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{loan.borrowerName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{loan.borrowerDept}</p>
                        </div>
                      </div>
                      <div className="pt-2 space-y-1.5 border-t border-slate-100 text-[11px]">
                        <a href={`tel:${loan.borrowerPhone}`} className="flex items-center space-x-1.5 text-slate-600 hover:text-blue-600 transition-colors">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{loan.borrowerPhone}</span>
                        </a>
                        <a href={`mailto:${loan.borrowerEmail}`} className="flex items-center space-x-1.5 text-slate-600 hover:text-blue-600 transition-colors">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{loan.borrowerEmail}</span>
                        </a>
                      </div>
                    </div>

                    {/* Middle Column - Request purpose & timeline */}
                    <div className="md:col-span-5 space-y-3">
                      <div>
                        <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">วัตถุประสงค์ในการขอใช้</span>
                        <p className="text-slate-800 mt-1 leading-relaxed text-xs font-medium">
                          {loan.purpose}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-semibold block">วันที่เริ่มใช้งาน</span>
                          <div className="flex items-center space-x-1 text-slate-900 mt-1 font-mono font-medium">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1" />
                            <span>{formatDate(loan.borrowDate)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block">กำหนดส่งคืน</span>
                          <div className="flex items-center space-x-1 text-slate-900 mt-1 font-mono font-medium">
                            <Calendar className="w-3.5 h-3.5 text-rose-500 mr-1" />
                            <span>{formatDate(loan.returnDate)}</span>
                          </div>
                        </div>
                      </div>

                      {loan.timePeriod && (
                        <div className="mt-2.5 flex items-center space-x-2 text-xs text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">ช่วงเวลา:</span>
                          <span className="font-bold text-[11px] text-blue-800">{loan.timePeriod}</span>
                        </div>
                      )}

                      {/* Show rejection details if rejected */}
                      {loan.status === 'rejected' && loan.rejectReason && (
                        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 flex items-start space-x-2 mt-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                          <div>
                            <span className="font-bold">สาเหตุที่ปฏิเสธ:</span> {loan.rejectReason}
                          </div>
                        </div>
                      )}

                      {/* Show approval details & System Evaluation if returned */}
                      {loan.status === 'returned' && loan.returnedAt && (
                        <div className="space-y-2 mt-2">
                          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>ส่งคืนอุปกรณ์เรียบร้อยเมื่อ {formatDate(loan.returnedAt)}</span>
                          </div>
                          {loan.conditionAfterReturn && (
                            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                              <span className="text-slate-500 font-medium">สภาพหลังคืน:</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                loan.conditionAfterReturn === 'ปกติพร้อมใช้งาน'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : loan.conditionAfterReturn === 'ส่งซ่อมบำรุง'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {loan.conditionAfterReturn}
                              </span>
                            </div>
                          )}

                          {/* ADMIN: Card view shows User Evaluation & Approver Evaluation */}
                          {isAdmin && (
                            <div className="space-y-2 pt-1">
                              {/* User review in card */}
                              <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/80 text-[11px]">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-blue-900 flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-blue-600" />
                                    การประเมินระบบจากผู้ขอใช้
                                  </span>
                                  {userRatingVal ? (
                                    <span className="font-bold text-amber-900 text-xs">{userRatingVal} / 5 ดาว</span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">รอประเมิน</span>
                                  )}
                                </div>
                                {userFeedbackVal && (
                                  <p className="text-[11px] text-slate-700 italic bg-white/70 p-1.5 rounded-lg border border-blue-100 mt-1">
                                    &ldquo;{userFeedbackVal}&rdquo;
                                  </p>
                                )}
                              </div>

                              {/* Approver review in card */}
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-800 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                    การประเมินระบบจากผู้อนุมัติ
                                  </span>
                                  {loan.approverRating ? (
                                    <span className="font-bold text-indigo-900 text-xs">{loan.approverRating} / 5 ดาว</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRating(loan, 'approver')}
                                      className="text-[10px] text-indigo-700 font-bold hover:underline cursor-pointer"
                                    >
                                      + บันทึกการประเมิน
                                    </button>
                                  )}
                                </div>
                                {loan.approverFeedback && (
                                  <p className="text-[11px] text-slate-700 italic bg-white/70 p-1.5 rounded-lg border border-slate-200 mt-1">
                                    &ldquo;{loan.approverFeedback}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* USER: Card view shows own system evaluation */}
                          {!isAdmin && isOwner && (
                            <div className="pt-1">
                              {userRatingVal ? (
                                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] flex items-center justify-between">
                                  <span className="text-emerald-900 font-medium flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    ท่านได้ประเมินความพึงพอใจระบบแล้ว ({userRatingVal}/5 ดาว)
                                  </span>
                                  {onRateLoan && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRating(loan, 'user')}
                                      className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer"
                                    >
                                      แก้ไขการประเมิน
                                    </button>
                                  )}
                                </div>
                              ) : (
                                onRateLoan && (
                                  <button
                                    id={`btn_card_rate_${loan.id}`}
                                    type="button"
                                    onClick={() => handleOpenRating(loan, 'user')}
                                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 hover:border-amber-400 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-xs shadow-2xs"
                                  >
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                    <span>⭐ ประเมินความพึงพอใจการใช้งานระบบห้องแล็บ</span>
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column - Action Controls */}
                    <div className="md:col-span-3 flex flex-col justify-center items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
                      {/* ADMIN ROLE CONTROLS */}
                      {isAdmin ? (
                        <>
                          {loan.status === 'pending' && (
                            <div className="w-full space-y-2">
                              <button
                                id={`btn_approve_${loan.id}`}
                                onClick={() => onApprove(loan.id)}
                                className="w-full py-2 px-3 bg-vet-olive-700 hover:bg-vet-olive-800 text-white rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs"
                              >
                                <Check className="w-4 h-4" />
                                <span>อนุมัติคำขอ</span>
                              </button>
                              <button
                                id={`btn_reject_trigger_${loan.id}`}
                                onClick={() => handleStartReject(loan.id)}
                                className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl font-semibold transition-all flex items-center justify-center space-x-1 cursor-pointer text-xs"
                              >
                                <X className="w-4 h-4" />
                                <span>ปฏิเสธ</span>
                              </button>
                            </div>
                          )}

                          {loan.status === 'approved' && (
                            <button
                              id={`btn_return_${loan.id}`}
                              onClick={() => handleStartReturn(loan.id)}
                              className="w-full py-2 px-3 bg-vet-navy-900 hover:bg-vet-navy-950 text-white rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs"
                            >
                              <Undo2 className="w-4 h-4" />
                              <span>บันทึกการส่งคืน</span>
                            </button>
                          )}

                          {loan.status === 'returned' && (
                            <button
                              type="button"
                              onClick={() => handleOpenRating(loan, 'approver')}
                              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl transition-all flex items-center justify-center space-x-1.5 border border-slate-300 cursor-pointer text-xs font-semibold"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              <span>{loan.approverRating ? 'แก้ไขประเมินผู้อนุมัติ' : 'บันทึกประเมินผู้อนุมัติ'}</span>
                            </button>
                          )}

                          {(loan.status === 'returned' || loan.status === 'rejected') && onDeleteRequest && (
                            <button
                              onClick={() => onDeleteRequest(loan.id)}
                              className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl transition-all flex items-center justify-center space-x-1 border border-slate-200 hover:border-rose-300 cursor-pointer text-xs"
                              title="ลบออกจากประวัติ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบประวัติคำขอ</span>
                            </button>
                          )}
                        </>
                      ) : (
                        /* USER ROLE CONTROLS */
                        <div className="w-full flex flex-col items-center justify-center space-y-2 text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                          {loan.status === 'pending' && (
                            <>
                              <div className="flex items-center space-x-1 text-amber-700 font-bold text-[11px]">
                                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                <span>รอเจ้าหน้าที่อนุมัติ</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-tight">
                                สิทธิ์การอนุมัติสงวนเฉพาะผู้ดูแลระบบ
                              </p>
                              {isOwner && onCancelMyRequest && (
                                <button
                                  onClick={() => onCancelMyRequest(loan.id)}
                                  className="mt-1 px-3 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>ยกเลิกคำขอของฉัน</span>
                                </button>
                              )}
                            </>
                          )}

                          {loan.status === 'approved' && (
                            <>
                              <div className="flex items-center space-x-1 text-blue-800 font-bold text-[11px]">
                                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                                <span>กำลังใช้งาน</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-tight">
                                เมื่อใช้เสร็จแล้ว กรุณาติดต่อผู้ดูแลเพื่อส่งคืน
                              </p>
                            </>
                          )}

                          {loan.status === 'returned' && (
                            <div className="flex flex-col items-center space-y-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="text-[10px] font-bold text-emerald-800">เสร็จสิ้นกระบวนการ</span>
                            </div>
                          )}

                          {loan.status === 'rejected' && (
                            <div className="flex flex-col items-center space-y-1">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span className="text-[10px] font-bold text-rose-800">คำขอถูกปฏิเสธ</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Rejection Reason Dialog */}
                  {isAdmin && rejectId === loan.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 pt-1 border-t border-rose-200 bg-rose-50/70 text-xs"
                    >
                      <form onSubmit={handleConfirmReject} className="space-y-2.5">
                        <div className="flex items-center space-x-1 text-rose-800 font-bold">
                          <AlertCircle className="w-4 h-4" />
                          <span>โปรดระบุสาเหตุที่ปฏิเสธการขอใช้เครื่องมือ</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="เช่น ตารางทับซ้อนกับรายวิชาหลัก หรือ เครื่องมืออยู่ในขั้นตอนการบำรุงรักษา..."
                            className="flex-1 px-3 py-1.5 border border-rose-300 rounded-xl focus:border-rose-500 focus:outline-none text-xs bg-white text-slate-900 placeholder:text-slate-400"
                          />
                          <button
                            type="submit"
                            id={`btn_reject_confirm_${loan.id}`}
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
                          >
                            ยืนยันปฏิเสธ
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectId(null)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Inline Return Condition Dialog */}
                  {isAdmin && returnId === loan.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 pt-1 border-t border-emerald-200 bg-emerald-50/70 text-xs"
                    >
                      <form onSubmit={handleConfirmReturn} className="space-y-2.5">
                        <div className="flex items-center space-x-1.5 text-emerald-800 font-bold mt-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>บันทึกการส่งคืนเครื่องมือห้องปฏิบัติการ: โปรดระบุสภาพการใช้งานหลังคืน</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { value: 'ปกติพร้อมใช้งาน', label: 'ปกติพร้อมใช้งาน', color: 'border-emerald-200 text-emerald-800 bg-white hover:bg-emerald-50' },
                              { value: 'ส่งซ่อมบำรุง', label: 'ส่งซ่อมบำรุง', color: 'border-amber-200 text-amber-800 bg-white hover:bg-amber-50' },
                              { value: 'ชำรุดเสียหาย', label: 'ชำรุดเสียหาย', color: 'border-rose-200 text-rose-800 bg-white hover:bg-rose-50' }
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setReturnCondition(opt.value)}
                                className={`px-3 py-1.5 border rounded-lg font-medium transition-all text-xs cursor-pointer ${
                                  returnCondition === opt.value
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : `${opt.color}`
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                            <button
                              type="submit"
                              id={`btn_return_confirm_${loan.id}`}
                              className="flex-1 sm:flex-initial px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                            >
                              ยืนยันส่งคืน
                            </button>
                            <button
                              type="button"
                              onClick={() => setReturnId(null)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Dual Evaluation Rating Feedback Modal */}
      {selectedLoanToRate && onRateLoan && (
        <RatingFeedbackModal
          isOpen={!!selectedLoanToRate}
          loan={selectedLoanToRate}
          currentUserRole={currentUserRole}
          initialEvaluatorType={ratePerspective}
          onClose={() => setSelectedLoanToRate(null)}
          onSubmitRating={(loanId, rating, feedback, evaluatorType) => {
            onRateLoan(loanId, rating, feedback, evaluatorType);
            setSelectedLoanToRate(null);
          }}
        />
      )}
    </div>
  );
};
