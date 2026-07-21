import { useState } from 'react';
import { 
  Bell, 
  User as UserIcon, 
  Shield, 
  Truck, 
  Package, 
  ChevronDown, 
  Check, 
  Sparkles,
  Inbox,
  Clock,
  LogOut
} from 'lucide-react';
import { UserRole, User, Notification } from '../types';

interface NavbarProps {
  currentUser: User | null;
  usersList: User[];
  notifications: Notification[];
  onSwitchUser: (userId: string) => void;
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onLogout: () => void;
}

export default function Navbar({
  currentUser,
  usersList,
  notifications,
  onSwitchUser,
  onMarkNotificationRead,
  onClearNotifications,
  onLogout,
}: NavbarProps) {
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            ساس للدعم اللوجستي (مسؤول)
          </span>
        );
      case UserRole.SHIPPER:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
            <Package className="w-3.5 h-3.5 text-amber-700" />
            الشاحن (التاجر)
          </span>
        );
      case UserRole.CARRIER:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-700" />
            الناقل (النقليات)
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-950 text-white font-black text-xl rounded-md tracking-wider border-b-2 border-amber-500">
              SAS
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight block">
                ساس للدعم اللوجستي
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block -mt-1">
                SAS Freight Brokerage
              </span>
            </div>
          </div>

          {/* Official Badge Header */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">
              الربط المباشر مع الهيئة العامة للنقل ووزارة النقل متصل
            </span>
          </div>

          {/* User Account Info & Actions */}
          <div className="flex items-center gap-3">
            
            {/* User Profile Info Card */}
            {currentUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <UserIcon className="w-4 h-4 text-slate-600" />
                <div className="text-right">
                  <span className="font-bold text-xs text-slate-900 block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {currentUser.email}
                  </span>
                </div>
                <div className="mr-1">
                  {getRoleBadge(currentUser.role)}
                </div>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowRoleSelector(false);
                }}
                className="relative p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-all cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-600 rounded-full animate-ping" />
                )}
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-600 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 sm:-left-12 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      التنبيهات والبريد ({unreadNotifications.length})
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-xs text-amber-700 hover:underline cursor-pointer"
                      >
                        مسح الكل
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400">
                        <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <span className="text-xs block">لا توجد إشعارات جديدة حالياً</span>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors relative ${
                            !notif.isRead ? 'bg-amber-50/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 block">
                              {notif.title}
                            </span>
                            {!notif.isRead && (
                              <button
                                onClick={() => onMarkNotificationRead(notif.id)}
                                className="text-[10px] text-amber-700 hover:underline shrink-0 cursor-pointer"
                              >
                                تحديد كمقروء
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(notif.createdAt).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            {currentUser && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 bg-slate-50 border border-slate-200/80 hover:border-rose-100 rounded-lg transition-all cursor-pointer"
                title="تسجيل الخروج من المنصة"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
