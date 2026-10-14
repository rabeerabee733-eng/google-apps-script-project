# تطبيق إدارة التحضير الإلكتروني

ابدأ بقراءة `native-app/README.md` للتشغيل والربط و`native-app/VERIFICATION.md` لنتائج الاختبار والقيود.

**أُنتج APK تجريبي لـ Android بنجاح.** إصدار 1.0.0، لأجهزة ARM64 بنظام Android 7 فأحدث، موقع بمفتاح Android Debug للاختبار الداخلي. لم يُختبر على جهاز فعلي. لا يوجد IPA؛ iPhone يحتاج بيئة وتوقيع Apple.

هذا المصدر لتطبيق أصلي Android وiPhone مع تحديثات خادم Google Apps Script الحالي. ليس متجر PDF السابق، وليس واجهة WebView.

- كود الهاتف: `native-app/src/`
- إعدادات البناء: `native-app/app.json` و`native-app/eas.json`
- ربط الخادم: `NativeApi.gs` و`NativePair.html` والتعديلات في `PortalAuth.gs` و`الرمز.js`
- اختبارات الخادم: `tests/native-api.test.cjs`
- اختبارات الاتصال في الهاتف: `native-app/tests/client.test.cjs`

الأرشيف يحتوي مصدرًا وتعليمات، وليس ملف تثبيت. لا يحتوي حسابات دخول أو مفاتيح توقيع Apple أو Android أو بيانات طلبات من الجدول. أُبقيت بيانات إعداد الخادم الموجودة في الكود الأصلي كما هي؛ يجب استخدام هذا المصدر داخل مشروعك الحالي وليس نشره عشوائيًا كمشروع عام.

فرع تسليم المصدر: `feat/native-management-app` في مستودع `rabeerabee733-eng/google-apps-script-project`، بعد موافقة المالك الصريحة على الرفع. نشر Apps Script وتوقيع iOS وتجربة الأجهزة خطوات منفصلة قبل الاعتماد.

بُنيت التعديلات فوق إصدار المستودع `34dbf43`. عند وجود تعديلات أحدث، ادمج الفروق بدل استبدال مشروع Apps Script كاملًا.
