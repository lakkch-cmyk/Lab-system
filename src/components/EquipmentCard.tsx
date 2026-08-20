import React from 'react';
import { motion } from 'motion/react';
import { MapPin, User, Calendar, Eye } from 'lucide-react';
import { Equipment } from '../data/equipment';
import { EquipmentImage } from './EquipmentImage';

interface EquipmentCardProps {
  item: Equipment;
  onViewDetail: (item: Equipment) => void;
  onBorrow: (item: Equipment) => void;
  isBorrowed: boolean;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ item, onViewDetail, onBorrow, isBorrowed }) => {
  // Determine current status
  const currentStatus = isBorrowed ? 'ยืมอยู่' : item.status;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ปกติ':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-vet-olive-50 text-vet-olive-900 border border-vet-olive-200">
            <span className="w-1.5 h-1.5 mr-1.5 bg-vet-olive-600 rounded-full animate-pulse" />
            พร้อมใช้งาน
          </span>
        );
      case 'ยืมอยู่':
      case 'ยืมใช้งาน':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200">
            <span className="w-1.5 h-1.5 mr-1.5 bg-vet-navy-700 rounded-full animate-pulse" />
            กำลังถูกใช้งาน
          </span>
        );
      case 'จัดซื้อยังไม่สมบูรณ์':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 mr-1.5 bg-slate-400 rounded-full" />
            ยังไม่สมบูรณ์
          </span>
        );
      case 'ชำรุด':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 mr-1.5 bg-rose-500 rounded-full" />
            ชำรุด
          </span>
        );
      case 'ส่งซ่อม':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 mr-1.5 bg-amber-500 rounded-full" />
            ส่งซ่อม
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Microscope':
        return 'bg-vet-navy-50 text-vet-navy-800 border-vet-navy-200';
      case 'Imaging / Metrology':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Sample preparation/Sample analysis':
        return 'bg-vet-olive-50 text-vet-olive-800 border-vet-olive-200';
      case 'Proteomics/Molecular Biology':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'Chromatography':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Spectroscopy':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTranslatedCategory = (category: string) => {
    switch (category) {
      case 'Microscope': return 'กล้องจุลทรรศน์';
      case 'Imaging / Metrology': return 'ภาพวินิจฉัย/การวัด';
      case 'Sample preparation/Sample analysis': return 'เตรียม/วิเคราะห์ตัวอย่าง';
      case 'Proteomics/Molecular Biology': return 'ชีววิทยาโมเลกุล';
      case 'Chromatography': return 'โครมาโทกราฟี';
      case 'Spectroscopy': return 'สเปกโทรสโกปี';
      default: return 'เครื่องมือทั่วไป';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -3, boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.08)' }}
      className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col justify-between h-full font-sans hover:border-vet-navy-400 transition-all duration-200"
    >
      {/* Card Header - Image slot with neatly positioned overlay badges */}
      <div 
        className="relative aspect-video w-full bg-slate-100 overflow-hidden border-b border-slate-100 group cursor-pointer" 
        onClick={() => onViewDetail(item)}
      >
        <EquipmentImage
          id={item.id}
          name={item.nameTh}
          type={item.type}
          aspectRatio="video"
          showBadge={false}
          className="group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top-Left: Equipment ID Pill */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center text-[11px] font-mono font-bold bg-slate-900/80 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-lg shadow-xs">
            {item.id}
          </span>
        </div>

        {/* Top-Right: Category Pill */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-lg shadow-xs backdrop-blur-md border ${
            item.type === 'Microscope' ? 'bg-vet-navy-900/85 text-vet-navy-100 border-vet-navy-400/30' :
            item.type === 'Imaging / Metrology' ? 'bg-purple-900/80 text-purple-100 border-purple-400/30' :
            item.type === 'Sample preparation/Sample analysis' ? 'bg-vet-olive-900/85 text-vet-olive-100 border-vet-olive-400/30' :
            item.type === 'Proteomics/Molecular Biology' ? 'bg-fuchsia-900/80 text-fuchsia-100 border-fuchsia-400/30' :
            item.type === 'Chromatography' ? 'bg-amber-900/80 text-amber-100 border-amber-400/30' :
            item.type === 'Spectroscopy' ? 'bg-rose-900/80 text-rose-100 border-rose-400/30' :
            'bg-slate-900/80 text-slate-100 border-white/20'
          }`}>
            {getTranslatedCategory(item.type)}
          </span>
        </div>

        {/* Bottom-Right: Subtle hover inspect indicator */}
        <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-white/90 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-md shadow-xs">
            <Eye className="w-3 h-3 text-vet-navy-800" />
            <span>ดูรายละเอียด</span>
          </span>
        </div>
      </div>

      {/* Card Body & Header Info */}
      <div className="p-5 pb-3">
        {/* Name (Thai & Eng) */}
        <h4 
          className="font-bold text-slate-900 text-base leading-snug line-clamp-2 min-h-[2.75rem] hover:text-vet-navy-900 cursor-pointer transition-colors" 
          onClick={() => onViewDetail(item)}
        >
          {item.nameTh}
        </h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic font-normal">
          {item.nameEn || 'N/A'}
        </p>
      </div>

      {/* Card Body - Details */}
      <div className="px-5 py-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-600 flex-1">
        {/* Location */}
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-vet-navy-700 shrink-0 mt-0.5" />
          <span className="line-clamp-2 text-slate-700 font-medium" title={item.location}>
            {item.location}
          </span>
        </div>

        {/* Custodian */}
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-vet-olive-700 shrink-0" />
          <span className="truncate text-slate-700">
            ผู้ดูแล: <span className="font-semibold text-slate-900">{item.manager || 'ไม่มีข้อมูล'}</span>
          </span>
        </div>

        {/* Purchase Year and Quantity */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>ปีจัดซื้อ พ.ศ. {item.fiscalYear}</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-600 justify-end">
            <span>จำนวน: <strong className="text-slate-900 font-bold">{item.quantity} เครื่อง</strong></span>
          </div>
        </div>
      </div>

      {/* Card Footer - Status and Actions */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="shrink-0">
          {getStatusBadge(currentStatus)}
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          {/* Detail Trigger */}
          <button
            id={`btn_detail_${item.id}`}
            onClick={() => onViewDetail(item)}
            className="p-2 bg-white text-slate-600 hover:text-vet-navy-900 border border-slate-200 rounded-xl shadow-2xs hover:border-vet-navy-400 transition-colors cursor-pointer"
            title="ดูรายละเอียด"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Borrow Trigger */}
          {currentStatus === 'ปกติ' ? (
            <button
              id={`btn_borrow_${item.id}`}
              onClick={() => onBorrow(item)}
              className="px-3.5 py-2 bg-vet-olive-700 hover:bg-vet-olive-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              ขอใช้งาน
            </button>
          ) : (
            <button
              disabled
              className="px-3.5 py-2 bg-slate-100 text-slate-400 font-medium text-xs rounded-xl cursor-not-allowed border border-slate-200"
            >
              ไม่พร้อมใช้
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
