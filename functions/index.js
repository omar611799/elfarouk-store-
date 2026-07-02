/**
 * ====================================================
 * elfarouk-store - WhatsApp Maintenance Reminders
 * Firebase Cloud Functions - index.js
 * ====================================================
 *
 * هذا الكود يرسل تذكيرات واتساب تلقائياً للعملاء
 * قبل موعد صيانة سياراتهم بـ 3 أيام.
 *
 * يعمل كل يوم الساعة 9 صباحاً (بتوقيت مصر/السعودية).
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios = require("axios");

// =====================================================
// تعريف الـ Secrets (الأسرار الآمنة)
// =====================================================
const WHATSAPP_TOKEN = defineSecret("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_ID = defineSecret("WHATSAPP_PHONE_ID");

// =====================================================
// تهيئة Firebase Admin
// =====================================================
admin.initializeApp();
const db = admin.firestore();

// =====================================================
// الدالة الرئيسية - تعمل كل يوم الساعة 9 صباحاً
// =====================================================
exports.sendMaintenanceReminders = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "Africa/Cairo",
    secrets: [WHATSAPP_TOKEN, WHATSAPP_PHONE_ID],
    region: "europe-west1",
  },
  async (_event) => {
    console.log("🔔 بدء إرسال تذكيرات الصيانة...");

    try {
      // حساب التاريخ بعد 3 أيام
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 3);

      // تحويل التاريخ لصيغة YYYY-MM-DD
      const targetDateStr = targetDate.toISOString().split("T")[0];

      console.log(`📅 البحث عن مواعيد: ${targetDateStr}`);

      // البحث في Firestore
      const snapshot = await db
        .collection("maintenance")
        .where("nextServiceDate", "==", targetDateStr)
        .get();

      if (snapshot.empty) {
        console.log("✅ لا توجد مواعيد اليوم.");
        return;
      }

      console.log(`📋 وُجد ${snapshot.size} عميل للتذكير.`);

      // إرسال رسالة لكل عميل
      const promises = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // التحقق من وجود البيانات المطلوبة
        if (!data.customerPhone || !data.customerName) {
          console.warn(
            `⚠️ بيانات ناقصة للسجل: ${doc.id} - تخطي.`
          );
          return;
        }

        // تنظيف رقم الهاتف (إزالة + إن وُجدت)
        const phone = String(data.customerPhone).replace(/^\+/, "");
        const name = data.customerName;
        const vehicle = data.vehicleInfo || "السيارة";

        console.log(`📱 إرسال لـ ${name} على ${phone}`);

        promises.push(
          sendWhatsAppMessage(
            phone,
            name,
            vehicle,
            targetDateStr,
            WHATSAPP_TOKEN.value(),
            WHATSAPP_PHONE_ID.value()
          )
        );
      });

      // انتظار إرسال جميع الرسائل
      const results = await Promise.allSettled(promises);

      let success = 0;
      let failed = 0;
      results.forEach((result) => {
        if (result.status === "fulfilled") success++;
        else {
          failed++;
          console.error("❌ فشل الإرسال:", result.reason?.message);
        }
      });

      console.log(
        `✅ الإرسال اكتمل: ${success} نجحت، ${failed} فشلت.`
      );
    } catch (error) {
      console.error("💥 خطأ غير متوقع:", error);
      throw error;
    }
  }
);

// =====================================================
// دالة مساعدة: إرسال رسالة واتساب
// =====================================================
async function sendWhatsAppMessage(
  phone,
  customerName,
  vehicleInfo,
  serviceDate,
  token,
  phoneNumberId
) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  // صياغة الرسالة بالعربية
  const messageBody =
    `🔧 *تذكير صيانة - الفاروق ستور*\n\n` +
    `السلام عليكم ${customerName} 👋\n\n` +
    `نذكّركم بأن موعد صيانة *${vehicleInfo}* القادم بعد 3 أيام.\n\n` +
    `📅 *التاريخ:* ${serviceDate}\n\n` +
    `نتمنى أن تكون بخير، ونسعد بخدمتكم دائماً! 🚗\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `الفاروق ستور للسيارات`;

  const response = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: {
        preview_url: false,
        body: messageBody,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log(
    `✅ تم الإرسال لـ ${phone}:`,
    response.data?.messages?.[0]?.id
  );
  return response.data;
}
