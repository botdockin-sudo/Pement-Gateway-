require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// ==========================
// Middlewares
// ==========================
app.use(express.json());
app.use(cors());

// ==========================
// Health check
// ==========================
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ==========================
// Validation functions
// ==========================
function isValidAmount(amount) {
  return /^[0-9]+(\.[0-9]{1,2})?$/.test(amount);
}

function isValidMobile(mobile) {
  return /^[6-9][0-9]{9}$/.test(mobile);
}

// ==========================
// Create Order API
// ==========================
app.post("/api/create-order", async (req, res) => {
  try {
    let { amount, mobile } = req.body;

    amount = String(amount);
    mobile = String(mobile);

    // ❌ validation
    if (!isValidAmount(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({ error: "Invalid mobile" });
    }

    // ✅ clean order id (no slash)
    const orderId = "ORD" + Date.now();

    const response = await fetch("https://pay.zapupi.com/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        zap_key: process.env.ZAP_KEY,
        order_id: orderId,
        amount: amount,
        customer_mobile: mobile
      })
    });

    const data = await response.json();

    if (data.status !== "success") {
      return res.status(400).json(data);
    }

    res.json({
      success: true,
      payment_url: data.payment_url,
      order_id: orderId
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// ==========================
// Webhook (MAIN FIX)
// ==========================

// POST webhook (ZapUPI yahi hit karega)
app.post("/webhook", (req, res) => {
  try {
    const data = req.body;

    console.log("📩 Webhook received:", data);

    // basic check
    if (!data || !data.order_id) {
      return res.status(400).send("Invalid");
    }

    // status handling
    if (data.status === "Success" || data.status === "success") {
      console.log("✅ Payment Success:", data.order_id);
    } else {
      console.log("❌ Payment Failed:", data.order_id);
    }

    // ⚡ IMPORTANT: fast response
    res.status(200).send("OK");

  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// GET webhook (debug ke liye)
app.get("/webhook", (req, res) => {
  res.status(200).send("Webhook alive ✅");
});

// ==========================
// Start server
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
