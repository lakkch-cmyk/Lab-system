import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Shield, 
  ShieldCheck, 
  User, 
  UserCheck,
  Mail, 
  Plus, 
  Trash2, 
  AlertCircle, 
  KeyRound,
  Info,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  userRole: UserRole;
  adminEmails: string[];
  onUpdateAdminEmails: (emails: string[]) => void;
  onSwitchUserEmail: (email: string, name?: string, dept?: string, forcedRole?: UserRole) => void;
  onToggleUserRole?: (targetRole?: UserRole) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userRole,
  adminEmails,
  onUpdateAdminEmails,
  onSwitchUserEmail,
  onToggleUserRole
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [customLoginEmail, setCustomLoginEmail] = useState('');
  const [customLoginName, setCustomLoginName] = useState('');
  const [customLoginDept, setCustomLoginDept] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'admin_list' | 'profile'>('admin_list');

  if (!isOpen) return null;

  const isAdmin = userRole === 'admin';
  if (!isAdmin) return null;

  const isEmailAdminAuthorized = adminEmails.some(
    e => e.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
  );

  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    
    if (!cleanEmail) {
      setEmailError('โปรดระบุอีเมล');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    if (adminEmails.map(e => e.toLowerCase()).includes(cleanEmail)) {
      setEmailError('อีเมลนี้ได้รับสิทธิ์ Admin อยู่แล้ว');
      return;
    }

    onUpdateAdminEmails([...adminEmails, cleanEmail]);
    setNewEmail('');
    setEmailError('');
  };

  const handleRemoveAdminEmail = (emailToRemove: string) => {
    if (adminEmails.length <= 1) {
      alert('ระบบต้องมีอีเมล Admin อย่างน้อย 1 บัญชี');
      return;
    }
    const updated = adminEmails.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase());
    onUpdateAdminEmails(updated);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customLoginEmail.trim().toLowerCase();
    if (!cleanEmail) return;
    onSwitchUserEmail(
      cleanEmail,
      customLoginName.trim() || cleanEmail.split('@')[0],
      customLoginDept.trim() || 'คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น'
    );
    setCustomLoginEmail('');
    setCustomLoginName('');
    setCustomLoginDept('');
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
            className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl border border-slate-200 flex flex-col my-6 text-slate-800"
          >
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-vet-navy-100 text-vet-navy-800 border border-vet-navy-200">
                  <KeyRound className="w-5 h-5 text-vet-navy-800" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>จัดการสิทธิ์การเข้าใช้งานตามอีเมล (RBAC)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กำหนดสิทธิ์ Admin และจำกัดการมองเห็นข้อมูลคำขอตามบัญชีผู้ใช้งาน
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SubTab Selectors */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('profile')}
                className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'profile'
                    ? 'border-vet-navy-900 text-vet-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>บัญชีปัจจุบัน & สลับผู้ใช้งาน</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('admin_list')}
                className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'admin_list'
                    ? 'border-vet-navy-900 text-vet-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ตั้งค่าอีเมล Admin ({adminEmails.length})</span>
                {isAdmin && (
                  <span className="bg-vet-navy-100 text-vet-navy-900 border border-vet-navy-200 px-1.5 py-0.5 rounded text-[10px]">
                    Admin Only
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* SUBTAB 1: Current Profile & Quick Switch */}
              {activeSubTab === 'profile' && (
                <div className="space-y-6">
                  {/* Current User Card */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isAdmin 
                      ? 'bg-vet-navy-50/80 border-vet-navy-200' 
                      : 'bg-vet-olive-50/80 border-vet-olive-200'
                  }`}>
                    <div className="flex items-start space-x-3.5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-xs text-lg shrink-0 ${
                        isAdmin ? 'bg-vet-navy-900' : 'bg-vet-olive-700'
                      }`}>
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-base">{currentUser.name}</h4>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            isAdmin 
                              ? 'bg-vet-navy-100 text-vet-navy-900 border-vet-navy-200' 
                              : 'bg-vet-olive-100 text-vet-olive-900 border-vet-olive-200'
                          }`}>
                            {isAdmin ? 'Admin Mode' : 'User Mode'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-mono mt-1 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{currentUser.email}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{currentUser.department}</p>
                      </div>
                    </div>

                    {/* Role Toggle Switch for Admin Users */}
                    {isEmailAdminAuthorized && onToggleUserRole && (
                      <div className="flex flex-col items-start sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        <span className="text-[11px] font-medium text-slate-500">สลับโหมดการทำงาน:</span>
                        <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => onToggleUserRole('admin')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                              isAdmin
                                ? 'bg-vet-navy-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Admin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleUserRole('user')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                              !isAdmin
                                ? 'bg-vet-olive-700 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>User</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Policy Explanation Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-vet-navy-800" />
                      <span>หลักการจำกัดสิทธิ์และการมองเห็นข้อมูล:</span>
                    </p>
                    <ul className="text-slate-600 space-y-1 pl-5 list-disc text-[11px] leading-relaxed">
                      <li><strong className="text-vet-olive-800">สิทธิ์ User (ทั่วไป):</strong> เห็นเฉพาะหน้า <em>"การขอใช้งานและการจองของตนเอง"</em> จะไม่สามารถมองเห็นประวัติคำขอ เบอร์โทร หรือข้อมูลการจองของผู้อื่นในระบบได้</li>
                      <li><strong className="text-vet-navy-900">สิทธิ์ Admin (ผู้ดูแลระบบ):</strong> สามารถดูและจัดการคำขอทั้งหมด อนุมัติ ปฏิเสธ และสามารถกำหนดเพิ่ม/ลดอีเมลของผู้ดูแลระบบได้</li>
                    </ul>
                  </div>

                  {/* Custom Email Switch Form */}
                  <form onSubmit={handleCustomLogin} className="space-y-3 pt-2 border-t border-slate-200">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      สลับเข้าใช้งานด้วยอีเมล KKU อื่น
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">อีเมลผู้ใช้งาน (KKU Email)</label>
                        <input
                          type="email"
                          value={customLoginEmail}
                          onChange={(e) => setCustomLoginEmail(e.target.value)}
                          placeholder="example@kku.ac.th"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-vet-navy-700 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">ชื่อผู้ใช้งาน (ทางเลือก)</label>
                        <input
                          type="text"
                          value={customLoginName}
                          onChange={(e) => setCustomLoginName(e.target.value)}
                          placeholder="ชื่อ-นามสกุล"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-vet-navy-700 font-medium"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!customLoginEmail.trim()}
                      className="w-full py-2 bg-vet-navy-900 hover:bg-vet-navy-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>เข้าใช้งานด้วยอีเมลนี้</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* SUBTAB 2: Admin Email Management */}
              {activeSubTab === 'admin_list' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">รายชื่ออีเมลที่ได้รับสิทธิ์ผู้ดูแลระบบ (Admin)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ผู้ใช้งานที่ล็อกอินด้วยอีเมลในรายการนี้จะได้รับสิทธิ์ Admin โดยอัตโนมัติ
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200">
                      {adminEmails.length} บัญชี
                    </span>
                  </div>

                  {/* Add New Admin Email Form */}
                  {isAdmin ? (
                    <form onSubmit={handleAddAdminEmail} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <label className="block text-xs font-bold text-slate-700">
                        เพิ่มอีเมลผู้ดูแลระบบใหม่
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => {
                              setNewEmail(e.target.value);
                              if (emailError) setEmailError('');
                            }}
                            placeholder="ระบุอีเมล เช่น professor@kku.ac.th"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-vet-navy-700 font-medium"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-vet-olive-700 hover:bg-vet-olive-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่มสิทธิ์</span>
                        </button>
                      </div>
                      {emailError && (
                        <p className="text-xs text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{emailError}</span>
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <p className="font-bold text-amber-900">สิทธิ์การจัดการอีเมล Admin เฉพาะผู้ดูแลระบบ</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          บัญชีปัจจุบันของท่านคือผู้ขอใช้งานทั่วไป หากต้องการเพิ่มสิทธิ์ Admin สามารถขอให้ผู้ดูแลระบบเดิมเป็นผู้ตั้งค่าให้ หรือสลับไปใช้บัญชี Admin เพื่อทดสอบได้
                        </p>
                      </div>
                    </div>
                  )}

                  {/* List of current Admin Emails */}
                  <div className="space-y-2">
                    {adminEmails.map((email, idx) => {
                      const isCurrentLoggedIn = email.toLowerCase() === currentUser.email.toLowerCase();

                      return (
                        <div
                          key={email}
                          className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-vet-navy-50 text-vet-navy-900 border border-vet-navy-200 flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                                <span>{email}</span>
                                {isCurrentLoggedIn && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-vet-navy-100 text-vet-navy-900 border border-vet-navy-200 font-bold">
                                    บัญชีปัจจุบัน
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500">สิทธิ์: ผู้ดูแลระบบเครื่องมือห้องปฏิบัติการ (Full Admin)</p>
                            </div>
                          </div>

                          {isAdmin && adminEmails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAdminEmail(email)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบสิทธิ์ Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b-2xl">
              <span className="text-xs text-slate-500">
                สถานะ: <strong className="text-slate-800">{isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ขอใช้งาน (User)'}</strong>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-300 shadow-2xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
