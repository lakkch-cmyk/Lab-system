import React, { useMemo, useState } from 'react';
import { 
  CheckCircle2, 
  ArrowLeftRight, 
  AlertTriangle, 
  Wrench, 
  MapPin, 
  Layers, 
  Activity,
  ArrowRight,
  BarChart3,
  Building2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { Equipment } from '../data/equipment';
import { LoanRequest } from '../types';

interface DashboardChartsProps {
  equipment: Equipment[];
  loans?: LoanRequest[];
  onTabChange?: (tab: any) => void;
}

const CATEGORY_COLORS = [
  '#173254', // Vet Deep Navy
  '#456630', // Vet Olive Green
  '#2a558c', // Medium Vet Blue
  '#547b3b', // Rich Forest Olive
  '#d97706', // Warm Amber
  '#2d5045', // Deep Sage / Teal
  '#375226', // Dark Khaki Olive
  '#10233b'  // Midnight Vet Navy
];

const LOCATION_COLORS = [
  '#173254', // Vet Deep Navy
  '#456630', // Vet Olive Green
  '#1e416d', // Institutional Navy
  '#547b3b', // Olive Medium
  '#2a558c', // Royal Blue
  '#649147', // Olive Green Light
  '#d97706', // Warm Amber
  '#204036', // Forest Sage
  '#786b45', // Khaki Earth
  '#0f233c'  // Deep Navy
];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  equipment, 
  loans = [],
  onTabChange
}) => {
  const [catMetric, setCatMetric] = useState<'quantity' | 'itemCount'>('quantity');
  const [locMetric, setLocMetric] = useState<'quantity' | 'itemCount'>('quantity');

  // Translate category keys to Thai labels
  const getThaiCategoryName = (type: string) => {
    switch (type) {
      case 'Microscope': return 'กล้องจุลทรรศน์';
      case 'Imaging / Metrology': return 'ภาพวินิจฉัย/การวัด';
      case 'Sample preparation/Sample analysis': return 'วิเคราะห์ตัวอย่าง';
      case 'Proteomics/Molecular Biology': return 'ชีววิทยาโมเลกุล';
      case 'Chromatography': return 'โครมาโทกราฟี';
      case 'Spectroscopy': return 'สเปกโทรสโกปี';
      default: return 'เครื่องมือห้องปฏิบัติการทั่วไป';
    }
  };

  // 1. Calculate items by Equipment Status (ปกติ, กำลังใช้งาน, ชำรุด, ส่งซ่อม)
  const statusData = useMemo(() => {
    const activeBorrowedSet = new Set(
      loans.filter(l => l.status === 'approved').map(l => l.equipmentId)
    );

    let normalCount = 0;
    let normalQty = 0;
    let inUseCount = 0;
    let inUseQty = 0;
    let damagedCount = 0;
    let damagedQty = 0;
    let repairCount = 0;
    let repairQty = 0;

    equipment.forEach(item => {
      const isCurrentlyBorrowed = activeBorrowedSet.has(item.id);
      const rawStatus = (item.status || '').trim();

      if (rawStatus === 'ชำรุด' || rawStatus === 'ชำรุดเสียหาย') {
        damagedCount += 1;
        damagedQty += item.quantity;
      } else if (rawStatus === 'ส่งซ่อม' || rawStatus === 'ส่งซ่อมบำรุง') {
        repairCount += 1;
        repairQty += item.quantity;
      } else if (rawStatus === 'กำลังใช้งาน' || rawStatus === 'ยืมอยู่' || isCurrentlyBorrowed) {
        inUseCount += 1;
        inUseQty += item.quantity;
      } else {
        normalCount += 1;
        normalQty += item.quantity;
      }
    });

    const totalItems = equipment.length || 1;
    const totalQty = equipment.reduce((sum, item) => sum + item.quantity, 0) || 1;

    return [
      {
        statusKey: 'normal',
        statusName: 'ปกติ (พร้อมใช้งาน)',
        shortName: 'พร้อมใช้งาน',
        count: normalCount,
        quantity: normalQty,
        percentage: Number(((normalCount / totalItems) * 100).toFixed(1)),
        qtyPercentage: Number(((normalQty / totalQty) * 100).toFixed(1)),
        icon: CheckCircle2,
        bgCard: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
        textBadge: 'text-emerald-700 bg-emerald-100/90 border-emerald-300',
        dotColor: 'bg-emerald-500',
        barColor: 'bg-emerald-500',
        description: 'เครื่องมือสมบูรณ์พร้อมให้บริการและรองรับการจองใช้งาน'
      },
      {
        statusKey: 'in_use',
        statusName: 'กำลังใช้งาน / ยืมอยู่',
        shortName: 'กำลังใช้งาน',
        count: inUseCount,
        quantity: inUseQty,
        percentage: Number(((inUseCount / totalItems) * 100).toFixed(1)),
        qtyPercentage: Number(((inUseQty / totalQty) * 100).toFixed(1)),
        icon: ArrowLeftRight,
        bgCard: 'bg-vet-navy-50/80 border-vet-navy-200 text-vet-navy-950',
        textBadge: 'text-vet-navy-800 bg-vet-navy-100 border-vet-navy-300',
        dotColor: 'bg-vet-navy-800',
        barColor: 'bg-vet-navy-800',
        description: 'อนุมัติคำขอแล้วและอยู่ระหว่างการปฏิบัติงานจริงในแล็บ'
      },
      {
        statusKey: 'repair',
        statusName: 'ส่งซ่อมบำรุง / รออะไหล่',
        shortName: 'ส่งซ่อมบำรุง',
        count: repairCount,
        quantity: repairQty,
        percentage: Number(((repairCount / totalItems) * 100).toFixed(1)),
        qtyPercentage: Number(((repairQty / totalQty) * 100).toFixed(1)),
        icon: Wrench,
        bgCard: 'bg-amber-50/70 border-amber-200 text-amber-950',
        textBadge: 'text-amber-700 bg-amber-100/90 border-amber-300',
        dotColor: 'bg-amber-500',
        barColor: 'bg-amber-500',
        description: 'อยู่ระหว่างส่งบำรุงรักษา ปรับเทียบ (Calibration) หรือรออะไหล่'
      },
      {
        statusKey: 'damaged',
        statusName: 'ชำรุดเสียหาย',
        shortName: 'ชำรุด',
        count: damagedCount,
        quantity: damagedQty,
        percentage: Number(((damagedCount / totalItems) * 100).toFixed(1)),
        qtyPercentage: Number(((damagedQty / totalQty) * 100).toFixed(1)),
        icon: AlertTriangle,
        bgCard: 'bg-rose-50/70 border-rose-200 text-rose-950',
        textBadge: 'text-rose-700 bg-rose-100/90 border-rose-300',
        dotColor: 'bg-rose-500',
        barColor: 'bg-rose-500',
        description: 'มีอาการขัดข้องหรือไม่พร้อมใช้งาน รอช่างตรวจซ่อม'
      }
    ];
  }, [equipment, loans]);

  // 2. Calculate items by Category
  const categoryData = useMemo(() => {
    const counts: Record<string, { items: number; quantity: number }> = {};
    
    equipment.forEach(item => {
      const type = item.type || 'อื่นๆ';
      if (!counts[type]) {
        counts[type] = { items: 0, quantity: 0 };
      }
      counts[type].items += 1;
      counts[type].quantity += item.quantity;
    });

    const totalQty = equipment.reduce((sum, e) => sum + e.quantity, 0) || 1;

    return Object.entries(counts).map(([name, data]) => ({
      name: getThaiCategoryName(name),
      rawType: name,
      itemCount: data.items,
      quantity: data.quantity,
      percentage: Number(((data.quantity / totalQty) * 100).toFixed(1))
    })).sort((a, b) => b.quantity - a.quantity);
  }, [equipment]);

  // 3. Equipment counts by All Locations
  const locationData = useMemo(() => {
    const counts: Record<string, { items: number; quantity: number }> = {};
    
    equipment.forEach(item => {
      const loc = item.location?.trim() || 'ไม่ระบุสถานที่';
      if (!counts[loc]) {
        counts[loc] = { items: 0, quantity: 0 };
      }
      counts[loc].items += 1;
      counts[loc].quantity += item.quantity;
    });

    const totalQty = equipment.reduce((sum, e) => sum + e.quantity, 0) || 1;

    return Object.entries(counts)
      .map(([fullName, data]) => {
        let cleanName = fullName
          .replace('อาคารโรงพยาบาลสัตว์', '')
          .replace('เครื่องสแกนสไลด์ติดตั้งที่', '')
          .trim();

        if (cleanName === 'คณะสัตวแพทยศาสตร์') {
          cleanName = 'คณะสัตวแพทย์ (ส่วนกลาง)';
        }

        return {
          name: cleanName,
          fullName: fullName,
          itemCount: data.items,
          quantity: data.quantity,
          percentage: Number(((data.quantity / totalQty) * 100).toFixed(1))
        };
      })
      .sort((a, b) => b.quantity - a.quantity);
  }, [equipment]);

  const totalItemsCount = equipment.length;
  const totalQuantityCount = equipment.reduce((sum, e) => sum + e.quantity, 0);

  // Custom Tooltip for Category Chart
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
          <p className="font-bold text-sm text-slate-100">{data.name}</p>
          <div className="pt-1.5 border-t border-slate-700 space-y-1">
            <p className="text-emerald-400 font-medium flex justify-between gap-4">
              <span>จำนวนเครื่องทั้งหมด:</span>
              <strong className="text-white font-mono">{data.quantity} เครื่อง</strong>
            </p>
            <p className="text-blue-400 font-medium flex justify-between gap-4">
              <span>จำนวนรายการเครื่องมือ:</span>
              <strong className="text-white font-mono">{data.itemCount} รายการ</strong>
            </p>
            <p className="text-slate-400 text-[11px] flex justify-between gap-4">
              <span>สัดส่วนในคลัง:</span>
              <strong className="text-slate-200 font-mono">{data.percentage}%</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Location Chart
  const CustomLocationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 z-50 max-w-[280px]">
          <p className="font-bold text-sm text-slate-100">{data.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{data.fullName}</p>
          <div className="pt-1.5 border-t border-slate-700 space-y-1">
            <p className="text-blue-400 font-medium flex justify-between gap-4">
              <span>จำนวนเครื่องในห้องนี้:</span>
              <strong className="text-white font-mono">{data.quantity} เครื่อง</strong>
            </p>
            <p className="text-purple-400 font-medium flex justify-between gap-4">
              <span>จำนวนรายการโมเดล:</span>
              <strong className="text-white font-mono">{data.itemCount} รายการ</strong>
            </p>
            <p className="text-slate-400 text-[11px] flex justify-between gap-4">
              <span>สัดส่วนในคลัง:</span>
              <strong className="text-slate-200 font-mono">{data.percentage}%</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8 font-sans">
      {/* 1. สรุปสถานะภาพรวมตัวเลขของเครื่องมือห้องปฏิบัติการ (Numeric Status Overview) */}
      <div 
        id="equipment_status_numeric_overview"
        className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col space-y-6"
      >
        {/* Header with Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-vet-navy-50 border border-vet-navy-200/80 rounded-xl text-vet-navy-800 shrink-0 shadow-2xs">
              <Activity className="w-5 h-5 text-vet-navy-700" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug flex items-center gap-2">
                สถานะภาพรวมของเครื่องมือห้องปฏิบัติการ
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200 rounded-full">
                  รวม {totalItemsCount} รายการ ({totalQuantityCount} เครื่อง)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                สรุปตัวเลขและสัดส่วนความพร้อมใช้งานของเครื่องมือในคลังห้องปฏิบัติการ
              </p>
            </div>
          </div>

          {onTabChange && (
            <button
              onClick={() => onTabChange('equipment')}
              className="text-xs font-bold text-vet-navy-800 hover:text-vet-olive-800 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>ไปที่รายการเครื่องมือ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Status Breakdown Cards with Numbers and Proportions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusData.map((item) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={item.statusKey}
                className={`p-4 sm:p-5 rounded-2xl border ${item.bgCard} transition-all duration-200 hover:shadow-xs flex flex-col justify-between space-y-3.5`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
                    {item.statusName}
                  </span>
                  <IconComponent className="w-5 h-5 opacity-80 shrink-0" />
                </div>

                {/* Main Numeric Values */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                      {item.count}
                      <span className="text-xs sm:text-sm font-semibold text-slate-500 ml-1.5">รายการ</span>
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${item.textBadge}`}>
                      {item.percentage}%
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-medium text-slate-600 flex items-center justify-between pt-2 border-t border-black/5">
                    <span>จำนวนเครื่องรวม:</span>
                    <span className="font-bold text-slate-900">{item.quantity} เครื่อง</span>
                  </div>
                </div>

                {/* Subtext description */}
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Status Distribution Proportion Bar (Clean CSS Bar) */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>สัดส่วนการกระจายสถานะเครื่องมือในคลัง</span>
            <span className="text-slate-500 font-mono text-[11px]">100% จาก {totalItemsCount} รายการ</span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {statusData.map((item) => (
              item.percentage > 0 && (
                <div
                  key={item.statusKey}
                  style={{ width: `${item.percentage}%` }}
                  className={`${item.barColor} transition-all duration-500`}
                  title={`${item.statusName}: ${item.count} รายการ (${item.percentage}%)`}
                />
              )
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-600">
            {statusData.map((item) => (
              <div key={item.statusKey} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                <span className="font-medium">{item.shortName}:</span>
                <span className="font-bold text-slate-900">{item.count} รายการ ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Bar Charts Breakdown: Categories & Locations (กราฟทรงแท่ง) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <div id="chart_category_breakdown" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-vet-olive-50 border border-vet-olive-200 rounded-xl text-vet-olive-800 shrink-0">
                <Layers className="w-5 h-5 text-vet-olive-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">กราฟแท่งสรุปตามหมวดหมู่การใช้งาน</h3>
                <p className="text-xs text-slate-500 mt-0.5">{categoryData.length} หมวดหมู่เครื่องมือวิทยาศาสตร์</p>
              </div>
            </div>
            
            {/* Metric Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCatMetric('quantity')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  catMetric === 'quantity'
                    ? 'bg-white text-vet-olive-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                จำนวนเครื่อง ({totalQuantityCount})
              </button>
              <button
                type="button"
                onClick={() => setCatMetric('itemCount')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  catMetric === 'itemCount'
                    ? 'bg-white text-vet-olive-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                จำนวนรายการ ({totalItemsCount})
              </button>
            </div>
          </div>

          {/* Recharts Horizontal Bar Chart */}
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={categoryData}
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  width={115}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomCategoryTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar 
                  dataKey={catMetric} 
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                >
                  {categoryData.map((_, index) => (
                    <Cell 
                      key={`cell-cat-${index}`} 
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Legend / Stat Tags */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
            {categoryData.slice(0, 4).map((cat, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700"
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} 
                />
                <span className="font-medium truncate max-w-[120px]">{cat.name}:</span>
                <strong className="text-slate-900 font-mono">
                  {catMetric === 'quantity' ? `${cat.quantity} เครื่อง` : `${cat.itemCount} รายการ`}
                </strong>
              </span>
            ))}
          </div>
        </div>

        {/* Location Bar Chart */}
        <div id="chart_location_breakdown" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-vet-navy-50 border border-vet-navy-200 rounded-xl text-vet-navy-800 shrink-0">
                <MapPin className="w-5 h-5 text-vet-navy-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">กราฟแท่งสรุปตามห้องปฏิบัติการ / สถานที่ตั้ง</h3>
                <p className="text-xs text-slate-500 mt-0.5">{locationData.length} ห้องปฏิบัติการและหน่วยงาน</p>
              </div>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLocMetric('quantity')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  locMetric === 'quantity'
                    ? 'bg-white text-vet-navy-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                จำนวนเครื่อง ({totalQuantityCount})
              </button>
              <button
                type="button"
                onClick={() => setLocMetric('itemCount')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  locMetric === 'itemCount'
                    ? 'bg-white text-vet-navy-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                จำนวนรายการ ({totalItemsCount})
              </button>
            </div>
          </div>

          {/* Recharts Horizontal Bar Chart for Locations */}
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={locationData}
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  width={125}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomLocationTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar 
                  dataKey={locMetric} 
                  radius={[0, 6, 6, 0]}
                  barSize={16}
                >
                  {locationData.map((_, index) => (
                    <Cell 
                      key={`cell-loc-${index}`} 
                      fill={LOCATION_COLORS[index % LOCATION_COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Legend / Stat Tags */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
            {locationData.slice(0, 4).map((loc, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700"
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: LOCATION_COLORS[idx % LOCATION_COLORS.length] }} 
                />
                <span className="font-medium truncate max-w-[120px]">{loc.name}:</span>
                <strong className="text-slate-900 font-mono">
                  {locMetric === 'quantity' ? `${loc.quantity} เครื่อง` : `${loc.itemCount} รายการ`}
                </strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

