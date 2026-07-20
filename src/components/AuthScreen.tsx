import React, { useState } from 'react';
import { 
  Shield, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  Truck, 
  Package, 
  ArrowLeft, 
  AlertCircle,
  Inbox,
  Sparkles,
  KeyRound,
  RefreshCw,
  MailWarning
} from 'lucide-react';
import { UserRole, User as UserType } from '../types';
import { 
  auth, 
  db, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../lib/firebase';
import { defaultUsers } from '../data';
import VirtualEmailHub from './VirtualEmailHub';

interface AuthScreenProps {
  onLoginSuccess: (user: UserType) => void;
  onRegisterSuccess: (user: Omit<UserType, 'id' | 'createdAt'>) => void;
}

export default function AuthScreen({
  onLoginSuccess,
  onRegisterSuccess,
}: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [roleSelection, setRoleSelection] = useState<UserRole>(UserRole.SHIPPER);
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Verification step
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'LOGIN_2FA' | 'REGISTER_2FA'>('LOGIN_2FA');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSmtpStatus(null);

    try {
      if (isRegistering) {
        if (!name || !email || !phone || !password) {
          alert('يرجى تعبئة جميع الحقول المطلوبة للتسجيل.');
          setIsLoading(false);
          return;
        }

        // Generate a 6-digit OTP code for simulation
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setTempUser({ name, email, phone, role: roleSelection, password });
        setAuthMode('REGISTER_2FA');

        const emailSubject = 'رمز تفعيل حساب ساس اللوجستي ومطابقة ترخيص النقل';
        const emailBody = `مرحباً بك يا ${name} في منصة ساس اللوجستية الموحدة (SAS).
لقد قمت بطلب تسجيل حساب جديد كـ (${roleSelection === UserRole.SHIPPER ? 'شاحن بضائع' : 'ناقل بري'}).

رمز التحقق الثنائي (2FA OTP) الخاص بك لتأكيد البريد وتفعيل الترخيص هو: ${code}

يرجى إدخال هذا الرمز في المنصة لاستكمال التسجيل بوزارة النقل وهيئة الاتصالات.`;

        // Write virtual email document to Firestore as backup/history log
        await addDoc(collection(db, 'virtual_emails'), {
          toEmail: email,
          subject: emailSubject,
          body: emailBody,
          createdAt: new Date().toISOString(),
          isRead: false,
          type: 'verification'
        });

        // Send real email using Gmail SMTP via our full-stack endpoint
        try {
          const smtpRes = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toEmail: email, subject: emailSubject, body: emailBody })
          });
          const smtpData = await smtpRes.json();
          setSmtpStatus(smtpData);
        } catch (smtpErr) {
          console.error("SMTP delivery failed:", smtpErr);
          setSmtpStatus({ success: false, error: 'connection_error', message: 'تعذر الاتصال بخادم البريد لإرسال الكود.' });
        }
        
        setShowVerificationStep(true);

      } else {
        // Login
        if (!email || !password) {
          alert('الرجاء كتابة البريد الإلكتروني وكلمة المرور.');
          setIsLoading(false);
          return;
        }

        let authenticatedUser: any = null;
        let profile: UserType | null = null;

        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          authenticatedUser = userCredential.user;
          
          // Get profile
          const userDoc = await getDoc(doc(db, 'users', authenticatedUser.uid));
          if (userDoc.exists()) {
            profile = userDoc.data() as UserType;
          } else {
            // Create profile if missing
            profile = {
              id: authenticatedUser.uid,
              email: authenticatedUser.email || email,
              name: email.split('@')[0],
              phone: '0500000000',
              role: email.includes('admin') ? UserRole.ADMIN : (email.includes('carrier') ? UserRole.CARRIER : UserRole.SHIPPER),
              isVerified: true,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', authenticatedUser.uid), profile);
          }
        } catch (authErr: any) {
          // If default user, auto-register them to simplify the demo process
          const defaultUser = defaultUsers.find(u => u.email === email);
          if (defaultUser && (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential')) {
            console.log('Pre-seeded user logging in for first time. Registering in Firebase Auth...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            profile = {
              ...defaultUser,
              id: userCredential.user.uid,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', userCredential.user.uid), profile);
          } else {
            throw authErr;
          }
        }

        if (profile) {
          // Generate 2FA code for Login
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedCode(code);
          setTempUser(profile);
          setAuthMode('LOGIN_2FA');

          const emailSubject = 'رمز الدخول الثنائي الموحد (2FA OTP) - منصة ساس';
          const emailBody = `عزيزي شريك ساس اللوجستي (${profile.name})،
لقد تم كشف محاولة تسجيل دخول صحيحة برقمك السري.

كود الدخول الثنائي الموحد والأمن للتحقق من هويتك هو: ${code}

إذا لم تكن أنت من قام بهذه المحاولة، يرجى تغيير الرقم السري فوراً وإبلاغ إدارة الدعم الفني.`;

          // Send virtual email for login 2FA as backup
          await addDoc(collection(db, 'virtual_emails'), {
            toEmail: email,
            subject: emailSubject,
            body: emailBody,
            createdAt: new Date().toISOString(),
            isRead: false,
            type: 'verification'
          });

          // Send real email using Gmail SMTP via our full-stack endpoint
          try {
            const smtpRes = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ toEmail: email, subject: emailSubject, body: emailBody })
            });
            const smtpData = await smtpRes.json();
            setSmtpStatus(smtpData);
          } catch (smtpErr) {
            console.error("SMTP delivery failed:", smtpErr);
            setSmtpStatus({ success: false, error: 'connection_error', message: 'تعذر الاتصال بخادم البريد لإرسال الكود.' });
          }

          setShowVerificationStep(true);
        } else {
          alert('تعذر استرداد ملفك الشخصي من ساس. يرجى مراجعة الإدارة.');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        alert('كلمة المرور أو البريد الإلكتروني غير صحيح، يرجى المحاولة مرة أخرى.');
      } else if (err.code === 'auth/invalid-email') {
        alert('صيغة البريد الإلكتروني المدخل غير صحيحة.');
      } else {
        alert('حدث خطأ أثناء الاتصال بالخادم السحابي: ' + (err.message || err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (verificationCode === generatedCode) {
      try {
        if (authMode === 'REGISTER_2FA') {
          // Complete Registration in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, tempUser.email, tempUser.password);
          
          const newUser: UserType = {
            id: userCredential.user.uid,
            email: tempUser.email,
            name: tempUser.name,
            phone: tempUser.phone,
            role: tempUser.role,
            isVerified: true,
            createdAt: new Date().toISOString()
          };

          // Save profile
          await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
          
          onRegisterSuccess(newUser);
        } else {
          // Login 2FA Success
          onLoginSuccess(tempUser);
        }
        setShowVerificationStep(false);
      } catch (err: any) {
        console.error("Error finalizing auth:", err);
        alert('حدث خطأ أثناء حفظ الملف الشخصي: ' + (err.message || err));
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('رمز التحقق غير صحيح، يرجى التأكد من كتابة الكود المكون من 6 أرقام بشكل صحيح.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col lg:flex-row gap-8 items-stretch justify-center py-6 px-2 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      
      {/* Right side: Auth Box */}
      <div className="flex-1 max-w-md mx-auto flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-14 h-14 bg-slate-950 text-white font-black text-2xl rounded-xl tracking-widest border-b-4 border-amber-600 shadow-md">
              SAS
            </div>
          </div>
          
          <h2 className="mt-4 text-center text-2xl font-black text-slate-900 tracking-tight">
            {showVerificationStep 
              ? 'تأكيد الحساب والتحقق الموحد (2FA)' 
              : isRegistering 
              ? 'إنشاء حساب جديد بالمنصة' 
              : 'بوابة تسجيل الدخول الموحدة'}
          </h2>
          
          <p className="mt-1 text-center text-xs text-slate-500 font-medium leading-relaxed">
            {showVerificationStep 
              ? 'أرسلنا كود OTP مكوّن من 6 أرقام لحماية حسابك.' 
              : 'منصة ساس للوساطة اللوجستية شريك النقل السحابي البري المرخص'}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80">
          
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-50 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mb-2" />
              <span className="text-xs font-bold text-slate-700">جاري معالجة طلبك سحابياً...</span>
            </div>
          )}

          {/* 1. OTP Verification Panel */}
          {showVerificationStep ? (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              
              {smtpStatus?.success ? (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1.5 shrink-0" />
                  <div className="text-xs text-emerald-900 space-y-1">
                    <span className="font-bold block text-emerald-950">تم إرسال بريد حقيقي عبر Gmail SMTP! ✅</span>
                    <p className="leading-relaxed">
                      لقد تم إرسال الرمز بنجاح إلى بريدك الإلكتروني المدخل: <strong className="font-mono">{email}</strong>. يرجى التحقق من صندوق الوارد أو البريد المهمل (Spam).
                    </p>
                  </div>
                </div>
              ) : smtpStatus?.error === 'credentials_missing' ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                  <MailWarning className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <span className="font-bold block text-amber-950">تم إنشاء الكود (لم يتم إرسال بريد خارجي) ⚠️</span>
                    <p className="leading-relaxed text-[11px]">
                      منصة ساس مهيأة لإرسال بريد حقيقي، ولكن لم يتم إعداد المتغيرات <code>GMAIL_USER</code> و <code>GMAIL_APP_PASSWORD</code> في الإعدادات بعد.
                    </p>
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowEmailPanel(!showEmailPanel)}
                        className="text-[11px] text-amber-900 font-extrabold underline hover:text-amber-800"
                      >
                        {showEmailPanel ? 'إخفاء صندوق البريد المساعد ❌' : 'إظهار صندوق البريد المساعد لاستعراض الكود 🔓'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : smtpStatus ? (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                  <MailWarning className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-900 space-y-1">
                    <span className="font-bold block text-red-950">فشل الاتصال بـ Gmail SMTP ❌</span>
                    <p className="leading-relaxed text-[11px]">
                      حدث خطأ أثناء محاولة إرسال البريد الإلكتروني. تأكد من صحة البريد المدخل ومفتاح مرور التطبيق.
                    </p>
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowEmailPanel(!showEmailPanel)}
                        className="text-[11px] text-red-900 font-extrabold underline hover:text-red-800"
                      >
                        {showEmailPanel ? 'إخفاء صندوق البريد المساعد ❌' : 'إظهار صندوق البريد المساعد لاستعراض الكود 🔓'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                  <Inbox className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <span className="font-bold block">جاري معالجة إرسال الرمز...</span>
                    <p className="leading-relaxed">
                      يتم الآن إرسال البريد الإلكتروني الثنائي الموحد. يرجى الانتظار ثواني معدودة.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رمز التحقق المكون من 6 أرقام *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <KeyRound className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center tracking-widest text-lg font-bold pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-extrabold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 transition-colors cursor-pointer"
              >
                تأكيد الرمز والتفعيل
              </button>

              <button
                type="button"
                onClick={() => setShowVerificationStep(false)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                الرجوع لتعديل البيانات
              </button>
            </form>
          ) : (
            
            /* 2. Login or Register Form */
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              
              {/* Role Selection when Registering */}
              {isRegistering && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-600">نوع الكيان المسجل بالمنصة *</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRoleSelection(UserRole.SHIPPER)}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        roleSelection === UserRole.SHIPPER 
                          ? 'border-slate-900 bg-slate-950 text-white font-bold' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Package className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-semibold">شاحن (تاجر جملة)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleSelection(UserRole.CARRIER)}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        roleSelection === UserRole.CARRIER 
                          ? 'border-slate-900 bg-slate-950 text-white font-bold' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Truck className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-semibold">ناقل (شركة خدمات نقليات)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name when Registering */}
              {isRegistering && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم التجاري أو الشخصي *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: شركة تجارة الخليج المحدودة"
                      className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Phone when Registering */}
              {isRegistering && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الجوال النشط *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="مثال: 0500000000"
                      className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@domain.com"
                    className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-slate-900"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-slate-900"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-extrabold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 transition-colors cursor-pointer"
                >
                  {isRegistering ? 'تسجيل وإرسال رمز التحقق' : 'تسجيل الدخول'}
                </button>
              </div>

              {/* Toggle Login/Register */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs font-bold text-amber-800 hover:underline"
                >
                  {isRegistering 
                    ? 'لديك حساب بالفعل؟ سجل دخولك هنا' 
                    : 'ليس لديك حساب؟ قم بالتسجيل كشاحن أو ناقل بري من هنا'}
                </button>
              </div>

              {/* Quick test credentials help */}
              {!isRegistering && (
                <div className="border-t border-slate-100 pt-4 mt-4 text-[11px] text-slate-400 leading-relaxed text-right space-y-1 bg-slate-50 p-3 rounded-lg">
                  <span className="font-bold text-slate-500 block">💡 الحسابات الافتراضية للتجربة السريعة:</span>
                  <div className="font-mono text-[10px] space-y-1 text-slate-500 text-left">
                    <div>• <b>Admin:</b> admin@sas.sa / Password: 123456</div>
                    <div>• <b>Shipper:</b> shipper1@global.com / Password: 123456</div>
                    <div>• <b>Carrier 1:</b> carrier1@express.sa / Password: 123456</div>
                    <div>• <b>Carrier 2:</b> carrier2@coldchain.sa / Password: 123456</div>
                  </div>
                  <div className="pt-2 text-[10.5px]">
                    بمجرد تسجيل الدخول بأي حساب، سيتم تفعيل حساب Firebase Auth وتوليد رمز أمان 2FA في البريد المقابل له فوراً.
                  </div>
                </div>
              )}

            </form>
          )}

        </div>
      </div>

      {/* Left side: Live Cloud Email Hub Drawer */}
      {showEmailPanel && (
        <div className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-center min-h-[450px]">
          <div className="bg-slate-50/50 p-1.5 rounded-2xl border border-dashed border-slate-300">
            <VirtualEmailHub currentEmailFilter={email} />
          </div>
        </div>
      )}

    </div>
  );
}
