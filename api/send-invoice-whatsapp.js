import { getAdminDb, getAdminAuth } from './_lib/firebaseAdmin.js'

function normalizePhone(phone) {
  let cleaned = String(phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '2' + cleaned;
  }
  return cleaned;
}

export default async function handler(req, res) {
  // تفعيل CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Fix: Verify Firebase Auth token — staff only
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }
  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const db = getAdminDb();
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const role = userSnap.exists ? userSnap.data().role : null;
    if (!['admin', 'cashier'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden: staff only' });
    }
  } catch {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }

  const id = req.query?.id || req.body?.id;
  if (!id) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('invoices').doc(id).get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = snapshot.data();
    const customer = invoice.customerData || {};
    
    if (!customer.phone) {
      return res.status(400).json({ error: 'Customer phone number is missing in this invoice' });
    }

    const phone = normalizePhone(customer.phone);
    const name = customer.name || 'عميلنا العزيز';
    const invNumber = invoice.number || 'غير معروف';
    const total = invoice.total || 0;
    const paid = invoice.paidAmount || 0;
    const due = invoice.dueAmount || 0;

    // الحصول على الدومين ديناميكياً لإنشاء رابط الفاتورة للمعاينة أونلاين
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'elfarouk-store.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const receiptLink = `${protocol}://${host}/receipt/${id}`;

    // الـ Secrets من بيئة Vercel
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      return res.status(500).json({ error: 'WhatsApp secrets are not configured on Vercel' });
    }

    const messageBody =
      `📄 *فاتورة شراء جديدة - الفاروق ستور*\n\n` +
      `السلام عليكم ${name} 👋\n\n` +
      `نشكركم على ثقتكم بنا. تم إصدار فاتورتكم بنجاح:\n\n` +
      `🔢 *رقم الفاتورة:* ${invNumber}\n` +
      `💰 *الإجمالي:* ${total} ج.م\n` +
      `💵 *المدفوع:* ${paid} ج.م\n` +
      (due > 0 ? `⏳ *المتبقي (آجل):* ${due} ج.م\n` : `✅ *حالة الدفع:* مدفوعة بالكامل\n`) +
      `\n🔗 *رابط عرض الفاتورة والتفاصيل أونلاين:*\n${receiptLink}\n\n` +
      `نتمنى لكم يوماً سعيداً ونسعد دائماً بخدمتكم! 🚗\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `الفاروق ستور للسيارات`;

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    
    const waResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: {
          preview_url: true,
          body: messageBody,
        },
      }),
    });

    const waData = await waResponse.json();

    if (!waResponse.ok) {
      console.error('❌ WhatsApp API error:', JSON.stringify(waData));
      return res.status(502).json({
        error: 'WhatsApp API rejected the request',
        details: waData,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: waData?.messages?.[0]?.id,
    });

  } catch (error) {
    console.error('💥 WhatsApp sending error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send WhatsApp message',
    });
  }
}
