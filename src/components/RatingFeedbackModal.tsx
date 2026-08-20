import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MessageSquare, ThumbsUp, Sparkles, AlertCircle, ShieldCheck, UserCheck, Settings, Info } from 'lucide-react';
import { LoanRequest, UserRole } from '../types';

interface RatingFeedbackModalProps {
  isOpen: boolean;
  loan: LoanRequest | null;
  currentUserRole?: UserRole;
  initialEvaluatorType?: 'user' | 'approver';
  onClose: () => void;
  onSubmitRating: (loanId: string, rating: number, feedback?: string, evaluatorType?: 'user' | 'approver') => void;
}

export const RatingFeedbackModal: React.FC<RatingFeedbackModalProps> = ({
  isOpen,
  loan,
  currentUserRole = 'user',
  initialEvaluatorType,
  onClose,
  onSubmitRating
}) => {
  // Determine evaluator perspective (user vs approver)
  const defaultEvaluator = initialEvaluatorType || (currentUserRole === 'admin' ? 'approver' : 'user');
  const [evaluatorType, setEvaluatorType] = useState<'user' | 'approver'>(defaultEvaluator);

  const initialRating = evaluatorType === 'approver'
    ? (loan?.approverRating || 5)
    : (loan?.userRating || loan?.rating || 5);

  const initialFeedback = evaluatorType === 'approver'
    ? (loan?.approverFeedback || '')
    : (loan?.userFeedback || loan?.ratingFeedback || '');

  const [rating, setRating] = useState<number>(initialRating);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>(initialFeedback);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !loan) return null;

  // Change perspective if user/admin toggles
  const handleTogglePerspective = (type: 'user' | 'approver') => {
    setEvaluatorType(type);
    if (type === 'approver') {
      setRating(loan.approverRating || 5);
      setFeedback(loan.approverFeedback || '');
    } else {
      setRating(loan.userRating || loan.rating || 5);
      setFeedback(loan.userFeedback || loan.ratingFeedback || '');
    }
    setError(null);
  };

  // Quick preset feedback tags for lab system evaluation
  const userSystemTags = [
    'ระบบจองใช้งานง่ายและรวดเร็ว',
    'ปฏิทินแสดงคิวว่างชัดเจน',
    'ขั้นตอนการยื่นคำขอไม่ซับซ้อน',
    'ได้รับการอนุมัติและแจ้งเตือนทันเวลา',
    'เจ้าหน้าที่ห้องแล็บให้คำแนะนำดีเยี่ยม',
    'ตัวกรองและค้นหาเครื่องมือแม่นยำ'
  ];

  const approverSystemTags = [
    'ข้อมูลคำขอในระบบครบถ้วนถูกต้อง',
    'ผู้ขอปฏิบัติตามแนวทางการใช้ห้องแล็บ',
    'ตรวจรับและส่งคืนตรงตามเวลานัด',
    'บันทึกสภาพเครื่องมือในระบบเรียบร้อย',
    'วัตถุประสงค์สอดคล้องกับงานวิจัย',
    'การประสานงานระบบส่งมอบราบรื่น'
  ];

  const currentTags = evaluatorType === 'approver' ? approverSystemTags : userSystemTags;

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return { text: '1 ดาว - ต้องปรับปรุงระบบ (Poor / Needs System Improvement)', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 2:
        return { text: '2 ดาว - พอใช้ ควรพัฒนาขั้นตอน (Fair)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 3:
        return { text: '3 ดาว - ปานกลาง เป็นไปตามเกณฑ์ (Average / Good)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 4:
        return { text: '4 ดาว - ดีมาก ระบบราบรื่น (Very Good)', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 5:
      default:
        return { text: '5 ดาว - ยอดเยี่ยม สะดวกและมีประสิทธิภาพสูงสุด (Excellent System Experience)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
  };

  const handleSelectQuickTag = (tag: string) => {
    if (!feedback) {
      setFeedback(tag);
    } else if (!feedback.includes(tag)) {
      setFeedback(prev => `${prev} ${tag}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('กรุณาเลือกคะแนนประเมิน 1 ถึง 5 ดาว');
      return;
    }
    onSubmitRating(loan.id, rating, feedback.trim(), evaluatorType);
    onClose();
  };

  const currentDisplayRating = hoveredRating !== null ? hoveredRating : rating;
  const ratingInfo = getRatingLabel(currentDisplayRating);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <div className="flex min-h-screen items-center justify-center p-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl text-left overflow-hidden my-6"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-vet-navy-900/10 via-slate-50 to-vet-olive-600/10 px-6 py-5 border-b border-slate-200 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 rounded-xl bg-vet-navy-900 text-white shadow-xs">
                    <Star className="w-5 h-5 fill-white" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      ประเมินความพึงพอใจการใช้งานระบบห้องปฏิบัติการ
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      VET Lab Booking & Service System Evaluation
                    </p>
                  </div>
                </div>
              </div>
              <button
                id="btn_close_rating_modal"
                onClick={onClose}
                className="p-2 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Internal Backend Privacy Badge */}
              <div className="p-3 bg-vet-navy-950 text-slate-100 rounded-xl flex items-center gap-2.5 text-xs shadow-xs border border-vet-navy-800">
                <ShieldCheck className="w-4 h-4 text-vet-olive-400 shrink-0" />
                <div className="leading-snug">
                  <span className="font-bold text-vet-olive-300">ข้อมูลเชิงลึกหลังบ้าน (Admin Insight):</span>
                  <span className="text-slate-300 text-[11px] ml-1">
                    คะแนนนี้ใช้ประเมินระบบการให้บริการและจะถูกเก็บเป็นข้อมูลสำหรับผู้ดูแลระบบพัฒนาการทำงาน (ไม่เปิดเผยต่อสาธารณะ)
                  </span>
                </div>
              </div>

              {/* Role Perspective Switcher (Visible to Admin or when editing) */}
              {currentUserRole === 'admin' && (
                <div className="p-1.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleTogglePerspective('user')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      evaluatorType === 'user'
                        ? 'bg-white text-vet-navy-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>มุมมองผู้ขอใช้งาน (User)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePerspective('approver')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      evaluatorType === 'approver'
                        ? 'bg-white text-vet-olive-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>มุมมองผู้อนุมัติ/เจ้าหน้าที่ (Approver)</span>
                  </button>
                </div>
              )}

              {/* Loan and Machine Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-vet-navy-900 bg-vet-navy-50 px-2 py-0.5 rounded border border-vet-navy-200">
                    {loan.equipmentCode}
                  </span>
                  <span className="text-slate-500">
                    รอบการใช้งาน: {loan.borrowDate} ถึง {loan.returnDate}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{loan.equipmentName}</p>
                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-0.5">
                  <span>ผู้ขอใช้งาน: <strong>{loan.borrowerName}</strong> ({loan.borrowerDept})</span>
                  <span className="text-vet-olive-800 font-semibold">สถานะ: ส่งคืนเรียบร้อย</span>
                </div>
              </div>

              {/* Evaluation Target Focus Notice */}
              <div className="p-2.5 bg-vet-navy-50/70 border border-vet-navy-200/80 rounded-xl flex items-start gap-2 text-xs text-vet-navy-900">
                <Info className="w-4 h-4 text-vet-navy-800 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>หัวข้อการประเมิน:</strong> ประเมินความสะดวก ความรวดเร็ว และความพึงพอใจต่อ <u>ระบบสารสนเทศและการให้บริการห้องปฏิบัติการ</u> (ไม่ใช่การประเมินตัวเครื่องมือ)
                </p>
              </div>

              {/* Star Rating Section */}
              <div className="text-center space-y-2.5 py-2 bg-gradient-to-b from-amber-50/50 to-transparent p-4 rounded-2xl border border-amber-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ระดับความพึงพอใจการใช้งานระบบ (1 - 5 ดาว)
                </label>

                {/* 5 Big Interactive Stars */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= currentDisplayRating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => {
                          setRating(starValue);
                          setError(null);
                        }}
                        onMouseEnter={() => setHoveredRating(starValue)}
                        onMouseLeave={() => setHoveredRating(null)}
                        className="p-1 rounded-xl transition-transform transform hover:scale-120 active:scale-95 cursor-pointer focus:outline-none"
                        title={`${starValue} ดาว`}
                      >
                        <Star
                          className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors duration-150 ${
                            isFilled
                              ? 'text-amber-500 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300 fill-transparent hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label Badge */}
                <div className="inline-flex items-center justify-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${ratingInfo.color}`}>
                    {ratingInfo.text}
                  </span>
                </div>
              </div>

              {/* Quick Preset Tags for System Evaluation */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  เลือกข้อความแนะนำด่วนสำหรับระบบ (System Feedback Tags):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectQuickTag(tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer text-left ${
                        feedback.includes(tag)
                          ? 'bg-vet-navy-100 text-vet-navy-900 border-vet-navy-300 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-vet-navy-800" />
                    ข้อเสนอแนะและข้อคิดเห็นต่อระบบห้องปฏิบัติการ (System Insights):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">ไม่บังคับ</span>
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    evaluatorType === 'approver'
                      ? 'ระบุข้อคิดเห็นจากผู้อนุมัติ/เจ้าหน้าที่ เช่น ความสมบูรณ์ของข้อมูล การประสานงาน หรือข้อแนะนำในการจัดคิว...'
                      : 'ระบุข้อคิดเห็นจากผู้ขอใช้ เช่น ความสะดวกรวดเร็วของระบบจอง การแจ้งเตือน หรือสิ่งที่อยากให้ปรับปรุงในระบบ...'
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-vet-navy-500/20 focus:border-vet-navy-700 resize-none font-medium"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium border border-slate-300 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-vet-olive-700 hover:bg-vet-olive-800 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูลการประเมินระบบ</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
