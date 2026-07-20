/**
 * Helper file to generate highly polished, responsive HTML email templates for the SAS Logistics Platform.
 * Uses inline styles for maximum compatibility with mail clients (Outlook, Gmail, Apple Mail, etc.).
 */

const primaryColor = "#0f172a"; // slate-900
const accentColor = "#d97706"; // amber-600
const textColor = "#334155"; // slate-700
const darkTextColor = "#0f172a"; // slate-900
const lightBg = "#f8fafc"; // slate-50
const cardBg = "#ffffff";

/**
 * Returns a beautifully designed HTML email for registration verification
 */
export function getVerificationEmailHtml(name: string, roleName: string, code: string): string {
  return `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رمز تفعيل حساب ساس اللوجستي</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        background-color: ${lightBg};
        font-family: 'Inter', Tahoma, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .email-container {
        max-width: 600px;
        margin: 40px auto;
        background-color: ${cardBg};
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        border: 1px solid #e2e8f0;
      }
      .email-header {
        background-color: ${primaryColor};
        padding: 32px 24px;
        text-align: center;
        border-bottom: 4px solid ${accentColor};
      }
      .logo-text {
        font-size: 28px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: 2px;
        margin: 0;
      }
      .header-subtitle {
        font-size: 13px;
        color: #94a3b8;
        margin-top: 6px;
        margin-bottom: 0;
        font-weight: 500;
      }
      .email-body {
        padding: 40px 32px;
        direction: rtl;
        text-align: right;
      }
      .welcome-text {
        font-size: 20px;
        font-weight: 700;
        color: ${darkTextColor};
        margin-top: 0;
        margin-bottom: 16px;
        line-height: 1.4;
      }
      .main-paragraph {
        font-size: 15px;
        color: ${textColor};
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .role-badge {
        display: inline-block;
        background-color: #f1f5f9;
        color: ${darkTextColor};
        font-size: 13px;
        font-weight: 700;
        padding: 6px 14px;
        border-radius: 30px;
        border: 1px solid #cbd5e1;
        margin-bottom: 24px;
      }
      .code-card {
        background-color: ${lightBg};
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        margin: 32px 0;
      }
      .code-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #64748b;
        margin-bottom: 8px;
        font-weight: 700;
      }
      .code-display {
        font-size: 38px;
        font-weight: 800;
        color: ${darkTextColor};
        letter-spacing: 6px;
        margin: 0;
        font-family: monospace;
      }
      .code-expiry {
        font-size: 11px;
        color: ${accentColor};
        margin-top: 8px;
        font-weight: 600;
      }
      .warning-box {
        background-color: #fffbeb;
        border-right: 4px solid #f59e0b;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 32px;
      }
      .warning-title {
        font-size: 13px;
        font-weight: 700;
        color: #78350f;
        margin: 0 0 4px 0;
      }
      .warning-text {
        font-size: 12px;
        color: #92400e;
        margin: 0;
        line-height: 1.5;
      }
      .email-footer {
        background-color: ${lightBg};
        padding: 24px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
      }
      .footer-links {
        margin-bottom: 12px;
      }
      .footer-links a {
        color: ${accentColor};
        text-decoration: none;
        margin: 0 8px;
        font-weight: 600;
      }
      .footer-text {
        margin: 4px 0;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <h1 class="logo-text">SAS</h1>
        <p class="header-subtitle">منصة ساس للخدمات والوساطة اللوجستية الموحدة</p>
      </div>
      
      <div class="email-body">
        <h2 class="welcome-text">مرحباً بك، ${name}</h2>
        <p class="main-paragraph">
          نشكرك على اختيار منصة ساس اللوجستية شريكاً لأعمالك. لقد تلقينا طلب تسجيل حسابك الجديد بالمنصة، ويرجى تأكيد الهوية ومطابقة التراخيص الحكومية من خلال الرمز أدناه.
        </p>
        
        <div class="role-badge">
          النوع التجاري المسجل: ${roleName}
        </div>
        
        <div class="code-card">
          <div class="code-label">رمز التحقق الثنائي (OTP)</div>
          <div class="code-display">${code}</div>
          <div class="code-expiry">⏱️ هذا الرمز صالح للاستخدام لمدة 10 دقائق فقط</div>
        </div>
        
        <div class="warning-box">
          <h4 class="warning-title">تنبيه أمان وحماية المعلومات</h4>
          <p class="warning-text">
            موظفو الدعم الفني في منصة ساس لن يطلبوا منك هذا الرمز أبداً عبر الهاتف أو وسائل التواصل. يرجى عدم مشاركته مع أي طرف ثالث لحماية تراخيص النقل البري الخاصة بك.
          </p>
        </div>
        
        <p class="main-paragraph" style="margin-bottom: 0;">
          في حال واجهت أي مشاكل أثناء التسجيل، لا تتردد بالرد على هذا البريد للتحدث مباشرة مع فريق الدعم والعمليات الميدانية لدينا.
        </p>
      </div>
      
      <div class="email-footer">
        <div class="footer-links">
          <a href="#">موقعنا التجاري</a> | 
          <a href="#">لوائح وزارة النقل</a> | 
          <a href="#">سياسة الخصوصية</a>
        </div>
        <p class="footer-text">منصة ساس اللوجستية - بوابة النقل السحابي المرخصة بالمملكة العربية السعودية</p>
        <p class="footer-text" style="font-size: 11px; color: #94a3b8;">© 2026 SAS Logistics Platform. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Returns a beautifully designed HTML email for login 2FA verification
 */
export function getLogin2FAEmailHtml(name: string, code: string): string {
  return `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>كود تسجيل الدخول الثنائي - منصة ساس</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        background-color: ${lightBg};
        font-family: 'Inter', Tahoma, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .email-container {
        max-width: 600px;
        margin: 40px auto;
        background-color: ${cardBg};
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        border: 1px solid #e2e8f0;
      }
      .email-header {
        background-color: ${primaryColor};
        padding: 32px 24px;
        text-align: center;
        border-bottom: 4px solid ${accentColor};
      }
      .logo-text {
        font-size: 28px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: 2px;
        margin: 0;
      }
      .header-subtitle {
        font-size: 13px;
        color: #94a3b8;
        margin-top: 6px;
        margin-bottom: 0;
        font-weight: 500;
      }
      .email-body {
        padding: 40px 32px;
        direction: rtl;
        text-align: right;
      }
      .welcome-text {
        font-size: 20px;
        font-weight: 700;
        color: ${darkTextColor};
        margin-top: 0;
        margin-bottom: 16px;
        line-height: 1.4;
      }
      .main-paragraph {
        font-size: 15px;
        color: ${textColor};
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .code-card {
        background-color: ${lightBg};
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        margin: 32px 0;
      }
      .code-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #64748b;
        margin-bottom: 8px;
        font-weight: 700;
      }
      .code-display {
        font-size: 38px;
        font-weight: 800;
        color: ${darkTextColor};
        letter-spacing: 6px;
        margin: 0;
        font-family: monospace;
      }
      .code-expiry {
        font-size: 11px;
        color: ${accentColor};
        margin-top: 8px;
        font-weight: 600;
      }
      .warning-box {
        background-color: #fef2f2;
        border-right: 4px solid #ef4444;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 32px;
      }
      .warning-title {
        font-size: 13px;
        font-weight: 700;
        color: #991b1b;
        margin: 0 0 4px 0;
      }
      .warning-text {
        font-size: 12px;
        color: #b91c1c;
        margin: 0;
        line-height: 1.5;
      }
      .email-footer {
        background-color: ${lightBg};
        padding: 24px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
      }
      .footer-links {
        margin-bottom: 12px;
      }
      .footer-links a {
        color: ${accentColor};
        text-decoration: none;
        margin: 0 8px;
        font-weight: 600;
      }
      .footer-text {
        margin: 4px 0;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <h1 class="logo-text">SAS</h1>
        <p class="header-subtitle">منصة ساس للخدمات والوساطة اللوجستية الموحدة</p>
      </div>
      
      <div class="email-body">
        <h2 class="welcome-text">شريكنا العزيز، ${name}</h2>
        <p class="main-paragraph">
          تم كشف محاولة تسجيل دخول ناجحة إلى لوحة التحكم الخاصة بك برقمك السري. لضمان أمان معلومات الشحن وتفاصيل الفواتير، يرجى إدخال الرمز الموحد التالي لتأكيد هويتك.
        </p>
        
        <div class="code-card">
          <div class="code-label">رمز الدخول الثنائي الموحد (OTP)</div>
          <div class="code-display">${code}</div>
          <div class="code-expiry">⏱️ هذا الرمز صالح للاستخدام لمرة واحدة فقط وينتهي بعد 10 دقائق</div>
        </div>
        
        <div class="warning-box">
          <h4 class="warning-title">حماية قصوى وحساب تجاري آمن</h4>
          <p class="warning-text">
            إذا لم تكن أنت من قام بمحاولة الدخول هذه، يرجى الدخول فوراً إلى حسابك وتغيير الرقم السري الخاص بك، أو إرسال بلاغ أمني عاجل لفريق العمليات اللوجستية في ساس.
          </p>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="footer-links">
          <a href="#">تواصل مع الدعم</a> | 
          <a href="#">لوائح الأمن السيبراني</a> | 
          <a href="#">شروط الاستخدام</a>
        </div>
        <p class="footer-text">منصة ساس اللوجستية - بوابة النقل السحابي المرخصة بالمملكة العربية السعودية</p>
        <p class="footer-text" style="font-size: 11px; color: #94a3b8;">© 2026 SAS Logistics Platform. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
