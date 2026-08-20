import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  User, 
  Building2, 
  Phone, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  LogIn,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onAuthSuccess?: (user: UserProfile) => void;
  onUserLoggedIn?: (user: UserProfile) => void;
  adminEmails: string[];
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onUserLoggedIn,
  adminEmails,
  isMandatory = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states - initialize with current user data
  const [email, setEmail] = useState(currentUser?.email || '');
  const [name, setName] = useState(currentUser?.name || '');
  const [department, setDepartment] = useState(
    currentUser?.department || 'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์'
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setEmail(currentUser.email || '');
      setName(currentUser.name || '');
      setDepartment(currentUser.department || 'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์');
      setPhone(currentUser.phone || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Check if current input email has admin authorization
  const isInputEmailAdmin = adminEmails.some(
    e => e.trim().toLowerCase() === email.trim().toLowerCase()
  );

  const handleQuickFill = (demoEmail: string, demoName: string, demoDept: string, demoPhone: string) => {
    setEmail(demoEmail);
    setName(demoName);
    setDepartment(demoDept);
    setPhone(demoPhone);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setErrorMsg('กรุณากรอกอีเมล (E-mail)');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('รูปแบบอีเมลไม่ถูกต้อง (เช่น user@kku.ac.th)');
      return;
    }

    if (!cleanName) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุลผู้ใช้งาน');
      return;
    }

    setIsLoading(true);

    const effectiveRole: UserRole = isInputEmailAdmin ? 'admin' : 'user';

    const updatedUser: UserProfile = {
      id: currentUser?.id || `user-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      department: department.trim() || 'คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น',
      phone: phone.trim() || '081-234-5678',
      role: effectiveRole
    };

    setTimeout(() => {
      if (onAuthSuccess) {
        onAuthSuccess(updatedUser);
      }
      if (onUserLoggedIn) {
        onUserLoggedIn(updatedUser);
      }

      setSuccessMsg(`บันทึกข้อมูลเข้าใช้งาน "${cleanName}" (${cleanEmail}) เรียบร้อยแล้ว`);
      setIsLoading(false);

      setTimeout(() => {
        onClose();
      }, 700);
    }, 300);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        // Only allow background click to close if not mandatory
        if (!isMandatory && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-vet-navy-950 via-vet-navy-900 to-vet-olive-900 p-6 text-white relative">
          {!isMandatory ? (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="absolute top-5 right-5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-semibold text-amber-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>ระบุข้อมูลก่อนเข้าใช้งาน</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-vet-olive-600/30 border border-vet-olive-400/40 rounded-xl text-vet-olive-300">
              <UserCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-vet-olive-500/30 text-vet-olive-200 border border-vet-olive-400/30 px-2 py-0.5 rounded-full">
                  {isMandatory ? 'กรุณาระบุข้อมูลเข้าใช้งาน' : 'เข้าใช้งานสะดวกรวดเร็ว'}
                </span>
                <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ไม่ต้องใช้รหัสผ่าน (No Password)
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">
                ลงชื่อเข้าใช้งานระบบ (E-mail & ชื่อ-สกุล)
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            ระบบเครื่องมือห้องปฏิบัติการ คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Alerts */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 font-medium"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Quick Select Preset Accounts */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                คลิกเลือกข้อมูลผู้ใช้งานตัวอย่างทันที:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Preset 1: Admin */}
              <button
                type="button"
                onClick={() => handleQuickFill(
                  'lakkch@kku.ac.th',
                  'ผศ.ดร. ลักขณา ชัยวงศ์',
                  'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์',
                  '081-999-8877'
                )}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                  email.toLowerCase() === 'lakkch@kku.ac.th'
                    ? 'border-vet-navy-500 bg-vet-navy-50/70 ring-1 ring-vet-navy-500'
                    : 'bg-white border-slate-200 hover:border-vet-navy-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-vet-navy-900 text-white shadow-2xs">
                    🛡️ ผู้ดูแลระบบ (Admin)
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">ผศ.ดร. ลักขณา ชัยวงศ์</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">lakkch@kku.ac.th</p>
              </button>

              {/* Preset 2: Lab Admin */}
              <button
                type="button"
                onClick={() => handleQuickFill(
                  'vet_labadmin@kku.ac.th',
                  'เจ้าหน้าที่ห้องปฏิบัติการกลาง',
                  'ฝ่ายเครื่องมือวิทยาศาสตร์และห้องปฏิบัติการ',
                  '043-009700'
                )}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                  email.toLowerCase() === 'vet_labadmin@kku.ac.th'
                    ? 'border-vet-navy-500 bg-vet-navy-50/70 ring-1 ring-vet-navy-500'
                    : 'bg-white border-slate-200 hover:border-vet-navy-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-vet-navy-800 text-white shadow-2xs">
                    🛡️ จนท.ห้องปฏิบัติการ
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">จนท.ห้องปฏิบัติการกลาง</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">vet_labadmin@kku.ac.th</p>
              </button>

              {/* Preset 3: Regular User */}
              <button
                type="button"
                onClick={() => handleQuickFill(
                  'somchai.v@kku.ac.th',
                  'น.สพ. สมชาย ใจดี',
                  'งานวิจัยและพัฒนาผลิตภัณฑ์สัตว์',
                  '089-123-4567'
                )}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                  email.toLowerCase() === 'somchai.v@kku.ac.th'
                    ? 'border-vet-olive-600 bg-vet-olive-50/70 ring-1 ring-vet-olive-600'
                    : 'bg-white border-slate-200 hover:border-vet-olive-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-vet-olive-100 text-vet-olive-900 border border-vet-olive-200">
                    👤 ผู้ขอใช้งาน (User)
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">น.สพ. สมชาย ใจดี</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">somchai.v@kku.ac.th</p>
              </button>

              {/* Preset 4: Student */}
              <button
                type="button"
                onClick={() => handleQuickFill(
                  'kanpitcha.k@kkumail.com',
                  'น.ส. กานต์พิชชา วงศ์สว่าง',
                  'นักศึกษาระดับบัณฑิตศึกษา (ป.โท) คณะสัตวแพทยศาสตร์',
                  '086-789-0123'
                )}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                  email.toLowerCase() === 'kanpitcha.k@kkumail.com'
                    ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                    🎓 นักศึกษา (Student)
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">น.ส. กานต์พิชชา วงศ์สว่าง</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">kanpitcha.k@kkumail.com</p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* E-mail Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  อีเมลผู้ใช้งาน (E-mail) <span className="text-rose-500">*</span>
                </label>
                {isInputEmailAdmin ? (
                  <span className="text-[10px] font-bold text-vet-navy-900 bg-vet-navy-50 border border-vet-navy-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-vet-navy-700" />
                    มีสิทธิ์ Admin อัตโนมัติ
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">
                    ผู้ขอใช้งานทั่วไป (User)
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น lakkch@kku.ac.th หรือ somchai@kku.ac.th"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all font-medium"
                />
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล (Full Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ผศ.ดร. ลักขณา ชัยวงศ์ หรือ นายสมชาย ใจดี"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all font-medium"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สังกัด / ภาควิชา / หน่วยงาน
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="เช่น สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all font-medium"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อ (Phone)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-vet-navy-700 focus:outline-none focus:ring-1 focus:ring-vet-navy-700 transition-all font-medium"
                />
              </div>
            </div>

            {/* Notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                ระบบจะบันทึก E-mail และชื่อ-สกุลนี้ไปใช้ในการยื่นคำขอใช้งานเครื่องมือและติดตามสถานะคำขอล่าสุดโดยอัตโนมัติ <strong>ไม่ต้องจำรหัสผ่าน</strong>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-vet-navy-900 hover:bg-vet-navy-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกและเข้าใช้งานระบบ (Save & Enter)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-vet-olive-600" />
            คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น
          </span>
          <span>VET Lab System</span>
        </div>
      </motion.div>
    </div>
  );
};
