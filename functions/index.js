/**
 * ====================================================
 * elfarouk-store - WhatsApp Maintenance Reminders
 * Firebase Cloud Functions - index.js
 * ====================================================
 *
 * هذا الكود يرسل تذكيرات واتساب تلقائياً للعملاء
 * قبل موعد صيانة سياراتهم بـ 3 أيام من فواتير المبيعات وحجوزات الصيانة.
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
if (!admin.apps.length) {
  admin.initializeApp();
}
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
    console.log("🔔 بدء فحص وإرسال تذكيرات الصيانة اليومية...");

    try {
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 3);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      console.log(`📅 البحث عن مواعيد صيانة مستحقة لتاريخ: ${targetDateStr}`);

      const remindersToSend = [];

      // 1. البحث في حجوزات الصيانة (serviceBookings)
      const bookingsSnap = await db
        .collection("serviceBookings")
        .where("bookingDate", "==", targetDateStr)
        .where("status", "in", ["confirmed", "pending"])
        .get()
        .catch(() => ({ docs: [] }));

      bookingsSnap.docs?.forEach((doc) => {
        const data = doc.data();
        if (data.customerPhone && data.customerName) {
          remindersToSend.push({
            phone: String(data.customerPhone).replace(/^\+/, ""),
            name: data.customerName,
            vehicle: data.carModel || data.licensePlate || "السيارة",
            serviceName: data.serviceType || "حجز صيانة دورية",
            dueDate: targetDateStr,
            source: "service_booking",
          });
        }
      });

      // 2. البحث في فواتير المبيعات ذات التذكيرات (invoices -> customerData.reminders)
      const invoicesSnap = await db
        .collection("invoices")
        .orderBy("createdAt", "desc")
        .limit(300)
        .get()
        .catch(() => ({ docs: [] }));

      invoicesSnap.docs?.forEach((doc) => {
        const inv = doc.data();
        const customer = inv.customerData || {};
        if (Array.isArray(customer.reminders) && customer.reminders.length > 0 && customer.phone) {
          const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt || Date.now());

          customer.reminders.forEach((rem) => {
            const dueDate = new Date(invDate);
            dueDate.setMonth(dueDate.getMonth() + (Number(rem.months) || 0));
            const dueStr = dueDate.toISOString().split("T")[0];

            if (dueStr === targetDateStr) {
              remindersToSend.push({
                phone: String(customer.phone).replace(/^\+/, ""),
                name: customer.name || "عميلنا العزيز",
                vehicle: customer.carModel || "السيارة",
                serviceName: rem.name || "صيانة وتغيير قطع غيار",
                dueDate: targetDateStr,
                source: "invoice_reminder",
              });
            }
          });
        }
      });

      if (remindersToSend.length === 0) {
        console.log("✅ لا توجد تذكيرات مستحقة لليوم.");
        return;
      }

      console.log(`📋 وُجد ${remindersToSend.length} تذكير جاهز للإرسال.`);

      // إرسال رسائل الواتساب
      const promises = remindersToSend.map((item) =>
        sendWhatsAppMessage(
          item.phone,
          item.name,
          item.vehicle,
          item.serviceName,
          item.dueDate,
          WHATSAPP_TOKEN.value(),
          WHATSAPP_PHONE_ID.value()
        )
      );

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

      console.log(`✅ نتيجة الإرسال: ${success} نجحت، ${failed} فشلت.`);
    } catch (error) {
      console.error("💥 خطأ في تشغيل دالة التذكيرات:", error);
      throw error;
    }
  }
);

// =====================================================
// دالة مساعدة: إرسال رسالة واتساب عبر Meta Cloud API
// =====================================================
async function sendWhatsAppMessage(
  phone,
  customerName,
  vehicleInfo,
  serviceName,
  serviceDate,
  token,
  phoneNumberId
) {
  let formattedPhone = String(phone || "").trim().replace(/\D/g, "");
  if (formattedPhone.startsWith("01")) {
    formattedPhone = "20" + formattedPhone.slice(1);
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const messageBody =
    `🔧 *تذكير صيانة - الفاروق ستور لقطع الغيار*\n\n` +
    `السلام عليكم أ/ *${customerName}* 👋\n\n` +
    `نود تذكيركم بموعد مراجعة صيانة: *${serviceName}*\n` +
    `لسيارتكم: *${vehicleInfo}*\n\n` +
    `📅 *الموعد المقترح:* ${serviceDate}\n\n` +
    `نسعد دائماً بخدمتكم وتوفير قطع الغيار الأصلية المعتمدة! 🚚\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `📍 الفاروق ستور - خدمة سيارات النقل والملاكي`;

  const response = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
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

  return response.data;
}
