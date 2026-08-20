import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Building, 
  PlusCircle,
  Clock,
  Layers
} from 'lucide-react';
import { Equipment } from '../data/equipment';
import { LoanRequest, UserProfile, UserRole } from '../types';

interface MasterScheduleTabProps {
  equipment: Equipment[];
  loans: LoanRequest[];
  currentUser: UserProfile;
  userRole: UserRole;
  onSelectEquipmentForLoan: (item: Equipment) => void;
  onViewEquipmentDetail: (item: Equipment) => void;
}

export const MasterScheduleTab: React.FC<MasterScheduleTabProps> = ({
  equipment,
  loans,
  currentUser,
  userRole,
  onSelectEquipmentForLoan,
  onViewEquipmentDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'booked_only' | 'available_only'>('all');
  const [timelineSpan, setTimelineSpan] = useState<7 | 14>(14);
  const [currentAnchorDate, setCurrentAnchorDate] = useState<Date>(new Date());

  const formatDateISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateISO(new Date());

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(equipment.map(item => item.type))).filter(Boolean)];
  }, [equipment]);

  const timelineDays = useMemo(() => {
    const days: { date: Date; dateStr: string; isToday: boolean; isWeekend: boolean }[] = [];
    const start = new Date(currentAnchorDate);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < timelineSpan; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = formatDateISO(d);
      const dayOfWeek = d.getDay();
      days.push({
        date: d,
        dateStr,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    return days;
  }, [currentAnchorDate, timelineSpan, todayStr]);

  const activeLoans = useMemo(() => {
    return loans.filter(l => l.status === 'approved' || l.status === 'pending');
  }, [loans]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchTh = item.nameTh.toLowerCase().includes(s);
        const matchId = item.id.toLowerCase().includes(s);
        const matchLoc = item.location?.toLowerCase().includes(s);
        if (!matchTh && !matchId && !matchLoc) return false;
      }

      if (selectedCategory !== 'all' && item.type !== selectedCategory) return false;

      const hasBooking = activeLoans.some(l => l.equipmentId === item.id);
      if (selectedStatusFilter === 'booked_only' && !hasBooking) return false;
      if (selectedStatusFilter === 'available_only' && hasBooking) return false;

      return true;
    });
  }, [equipment, searchTerm, selectedCategory, selectedStatusFilter, activeLoans]);

  const handlePrev = () => {
    const next = new Date(currentAnchorDate);
    next.setDate(next.getDate() - timelineSpan);
    setCurrentAnchorDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentAnchorDate);
    next.setDate(next.getDate() + timelineSpan);
    setCurrentAnchorDate(next);
  };

  const handleToday = () => {
    setCurrentAnchorDate(new Date());
  };

  const thaiDaysShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  const formatThaiMonthYear = (d: Date) => {
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${monthNames[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-vet-navy-50 border border-vet-navy-200 text-vet-navy-900 text-xs font-bold mb-3">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>ภาพรวมผังตารางการใช้งานรวม (Master Timeline Matrix)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              ผังปฏิทินและตารางเวลาจองเครื่องมือห้องปฏิบัติการ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              แสดงภาพรวมตารางการจองและช่วงเวลาว่างของเครื่องมือทั้งหมดแบบ Timeline View รายวัน ช่วยให้วางแผนงานวิจัยและการเรียนการสอนได้อย่างแม่นยำ
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">เครื่องมือทั้งหมด</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{equipment.length}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-center">
              <p className="text-[10px] uppercase tracking-wider text-vet-navy-900 font-bold">รายการจองที่แอคทีฟ</p>
              <p className="text-xl font-bold text-vet-navy-900 mt-0.5">{activeLoans.length}</p>
            </div>
          </div>
        </div>

        {/* Filter and Date Navigation Toolbar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left search & filter controls */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัสเครื่องมือ..."
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-vet-navy-700 focus:bg-white transition-all font-medium"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-vet-navy-700 cursor-pointer font-medium"
            >
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedStatusFilter === 'all'
                    ? 'bg-white text-vet-navy-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('booked_only')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedStatusFilter === 'booked_only'
                    ? 'bg-white text-vet-navy-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                มีการจอง
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('available_only')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedStatusFilter === 'available_only'
                    ? 'bg-white text-vet-navy-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ว่างทั้งหมด
              </button>
            </div>
          </div>

          {/* Right Date Controls */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              {[7, 14].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTimelineSpan(s as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    timelineSpan === s
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s} วัน
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="ก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-bold text-vet-navy-900 hover:bg-white rounded-md transition-colors cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="ถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-1.5 text-vet-olive-800">
              <span className="w-2.5 h-2.5 rounded-full bg-vet-olive-600" />
              <span className="font-medium text-[11px]">ว่างพร้อมจอง</span>
            </div>
            <div className="flex items-center space-x-1.5 text-vet-navy-900">
              <span className="w-2.5 h-2.5 rounded-full bg-vet-navy-900" />
              <span className="font-medium text-[11px]">อนุมัติใช้งานอยู่</span>
            </div>
            <div className="flex items-center space-x-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-medium text-[11px]">รอดำเนินการ</span>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            ช่วงเวลาที่แสดง: {formatThaiMonthYear(currentAnchorDate)}
          </span>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
                <th className="p-4 font-bold sticky left-0 bg-slate-50 z-20 w-72 shadow-xs">
                  รายการเครื่องมือห้องปฏิบัติการ
                </th>
                {timelineDays.map(({ date, dateStr, isToday, isWeekend }) => (
                  <th
                    key={dateStr}
                    className={`p-2 text-center border-l border-slate-100 min-w-[50px] ${
                      isToday ? 'bg-vet-navy-50/70 text-vet-navy-950 font-bold' : isWeekend ? 'bg-slate-100/50 text-slate-500' : ''
                    }`}
                  >
                    <div className="text-[10px] font-semibold">{thaiDaysShort[date.getDay()]}</div>
                    <div className={`text-sm font-bold ${isToday ? 'text-vet-navy-900' : 'text-slate-800'}`}>
                      {date.getDate()}
                    </div>
                  </th>
                ))}
                <th className="p-3 text-center text-xs font-bold text-slate-600 w-24">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={timelineDays.length + 2} className="p-8 text-center text-slate-400">
                    ไม่พบเครื่องมือที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((item) => {
                  const itemLoans = activeLoans.filter(l => l.equipmentId === item.id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Equipment Info Sticky Column */}
                      <td className="p-3.5 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-[10px] font-bold bg-vet-navy-50 text-vet-navy-900 px-1.5 py-0.5 rounded border border-vet-navy-200 shrink-0">
                            {item.id}
                          </span>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onViewEquipmentDetail(item)}
                              className="font-bold text-slate-900 hover:text-vet-navy-800 text-xs truncate block text-left transition-colors cursor-pointer"
                            >
                              {item.nameTh}
                            </button>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.location}</p>
                          </div>
                        </div>
                      </td>

                      {/* Day Cells */}
                      {timelineDays.map(({ dateStr, isToday, isWeekend }) => {
                        const dayLoan = itemLoans.find(l => dateStr >= l.borrowDate && dateStr <= l.returnDate);

                        return (
                          <td
                            key={dateStr}
                            className={`p-1 text-center border-l border-slate-100 relative ${
                              isToday ? 'bg-vet-navy-50/30' : isWeekend ? 'bg-slate-50/40' : ''
                            }`}
                          >
                            {dayLoan ? (
                              <div
                                title={`${dayLoan.borrowerName} (${dayLoan.borrowerDept}) - ${dayLoan.timePeriod || 'เต็มวัน'}`}
                                className={`h-8 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all shadow-2xs ${
                                  dayLoan.status === 'approved'
                                    ? 'bg-vet-navy-100 text-vet-navy-900 border border-vet-navy-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                <span className="truncate px-1">{dayLoan.borrowerName.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <div className="h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-vet-olive-800 bg-vet-olive-50/60 border border-vet-olive-200 hover:bg-vet-olive-100 transition-colors">
                                <span>ว่าง</span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Action Cell */}
                      <td className="p-3 text-center border-l border-slate-100">
                        <button
                          type="button"
                          onClick={() => onSelectEquipmentForLoan(item)}
                          className="px-2.5 py-1 bg-vet-olive-700 hover:bg-vet-olive-800 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                        >
                          ขอใช้งาน
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
