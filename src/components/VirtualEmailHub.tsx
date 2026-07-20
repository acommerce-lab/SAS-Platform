import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  X, 
  Check, 
  Inbox, 
  Clock, 
  RefreshCw, 
  ChevronRight, 
  Eye, 
  Send,
  Sparkles,
  Search
} from 'lucide-react';
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc,
  doc,
  getDocs
} from '../lib/firebase';

interface VirtualEmail {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  type: string;
}

interface VirtualEmailHubProps {
  currentEmailFilter?: string;
  onClose?: () => void;
}

export default function VirtualEmailHub({ 
  currentEmailFilter = '', 
  onClose 
}: VirtualEmailHubProps) {
  const [emails, setEmails] = useState<VirtualEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<VirtualEmail | null>(null);
  const [searchQuery, setSearchQuery] = useState(currentEmailFilter);
  const [loading, setLoading] = useState(true);

  // Sync emails from Firestore in real-time
  useEffect(() => {
    setLoading(true);
    let q = query(
      collection(db, 'virtual_emails'), 
      orderBy('createdAt', 'desc')
    );

    // If there is a search or filter, we can do client-side filtering or Firestore query.
    // Client-side is more flexible for custom searching (by subject, body, or email).
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: VirtualEmail[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as VirtualEmail);
      });
      setEmails(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error reading virtual emails:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update searchQuery if currentEmailFilter changes
  useEffect(() => {
    if (currentEmailFilter) {
      setSearchQuery(currentEmailFilter);
    }
  }, [currentEmailFilter]);

  const filteredEmails = emails.filter(email => {
    const queryLower = searchQuery.toLowerCase().trim();
    if (!queryLower) return true;
    return (
      email.toEmail.toLowerCase().includes(queryLower) ||
      email.subject.toLowerCase().includes(queryLower) ||
      email.body.toLowerCase().includes(queryLower)
    );
  });

  const handleMarkAsRead = async (email: VirtualEmail) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await updateDoc(doc(db, 'virtual_emails', email.id), {
          isRead: true
        });
      } catch (err) {
        console.error("Error marking email as read:", err);
      }
    }
  };

  const handleClearAll = async () => {
    // For demo purposes, we can delete or mark all as read. Let's mark all as read.
    const unread = emails.filter(e => !e.isRead);
    for (const e of unread) {
      await updateDoc(doc(db, 'virtual_emails', e.id), { isRead: true });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-amber-600 p-1.5 rounded-lg text-white">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">صندوق البريد السحابي الافتراضي لساس</h3>
            <p className="text-[10px] text-slate-300">محاكاة فورية لإشعارات البريد ورموز التحقق 2FA</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main split-screen container */}
      <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-x-reverse divide-slate-100">
        
        {/* Left side: Detail View (or message list if none selected) */}
        <div className="w-1/2 flex flex-col min-h-0 bg-slate-50">
          {selectedEmail ? (
            <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
              <button 
                onClick={() => setSelectedEmail(null)}
                className="flex items-center gap-1 text-xs text-amber-800 font-bold hover:underline mb-2 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" /> رجوع لقائمة الرسائل
              </button>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-3 space-y-1 text-right">
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(selectedEmail.createdAt).toLocaleString('ar-EG')}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">
                    {selectedEmail.subject}
                  </h4>
                  <div className="text-xs text-slate-600 mt-2">
                    <span className="font-semibold text-slate-800">إلى: </span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {selectedEmail.toEmail}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold">المرسل:</span> notifications@sas.sa
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line text-right py-2 font-sans font-medium">
                  {selectedEmail.body}
                </div>

                {selectedEmail.body.includes('رمز التحقق') && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200/80 text-center mt-4">
                    <span className="text-[10px] font-bold text-amber-800 block mb-1">💡 انسخ رمز التحقق الخاص بك:</span>
                    <span className="font-mono font-black text-lg text-amber-900 select-all tracking-widest">
                      {selectedEmail.body.match(/\d{6}/)?.[0] || '123456'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">اختر رسالة من القائمة لعرض محتواها بالتفصيل</span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                ستتمكن من نسخ رموز التحقق 2FA أو بوليصة الشحن وتتبع حالة طلباتك.
              </p>
            </div>
          )}
        </div>

        {/* Right side: List View */}
        <div className="w-1/2 flex flex-col min-h-0">
          {/* Search box */}
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="تصفية حسب بريدك الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pr-8 pl-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-slate-900 font-mono text-left"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <button 
              onClick={handleClearAll}
              title="تحديد الكل كمقروء"
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Email list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>جاري تحميل البريد...</span>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center py-12">
                <Inbox className="w-8 h-8 text-slate-300 mb-1.5" />
                <span className="font-bold text-slate-500">لا توجد رسائل واردة</span>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  {searchQuery ? 'لا توجد رسائل مطابقة لفلتر البحث المكتوب.' : 'لم يتم إرسال أي إشعارات أو أكواد لهذا البريد بعد.'}
                </p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => handleMarkAsRead(email)}
                  className={`p-3 text-right cursor-pointer hover:bg-slate-50 transition-colors border-r-4 text-xs relative ${
                    selectedEmail?.id === email.id ? 'bg-slate-50/80 border-r-amber-600' : 'border-r-transparent'
                  } ${!email.isRead ? 'bg-amber-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1 gap-1">
                    <span className="font-mono text-[9px] text-slate-400 shrink-0">
                      {new Date(email.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`font-semibold ${!email.isRead ? 'text-slate-900' : 'text-slate-600'} truncate flex-1`}>
                      {email.subject}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 truncate mb-1 text-left font-mono">
                    إلى: {email.toEmail}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                    {email.body}
                  </p>

                  {!email.isRead && (
                    <span className="absolute top-3.5 right-1.5 w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer banner */}
          <div className="bg-slate-50 p-2.5 border-t border-slate-100 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>يدعم التحديث الفوري والربط في الزمن الحقيقي عبر Firestore</span>
          </div>

        </div>

      </div>

    </div>
  );
}
