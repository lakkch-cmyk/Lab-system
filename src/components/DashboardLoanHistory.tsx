import React, { useState, useMemo } from 'react';
import { 
  History, 
  User, 
  Calendar, 
  Activity, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Clock, 
  ArrowRight,
  Layers,
  Download
} from 'lucide-react';
import { Equipment } from '../data/equipment';
import { LoanRequest } from '../types';

interface DashboardLoanHistoryProps {
  equipment: Equipment[];
  loans: LoanRequest[];
}

export const DashboardLoanHistory: React.FC<DashboardLoanHistoryProps> = ({
  equipment,
  loans
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const equipmentOptions = useMemo(() => {
    return equipment.map(item => ({
      id: item.id,
      nameTh: item.nameTh,
      nameEn: item.nameEn,
      code: item.id
    }));
  }, [equipment]);

  const filteredHistory = useMemo(() => {
    let result = loans;

    if (selectedEquipmentId !== 'all') {
      result = result.filter(loan => loan.equipmentId === selectedEquipmentId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(loan => 
        loan.borrowerName.toLowerCase().includes(q) ||
        loan.borrowerDept.toLowerCase().includes(q) ||
        loan.equipmentName.toLowerCase().includes(q) ||
        loan.equipmentCode.toLowerCase().includes(q) ||
        (loan.conditionAfterReturn && loan.conditionAfterReturn.toLowerCase().includes(q))
      );
    }

    return result;
  }, [loans, selectedEquipmentId, searchQuery]);

  const selectedEquipmentInfo = useMemo(() => {
    if (selectedEquipmentId === 'all') return null;
    return equipment.find(item => item.id === selectedEquipmentId) || null;
  }, [equipment, selectedEquipmentId]);

  const statsForSelected = useMemo(() => {
    const targetLoans = filteredHistory;
    const totalLoansCount = targetLoans.filter(l => l.status === 'approved' || l.status === 'returned').length;
    const pendingLoansCount = targetLoans.filter(l => l.status === 'pending').length;
    
    const returnedLoans = targetLoans.filter(l => l.status === 'returned' && l.returnedAt);
    let totalDays = 0;
    returnedLoans.forEach(l => {
      const start = new Date(l.borrowDate);
      const end = l.returnedAt ? new Date(l.returnedAt) : new Date(l.returnDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDays += diffDays;
    });
    const avgDays = returnedLoans.length > 0 ? (totalDays / returnedLoans.length).toFixed(1) : '0';

    const conditions = {
      normal: returnedLoans.filter(l => l.conditionAfterReturn === 'ปกติพร้อมใช้งาน').length,
      repair: returnedLoans.filter(l => l.conditionAfterReturn === 'ส่งซ่อมบำรุง').length,
      damaged: returnedLoans.filter(l => l.conditionAfterReturn === 'ชำรุดเสียหาย').length,
    };

    return {
      total: totalLoansCount,
      pending: pendingLoansCount,
      avgDays,
      conditions
    };
  }, [filteredHistory]);

  const formatDateTh = (dateStr: string) => {
    if (!dateStr) return '';
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

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;

    const getStatusThai = (status: string) => {
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

    const headers = [
      'ลำดับ',
      'รหัสคำขอ',
      'สถานะ',
      'รหัสเครื่องมือ',
      'ชื่อเครื่องมือห้องปฏิบัติการ',
      'ชื่อ-นามสกุล ผู้ขอใช้',
      'หน่วยงาน/ภาควิชา',
      'เบอร์โทรศัพท์',
      'อีเมล',
      'วันที่เริ่มขอใช้',
      'วันที่กำหนดส่งคืน',
      'ช่วงเวลา',
      'วัตถุประสงค์',
      'สภาพเครื่องมือเมื่อรับคืน'
    ];

    const rows = filteredHistory.map((item, idx) => [
      escapeCSV(idx + 1),
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
      escapeCSV(item.conditionAfterReturn || '-')
    ]);

    const csvContent = '\uFEFF' + [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `ประวัติการใช้งานเครื่องมือ_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 mt-12" id="dashboard_usage_history">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-vet-navy-100 rounded-xl text-vet-navy-800 border border-vet-navy-200 shrink-0">
            <History className="w-6 h-6 text-vet-navy-800" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              สมุดบันทึกประวัติขอใช้งานเครื่องมือและสถานะรายบุคคล
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
              สืบค้นข้อมูลประวัติการขอใช้สิทธิ์ วันที่ขอใช้งานเครื่องมือ พร้อมบันทึกการรายงานประเมินสภาพเครื่องมือหลังเสร็จสิ้นภารกิจ
            </p>
          </div>
        </div>
        
        {/* Quick selector badge */}
        <div className="flex flex-wrap gap-1.5 self-start md:self-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider self-center mr-1">
            ประเภทด่วน:
          </span>
          <button 
            onClick={() => { setSelectedEquipmentId('all'); setSearchQuery(''); }}
            className={`px-3 py-1 text-xs rounded-full font-semibold transition-all cursor-pointer ${
              selectedEquipmentId === 'all' && !searchQuery
                ? 'bg-vet-navy-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            แสดงทั้งหมด ({loans.length})
          </button>
          <button 
            onClick={() => { setSelectedEquipmentId('all'); setSearchQuery('ชำรุดเสียหาย'); }}
            className={`px-3 py-1 text-xs rounded-full font-semibold transition-all cursor-pointer ${
              searchQuery === 'ชำรุดเสียหาย'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            ที่มีรายงานชำรุด ({loans.filter(l => l.conditionAfterReturn === 'ชำรุดเสียหาย').length})
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            title="ดาวน์โหลดประวัติเป็นไฟล์ CSV"
            className="px-3.5 py-1 text-xs rounded-full font-bold bg-vet-olive-700 hover:bg-vet-olive-800 active:scale-95 text-white transition-all cursor-pointer shadow-xs flex items-center space-x-1 ml-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV ({filteredHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Dropdown Select Equipment */}
        <div className="md:col-span-6 lg:col-span-5">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            เลือกเครื่องมือห้องปฏิบัติการเพื่อดูประวัติเฉพาะเจาะจง:
          </label>
          <div className="relative">
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all appearance-none cursor-pointer"
            >
              <option value="all">📁 เครื่องมือทั้งหมดในระบบ (All Equipment History)</option>
              {equipmentOptions.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.id}] {item.nameTh}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="md:col-span-6 lg:col-span-7">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            ค้นหาประวัติ (ชื่อผู้ขอ, สังกัด, รหัสเครื่องมือ, หรือสถานะ):
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="เช่น น.สพ.สมชาย, ชำรุดเสียหาย, ภาควิชาศัลยศาสตร์..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Selected Equipment Banner / Summary Bar */}
      {selectedEquipmentInfo && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold bg-vet-navy-900 text-white px-2.5 py-1 rounded-lg">
              {selectedEquipmentInfo.id}
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                {selectedEquipmentInfo.nameTh}
              </h4>
              <p className="text-xs text-slate-500">
                สถานที่: {selectedEquipmentInfo.location} • ผู้ดูแล: {selectedEquipmentInfo.manager}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">สถานะปัจจุบัน:</span>
            <span className="font-bold text-vet-navy-900 bg-vet-navy-50 border border-vet-navy-200 px-2.5 py-1 rounded-lg">
              {selectedEquipmentInfo.status}
            </span>
          </div>
        </div>
      )}

      {/* Quick Numerical Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">จำนวนครั้งที่ขอใช้</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{statsForSelected.total} <span className="text-xs font-normal text-slate-500">ครั้ง</span></p>
        </div>
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ระยะเวลาเฉลี่ย</p>
          <p className="text-xl font-bold text-vet-navy-900 mt-0.5">{statsForSelected.avgDays} <span className="text-xs font-normal text-slate-500">วัน/ครั้ง</span></p>
        </div>
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[11px] font-semibold text-vet-olive-800 uppercase tracking-wider">คืนสภาพปกติ</p>
          <p className="text-xl font-bold text-vet-olive-700 mt-0.5">{statsForSelected.conditions.normal} <span className="text-xs font-normal text-slate-500">รายการ</span></p>
        </div>
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">มีรายงานชำรุด</p>
          <p className="text-xl font-bold text-rose-700 mt-0.5">{statsForSelected.conditions.damaged + statsForSelected.conditions.repair} <span className="text-xs font-normal text-slate-500">รายการ</span></p>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 text-xs">
            <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-700">ไม่พบประวัติการขอใช้งานตามเงื่อนไขที่ระบุ</p>
            <p className="text-slate-400 mt-1">ลองเปลี่ยนการเลือกเครื่องมือ หรือล้างคำค้นหา</p>
          </div>
        ) : (
              filteredHistory.map(item => {
                const getRowColorStyles = (status: string) => {
                  switch (status) {
                    case 'pending':
                      return 'border-l-4 border-l-amber-500 bg-amber-50/30 hover:bg-amber-50/60 border-amber-200/80';
                    case 'approved':
                      return 'border-l-4 border-l-vet-navy-800 bg-vet-navy-50/25 hover:bg-vet-navy-50/50 border-vet-navy-200/80';
                    case 'returned':
                      return 'border-l-4 border-l-vet-olive-600 bg-vet-olive-50/20 hover:bg-vet-olive-50/40 border-vet-olive-200/80';
                    case 'rejected':
                      return 'border-l-4 border-l-rose-500 bg-rose-50/25 hover:bg-rose-50/50 border-rose-200/80';
                    default:
                      return 'border-slate-200 bg-white hover:bg-slate-50';
                  }
                };

                return (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs ${getRowColorStyles(item.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white text-vet-navy-900 border border-slate-200 flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-2xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{item.borrowerName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">({item.borrowerDept})</span>
                          <span className="font-mono text-[10px] bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-bold shadow-2xs">
                            {item.equipmentCode}
                          </span>
                        </div>
                        <p className="text-slate-800 mt-1 font-semibold">{item.equipmentName}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">วัตถุประสงค์: {item.purpose}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="flex items-center sm:justify-end gap-1.5 text-slate-700 font-mono text-[11px] font-medium">
                          <Calendar className="w-3.5 h-3.5 text-vet-navy-800" />
                          <span>{formatDateTh(item.borrowDate)} &rarr; {formatDateTh(item.returnDate)}</span>
                        </div>
                        {item.timePeriod && (
                          <p className="text-[10px] text-vet-navy-800 font-medium mt-0.5">{item.timePeriod}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border shadow-2xs ${
                          item.status === 'returned'
                            ? 'bg-vet-olive-100 text-vet-olive-950 border-vet-olive-300'
                            : item.status === 'approved'
                            ? 'bg-vet-navy-100 text-vet-navy-950 border-vet-navy-300'
                            : item.status === 'pending'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {item.status === 'returned' ? 'ส่งคืนแล้ว' : item.status === 'approved' ? 'กำลังใช้งาน' : item.status === 'pending' ? 'รออนุมัติ' : 'ปฏิเสธ'}
                        </span>

                        {item.conditionAfterReturn && (
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                            item.conditionAfterReturn === 'ปกติพร้อมใช้งาน'
                              ? 'bg-vet-olive-50 text-vet-olive-800 border border-vet-olive-200'
                              : item.conditionAfterReturn === 'ส่งซ่อมบำรุง'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            สภาพ: {item.conditionAfterReturn}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
        )}
      </div>
    </div>
  );
};
