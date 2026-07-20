import { useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  FileText, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  Calendar,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Waybill, SystemSettings } from '../types';

interface WaybillPrintableProps {
  waybill: Waybill | null;
  systemSettings: SystemSettings;
  onClose: () => void;
}

export default function WaybillPrintable({
  waybill,
  systemSettings,
  onClose,
}: WaybillPrintableProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!waybill) return null;

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple robust iframe/window printing fallback for browser
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>بوليصة شحن ساس - ${waybill.serialNumber}</title>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
              <style>
                body { font-family: 'Cairo', 'Segoe UI', sans-serif; direction: rtl; padding: 20px; }
                @media print {
                  .no-print { display: none; }
                  body { padding: 0; }
                }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              <div class="p-6 border-4 border-double border-slate-800 rounded-xl">
                ${printContent}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleDownloadHTML = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;
    
    const element = document.createElement("a");
    const file = new Blob([`
      <html>
        <head>
          <meta charset="utf-8">
          <title>بوليصة شحن رقم ${waybill.serialNumber}</title>
          <style>
            body { font-family: sans-serif; direction: rtl; padding: 40px; background: #f8fafc; color: #1e293b; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border: 2px solid #cbd5e1; border-radius: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .border-b { border-bottom: 1px solid #e2e8f0; }
            .font-bold { font-weight: bold; }
            .mt-4 { margin-top: 16px; }
            .p-4 { padding: 16px; }
            .bg-slate-50 { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="container">
            ${printContent}
          </div>
        </body>
      </html>
    `], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `Waybill-${waybill.serialNumber}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Top bar with quick buttons */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <div>
              <span className="font-extrabold text-sm block">مستند بوليصة الشحن الرسمية</span>
              <span className="text-[10px] text-slate-400 font-mono block">رقم السلسلة: {waybill.serialNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة / تصدير PDF
            </button>
            
            <button
              onClick={handleDownloadHTML}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              حفظ بصيغة HTML
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {/* Paper template container */}
          <div 
            ref={printAreaRef}
            className="bg-white p-10 max-w-3xl mx-auto rounded-xl shadow-lg border border-slate-300 text-slate-900 direction-rtl select-text"
            style={{ minHeight: '297mm' }}
          >
            
            {/* Standard double border layout for official documents */}
            <div className="border-4 border-double border-slate-800 p-6 space-y-8">
              
              {/* Header section (customized from Admin Panel) */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 gap-6">
                
                {/* Right side: custom header text */}
                <div className="text-right space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-900 text-white font-black text-sm rounded">
                      SAS
                    </div>
                    <span className="font-extrabold text-lg text-slate-900">مؤسسة ساس للوساطة والخدمات اللوجستية</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed whitespace-pre-line">
                    {systemSettings.waybillHeader}
                  </p>
                </div>

                {/* Left side: Seal and Serial */}
                <div className="text-left space-y-2 shrink-0">
                  <div className="border-2 border-slate-800 p-2 text-center rounded bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">رقم بوليصة الشحن الموحدة</span>
                    <span className="text-sm font-black text-amber-700 tracking-wider block">{waybill.serialNumber}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right space-y-0.5">
                    <div>تاريخ الإصدار: <span className="font-bold text-slate-800">{waybill.issueDate}</span></div>
                    <div>الحالة: <span className="font-extrabold text-emerald-700">مستند رسمي معتمد</span></div>
                  </div>
                </div>

              </div>

              {/* SECTION 1: CONTRACTING PARTIES */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 border-r-4 border-slate-900 rounded-l">
                  أولاً: بيانات أطراف العقد والاتفاقية
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Shipper */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-bold text-amber-800 text-[10px] block">1. الشاحن (المرسل)</span>
                    <span className="font-extrabold text-slate-950 block text-[13px]">{waybill.shipperInfo.name}</span>
                    <span className="text-slate-500 block">جوال: {waybill.shipperInfo.phone}</span>
                    <span className="text-slate-500 block truncate">العنوان: {waybill.shipperInfo.address}</span>
                  </div>

                  {/* Carrier */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-bold text-amber-800 text-[10px] block">2. الناقل (البرّي)</span>
                    <span className="font-extrabold text-slate-950 block text-[13px]">{waybill.carrierInfo.name}</span>
                    <span className="text-slate-500 block">رقم اللوحة: {waybill.carrierInfo.truckPlate}</span>
                    <span className="text-slate-500 block">السائق: {waybill.carrierInfo.driverName} ({waybill.carrierInfo.driverPhone})</span>
                  </div>

                  {/* Receiver */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-bold text-amber-800 text-[10px] block">3. المرسل إليه (المستلم)</span>
                    <span className="font-extrabold text-slate-950 block text-[13px]">{waybill.receiverInfo.name}</span>
                    <span className="text-slate-500 block">جوال: {waybill.receiverInfo.phone}</span>
                    <span className="text-slate-500 block truncate">العنوان: {waybill.receiverInfo.address}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CARGO SPECIFICATIONS */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 border-r-4 border-slate-900 rounded-l">
                  ثانياً: مواصفات الشحنة والمنتجات المحملة
                </h3>

                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">الوصف والمنتج</th>
                        <th className="px-4 py-2.5">النوع</th>
                        <th className="px-4 py-2.5">الفئة والمواصفة</th>
                        <th className="px-4 py-2.5">العبوة القياسية</th>
                        <th className="px-4 py-2.5">الكمية الإجمالية</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-slate-800">
                        <td className="px-4 py-3 font-extrabold">{waybill.productInfo.name}</td>
                        <td className="px-4 py-3">{waybill.productInfo.type}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-100">
                            {waybill.productInfo.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">{waybill.productInfo.packaging}</td>
                        <td className="px-4 py-3 font-bold text-slate-950">{waybill.productInfo.quantity}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: ROUTING & COSTS */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 border-r-4 border-slate-900 rounded-l">
                  ثالثاً: تفاصيل خط السير والتكاليف المالية المعتمدة
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Routing Map points */}
                  <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      <span className="font-bold text-slate-500">نقطة الانطلاق والتحميل:</span>
                      <span className="font-semibold text-slate-800 truncate">{waybill.routeInfo.from}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span className="font-bold text-slate-500">نقطة التفريغ والتسليم:</span>
                      <span className="font-semibold text-slate-800 truncate">{waybill.routeInfo.to}</span>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">المسافة المقدرة بخرائط جوجل</span>
                      <span className="text-base font-black text-slate-800 mt-0.5 block">{waybill.routeInfo.distance} كيلومتر</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">الأجرة الإجمالية المتفق عليها</span>
                      <span className="text-xl font-black text-amber-700 mt-0.5 block">{waybill.routeInfo.estimatedCost.toLocaleString('ar-EG')} ريال سعودي</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: TERMS & CONDITIONS */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 border-r-4 border-slate-900 rounded-l">
                  رابعاً: شروط وأحكام وثيقة النقل الموحدة (SAS Logistics)
                </h3>
                <div className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono">
                  {waybill.termsAndConditions}
                </div>
              </div>

              {/* SECTION 5: SIGNATURES & STAMPS */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-4">
                  <span className="font-bold text-slate-700 block">توقيع وختم الشاحن (المرسل)</span>
                  <div className="h-12 border-b border-dashed border-slate-300" />
                  <span className="text-[10px] text-slate-400 block">التوقيع الإلكتروني معتمد وموثق</span>
                </div>

                <div className="space-y-4">
                  <span className="font-bold text-slate-700 block">توقيع وختم السائق (الناقل)</span>
                  <div className="h-12 border-b border-dashed border-slate-300" />
                  <span className="text-[10px] text-slate-400 block">تم التوقيع عند تحميل المركبة</span>
                </div>

                <div className="space-y-4 flex flex-col items-center justify-between">
                  <span className="font-bold text-slate-700 block">خاتم واعتماد وسيط الشحن (SAS)</span>
                  
                  {/* A high quality CSS stamp for SAS */}
                  <div className="w-16 h-16 border-4 border-double border-amber-600 rounded-full flex flex-col items-center justify-center -rotate-12 select-none">
                    <span className="font-black text-amber-700 text-xs tracking-wider">SAS</span>
                    <span className="text-[7px] font-bold text-amber-600">لوجستي معتمد</span>
                  </div>
                  
                  <span className="text-[10px] text-slate-400 block">تحت مظلة أنظمة هيئة النقل</span>
                </div>
              </div>

              {/* Footer text customized from Admin Panel */}
              <div className="border-t-2 border-slate-900 pt-4 text-center">
                <p className="text-[9px] text-slate-400 font-medium whitespace-pre-line leading-relaxed">
                  {systemSettings.waybillFooter}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
