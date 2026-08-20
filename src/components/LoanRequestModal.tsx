import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Building, 
  Phone, 
  Mail, 
  CalendarDays, 
  Clock, 
  FileEdit, 
  AlertCircle,
  ClipboardCheck,
  ChevronRight,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Equipment } from '../data/equipment';
import { LoanRequest, UserProfile } from '../types';
import { EquipmentCalendarTimeline } from './EquipmentCalendarTimeline';

interface LoanRequestModalProps {
  item: Equipment | null;
  currentUser?: UserProfile;
  loans?: LoanRequest[];
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: (loanData: {
    equipmentId: string;
    equipmentName: string;
    borrowerName: string;
    borrowerDept: string;
    borrowerPhone: string;
    borrowerEmail: string;
    purpose: string;
    borrowDate: string;
    returnDate: string;
    timePeriod: string;
  }) => void;
}

export const LoanRequestModal: React.FC<LoanRequestModalProps> = ({ 
  item, 
  currentUser,
  loans = [],
  isOpen = true, 
  onClose, 
  onSubmit 
}) => {
  if (!item || isOpen === false) return null;

  // Today ISO helper
  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize form states with current user's profile defaults
  const [borrowerName, setBorrowerName] = useState(currentUser?.name || '');
  const [borrowerDept, setBorrowerDept] = useState(currentUser?.department || '');
  const [borrowerPhone, setBorrowerPhone] = useState(currentUser?.phone || '');
  const [borrowerEmail, setBorrowerEmail] = useState(currentUser?.email || '');
  const [purpose, setPurpose] = useState('');
  const [borrowDate, setBorrowDate] = useState(todayStr);
  const [returnDate, setReturnDate] = useState(todayStr);
  const [timePeriod, setTimePeriod] = useState<string>('เต็มวัน (08:30 - 16:30 น.)');
  const [customTimeStart, setCustomTimeStart] = useState('09:00');
  const [customTimeEnd, setCustomTimeEnd] = useState('12:00');
  const [agreed, setAgreed] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  // Form errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (currentUser) {
      setBorrowerName(currentUser.name || '');
      setBorrowerDept(currentUser.department || '');
      setBorrowerPhone(currentUser.phone || '');
      setBorrowerEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Handle timeline date range selection
  const handleSelectDateFromTimeline = (startDate: string, endDate: string) => {
    setBorrowDate(startDate);
    setReturnDate(endDate);
  };

  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};

    if (!borrowerName.trim()) tempErrors.name = 'โปรดระบุชื่อ-นามสกุลผู้ขอใช้งาน';
    if (!borrowerDept.trim()) tempErrors.dept = 'โปรดระบุคณะ / ภาควิชา / สังกัด';
    if (!borrowerPhone.trim()) tempErrors.phone = 'โปรดระบุเบอร์โทรศัพท์ติดต่อ';
    if (!borrowerEmail.trim()) {
      tempErrors.email = 'โปรดระบุอีเมลผู้ขอใช้งาน';
    } else if (!/\S+@\S+\.\S+/.test(borrowerEmail)) {
      tempErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (!purpose.trim()) tempErrors.purpose = 'โปรดระบุวัตถุประสงค์การใช้งานเครื่องมือ';
    if (!borrowDate) tempErrors.borrowDate = 'โปรดระบุวันที่เริ่มใช้งาน';
    if (!returnDate) tempErrors.returnDate = 'โปรดระบุวันที่สิ้นสุดการใช้งาน';

    if (borrowDate && returnDate && returnDate < borrowDate) {
      tempErrors.returnDate = 'วันที่สิ้นสุดต้องไม่เกิดขึ้นก่อนวันที่เริ่มใช้งาน';
    }

    if (!agreed) tempErrors.agree = 'โปรดยอมรับเงื่อนไขการใช้งานและการดูแลรักษา';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && item) {
      onSubmit({
        equipmentId: item.id,
        equipmentName: item.nameTh,
        borrowerName,
        borrowerDept,
        borrowerPhone,
        borrowerEmail,
        purpose,
        borrowDate,
        returnDate,
        timePeriod: timePeriod === 'custom' ? `ระบุเวลา (${customTimeStart} - ${customTimeEnd} น.)` : timePeriod
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-4xl border border-slate-200 flex flex-col my-6"
          >
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 sm:px-8 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-vet-navy-100 text-vet-navy-800 rounded-xl border border-vet-navy-200">
                  <ClipboardCheck className="w-5 h-5 text-vet-navy-800" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    แบบฟอร์มขอใช้งานเครื่องมือห้องปฏิบัติการ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ตรวจสอบตารางเวลาว่างและส่งคำขอใช้งานเครื่องมือ {item.id}
                  </p>
                </div>
              </div>
              <button
                id="btn_close_borrow_modal"
                onClick={onClose}
                className="p-2 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Short info of selected item */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="shrink-0 font-mono text-xs font-bold bg-vet-navy-900 text-white px-2.5 py-1 rounded-lg">
                      {item.id}
                    </div>
                    <div>
                      <p className="text-[10px] text-vet-navy-800 font-bold uppercase tracking-wider">เครื่องมือห้องปฏิบัติการที่เลือก</p>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{item.nameTh}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">ผู้รับผิดชอบ: {item.manager} • {item.location}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-vet-navy-900 transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-vet-navy-800" />
                    <span>{showTimeline ? 'ซ่อนผังตารางเวลา' : 'แสดงผังตารางเวลา'}</span>
                  </button>
                </div>

                {/* Embedded Graphical Calendar Timeline Module */}
                {showTimeline && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-vet-navy-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-vet-olive-700" />
                        <span>โมดูลปฏิทิน & ตารางความพร้อมใช้งาน (Timeline View)</span>
                      </h4>
                      <span className="text-xs text-slate-500">
                        คลิกวันที่บนตารางเพื่อเลือกวันยืม-คืนอัตโนมัติ
                      </span>
                    </div>

                    <EquipmentCalendarTimeline
                      equipmentId={item.id}
                      equipmentName={item.nameTh}
                      loans={loans}
                      selectedBorrowDate={borrowDate}
                      selectedReturnDate={returnDate}
                      onSelectDateRange={handleSelectDateFromTimeline}
                    />
                  </div>
                )}

                {/* Form Grid */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-200">
                    ข้อมูลผู้ขอใช้งานเครื่องมือ
                  </h4>

                  {/* 1. Borrower Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ชื่อ-นามสกุล ของผู้ขอใช้งาน <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <User className="h-4.5 w-4.5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        id="input_borrower_name"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        placeholder="เช่น น.สพ.สมชาย ใจดี"
                        className={`block w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 font-medium ${
                          errors.name 
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20' 
                            : 'border-slate-300 focus:border-vet-navy-700 focus:ring-1 focus:ring-vet-navy-700'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-xs text-rose-600 flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* 2. Department / Unit */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      กลุ่มวิชา / คณะ / ฝ่ายงานสังกัด <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Building className="h-4.5 w-4.5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        id="input_borrower_dept"
                        value={borrowerDept}
                        onChange={(e) => setBorrowerDept(e.target.value)}
                        placeholder="เช่น สาขาวิชาอายุรศาสตร์และศัลยศาสตร์ / โรงพยาบาลสัตว์"
                        className={`block w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 font-medium ${
                          errors.dept 
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20' 
                            : 'border-slate-300 focus:border-vet-navy-700 focus:ring-1 focus:ring-vet-navy-700'
                        }`}
                      />
                    </div>
                    {errors.dept && (
                      <p className="mt-1 text-xs text-rose-600 flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.dept}
                      </p>
                    )}
                  </div>

                  {/* Contact Group (Phone + Email) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <Phone className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                        <input
                          type="tel"
                          id="input_borrower_phone"
                          value={borrowerPhone}
                          onChange={(e) => setBorrowerPhone(e.target.value)}
                          placeholder="เช่น 0812345678"
                          className={`block w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 font-medium ${
                            errors.phone 
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20' 
                              : 'border-slate-300 focus:border-vet-navy-700 focus:ring-1 focus:ring-vet-navy-700'
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-xs text-rose-600 flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        อีเมลผู้ติดต่อ (KKU Mail) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <Mail className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                        <input
                          type="email"
                          id="input_borrower_email"
                          value={borrowerEmail}
                          onChange={(e) => setBorrowerEmail(e.target.value)}
                          placeholder="เช่น user@kku.ac.th"
                          className={`block w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 font-medium ${
                            errors.email 
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20' 
                              : 'border-slate-300 focus:border-vet-navy-700 focus:ring-1 focus:ring-vet-navy-700'
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-xs text-rose-600 flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-2 pb-1 border-b border-slate-200">
                    ข้อมูลระยะเวลาและช่วงเวลาที่ขอใช้งาน
                  </h4>

                  {/* Dates Group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        วันที่เริ่มใช้งาน <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <CalendarDays className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                        <input
                          type="date"
                          id="input_borrow_date"
                          value={borrowDate}
                          min={todayStr}
                          onChange={(e) => setBorrowDate(e.target.value)}
                          className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 py-2.5 pl-10 pr-4 text-sm focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all font-medium"
                        />
                      </div>
                      {errors.borrowDate && (
                        <p className="mt-1 text-xs text-rose-600 flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.borrowDate}
                        </p>
                      )}
                    </div>

                    {/* Return Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        วันที่สิ้นสุดการใช้งาน / กำหนดส่งคืน <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <CalendarDays className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                        <input
                          type="date"
                          id="input_return_date"
                          value={returnDate}
                          min={borrowDate || todayStr}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className={`block w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all bg-white text-slate-900 font-medium ${
                            errors.returnDate 
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20' 
                              : 'border-slate-300 focus:border-vet-navy-700 focus:ring-1 focus:ring-vet-navy-700'
                          }`}
                        />
                      </div>
                      {errors.returnDate && (
                        <p className="mt-1 text-xs text-rose-600 flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.returnDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Time Slots Selection */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      ช่วงเวลาที่ต้องการใช้งานเครื่องมือ <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'เต็มวัน (08:30 - 16:30 น.)', label: 'เต็มวัน', sub: '08:30 - 16:30' },
                        { id: 'ครึ่งวันเช้า (08:30 - 12:00 น.)', label: 'ครึ่งวันเช้า', sub: '08:30 - 12:00' },
                        { id: 'ครึ่งวันบ่าย (13:00 - 16:30 น.)', label: 'ครึ่งวันบ่าย', sub: '13:00 - 16:30' },
                        { id: 'custom', label: 'ระบุเวลาเอง', sub: 'กำหนดช่วงเวลา' }
                      ].map((slot) => {
                        const isSelected = timePeriod === slot.id || (slot.id === 'custom' && timePeriod === 'custom');
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setTimePeriod(slot.id)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-16 cursor-pointer ${
                              isSelected
                                ? 'bg-vet-navy-50 border-vet-navy-700 text-vet-navy-900 shadow-2xs font-semibold'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                            }`}
                          >
                            <span className="text-xs font-bold leading-none">{slot.label}</span>
                            <span className="text-[10px] font-mono opacity-80 mt-1">{slot.sub}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Time Picker */}
                    {timePeriod === 'custom' && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            เวลาเริ่มต้น <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Clock className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              type="time"
                              value={customTimeStart}
                              onChange={(e) => setCustomTimeStart(e.target.value)}
                              className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 py-2 pl-9 pr-3 text-xs focus:border-vet-navy-700 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            เวลาสิ้นสุด <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Clock className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              type="time"
                              value={customTimeEnd}
                              onChange={(e) => setCustomTimeEnd(e.target.value)}
                              className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 py-2 pl-9 pr-3 text-xs focus:border-vet-navy-700 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Purpose */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ระบุวัตถุประสงค์โดยสังเขป <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute top-3 left-3.5">
                        <FileEdit className="h-4.5 w-4.5 text-slate-400" />
                      </div>
                      <textarea
                        id="input_borrow_purpose"
                        rows={3}
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="กรอกวัตถุประสงค์ เช่น ใช้ทำปฏิบัติการรายวิชา หรือ ดำเนินโครงการวิจัยร่วม..."
                        className={`block w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 font-medium ${
                          errors.purpose 
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20' 
                            : 'border-slate-300 focus:border-vet-navy-700 focus:ring-1 focus:ring-vet-navy-700'
                        }`}
                      />
                    </div>
                    {errors.purpose && (
                      <p className="mt-1 text-xs text-rose-600 flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.purpose}
                      </p>
                    )}
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-2">
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="agree_terms"
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-vet-navy-900 focus:ring-vet-navy-700 cursor-pointer accent-vet-navy-900"
                        />
                      </div>
                      <div className="ml-3 text-xs">
                        <label htmlFor="agree_terms" className="font-medium text-slate-600 cursor-pointer select-none leading-normal">
                          ข้าพเจ้าขอรับรองว่าจะดูแลรักษาเครื่องมือห้องปฏิบัติการดังกล่าวเป็นอย่างดี และจะส่งคืนตามกำหนดเวลา หากเกิดความชำรุดเสียหาย ยินดีรับผิดชอบตามระเบียบของทางราชการ
                        </label>
                      </div>
                    </div>
                    {errors.agree && (
                      <p className="mt-1 text-xs text-rose-600 flex items-center pl-7">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.agree}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 sm:px-8 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  id="btn_borrow_form_cancel"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-200/80 rounded-xl font-medium text-xs sm:text-sm transition-colors border border-slate-300 bg-white cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  id="btn_borrow_form_submit"
                  className="px-5 py-2 bg-vet-olive-700 hover:bg-vet-olive-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center cursor-pointer"
                >
                  ส่งคำขอใช้งานเครื่องมือ
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
