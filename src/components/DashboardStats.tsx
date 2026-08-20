import React from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  CheckCircle, 
  ArrowLeftRight, 
  MapPin, 
  ArrowRight
} from 'lucide-react';
import { Equipment } from '../data/equipment';
import { LoanRequest } from '../types';

interface DashboardStatsProps {
  equipment: Equipment[];
  loans: LoanRequest[];
  onTabChange: (tab: any) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ equipment, loans, onTabChange }) => {
  // Calculations
  const totalItemsCount = equipment.length;
  const totalQuantity = equipment.reduce((sum, item) => sum + item.quantity, 0);
  
  const activeLoans = loans.filter(l => l.status === 'approved').length;
  const pendingLoans = loans.filter(l => l.status === 'pending').length;

  const normalStatusCount = equipment.filter(item => item.status === 'ปกติ').length;
  const normalStatusPercent = ((normalStatusCount / totalItemsCount) * 100).toFixed(0);

  // Distinct locations count
  const locationsCount = new Set(equipment.map(item => item.location)).size;

  const stats = [
    {
      id: 'stat-total',
      title: 'เครื่องมือห้องปฏิบัติการทั้งหมด',
      value: `${totalItemsCount} รายการ`,
      subText: `รวมทั้งหมด ${totalQuantity} เครื่องในคลัง`,
      icon: Briefcase,
      accentColor: 'bg-vet-navy-800',
      badgeBg: 'bg-vet-navy-50 text-vet-navy-900 border-vet-navy-200/80',
      action: () => onTabChange('equipment')
    },
    {
      id: 'stat-ready',
      title: 'พร้อมให้บริการใช้งาน',
      value: `${normalStatusCount} รายการ`,
      subText: `คิดเป็น ${normalStatusPercent}% ของเครื่องมือทั้งหมด`,
      icon: CheckCircle,
      accentColor: 'bg-vet-olive-700',
      badgeBg: 'bg-vet-olive-50 text-vet-olive-900 border-vet-olive-200/80',
      action: () => onTabChange('equipment')
    },
    {
      id: 'stat-active',
      title: 'อยู่ระหว่างการใช้งาน / ยืม',
      value: `${activeLoans} เครื่อง`,
      subText: `รอดำเนินการพิจารณา ${pendingLoans} รายการ`,
      icon: ArrowLeftRight,
      accentColor: 'bg-amber-600',
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-200/80',
      action: () => onTabChange('loans')
    },
    {
      id: 'stat-locations',
      title: 'ห้องปฏิบัติการและหน่วยงาน',
      value: `${locationsCount} แห่ง`,
      subText: `ครอบคลุมทุกสาขาวิชาและ รพ.สัตว์`,
      icon: MapPin,
      accentColor: 'bg-vet-navy-900',
      badgeBg: 'bg-vet-navy-50 text-vet-navy-900 border-vet-navy-200/80',
      action: () => onTabChange('equipment')
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 font-sans"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.id}
          variants={itemVariants}
          onClick={stat.action}
          className="relative bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group"
          whileHover={{ y: -3 }}
        >
          {/* Top colored institutional bar */}
          <div className={`h-1.5 w-full ${stat.accentColor}`} />

          <div className="p-5 flex justify-between items-start gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 tracking-wide">{stat.title}</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight group-hover:text-vet-navy-900 transition-colors">
                {stat.value}
              </h3>
            </div>
            <div className={`p-3 rounded-xl border ${stat.badgeBg} transition-transform duration-200 group-hover:scale-105 shrink-0 shadow-2xs`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
          
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium truncate">{stat.subText}</span>
            <span className="text-vet-olive-700 font-semibold text-xs shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>ดูข้อมูล</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
