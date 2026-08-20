import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Sparkles,
  Bell,
  Calendar,
  AlertCircle,
  ChevronRight,
  Star,
  Ban,
  Check,
  X,
  Send,
  Zap,
  RotateCcw,
  Sliders,
  Volume2
} from 'lucide-react';
import { LoanRequest, UserProfile } from '../types';

interface LatestStatusTrackerProps {
  loans: LoanRequest[];
  currentUser?: UserProfile;
  isAdmin: boolean;
  onSimulateNotification: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning',
    loanId?: string,
    equipmentName?: string
  ) => void;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, reason?: string) => void;
  onReturn: (id: string, condition?: string) => void;
  onRateLoan?: (id: string, rating: number, feedback?: string, evaluatorType?: 'user' | 'approver') => void;
  onCancelMyRequest?: (id: string) => void;
}

export const LatestStatusTracker: React.FC<LatestStatusTrackerProps> = ({
  loans,
  currentUser,
  isAdmin,
  onSimulateNotification,
  onApprove,
  onReject,
  onReturn,
  onRateLoan,
  onCancelMyRequest
}) => {
  // Sort loans by createdAt descending to easily find the latest
  const sortedLoans = [...loans].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    sortedLoans.length > 0 ? sortedLoans[0].id : null
  );
  const [showSimulatorPanel, setShowSimulatorPanel] = useState(true);
  const [customSimMessage, setCustomSimMessage] = useState('');

  // Active targeted loan for tracking
  const activeLoan = sortedLoans.find(l => l.id === selectedLoanId) || sortedLoans[0] || null;

  if (!activeLoan) {
    return null;
  }

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

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'ไม่ระบุ';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    } catch {
      return dateStr;
    }
  };

  // Determine active step index (0-4)
  const getStepIndex = (status: LoanRequest['status']) => {
    switch (status) {
      case 'pending': return 1; // Step 2: Under Review
      case 'approved': return 3; // Step 4: Approved & In Use
      case 'returned': return 4; // Step 5: Returned & Evaluated
      case 'rejected': return 2; // Step 3: Rejected
      default: return 0;
    }
  };

  const currentStep = getStepIndex(activeLoan.status);

  // Status visual themes
  const getStatusTheme = (status: LoanRequest['status']) => {
    switch (status) {
      case 'pending':
        return {
          title: 'รอพิจารณาอนุมัติคำขอ',
          desc: 'คำขอของท่านส่งถึงเจ้าหน้าที่ห้องปฏิบัติการเรียบร้อยแล้ว อยู่ระหว่างการตรวจสอบคิวและสภาพอุปกรณ์',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/30',
          pulseColor: 'bg-amber-500',
          borderTheme: 'border-amber-300',
          bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
          icon: <Clock className="w-4 h-4 text-amber-600" />
        };
      case 'approved':
        return {
          title: 'อนุมัติคำขอแล้ว (พร้อมรับเครื่องมือ/กำลังใช้งาน)',
          desc: 'เจ้าหน้าที่ได้อนุมัติคำขอใช้งานเรียบร้อยแล้ว ท่านสามารถติดต่อรับเครื่องมือตามกำหนดเวลา ณ ห้องปฏิบัติการ',
          badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300 ring-1 ring-emerald-400/30',
          pulseColor: 'bg-emerald-500',
          borderTheme: 'border-emerald-300',
          bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        };
      case 'returned':
        return {
          title: 'ส่งคืนเครื่องมือเรียบร้อยแล้ว (เสร็จสมบูรณ์)',
          desc: 'ตรวจรับคืนอุปกรณ์เรียบร้อยแล้ว ขอบคุณที่ปฏิบัติตามระเบียบการใช้งานห้องปฏิบัติการอย่างเคร่งครัด',
          badgeClass: 'bg-blue-100 text-blue-950 border-blue-300 ring-1 ring-blue-400/30',
          pulseColor: 'bg-blue-500',
          borderTheme: 'border-blue-300',
          bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
          icon: <ArrowLeftRight className="w-4 h-4 text-blue-600" />
        };
      case 'rejected':
        return {
          title: 'คำขอไม่ได้รับการอนุมัติ',
          desc: activeLoan.rejectReason ? `สาเหตุ: ${activeLoan.rejectReason}` : 'คำขอไม่ผ่านการพิจารณา ท่านสามารถยื่นคำขอใหม่โดยปรับเปลี่ยนช่วงเวลา',
          badgeClass: 'bg-rose-100 text-rose-950 border-rose-300 ring-1 ring-rose-400/30',
          pulseColor: 'bg-rose-500',
          borderTheme: 'border-rose-300',
          bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
          icon: <XCircle className="w-4 h-4 text-rose-600" />
        };
      default:
        return {
          title: activeLoan.status,
          desc: '',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
          pulseColor: 'bg-slate-400',
          borderTheme: 'border-slate-300',
          bgGradient: 'from-slate-100 to-transparent',
          icon: null
        };
    }
  };

  const statusTheme = getStatusTheme(activeLoan.status);

  // Quick Simulation Actions
  const handleSimulateApprove = () => {
    onApprove(activeLoan.id, 'จำลองการอนุมัติผ่านระบบ Notification Simulator');
    onSimulateNotification(
      'คำขอใช้งานได้รับการอนุมัติแล้ว (จำลองผล)',
      `คำขอใช้งาน "${activeLoan.equipmentName}" ได้รับการอนุมัติแล้ว กรุณาติดต่อรับเครื่องมือตามกำหนด`,
      'success',
      activeLoan.id,
      activeLoan.equipmentName
    );
  };

  const handleSimulateReject = () => {
    const reason = 'จำลองเหตุผล: ตารางการใช้งานทับซ้อนกับรายวิชาปฏิบัติการ';
    onReject(activeLoan.id, reason);
    onSimulateNotification(
      'คำขอใช้งานไม่ได้รับการอนุมัติ (จำลองผล)',
      `คำขอใช้งาน "${activeLoan.equipmentName}" ถูกปฏิเสธ (${reason})`,
      'warning',
      activeLoan.id,
      activeLoan.equipmentName
    );
  };

  const handleSimulateReturn = () => {
    onReturn(activeLoan.id, 'ปกติพร้อมใช้งาน');
    onSimulateNotification(
      'บันทึกการส่งคืนอุปกรณ์สำเร็จ (จำลองผล)',
      `ตรวจรับคืนเครื่องมือ "${activeLoan.equipmentName}" เรียบร้อยแล้ว (สภาพ: ปกติพร้อมใช้งาน)`,
      'info',
      activeLoan.id,
      activeLoan.equipmentName
    );
  };

  const handleSendCustomNotification = () => {
    const msg = customSimMessage.trim() || `อัปเดตสถานะล่าสุดของคำขอ ${activeLoan.equipmentCode}: อยู่ระหว่างดำเนินการ`;
    onSimulateNotification(
      'แจ้งเตือนสถานะคำขอใช้งาน (จำลองข้อความ)',
      msg,
      'info',
      activeLoan.id,
      activeLoan.equipmentName
    );
    setCustomSimMessage('');
  };

  return (
    <div
      id="latest_status_tracker_card"
      className={`rounded-2xl border-2 ${statusTheme.borderTheme} bg-gradient-to-b ${statusTheme.bgGradient} bg-white p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all duration-300`}
    >
      {/* Background Decorative Grid */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-slate-100/60 to-transparent pointer-events-none -z-0" />

      {/* Top Bar: Section Title & Request Selector */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-vet-navy-900 text-white rounded-xl shadow-2xs">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                สถานะล่าสุดของคำขอใช้งาน (Latest Status Tracker)
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusTheme.pulseColor} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${statusTheme.pulseColor}`} />
                </span>
                <span>อัปเดตสด Real-time</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามความคืบหน้าของคำขอและทดสอบการแจ้งเตือนสถานะการอนุมัติแบบจำลองผ่าน UI
            </p>
          </div>
        </div>

        {/* Request selector dropdown if user has multiple requests */}
        {sortedLoans.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">เลือกดูคำขอ:</span>
            <select
              value={activeLoan.id}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-vet-navy-700 shadow-2xs"
            >
              {sortedLoans.map((loan, idx) => (
                <option key={loan.id} value={loan.id}>
                  {idx === 0 ? '🔥 ล่าสุด: ' : ''}#{loan.equipmentCode} - {loan.equipmentName} ({loan.status === 'pending' ? 'รออนุมัติ' : loan.status === 'approved' ? 'อนุมัติแล้ว' : loan.status === 'returned' ? 'ส่งคืนแล้ว' : 'ปฏิเสธ'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hero Status Banner */}
      <div className="relative z-10 mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Status Badge & Equipment Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-extrabold border shadow-2xs ${statusTheme.badgeClass}`}>
              {statusTheme.icon}
              <span className="ml-1.5">{statusTheme.title}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              รหัสคำขอ: {activeLoan.id}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              ยื่นเมื่อ {formatDate(activeLoan.createdAt)} ({formatTimeAgo(activeLoan.createdAt)})
            </span>
          </div>

          <div className="bg-white/95 rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  {activeLoan.equipmentCode}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  {activeLoan.equipmentName}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">กำหนดการขอใช้</span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {formatDate(activeLoan.borrowDate)} - {formatDate(activeLoan.returnDate)}
                </span>
                {activeLoan.timePeriod && (
                  <span className="text-[10px] text-blue-700 block font-medium">
                    ช่วง: {activeLoan.timePeriod}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
              <p className="text-slate-600">
                <strong className="text-slate-800">วัตถุประสงค์:</strong> {activeLoan.purpose}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span><strong>ผู้ขอใช้:</strong> {activeLoan.borrowerName}</span>
                <span><strong>สังกัด:</strong> {activeLoan.borrowerDept}</span>
                {activeLoan.borrowerPhone && <span><strong>โทร:</strong> {activeLoan.borrowerPhone}</span>}
              </div>
            </div>

            {/* Status Guide Message */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-vet-navy-700 shrink-0 mt-0.5" />
              <p className="text-slate-700 font-medium leading-relaxed">
                {statusTheme.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Step Interactive Progress Bar */}
        <div className="lg:col-span-5 bg-white/95 rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-vet-navy-700" />
              ขั้นตอนการดำเนินการ (Status Workflow)
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              ขั้นตอนที่ {activeLoan.status === 'rejected' ? '3/5 (ไม่อนุมัติ)' : `${currentStep + 1}/5`}
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-3">
            {[
              {
                step: 1,
                title: 'ยื่นคำขอใช้งาน',
                detail: formatDate(activeLoan.createdAt),
                isDone: true,
                isActive: false
              },
              {
                step: 2,
                title: 'รอเจ้าหน้าที่ตรวจสอบ',
                detail: activeLoan.status === 'pending' ? 'กำลังพิจารณา' : 'ตรวจสอบแล้ว',
                isDone: activeLoan.status !== 'pending',
                isActive: activeLoan.status === 'pending'
              },
              {
                step: 3,
                title: activeLoan.status === 'rejected' ? 'ไม่อนุมัติคำขอ' : 'ผลการอนุมัติ',
                detail: activeLoan.status === 'rejected' ? (activeLoan.rejectReason || 'ปฏิเสธ') : (activeLoan.status === 'pending' ? 'รอผล' : 'อนุมัติแล้ว'),
                isDone: activeLoan.status === 'approved' || activeLoan.status === 'returned' || activeLoan.status === 'rejected',
                isActive: activeLoan.status === 'approved',
                isError: activeLoan.status === 'rejected'
              },
              {
                step: 4,
                title: 'เบิกรับ & ใช้งานเครื่องมือ',
                detail: activeLoan.status === 'approved' ? 'กำลังใช้งาน' : (activeLoan.status === 'returned' ? 'ใช้งานเสร็จสิ้น' : '-'),
                isDone: activeLoan.status === 'returned',
                isActive: activeLoan.status === 'approved'
              },
              {
                step: 5,
                title: 'ส่งคืน & ประเมินผลระบบ',
                detail: activeLoan.status === 'returned' ? (activeLoan.userRating ? `ประเมินแล้ว ⭐ ${activeLoan.userRating}/5` : 'รอประเมินความพึงพอใจ') : '-',
                isDone: activeLoan.status === 'returned' && Boolean(activeLoan.userRating),
                isActive: activeLoan.status === 'returned' && !activeLoan.userRating
              }
            ].map((item, index) => (
              <div key={item.step} className="flex items-start gap-3 relative">
                {/* Connecting Line */}
                {index < 4 && (
                  <div
                    className={`absolute left-3.5 top-6 w-0.5 h-6 -ml-[1px] ${
                      item.isDone ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    item.isError
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                      : item.isDone
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : item.isActive
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}
                >
                  {item.isError ? (
                    <X className="w-3.5 h-3.5" />
                  ) : item.isDone ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    item.step
                  )}
                </div>

                {/* Step Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold leading-tight ${
                        item.isError
                          ? 'text-rose-700'
                          : item.isDone
                          ? 'text-emerald-800'
                          : item.isActive
                          ? 'text-amber-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.detail}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action button if pending */}
          {activeLoan.status === 'pending' && onCancelMyRequest && (
            <button
              onClick={() => onCancelMyRequest(activeLoan.id)}
              className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>ยกเลิกคำขอนี้</span>
            </button>
          )}

          {/* Action button if returned and not rated */}
          {activeLoan.status === 'returned' && onRateLoan && !activeLoan.userRating && (
            <button
              onClick={() => onRateLoan(activeLoan.id, 5, 'ระบบใช้งานง่าย สะดวกรวดเร็ว', 'user')}
              className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>⭐ บันทึกประเมินความพึงพอใจระบบ (5 ดาว)</span>
            </button>
          )}
        </div>
      </div>

      {/* Simulator Notification Section */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                🧪 ระบบจำลองการแจ้งเตือนสถานะการอนุมัติผ่าน UI (Approval Notification Simulator)
              </span>
              <p className="text-[11px] text-slate-500">
                คลิกปุ่มด้านล่างเพื่อทดสอบการจำลองเปลี่ยนสถานะคำขอ พร้อมรับการแจ้งเตือนแบบ Real-time Popup และเสียง Chime
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSimulatorPanel(!showSimulatorPanel)}
            className="text-[11px] font-bold text-vet-navy-800 hover:text-vet-navy-950 underline self-start sm:self-auto cursor-pointer"
          >
            {showSimulatorPanel ? 'ซ่อนแผงจำลอง' : 'เปิดแผงจำลอง'}
          </button>
        </div>

        <AnimatePresence>
          {showSimulatorPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3.5 p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl space-y-3 overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Simulate Approve */}
                <button
                  id="btn_sim_approve"
                  type="button"
                  onClick={handleSimulateApprove}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="จำลอง: เจ้าหน้าที่กดอนุมัติคำขอใช้งานนี้"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>จำลอง: อนุมัติคำขอ (Approve)</span>
                </button>

                {/* 2. Simulate Reject */}
                <button
                  id="btn_sim_reject"
                  type="button"
                  onClick={handleSimulateReject}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="จำลอง: เจ้าหน้าที่กดปฏิเสธคำขอใช้งานนี้"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>จำลอง: ปฏิเสธคำขอ (Reject)</span>
                </button>

                {/* 3. Simulate Return */}
                <button
                  id="btn_sim_return"
                  type="button"
                  onClick={handleSimulateReturn}
                  className="px-3 py-1.5 bg-vet-navy-900 hover:bg-vet-navy-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="จำลอง: บันทึกรับคืนเครื่องมือเรียบร้อย"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>จำลอง: รับคืนอุปกรณ์ (Returned)</span>
                </button>

                {/* 4. Simulate Push Notification */}
                <button
                  id="btn_sim_push"
                  type="button"
                  onClick={() => {
                    onSimulateNotification(
                      `🔔 แจ้งเตือน: กำหนดรับเครื่องมือ #${activeLoan.equipmentCode}`,
                      `เรียนคุณ ${activeLoan.borrowerName} คำขอ "${activeLoan.equipmentName}" ถึงกำหนดวันขอใช้แล้ว (${formatDate(activeLoan.borrowDate)})`,
                      'info',
                      activeLoan.id,
                      activeLoan.equipmentName
                    );
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>จำลอง: แจ้งเตือนคิวรับเครื่องมือ</span>
                </button>
              </div>

              {/* Custom Notification Test Form */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  value={customSimMessage}
                  onChange={(e) => setCustomSimMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความแจ้งเตือนที่ต้องการจำลองส่งถึงผู้ใช้..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-vet-navy-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendCustomNotification();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendCustomNotification}
                  className="px-3 py-1.5 bg-vet-olive-700 hover:bg-vet-olive-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งแจ้งเตือนจำลอง</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
