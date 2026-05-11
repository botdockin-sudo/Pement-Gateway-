require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const admin = require("firebase-admin");
const TelegramBot = require("node-telegram-bot-api");
const multer = require("multer");

// 1. Firebase Setup
// Dhayan de: firebase-key.json file aapke folder me honi chahiye
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});
const db = admin.database();

// 2. Telegram Setup
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// 3. Multer Setup (Memory me file save karne ke liye)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());
app.use(cors());

// ==========================
// A. PAYMENT: CREATE ORDER
// ==========================
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const orderId = "ORD" + Date.now();

    const response = await fetch("https://pay.zapupi.com/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zap_key: process.env.ZAP_KEY,
        order_id: orderId,
        amount: amount
      })
    });

    const data = await response.json();
    if (data.status !== "success") return res.status(400).json(data);

    // Firebase me Save karein
    await db.ref("orders/" + orderId).set({
      order_id: orderId,
      amount: amount,
      status: "Pending",
      timestamp: admin.database.ServerValue.TIMESTAMP
    });

    res.json({ success: true, payment_url: data.payment_url, order_id: orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// B. PAYMENT: WEBHOOK (ZapUPI call karega)
// ==========================
app.post("/webhook", async (req, res) => {
  const data = req.body;
  console.log("📩 Webhook Received:", data);

  if (data && data.order_id) {
    const status = data.status; // Success ya Failed

    // Firebase Update
    await db.ref("orders/" + data.order_id).update({ status: status });

    // Telegram Alert
    const emoji = status === "Success" ? "✅" : "❌";
    bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `${emoji} **Payment Update**\n\nOrder: ${data.order_id}\nStatus: ${status}`);
  }
  res.status(200).send("OK");
});

// ==========================
// C. IMAGE: UPLOAD TO TELEGRAM & FIREBASE
// ==========================
app.post("/upload-image", upload.single("myImage"), async (req, res) => {
  try {
    const file = req.file;
    const desc = req.body.description || "No description";

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // 1. Send to Telegram
    const telMsg = await bot.sendPhoto(process.env.TELEGRAM_CHAT_ID, file.buffer, {
      caption: `📸 **New Website Upload**\n\n📝 Desc: ${desc}\n⏰ Time: ${new Date().toLocaleString()}`,
      parse_mode: "Markdown"
    });

    // 2. Save Metadata to Firebase
    const imgId = "IMG" + Date.now();
    await db.ref("gallery/" + imgId).set({
      image_id: imgId,
      description: desc,
      telegram_msg_id: telMsg.message_id,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });

    res.json({ success: true, message: "Image sent and recorded!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
