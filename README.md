# ZENVIX — بداية مشروع موقع الدردشة

نسخة أولية قابلة للتشغيل بعد ربط Firebase. تشمل تسجيل الحساب بالبريد وكلمة المرور أو Google، وغرف دردشة عامة برسائل مباشرة عبر Firestore.

## 1) المتطلبات
- Node.js إصدار 20 أو أحدث.
- حساب Google لإنشاء مشروع Firebase.
- حساب Vercel للنشر.

## 2) إعداد Firebase
1. افتح https://console.firebase.google.com وأنشئ مشروعًا باسم `zenvix`.
2. من Project settings > General أضف تطبيق Web وانسخ إعدادات Firebase.
3. من Authentication > Sign-in method فعّل Email/Password وGoogle.
4. من Authentication > Settings > Authorized domains أضف دومين Vercel بعد النشر.
5. من Firestore Database أنشئ قاعدة بيانات (ابدأ بوضع production).
6. افتح تبويب Rules وانسخ محتوى ملف `firestore.rules` ثم اضغط Publish.

## 3) تشغيل المشروع على جهازك
افتح المجلد في الطرفية ثم نفّذ:
```bash
npm install
```
انسخ `.env.example` إلى ملف جديد اسمه `.env`، ثم املأ القيم من إعدادات تطبيق Firebase:
```bash
npm run dev
```
افتح الرابط المحلي الذي يظهر لك في الطرفية.

## 4) النشر على Vercel
1. ارفع مجلد المشروع إلى مستودع GitHub.
2. افتح https://vercel.com واستورد المستودع.
3. أضف متغيرات البيئة الستة الموجودة في `.env.example` من Project Settings > Environment Variables.
4. اضغط Deploy.
5. أضف دومين Vercel إلى Firebase Authentication > Authorized domains.

## ملاحظات مهمة
- لا تضع مفاتيح Firebase الحقيقية داخل ملفات الكود أو ترسلها في محادثة عامة. استخدم متغيرات البيئة في `.env` محليًا وVercel.
- هذه نسخة أولية: غرف عامة فقط. الشات الخاص، العشوائي، رفع الصور والملفات، الإشعارات، الحظر والتبليغ ولوحة الإدارة تحتاج مراحل تطوير إضافية قبل إطلاق عام.
- لا تعتبر قواعد Firestore الحالية نظام إشراف أو حماية مكتملًا. راجعها واختبرها قبل فتح الموقع للجمهور.
