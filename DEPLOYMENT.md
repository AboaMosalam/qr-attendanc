# 🚀 دليل النشر على Render

## الخطوة 1: إنشاء حساب MongoDB Atlas (قاعدة بيانات مجانية)

### 1. افتح: https://www.mongodb.com/cloud/atlas/register
- سجل حساب جديد (مجاني)
- اختر **Free Tier** (M0 Sandbox)

### 2. إنشاء Cluster:
- اضغط "Build a Database"
- اختر **M0 Free**
- اختر أقرب Region ليك (مثلاً: AWS - Frankfurt)
- اسم الـ Cluster: **qr-attendance**
- اضغط "Create"

### 3. إنشاء Database User:
- اضغط "Database Access" من القائمة الجانبية
- اضغط "Add New Database User"
- Username: `admin` (أو أي اسم)
- Password: اختار كلمة مرور قوية (احفظها!)
- Database User Privileges: **Read and Write**
- اضغط "Add User"

### 4. السماح بالوصول من أي IP:
- اضغط "Network Access" من القائمة الجانبية
- اضغط "Add IP Address"
- اضغط "Allow Access from Anywhere" (0.0.0.0/0)
- اضغط "Confirm"

### 5. الحصول على Connection String:
- ارجع لـ "Database"
- اضغط "Connect" على الـ Cluster
- اختر "Drivers"
- اختر Driver: **Node.js** و Version: **6.0 or later**
- انسخ الـ **Connection String**
- سيكون شكله:
  ```
  mongodb+srv://admin:<password>@qr-attendance.abc123.mongodb.net/?retryWrites=true&w=majority
  ```
- **مهم:** غير `<password>` بكلمة المرور اللي اخترتها!

---

## الخطوة 2: رفع المشروع على GitHub

### إذا لم يكن لديك Git مثبت:
1. حمل Git من: https://git-scm.com/download/win
2. ثبته بالإعدادات الافتراضية

### من Terminal في VS Code:

```bash
# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - QR Attendance System"
```

### إنشاء Repository على GitHub:
1. افتح: https://github.com/new
2. اسم الـ Repository: **qr-attendance-system**
3. اجعله **Public** أو **Private** (كما تريد)
4. **لا تضف** README أو .gitignore
5. اضغط "Create repository"

### ربط المشروع بـ GitHub:

انسخ الأوامر من صفحة GitHub والصقها في Terminal:
```bash
git remote add origin https://github.com/YOUR_USERNAME/qr-attendance-system.git
git branch -M main
git push -u origin main
```

---

## الخطوة 3: النشر على Render

### 1. إنشاء Web Service:
- من Dashboard في Render
- اضغط "New +" → "Web Service"
- اختر "Build and deploy from a Git repository"
- اضغط "Next"

### 2. ربط GitHub:
- اضغط "Connect GitHub" (إذا لم تكن ربطت حسابك)
- اختر الـ Repository: **qr-attendance-system**
- اضغط "Connect"

### 3. إعدادات الـ Web Service:

**Name:** `qr-attendance` (أو أي اسم تريده)

**Region:** اختر أقرب منطقة

**Branch:** `main`

**Root Directory:** (اتركه فارغاً)

**Runtime:** `Node`

**Build Command:** `npm install`

**Start Command:** `npm start`

**Instance Type:** اختر **Free**

### 4. Environment Variables (متغيرات البيئة):

اضغط "Add Environment Variable" وأضف:

**Key:** `MONGODB_URI`
**Value:** الصق الـ Connection String من MongoDB Atlas
(مثال: `mongodb+srv://admin:mypassword@qr-attendance.abc123.mongodb.net/qr-attendance?retryWrites=true&w=majority`)

**Key:** `NODE_ENV`
**Value:** `production`

### 5. Deploy:
- اضغط "Create Web Service"
- انتظر 3-5 دقائق حتى ينتهي الـ Deploy
- سيعطيك رابط مثل: `https://qr-attendance.onrender.com`

---

## الخطوة 4: اختبار التطبيق

افتح الرابط اللي أعطاك إياه Render:
- **الصفحة الرئيسية:** `https://your-app.onrender.com`
- **بوابة الطلاب:** `https://your-app.onrender.com/student`
- **بوابة المحاضرين:** `https://your-app.onrender.com/instructor`

---

## ⚠️ ملاحظات مهمة:

### النسخة المجانية من Render:
- ✅ مجانية تماماً
- ⚠️ التطبيق **ينام** بعد 15 دقيقة من عدم الاستخدام
- ⏱️ أول request بعد النوم يأخذ 30-50 ثانية للاستيقاظ

### الحلول:
1. استخدم خدمة Ping مجانية مثل [UptimeRobot](https://uptimerobot.com) لإبقائه مستيقظاً
2. أو اشترك في النسخة المدفوعة ($7/شهر) بدون Sleep

---

## 🔄 التحديثات المستقبلية:

عند تعديل الكود:
```bash
git add .
git commit -m "وصف التحديث"
git push
```

Render سيكتشف التحديث ويعيد الـ Deploy تلقائياً! 🎉

---

## 🆘 حل المشاكل:

### إذا فشل الـ Deploy:
1. تحقق من الـ Logs في Render
2. تأكد من أن MONGODB_URI صحيح
3. تأكد من أن المكتبات مثبتة في package.json

### إذا لم يعمل التطبيق:
1. افتح الـ Logs في Render
2. ابحث عن رسائل الخطأ
3. تأكد من الاتصال بقاعدة البيانات

---

## ✅ Checklist:

- [ ] إنشاء حساب MongoDB Atlas
- [ ] إنشاء Cluster مجاني
- [ ] إنشاء Database User
- [ ] السماح بالوصول من أي IP
- [ ] نسخ Connection String
- [ ] تثبيت Git
- [ ] رفع المشروع على GitHub
- [ ] إنشاء Web Service على Render
- [ ] إضافة MONGODB_URI
- [ ] Deploy ناجح
- [ ] اختبار التطبيق

---

**بالتوفيق! 🚀**
