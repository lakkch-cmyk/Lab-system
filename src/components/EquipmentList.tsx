import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Calendar, 
  CheckSquare, 
  RotateCcw, 
  LayoutGrid, 
  FlaskConical,
  Info,
  CalendarDays,
  X,
  Sparkles,
  Command,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Equipment } from '../data/equipment';
import { LoanRequest, UserProfile, UserRole } from '../types';
import { EquipmentCard } from './EquipmentCard';
import { MasterScheduleTab } from './MasterScheduleTab';

interface EquipmentListProps {
  equipment: Equipment[];
  loans?: LoanRequest[];
  currentUser?: UserProfile;
  userRole?: UserRole;
  onViewDetail: (item: Equipment) => void;
  onBorrow: (item: Equipment) => void;
  activeBorrowedIds: string[];
}

export const EquipmentList: React.FC<EquipmentListProps> = ({ 
  equipment, 
  loans = [],
  currentUser = { id: '1', name: 'User', email: 'user@kku.ac.th', role: 'user', department: 'คณะสัตวแพทยศาสตร์', phone: '' },
  userRole = 'user',
  onViewDetail, 
  onBorrow,
  activeBorrowedIds
}) => {
  // View mode switcher: 'grid' vs 'timeline'
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('id-asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Search input ref for hotkey focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen to keyboard shortcut '/' or 'Ctrl+K' to focus live search bar immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derive unique categories, locations, and years dynamically
  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(equipment.map(item => item.type))).filter(Boolean)];
  }, [equipment]);

  const locations = useMemo(() => {
    return ['all', ...Array.from(new Set(equipment.map(item => item.location))).filter(Boolean)];
  }, [equipment]);

  const years = useMemo(() => {
    return ['all', ...Array.from(new Set(equipment.map(item => item.fiscalYear))).filter(Boolean).map(String)].sort((a,b)=>b.localeCompare(a));
  }, [equipment]);

  // Translate category to Thai
  const getThaiCategory = (cat: string) => {
    switch (cat) {
      case 'all': return 'ทุกประเภทเครื่องมือ';
      case 'Microscope': return 'กล้องจุลทรรศน์';
      case 'Imaging / Metrology': return 'ภาพวินิจฉัย/การวัด';
      case 'Sample preparation/Sample analysis': return 'วิเคราะห์ตัวอย่าง';
      case 'Proteomics/Molecular Biology': return 'ชีววิทยาโมเลกุล';
      case 'Chromatography': return 'โครมาโทกราฟี';
      case 'Spectroscopy': return 'สเปกโทรสโกปี';
      default: return 'เครื่องมือทั่วไป';
    }
  };

  const getThaiLocation = (loc: string) => {
    if (loc === 'all') return 'ทุกสถานที่ตั้ง / ห้องแล็บ';
    if (loc.length > 30) return loc.slice(0, 30) + '...';
    return loc;
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedStatus('all');
    setSelectedYear('all');
    setSortBy('id-asc');
    searchInputRef.current?.focus();
  };

  const hasActiveFilters = searchTerm.trim() !== '' || 
    selectedCategory !== 'all' || 
    selectedLocation !== 'all' || 
    selectedStatus !== 'all' || 
    selectedYear !== 'all';

  // Filter & Sort Logic with Live Search
  const filteredEquipment = useMemo(() => {
    return equipment
      .filter(item => {
        // 1. Live search term across multiple fields
        if (searchTerm.trim()) {
          const s = searchTerm.trim().toLowerCase();
          const matchTh = item.nameTh?.toLowerCase().includes(s);
          const matchEn = item.nameEn?.toLowerCase().includes(s);
          const matchId = item.id?.toLowerCase().includes(s);
          const matchCategory = item.type?.toLowerCase().includes(s) || getThaiCategory(item.type).toLowerCase().includes(s);
          const matchLocation = item.location?.toLowerCase().includes(s);
          const matchManager = item.manager?.toLowerCase().includes(s);
          const matchSerial = item.serialNo?.toLowerCase().includes(s);
          const matchSpecs = item.specs?.toLowerCase().includes(s);
          const matchBrand = item.brand?.toLowerCase().includes(s);
          
          if (!matchTh && !matchEn && !matchId && !matchCategory && !matchLocation && !matchManager && !matchSerial && !matchSpecs && !matchBrand) {
            return false;
          }
        }

        // 2. Category
        if (selectedCategory !== 'all' && item.type !== selectedCategory) return false;

        // 3. Location
        if (selectedLocation !== 'all' && item.location !== selectedLocation) return false;

        // 4. Status
        if (selectedStatus !== 'all') {
          const isBorrowed = activeBorrowedIds.includes(item.id);
          const currentStatus = isBorrowed ? 'ยืมอยู่' : item.status;
          
          if (selectedStatus === 'available' && currentStatus !== 'ปกติ') return false;
          if (selectedStatus === 'borrowed' && currentStatus !== 'ยืมอยู่') return false;
          if (selectedStatus === 'incomplete' && currentStatus !== 'จัดซื้อยังไม่สมบูรณ์') return false;
          if (selectedStatus === 'maintenance' && currentStatus !== 'ส่งซ่อม' && currentStatus !== 'ชำรุด') return false;
        }

        // 5. Year
        if (selectedYear !== 'all' && String(item.fiscalYear) !== selectedYear) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'id-asc':
            return a.id.localeCompare(b.id);
          case 'id-desc':
            return b.id.localeCompare(a.id);
          case 'budget-desc':
            return b.budget - a.budget;
          case 'budget-asc':
            return a.budget - b.budget;
          case 'year-desc':
            return b.fiscalYear - a.fiscalYear;
          case 'year-asc':
            return a.fiscalYear - b.fiscalYear;
          case 'no-asc':
            return a.no - b.no;
          default:
            return a.no - b.no;
        }
      });
  }, [equipment, searchTerm, selectedCategory, selectedLocation, selectedStatus, selectedYear, sortBy, activeBorrowedIds]);

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Explorer Headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-vet-navy-50 border border-vet-navy-200 rounded-xl text-vet-navy-800 shrink-0 shadow-2xs">
            <FlaskConical className="w-6 h-6 text-vet-navy-700" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
              สืบค้นและสำรวจเครื่องมือห้องปฏิบัติการ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              ค้นหาข้อมูลจำเพาะ ตรวจสอบสถานะความพร้อม และยื่นคำขอใช้งานเครื่องมือ
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Total Count Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              id="btn_view_grid"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-vet-navy-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ดเครื่องมือ</span>
            </button>
            <button
              id="btn_view_timeline"
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-vet-navy-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>ผังปฏิทิน (Timeline)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs shrink-0 bg-vet-navy-50 px-3 py-1.5 rounded-xl border border-vet-navy-200/80 text-vet-navy-900 font-bold">
            <span>ทั้งหมด <strong>{equipment.length}</strong> รายการ</span>
          </div>
        </div>
      </div>

      {/* Main View Area: Grid Catalog vs Timeline Matrix */}
      {viewMode === 'timeline' ? (
        <MasterScheduleTab
          equipment={equipment}
          loans={loans}
          currentUser={currentUser}
          userRole={userRole}
          onSelectEquipmentForLoan={onBorrow}
          onViewEquipmentDetail={onViewDetail}
        />
      ) : (
        <>
          {/* STICKY LIVE SEARCH & FILTER BAR */}
          <div 
            id="live_search_filter_bar"
            className="sticky top-14 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3.5 transition-all"
          >
            {/* Top Row: Live Search Input + Category Dropdown + Sort Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Main Live Search Input with Instant Clear & Keyboard Shortcut Badge */}
              <div className="md:col-span-6 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-4.5 w-4.5 text-vet-navy-700" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  id="input_search_equipment"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาทันที (ชื่อเครื่องมือ, รหัส VET, หมวดหมู่, ห้องแล็บ, ยี่ห้อ)..."
                  className="block w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-20 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-vet-navy-700 focus:outline-none focus:ring-2 focus:ring-vet-navy-700/20 transition-all font-medium"
                />

                {/* Right controls inside search bar: Clear (X) + Shortcut badge */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1.5">
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        searchInputRef.current?.focus();
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                      title="ล้างข้อความค้นหา"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-200/70 border border-slate-300 rounded">
                    /
                  </kbd>
                </div>
              </div>

              {/* Quick Category Selector */}
              <div className="md:col-span-3">
                <select
                  id="select_category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 px-3 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-vet-navy-700 focus:outline-none focus:ring-2 focus:ring-vet-navy-700/20 transition-all cursor-pointer font-medium"
                >
                  <option value="all">ทุกหมวดหมู่เครื่องมือ ({equipment.length})</option>
                  {categories.filter(c => c !== 'all').map(cat => {
                    const count = equipment.filter(e => e.type === cat).length;
                    return (
                      <option key={cat} value={cat}>
                        {getThaiCategory(cat)} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Sorting Trigger + Advanced Filter Toggle */}
              <div className="md:col-span-3 flex gap-2">
                <select
                  id="select_sorting"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 px-3 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-vet-navy-700 focus:outline-none focus:ring-2 focus:ring-vet-navy-700/20 transition-all cursor-pointer font-medium"
                >
                  <option value="id-asc">เรียง: รหัส ก-ฮ / A-Z</option>
                  <option value="id-desc">เรียง: รหัส ฮ-ก / Z-A</option>
                  <option value="year-desc">เรียง: ปีจัดซื้อ ใหม่ &rarr; เก่า</option>
                  <option value="year-asc">เรียง: ปีจัดซื้อ เก่า &rarr; ใหม่</option>
                  <option value="budget-desc">เรียง: งบประมาณ สูง &rarr; ต่ำ</option>
                  <option value="no-asc">เรียง: ลำดับเริ่มต้น</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    showAdvancedFilters || (selectedLocation !== 'all' || selectedStatus !== 'all' || selectedYear !== 'all')
                      ? 'bg-vet-navy-50 border-vet-navy-300 text-vet-navy-900 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                  title="ตัวกรองขั้นสูง (สถานที่, สถานะ, ปีงบประมาณ)"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Filter Category Chips (Instant 1-Click Filtering without Scrolling) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-vet-olive-600" />
                หมวด:
              </span>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = cat === 'all' 
                  ? equipment.length 
                  : equipment.filter(e => e.type === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-vet-navy-900 text-white border-vet-navy-900 shadow-2xs font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{getThaiCategory(cat)}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-vet-olive-700 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Search & Filter Indicator Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center flex-wrap gap-2 text-slate-600">
                <span className="font-semibold text-slate-800">
                  ผลการค้นหา: <span className="text-vet-navy-900 font-extrabold text-sm">{filteredEquipment.length}</span> จาก {equipment.length} รายการ
                </span>

                {/* Filter tags */}
                {searchTerm.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200 rounded-md font-medium text-[11px]">
                    คำค้น: &ldquo;{searchTerm}&rdquo;
                    <button onClick={() => setSearchTerm('')} className="hover:text-vet-navy-950 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-vet-olive-50 text-vet-olive-900 border border-vet-olive-200 rounded-md font-medium text-[11px]">
                    หมวด: {getThaiCategory(selectedCategory)}
                    <button onClick={() => setSelectedCategory('all')} className="hover:text-vet-olive-950 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-medium text-[11px]">
                    สถานะ: {
                      selectedStatus === 'available' ? 'พร้อมใช้งาน' :
                      selectedStatus === 'borrowed' ? 'กำลังใช้งาน' :
                      selectedStatus === 'incomplete' ? 'จัดซื้อยังไม่สมบูรณ์' :
                      selectedStatus === 'maintenance' ? 'ส่งซ่อม/ชำรุด' : selectedStatus
                    }
                    <button onClick={() => setSelectedStatus('all')} className="hover:text-amber-950 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedLocation !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200 rounded-md font-medium text-[11px]">
                    สถานที่: {getThaiLocation(selectedLocation)}
                    <button onClick={() => setSelectedLocation('all')} className="hover:text-vet-navy-950 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {/* Reset action button */}
              {hasActiveFilters && (
                <button
                  id="btn_clear_all_filters"
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างตัวกรองทั้งหมด</span>
                </button>
              )}
            </div>

            {/* Collapsible Advanced Filters Drawer (Location, Status, Year) */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-3.5 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                {/* Location filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-vet-navy-700 shrink-0" />
                    <span>สถานที่ตั้ง / ห้องปฏิบัติการ</span>
                  </label>
                  <select
                    id="select_location"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="block w-full rounded-xl bg-white border border-slate-200 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all cursor-pointer font-medium"
                  >
                    <option value="all">ทุกสถานที่ตั้ง ({locations.length - 1} แห่ง)</option>
                    {locations.filter(l => l !== 'all').map(loc => (
                      <option key={loc} value={loc}>{getThaiLocation(loc)}</option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-vet-olive-700 shrink-0" />
                    <span>สถานะความพร้อม</span>
                  </label>
                  <select
                    id="select_status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="block w-full rounded-xl bg-white border border-slate-200 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all cursor-pointer font-medium"
                  >
                    <option value="all">ทุกสถานะ</option>
                    <option value="available">พร้อมใช้งาน (Available)</option>
                    <option value="borrowed">กำลังถูกใช้งาน (In Use)</option>
                    <option value="incomplete">จัดซื้อยังไม่สมบูรณ์</option>
                    <option value="maintenance">ชำรุด หรือ ส่งซ่อม</option>
                  </select>
                </div>

                {/* Acquisition year filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-vet-navy-700 shrink-0" />
                    <span>ปีงบประมาณ</span>
                  </label>
                  <select
                    id="select_year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="block w-full rounded-xl bg-white border border-slate-200 py-2 px-3 text-xs sm:text-sm text-slate-800 focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all cursor-pointer font-medium"
                  >
                    <option value="all">ทุกปีงบประมาณ</option>
                    {years.filter(y => y !== 'all').map(year => (
                      <option key={year} value={year}>พ.ศ. {year}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Grid of Equipment Cards */}
          {filteredEquipment.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500 text-sm flex flex-col items-center justify-center shadow-2xs">
              <Info className="w-10 h-10 text-slate-400 mb-2.5" />
              <p className="font-bold text-slate-800 text-base">ไม่พบเครื่องมือห้องปฏิบัติการตามเงื่อนไขที่ค้นหา</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                ไม่มีรายการที่ตรงกับ &ldquo;{searchTerm}&rdquo; หรือตัวกรองที่เลือก ลองเปลี่ยนคำค้นหา หรือคลิกปุ่มด้านล่างเพื่อล้างตัวกรอง
              </p>
              <button 
                onClick={handleResetFilters} 
                className="mt-4 px-4 py-2 bg-vet-navy-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-vet-navy-950 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างตัวกรองทั้งหมด</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((item) => {
                const isBorrowed = activeBorrowedIds.includes(item.id);
                return (
                  <div key={item.id} className="h-full">
                    <EquipmentCard
                      item={item}
                      onViewDetail={onViewDetail}
                      onBorrow={onBorrow}
                      isBorrowed={isBorrowed}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
