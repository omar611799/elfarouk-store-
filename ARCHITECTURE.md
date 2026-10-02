# 📐 ELFAROUK STORE — System Architecture & Technical Specifications

> وثيقة التصميم المعماري والمواصفات الفنية لمنظومة ELFAROUK STORE (Website + ERP + AI Engine).

---

## 1. المعمارية العامة للطبقات (Layered Architectural Pattern)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           1. CLIENT PRESENTATION LAYER                      │
│   ┌───────────────────────────────┐     ┌───────────────────────────────┐   │
│   │     Customer Storefront       │     │     ERP Admin & Cashier       │   │
│   │  - AI Spare Parts Assistant   │     │  - Realtime POS & Inventory   │   │
│   │  - Commercial Truck Search    │     │  - AI Business Dashboard      │   │
│   │  - Vehicle Selector Widget    │     │  - Demand Forecast Matrix     │   │
│   └──────────────┬────────────────┘     └───────────────┬───────────────┘   │
└──────────────────┼──────────────────────────────────────┼───────────────────┘
                   │ HTTPS / JSON & Bearer Token          │
┌──────────────────▼──────────────────────────────────────▼───────────────────┐
│                    2. API GATEWAY & ORCHESTRATION LAYER                     │
│                           (/api/ai/* & /api/*)                              │
│  - Firebase Auth Token Verification (Staff vs Customer Role Checks)         │
│  - Sliding-Window Rate Limiting (DDoS & Spam Defense)                       │
│  - Input Sanitization & Parameter Validation                                │
│  - Safe JSON Error Handlers (Zero Leaked Stack Traces)                      │
└──────────────────┬──────────────────────────────────────┬───────────────────┘
                   │                                      │
┌──────────────────▼──────────────────────────────────────▼───────────────────┐
│                      3. SPECIALIZED AI & DOMAIN ENGINES                     │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────┐  │
│  │   Automotive Taxonomy   │  │   Search & Ranking      │  │ Forecasting │  │
│  │ • Truck/Dababa Models   │  │ • Multi-Factor Scoring  │  │ • Croston's │  │
│  │ • Arabic Vernacular     │  │ • Compatibility Boost   │  │   Method    │  │
│  │ • Part Entity Extraction│  │ • In-Stock Prioritization│ • Stock Out   │  │
│  │ • Placement Normalizer  │  │ • OEM vs Aftermarket    │   Estimator │  │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                 Safe Tool Layer & Deterministic Retrieval             │  │
│  │ • search_products()            • get_vehicle_compatibility()           │  │
│  │ • get_live_stock_and_price()   • get_sales_velocity_insights()         │  │
│  │ • get_frequently_bought_together() • get_dead_stock_report()         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │ Realtime Read / Write Batch Operations
┌──────────────────▼──────────────────────────────────────────────────────────┐
│                      4. DATA PERSISTENCE & STORAGE LAYER                    │
│   Google Cloud Firestore:                                                   │
│   products | customers | invoices | purchases | stockLogs | search_logs     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. الخوارزميات ونماذج الذكاء الاصطناعي المطبقة (Applied AI & ML Algorithms)

### 2.1 خوارزمية الترتيب الموزونة (Multi-Factor Scoring Ranking):
يتم احتساب درجة الترتيب (Score) لكل قطعة بناءً على المعادلة الموزونة التالية:

$$\text{Score} = S_{\text{compatibility}} (45) + S_{\text{taxonomy}} (30) + S_{\text{availability}} (15) + S_{\text{tier}} (10)$$

* **توافق السيارة ($S_{\text{compatibility}}$)**: +45 نقطة في حال التطابق التام مع موديل وسنة سيارة النقل، +20 نقطة في حال التطابق الجزئي.
* **تطابق نوع القطعة ($S_{\text{taxonomy}}$)**: +30 نقطة عند تطابق نوع القطعة من خلال القاموس الشامل لقطع النقل.
* **توفر المخزون ($S_{\text{availability}}$)**: +15 نقطة إذا كان المخزون $> 5$ قطع، -20 نقطة إذا كانت القطعة نافدة من المخزن.
* **مستوى الجودة ($S_{\text{tier}}$)**: +10 نقاط للقطع الأصلية (`OEM`)، +8 للبدائل الممتازة.

---

### 2.2 خوارزمية التنبؤ بالطلب المتقطع لقطع الغيار (Croston's Method):
تعتبر قطع غيار السيارات والشاحنات ذات **طلب متقطع (Intermittent Demand)** لا تناسبه خوارزميات الانحدار العادية. يتم تطبيق طريقة كروستون لتقدير معدل الطلب اليومي:

1. **حساب متوسط حجم الطلب غير الصفري ($\bar{z}$)**:
   $$\bar{z} = \frac{\sum_{t \in \text{Sales}} y_t}{N_{\text{sales}}}$$
2. **حساب متوسط الفاصل الزمني بين المبيعات ($\bar{p}$)**:
   $$\bar{p} = \frac{T}{N_{\text{sales}}}$$
3. **معدل الطلب المتوقع يومياً ($D_{\text{daily}}$)**:
   $$D_{\text{daily}} = \frac{\bar{z}}{\bar{p}}$$
4. **التنبؤ لفترة 7 أيام و 30 يوماً وتاريخ النفاد**:
   $$\text{Forecast}_{7d} = \lceil D_{\text{daily}} \times 7 \rceil, \quad \text{DaysUntilStockOut} = \lfloor \frac{\text{CurrentStock}}{D_{\text{daily}}} \rfloor$$

---

## 3. نموذج الأمان ومنع التخريف (Zero-Hallucination Guardrails)

* **الفصل الصارم بين الاستدلال والبيانات الحية**: لا يقوم الذكاء الاصطناعي بتخمين المخزون أو الأسعار مطلقاً، بل يستدعي فقط الدوال الصريحة (`Deterministic Tools`) التي تقرأ من قاعدة بيانات الـ ERP في لحظة الطلب.
* **قاعدة التوافق الإلزامية**: إذا لم يُعثر على سجل توافق مؤكد في قاعدة البيانات بين القطعة وموديل السيارة، يرفض النظام تأكيد التوافق ويطلب رقم الشاسيه (VIN) أو يوضح البدائل صراحةً.
* **الصلاحيات والعمليات الحساسة**: جميع عمليات التعديل، والحذف، وإصدار الفواتير تتطلب جلسة مصادقة موثقة للمدير أو الكاشير، مع وجود تأكيد بشري يدوي (Human-in-the-loop).
