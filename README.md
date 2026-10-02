# 🚚 ELFAROUK STORE — Website + ERP + AI Platform
> نظام متكامل لإدارة تجارة وتوزيع قطع غيار عربات النقل والدبابة والجامبو والسيارات، مزود بطبقة ذكاء اصطناعي مدمجة في الـ ERP والمتجر الإلكتروني.

---

## 🌟 نظرة عامة على المشروع (Project Overview)

منظومة برمجية متكاملة للإنتاج الفعلي (Production-Ready) مبنية بتقنيات الويب الحديثة وتعمل في بيئة السحاب:
* **نظام تخطيط موارد المؤسسات (ERP)**: إدارة المخازن، المبيعات (POS)، المشتريات، الموردين، حسابات العملاء، المديونيات، عروض الأسعار، وجداول حجز الصيانة.
* **طبقة الذكاء الاصطناعي المدمجة (AI Intelligence Layer)**: 
  - **مساعد قطع الغيار الذكي للعميل**: فهم اللغة الطبيعية، التحقق الدقيق من توافق القطع مع موديلات سيارات النقل (الدبابة، الجامبو، ديماكس، هيلوكس، كانتر، سوزوكي فان)، وعرض المخزون اللحظي وزر الإضافة المباشرة للسلة.
  - **مساعد الأعمال الذكي لصاحب المحل (AI Business Dashboard)**: التنبؤ بالطلب بالمعادلات الإحصائية (Croston's Method)، اكتشاف الرواكد (Dead Stock)، والتنبيه بالنواقص مع توليد كميات إعادة الطلب المقترحة، والإجابة عن استفسارات المبيعات باللغة الطبيعية.
* **الأمان والحماية المتقدمة (Security & Hardening)**: حماية ضد التخمين العنيف (Anti-Brute Force)، ترويسات أمان صارمة (CSP, HSTS, X-Frame-Options)، وتشفير كامل للـ APIs.

---

## 🛠️ التكنولوجيا المستخدمة (Tech Stack)

### 1. الواجهة الأمامية (Frontend):
* **React 18** مع التوجيه الديناميكي والتحميل الكسول (**React Router v6 + Lazy Loading**).
* **Vite 8**: بيئة بناء سريعة وفائقة الكفاءة.
* **TailwindCSS v3**: تصميم عصري يدعم الـ Dark/Light Mode.
* **Framer Motion & Lucide Icons**: حركات سلسة وأيقونات متناسقة.
* **Recharts**: رسوم بيانية وتحليلات بصرية لحظية.

### 2. الواجهة الخلفية والخوادم (Backend & Serverless):
* **Vercel Serverless Functions (`/api/*`)**: بيئة Node.js سريعة وآمنة.
* **Firebase Admin SDK**: للتحكم الآمن في العمليات الإدارية وتوثيق الـ Auth Tokens.
* **Sliding-Window Rate Limiting**: حماية الـ APIs من الاستهلاك المفرط والهجمات.

### 3. قاعدة البيانات والمصادقة (Database & Auth):
* **Google Cloud Firestore**: قاعدة بيانات NoSQL فورية تدعم التزامن في الوقت الفعلي (Real-time).
* **Firebase Authentication**: تشفير كلمات المرور بحماية `scrypt + salt`.

---

## 📁 هيكلية المجلدات الرئيسية (Folder Structure)

```
elfarouk-store/
├── api/                           # خوادم الـ Serverless APIs
│   ├── _lib/                      # دوال مشتركة (Auth, RateLimit, Mailer, Database)
│   ├── ai/                        # محركات الذكاء الاصطناعي
│   │   └── _lib/
│   │       ├── aiEngine.js        # خوارزميات الترتيب، التنبؤ بالطلب، والاقتراحات
│   │       └── automotiveTaxonomy.js # قاموس سيارات النقل ومصطلحات قطع الغيار
│   ├── ai-business-assistant.js   # مساعد الـ ERP لصاحب المحل
│   ├── ai-customer-assistant.js   # مساعد العميل والبحث الذكي
│   ├── send-invoice-whatsapp.js   # خدمة إرسال الفواتير عبر واتساب
│   └── create-cashier-user.js     # إنشاء وتأمين حسابات الكاشير
│
├── src/                           # كود الواجهة الأمامية (React)
│   ├── components/                # المكونات المشتركة
│   │   ├── ai/                    # مكونات الذكاء الاصطناعي (AIAssistantWidget)
│   │   ├── layout/                # الهيكل العام والقائمة الجانبية (Layout)
│   │   ├── ErrorBoundary.jsx      # معالج الأخطاء العام
│   │   └── LoadingScreen.jsx       # شاشة التحميل السريع
│   ├── context/                   # إدارة الحالة والمصادقة (StoreContext & AuthContext)
│   ├── firebase/                  # تهيئة ومجموعات Firestore
│   ├── pages/                     # شاشات الـ ERP والمتجر
│   │   ├── AIBusinessAssistant.jsx# لوحة تحليلات الذكاء الاصطناعي والتنبؤ بالطلب
│   │   ├── Products.jsx           # إدارة المنتجات وتوافق السيارات
│   │   ├── POS.jsx                # نقطة البيع والفواتير
│   │   └── Customers.jsx          # العملاء وأسطول النقل
│   ├── services/                  # واجهات الاتصال بالـ Backend APIs
│   └── utils/                     # الأدوات المساعدة والاختبارات
│
├── vercel.json                    # إعدادات النشر وترويسات الأمان
├── firestore.rules                # قواعد أمان قاعدة البيانات
└── ARCHITECTURE.md                # وثيقة التصميم المعماري الشاملة
```

---

## 🚀 التشغيل والتثبيت المحلي (Local Setup & Run)

### المتطلبات الأساسية:
* Node.js (الإصدار 18 أو أحدث)
* npm أو yarn

### خطوات التثبيت:
```bash
# 1. تثبيت الحزم البرمجية
npm install

# 2. إنشاء ملف المتغيرات البيئية .env
cp .env.example .env

# 3. تشغيل خادم التطوير المحلي
npm run dev
```

---

## 🔐 المتغيرات البيئية (Environment Variables)

قم بملء البيانات التالية في ملف `.env`:
```ini
# إعدادات Firebase Client SDK
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_WHATSAPP_NUMBER=201115329887

# إعدادات Firebase Admin (على Vercel Serverless فقط)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account", ...}
```

---

## 🛡️ إرشادات الأمان والإنتاج (Production Security Highlights)
1. جميع ملفات الـ `.env` والمفاتيح مستثناة بالكامل في `.gitignore`.
2. حماية الـ APIs بالتحقق الإلزامي من صلاحيات `admin` و `cashier` عبر `verifyIdToken`.
3. تفعيل حماية ضد التخمين العنيف (Anti-Brute Force): يتم قفل تسجيل الدخول مؤقتاً عند تكرار المحاولات الخاطئة.
4. منع تخريف الذكاء الاصطناعي (Zero-Hallucination): استرجاع بيانات الأسعار والتوافق والمخزون لحظياً من الـ ERP وليس من تخمينات لغوية.
