import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  AlertCircle, 
  CalendarDays
} from 'lucide-react';
import { LoanRequest } from '../types';

interface EquipmentCalendarTimelineProps {
  equipmentId: string;
  equipmentName?: string;
  loans: LoanRequest[];
  selectedBorrowDate?: string;
  selectedReturnDate?: string;
  onSelectDateRange?: (startDate: string, endDate: string) => void;
  compact?: boolean;
}

export const EquipmentCalendarTimeline: React.FC<EquipmentCalendarTimelineProps> = ({
  equipmentId,
  equipmentName,
  loans,
  selectedBorrowDate,
  selectedReturnDate,
  onSelectDateRange
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'month'>('timeline');
  const [timelineSpan, setTimelineSpan] = useState<7 | 14 | 30>(14);
  
  // Date anchor
  const [currentAnchorDate, setCurrentAnchorDate] = useState<Date>(() => {
    if (selectedBorrowDate) {
      const parsed = new Date(selectedBorrowDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  // Filter loans for this specific machine
  const machineLoans = useMemo(() => {
    return loans.filter(l => 
      l.equipmentId === equipmentId && 
      (l.status === 'approved' || l.status === 'pending')
    );
  }, [loans, equipmentId]);

  // Helper to format date in YYYY-MM-DD
  const formatDateISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateISO(new Date());

  // Check if a date string falls inside a loan period
  const getLoanForDate = (dateStr: string) => {
    return machineLoans.find(loan => {
      return dateStr >= loan.borrowDate && dateStr <= loan.returnDate;
    });
  };

  // Generate days array for Timeline View
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

  // Month View Days Generation
  const monthCalendarGrid = useMemo(() => {
    const year = currentAnchorDate.getFullYear();
    const month = currentAnchorDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean; isWeekend: boolean }[] = [];

    for (let i = startDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      const dateStr = formatDateISO(prevDate);
      days.push({
        date: prevDate,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: prevDate.getDay() === 0 || prevDate.getDay() === 6
      });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const currDate = new Date(year, month, d);
      const dateStr = formatDateISO(currDate);
      days.push({
        date: currDate,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: currDate.getDay() === 0 || currDate.getDay() === 6
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = formatDateISO(nextDate);
      days.push({
        date: nextDate,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6
      });
    }

    return days;
  }, [currentAnchorDate, todayStr]);

  const handlePrev = () => {
    const next = new Date(currentAnchorDate);
    if (viewMode === 'timeline') {
      next.setDate(next.getDate() - timelineSpan);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentAnchorDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentAnchorDate);
    if (viewMode === 'timeline') {
      next.setDate(next.getDate() + timelineSpan);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentAnchorDate(next);
  };

  const handleToday = () => {
    setCurrentAnchorDate(new Date());
  };

  const handleDayClick = (dateStr: string) => {
    if (!onSelectDateRange) return;

    const occupied = getLoanForDate(dateStr);
    if (occupied) return;

    if (!selectedBorrowDate || (selectedBorrowDate && selectedReturnDate && selectedBorrowDate !== selectedReturnDate)) {
      onSelectDateRange(dateStr, dateStr);
    } else if (selectedBorrowDate && (!selectedReturnDate || selectedBorrowDate === selectedReturnDate)) {
      if (dateStr >= selectedBorrowDate) {
        onSelectDateRange(selectedBorrowDate, dateStr);
      } else {
        onSelectDateRange(dateStr, dateStr);
      }
    }
  };

  const thaiDaysShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  const formatThaiMonthYear = (d: Date) => {
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${monthNames[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  const conflictInfo = useMemo(() => {
    if (!selectedBorrowDate || !selectedReturnDate) return null;
    const overlapping = machineLoans.filter(l => {
      return !(selectedReturnDate < l.borrowDate || selectedBorrowDate > l.returnDate);
    });
    return overlapping.length > 0 ? overlapping : null;
  }, [selectedBorrowDate, selectedReturnDate, machineLoans]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden text-slate-800 font-sans">
      {/* Calendar Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-vet-navy-100 text-vet-navy-800 rounded-xl border border-vet-navy-200">
            <CalendarDays className="w-5 h-5 text-vet-navy-800" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                ตารางเวลาความพร้อมใช้งาน {equipmentName ? `(${equipmentName})` : ''}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200">
                เรียลไทม์
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatThaiMonthYear(currentAnchorDate)} • ตรวจสอบสถานะการจองก่อนเลือกวันใช้งาน
            </p>
          </div>
        </div>

        {/* Action Controls (View Mode & Navigation) */}
        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-vet-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ไทม์ไลน์
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-vet-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายเดือน
            </button>
          </div>

          {/* Span toggle if in Timeline */}
          {viewMode === 'timeline' && (
            <div className="hidden sm:flex bg-slate-200/80 p-1 rounded-xl text-[11px] font-semibold">
              {[7, 14, 30].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTimelineSpan(s as any)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    timelineSpan === s 
                      ? 'bg-white text-slate-900 font-bold shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s} วัน
                </button>
              ))}
            </div>
          )}

          {/* Date Navigation */}
          <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl">
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
              className="px-2 py-0.5 text-[11px] font-bold text-vet-navy-900 hover:bg-white rounded-md transition-colors cursor-pointer"
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

      {/* Legend & Guidance */}
      <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center space-x-1.5 text-vet-olive-800">
            <span className="w-2.5 h-2.5 rounded-full bg-vet-olive-600" />
            <span className="font-semibold text-[11px]">ว่างพร้อมจอง</span>
          </div>
          <div className="flex items-center space-x-1.5 text-vet-navy-900">
            <span className="w-2.5 h-2.5 rounded-full bg-vet-navy-900" />
            <span className="font-semibold text-[11px]">อนุมัติใช้งานอยู่</span>
          </div>
          <div className="flex items-center space-x-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="font-semibold text-[11px]">รอดำเนินการ</span>
          </div>
          <div className="flex items-center space-x-1.5 text-vet-navy-900">
            <span className="w-2.5 h-2.5 rounded-md border border-vet-navy-600 bg-vet-navy-100" />
            <span className="font-semibold text-[11px]">ช่วงวันที่เลือก</span>
          </div>
        </div>

        {onSelectDateRange && (
          <span className="text-[11px] text-slate-500 hidden md:inline">
            คลิกที่ช่องวันที่เพื่อกำหนดวันเริ่มและวันสิ้นสุดการใช้งาน
          </span>
        )}
      </div>

      {/* Conflict Alert Banner */}
      {conflictInfo && (
        <div className="m-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-800">
              ช่วงเวลาที่คุณเลือก ({selectedBorrowDate} ถึง {selectedReturnDate}) มีการจองทับซ้อนกับคำขออื่น:
            </p>
            <ul className="mt-1 space-y-0.5 list-disc list-inside text-rose-700 text-[11px]">
              {conflictInfo.map(c => (
                <li key={c.id}>
                  <strong>{c.borrowerName}</strong> ({c.borrowDate} - {c.returnDate}) • สถานะ: {c.status === 'approved' ? 'อนุมัติแล้ว' : 'รอดำเนินการ'}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-rose-600 mt-1">
              * โปรดหลีกเลี่ยงหรือเลือกช่วงวันอื่นเพื่อให้คำขอได้รับการอนุมัติอย่างรวดเร็ว
            </p>
          </div>
        </div>
      )}

      {/* VIEW 1: TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="p-4 sm:p-5 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Days Column Header */}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}>
              {timelineDays.map(({ date, dateStr, isToday, isWeekend }) => {
                const dayNum = date.getDate();
                const dayName = thaiDaysShort[date.getDay()];
                const isSelectedStart = dateStr === selectedBorrowDate;
                const isSelectedEnd = dateStr === selectedReturnDate;
                const isWithinSelectedRange = selectedBorrowDate && selectedReturnDate && dateStr >= selectedBorrowDate && dateStr <= selectedReturnDate;
                const loan = getLoanForDate(dateStr);

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer select-none group relative ${
                      isWithinSelectedRange
                        ? 'bg-vet-navy-50 border-vet-navy-600 text-vet-navy-950 ring-1 ring-vet-navy-600'
                        : isToday
                        ? 'bg-vet-navy-50/60 border-vet-navy-400 text-vet-navy-950'
                        : isWeekend
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Day Name */}
                    <span className={`text-[10px] font-semibold ${
                      isToday ? 'text-vet-navy-900 font-bold' : 'text-slate-500'
                    }`}>
                      {dayName}
                    </span>

                    {/* Day Number */}
                    <span className={`text-base sm:text-lg font-black my-0.5 ${
                      isToday 
                        ? 'text-vet-navy-900' 
                        : isWithinSelectedRange 
                        ? 'text-vet-navy-950' 
                        : 'text-slate-900'
                    }`}>
                      {dayNum}
                    </span>

                    {/* Month abbreviation if day is 1 */}
                    {dayNum === 1 && (
                      <span className="text-[9px] font-bold text-vet-navy-900">
                        {date.toLocaleDateString('th-TH', { month: 'short' })}
                      </span>
                    )}

                    {/* Timeline Slot Status Block */}
                    <div className="w-full mt-1 pt-1 border-t border-slate-100 flex flex-col items-center gap-1">
                      {loan ? (
                        <div
                          className={`w-full py-1 px-1 rounded text-[9px] font-bold truncate transition-all ${
                            loan.status === 'approved'
                              ? 'bg-vet-navy-100 text-vet-navy-900 border border-vet-navy-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                          title={`${loan.borrowerName} (${loan.borrowerDept}) - ${loan.timePeriod || 'เต็มวัน'}`}
                        >
                          <div className="flex items-center justify-center space-x-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${loan.status === 'approved' ? 'bg-vet-navy-900' : 'bg-amber-600 animate-pulse'}`} />
                            <span className="truncate">{loan.status === 'approved' ? 'จองแล้ว' : 'รอนุมัติ'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full py-1 px-1 rounded text-[9px] font-bold text-vet-olive-800 bg-vet-olive-50 border border-vet-olive-200 group-hover:bg-vet-olive-100 transition-colors">
                          <span>ว่าง</span>
                        </div>
                      )}
                    </div>

                    {/* Today Pill */}
                    {isToday && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-vet-navy-900 text-white text-[8px] font-bold px-1.5 rounded-full shadow-2xs">
                        วันนี้
                      </span>
                    )}

                    {/* Start/End marker */}
                    {isSelectedStart && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-vet-olive-700 text-white text-[8px] font-bold px-1.5 rounded-full shadow-2xs whitespace-nowrap">
                        วันเริ่ม
                      </div>
                    )}
                    {isSelectedEnd && isSelectedEnd !== isSelectedStart && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-vet-olive-700 text-white text-[8px] font-bold px-1.5 rounded-full shadow-2xs whitespace-nowrap">
                        วันคืน
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Visual Timeline Reservation Bars below header */}
            {machineLoans.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>รายการจองที่ตรงกับช่วงนี้ ({machineLoans.length} รายการ)</span>
                </div>
                <div className="space-y-1.5">
                  {machineLoans.map(loan => (
                    <div 
                      key={loan.id}
                      className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        loan.status === 'approved'
                          ? 'bg-vet-navy-50/60 border-vet-navy-200 text-vet-navy-950'
                          : 'bg-amber-50/60 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${loan.status === 'approved' ? 'bg-vet-navy-100 text-vet-navy-800' : 'bg-amber-100 text-amber-700'}`}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none">{loan.borrowerName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{loan.borrowerDept}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px]">
                        <div className="flex items-center space-x-1 font-mono text-slate-600">
                          <Clock className="w-3 h-3 text-vet-navy-800" />
                          <span>{loan.borrowDate} &rarr; {loan.returnDate}</span>
                          <span className="text-[10px] text-slate-500">({loan.timePeriod || 'เต็มวัน'})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          loan.status === 'approved'
                            ? 'bg-vet-navy-100 text-vet-navy-900 border border-vet-navy-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {loan.status === 'approved' ? 'อนุมัติแล้ว' : 'รอดำเนินการ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: MONTH CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="p-4 sm:p-5">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-slate-600">
            {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day) => (
              <div key={day} className="py-1.5 rounded-lg bg-slate-100">
                {day}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthCalendarGrid.map(({ date, dateStr, isCurrentMonth, isToday, isWeekend }) => {
              const dayNum = date.getDate();
              const isWithinSelectedRange = selectedBorrowDate && selectedReturnDate && dateStr >= selectedBorrowDate && dateStr <= selectedReturnDate;
              const loan = getLoanForDate(dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`min-h-[70px] sm:min-h-[85px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none group relative ${
                    !isCurrentMonth
                      ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-400'
                      : isWithinSelectedRange
                      ? 'bg-vet-navy-50 border-vet-navy-600 text-vet-navy-950 ring-1 ring-vet-navy-600'
                      : isToday
                      ? 'bg-vet-navy-50/60 border-vet-navy-400 text-vet-navy-950'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Top: Date Number & Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-bold ${
                      isToday 
                        ? 'w-6 h-6 rounded-full bg-vet-navy-900 text-white flex items-center justify-center' 
                        : isWithinSelectedRange 
                        ? 'text-vet-navy-950 font-extrabold' 
                        : isWeekend 
                        ? 'text-slate-500' 
                        : 'text-slate-800'
                    }`}>
                      {dayNum}
                    </span>

                    {/* Availability Dot */}
                    {isCurrentMonth && (
                      <span className={`w-2 h-2 rounded-full ${
                        loan 
                          ? loan.status === 'approved' 
                            ? 'bg-vet-navy-900' 
                            : 'bg-amber-500 animate-pulse'
                          : 'bg-vet-olive-600'
                      }`} />
                    )}
                  </div>

                  {/* Bottom: Booking tag */}
                  <div className="mt-1">
                    {isCurrentMonth && loan ? (
                      <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate ${
                        loan.status === 'approved'
                          ? 'bg-vet-navy-100 text-vet-navy-900 border border-vet-navy-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {loan.status === 'approved' ? 'จองแล้ว' : 'รอนุมัติ'} • {loan.borrowerName.split(' ')[0]}
                      </div>
                    ) : isCurrentMonth ? (
                      <div className="text-[9px] text-vet-olive-800 font-bold opacity-80 group-hover:opacity-100">
                        ว่าง
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
