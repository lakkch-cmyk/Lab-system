import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Tag, 
  FileText, 
  Award, 
  Info,
  CalendarDays,
  History,
  HelpCircle
} from 'lucide-react';
import { Equipment } from '../data/equipment';
import { LoanRequest, UserProfile } from '../types';
import { EquipmentImage } from './EquipmentImage';
import { EquipmentCalendarTimeline } from './EquipmentCalendarTimeline';

interface EquipmentDetailModalProps {
  item: Equipment | null;
  onClose: () => void;
  onBorrow: (item: Equipment) => void;
  loans: LoanRequest[];
  isBorrowed: boolean;
  currentUser?: UserProfile;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ 
  item, 
  onClose, 
  onBorrow, 
  loans,
  isBorrowed
}) => {
  if (!item) return null;

  // Filter loans for this specific item
  const itemLoans = loans.filter(l => l.equipmentId === item.id);
  const currentStatus = isBorrowed ? 'ยืมอยู่' : item.status;

  const getStatusBadgeLarge = (status: string) => {
    switch (status) {
      case 'ปกติ':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 mr-2 bg-emerald-500 rounded-full animate-pulse" />
            พร้อมใช้งานปกติ (Available)
          </span>
        );
      case 'ยืมอยู่':
      case 'ยืมใช้งาน':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200">
            <span className="w-2 h-2 mr-2 bg-vet-navy-700 rounded-full animate-pulse" />
            กำลังถูกใช้งานอยู่ (In Use)
          </span>
        );
      case 'จัดซื้อยังไม่สมบูรณ์':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 mr-2 bg-slate-400 rounded-full" />
            จัดซื้อยังไม่สมบูรณ์
          </span>
        );
      case 'ชำรุด':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 mr-2 bg-rose-500 rounded-full" />
            ชำรุด เสียหาย (Out of Order)
          </span>
        );
      case 'ส่งซ่อม':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 mr-2 bg-amber-500 rounded-full" />
            กำลังส่งซ่อมบำรุง (Under Repair)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getThaiCategory = (category: string) => {
    switch (category) {
      case 'Microscope': return 'กล้องจุลทรรศน์ (Microscope)';
      case 'Imaging / Metrology': return 'เครื่องภาพวินิจฉัยและการวัด (Imaging / Metrology)';
      case 'Sample preparation/Sample analysis': return 'เครื่องเตรียมตัวอย่างและวิเคราะห์ (Sample Prep / Analysis)';
      case 'Proteomics/Molecular Biology': return 'เครื่องมือชีววิทยาโมเลกุล (Proteomics / Molecular Biology)';
      case 'Chromatography': return 'เครื่องมือโครมาโทกราฟี (Chromatography)';
      case 'Spectroscopy': return 'เครื่องมือสเปกโทรสโกปี (Spectroscopy)';
      default: return 'เครื่องมือห้องปฏิบัติการทั่วไป';
    }
  };

  const formatLoanStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">รอนุมัติ</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">กำลังใช้งาน</span>;
      case 'returned':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">ส่งคืนแล้ว</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">ปฏิเสธ</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Wrapper */}
        <div className="flex min-h-screen items-center justify-center p-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-2xl text-left overflow-hidden my-6"
          >
            {/* Header banner */}
            <div className="bg-slate-50 px-6 py-5 sm:px-8 flex justify-between items-start border-b border-slate-200">
              <div className="space-y-1.5">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold bg-vet-navy-900 text-white px-2.5 py-1 rounded-lg shadow-2xs">
                    {item.id}
                  </span>
                  <span className="text-xs font-semibold bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200 px-2.5 py-1 rounded-lg">
                    {getThaiCategory(item.type)}
                  </span>
                  <div>
                    {getStatusBadgeLarge(currentStatus)}
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight pt-1">
                  {item.nameTh}
                </h3>
                <p className="text-slate-500 text-sm italic font-normal">
                  {item.nameEn || 'No English Name Available'}
                </p>
              </div>
              <button
                id="btn_close_detail_modal"
                onClick={onClose}
                className="p-2 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200 shrink-0 ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
              {/* Top Overview Section with Image & Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Image Panel */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="relative aspect-video lg:aspect-square w-full rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center group h-full min-h-[220px]">
                    <EquipmentImage
                      id={item.id}
                      name={item.nameTh}
                      type={item.type}
                      aspectRatio="square"
                      showBadge={false}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    {/* Top overlay logo/tag */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center text-xs font-mono font-bold bg-slate-900/85 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-lg shadow-xs">
                        {item.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Cards Grid */}
                <div className="lg:col-span-7 grid grid-cols-1 gap-3">
                  {/* 1. Category and Fiscal Year */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-vet-navy-100 text-vet-navy-800 border border-vet-navy-200 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500">หมวดหมู่และปีจัดซื้อ</span>
                      <p className="text-sm sm:text-base font-bold text-slate-900">
                        {getThaiCategory(item.type)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        จัดซื้อในปีงบประมาณ พ.ศ. {item.fiscalYear}
                      </p>
                    </div>
                  </div>

                  {/* 2. Custodian / Manager */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-vet-olive-100 text-vet-olive-800 border border-vet-olive-200 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500">ผู้ดูแลรับผิดชอบ</span>
                      <p className="text-sm sm:text-base font-bold text-slate-900">
                        {item.manager || 'ไม่มีข้อมูลผู้ดูแล'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        เบอร์โทรติดต่อ: {item.phone || 'ไม่ระบุ'}
                      </p>
                    </div>
                  </div>

                  {/* 3. Availability and Status */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-vet-navy-100 text-vet-navy-800 border border-vet-navy-200 flex items-center justify-center shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500">สถานะความพร้อมในระบบ</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {currentStatus === 'ปกติ' ? 'พร้อมให้บริการยื่นคำขอใช้งาน' : currentStatus}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        จำนวนทั้งหมด {item.quantity} เครื่องในระบบ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications & Purpose */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">
                    <FileText className="w-4 h-4 text-vet-navy-800 mr-2" />
                    รายละเอียดเครื่อง (พอสังเขป)
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200/90 min-h-[100px]">
                    {item.specs || 'ไม่มีข้อมูลรายละเอียดเพิ่มเติมสำหรับเครื่องมือนี้'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">
                    <Award className="w-4 h-4 text-vet-olive-700 mr-2" />
                    วัตถุประสงค์การใช้งาน
                  </h4>
                  <div className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/90 min-h-[100px] flex flex-col justify-between">
                    <p>{item.purpose || 'ใช้เพื่อสนับสนุนการเรียนการสอน การวิจัย และงานบริการโรงพยาบาลสัตว์ คณะสัตวแพทยศาสตร์'}</p>
                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center space-x-2 text-xs text-slate-500">
                      <span>รหัสเครื่องมือ:</span>
                      <span className="font-mono font-bold text-slate-800">{item.serialNo || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Custodian panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Location Map Pin Card */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">
                    <MapPin className="w-4 h-4 text-vet-navy-800 mr-2" />
                    สถานที่ตั้งเครื่องมือ
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 flex items-start space-x-3">
                    <div className="p-2.5 bg-vet-navy-100 text-vet-navy-800 rounded-xl shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น</p>
                      <p className="text-slate-700 text-sm mt-0.5 font-medium">{item.location || 'โรงพยาบาลสัตว์'}</p>
                      <p className="text-xs text-slate-500 mt-1">โปรดประสานงานและยื่นคำขอล่วงหน้าก่อนเข้าใช้งาน</p>
                    </div>
                  </div>
                </div>

                {/* Custodian Direct Card */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">
                    <User className="w-4 h-4 text-vet-olive-700 mr-2" />
                    ผู้ดูแลและผู้ประสานงาน
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2.5 text-sm">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-vet-navy-900 text-white flex items-center justify-center font-bold text-xs">
                        {item.manager ? item.manager.charAt(0) : 'V'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.manager || 'ฝ่ายบริการเครื่องมือกลาง'}</p>
                        <p className="text-xs text-slate-500">เจ้าหน้าที่ดูแลเครื่องมือประจำห้องแล็บ</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
                      {item.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-vet-navy-800 shrink-0" />
                          <span>โทรศัพท์: <strong>{item.phone}</strong></span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-vet-navy-800 shrink-0" />
                          <span>อีเมล: <strong>{item.email}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphical Timeline and Calendar View for this machine */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span className="flex items-center">
                    <CalendarDays className="w-4 h-4 text-vet-navy-800 mr-2" />
                    ผังตารางเวลา & ความพร้อมใช้งาน (Timeline View)
                  </span>
                  <span className="text-xs text-slate-500">
                    {itemLoans.filter(l => l.status === 'approved' || l.status === 'pending').length} รายการจอง
                  </span>
                </h4>

                <EquipmentCalendarTimeline
                  equipmentId={item.id}
                  equipmentName={item.nameTh}
                  loans={loans}
                />
              </div>

              {/* Recent Loan History Section */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span className="flex items-center">
                    <History className="w-4 h-4 text-vet-navy-800 mr-2" />
                    ประวัติรายการขอใช้งาน ({itemLoans.length})
                  </span>
                </h4>

                {itemLoans.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs bg-slate-50">
                    ยังไม่มีประวัติการขอใช้งานเครื่องมือนี้ในขณะนี้
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold">
                        <tr>
                          <th className="px-3.5 py-2.5">ผู้ขอใช้งาน</th>
                          <th className="px-3.5 py-2.5">หน่วยงาน</th>
                          <th className="px-3.5 py-2.5">วันที่เริ่มใช้งาน</th>
                          <th className="px-3.5 py-2.5">กำหนดส่งคืน</th>
                          <th className="px-3.5 py-2.5">ช่วงเวลา</th>
                          <th className="px-3.5 py-2.5">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {itemLoans.map((loan) => (
                          <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3.5 py-2.5 font-medium text-slate-900">{loan.borrowerName}</td>
                            <td className="px-3.5 py-2.5 text-slate-600">{loan.borrowerDept}</td>
                            <td className="px-3.5 py-2.5">{loan.borrowDate}</td>
                            <td className="px-3.5 py-2.5">{loan.returnDate}</td>
                            <td className="px-3.5 py-2.5 text-slate-600">{loan.timePeriod || 'เต็มวัน'}</td>
                            <td className="px-3.5 py-2.5">{formatLoanStatus(loan.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 sm:px-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center">
                <HelpCircle className="w-4 h-4 text-vet-navy-800 mr-1.5" />
                หากอุปกรณ์มีปัญหาในการใช้งาน โปรดติดต่อผู้ดูแลทันที
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  id="btn_detail_modal_cancel"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-200/80 rounded-xl font-medium text-xs sm:text-sm transition-colors border border-slate-300 bg-white cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                {currentStatus === 'ปกติ' && (
                  <button
                    id="btn_detail_modal_submit_borrow"
                    onClick={() => onBorrow(item)}
                    className="px-5 py-2 bg-vet-olive-700 hover:bg-vet-olive-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                  >
                    ขอใช้งานเครื่องมือนี้
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
