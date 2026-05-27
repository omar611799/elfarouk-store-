/**
 * ====================================================
 * elfarouk-store - WhatsApp Maintenance Reminders
 * يعمل عبر GitHub Actions مجاناً كل يوم الساعة 9 صباحاً
 * ====================================================
 */

const admin = require("firebase-admin");
const axios = require("axios");

// =====================================================
// تهيئة Firebase Admin باستخدام Service Account
// =====================================================
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// =====================================================
// الدالة الرئيسية
// =====================================================
async function main() {
  console.log("🔔 بدء إرسال تذكيرات الصيانة...");
  console.log(`📅 وقت التشغيل: ${new Date().toLocaleString("ar-EG")}`);

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.error("❌ الـ Secrets غير موجودة!");
    process.exit(1);
  }

  try {
    // حساب التاريخ بعد 3 أيام
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 3);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    console.log(`📅 البحث عن مواعيد بتاريخ: ${targetDateStr}`);

    // البحث في Firestore
    const snapshot = await db
      .collection("maintenance")
      .where("nextServiceDate", "==", targetDateStr)
      .get();

    if (snapshot.empty) {
      console.log("✅ لا توجد مواعيد للإرسال اليوم.");
      return;
    }

    console.log(`📋 وُجد ${snapshot.size} عميل للتذكير.`);

    let success = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      if (!data.customerPhone || !data.customerName) {
        console.warn(`⚠️ بيانات ناقصة - تخطي السجل: ${doc.id}`);
        continue;
      }

      const phone = String(data.customerPhone).replace(/^\+/, "");
      const name = data.customerName;
      const vehicle = data.vehicleInfo || "السيارة";

      try {
        await sendWhatsAppMessage(phone, name, vehicle, targetDateStr, token, phoneId);
        console.log(`✅ تم الإرسال لـ ${name} (${phone})`);
        success++;
      } catch (err) {
        console.error(`❌ فشل الإرسال لـ ${name}: ${err.message}`);
        failed++;
      }

      // تأخير بسيط لتجنب Rate Limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ نجحت: ${success}`);
    console.log(`❌ فشلت: ${failed}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("💥 خطأ:", error.message);
    process.exit(1);
  }
}

// =====================================================
// دالة إرسال رسالة واتساب
// =====================================================
async function sendWhatsAppMessage(phone, name, vehicle, date, token, phoneId) {
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

  const body =
    `🔧 *تذكير صيانة - الفاروق ستور*\n\n` +
    `السلام عليكم ${name} 👋\n\n` +
    `نذكّركم بأن موعد صيانة *${vehicle}* القادم بعد 3 أيام.\n\n` +
    `📅 *التاريخ:* ${date}\n\n` +
    `نسعد بخدمتكم دائماً! 🚗\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `الفاروق ستور للسيارات`;

  const response = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

// =====================================================
// تشغيل
// =====================================================
main().catch((err) => {
  console.error("💥 خطأ غير متوقع:", err);
  process.exit(1);
});
