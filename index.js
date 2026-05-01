require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// ==========================
app.use(express.json());
app.use(cors());

// ==========================
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ==========================
// Validation (only amount)
// ==========================
function isValidAmount(amount) {
  return /^[0-9]+(\.[0-9]{1,2})?$/.test(amount);
}

// ==========================
// CREATE ORDER
// ==========================
app.post("/api/create-order", async (req, res) => {
  try {
    let { amount } = req.body;

    amount = String(amount);

    if (!isValidAmount(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const orderId = "ORD" + Date.now();

    const response = await fetch("https://pay.zapupi.com/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        zap_key: process.env.ZAP_KEY,
        order_id: orderId,
        amount: amount
        // ❌ mobile removed
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// ORDER STATUS
// ==========================
app.post("/api/order-status", async (req, res) => {
  try {
    const { order_id } = req.body;

    const response = await fetch("https://pay.zapupi.com/api/order-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        zap_key: process.env.ZAP_KEY,
        order_id: order_id
      })
    });

    const data = await response.json();

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// WEBHOOK
// ==========================
app.post("/webhook", (req, res) => {
  const data = req.body;

  console.log("Webhook:", data);

  if (data.status === "Success" || data.status === "success") {
    console.log("✅ Payment Success:", data.order_id);
  } else {
    console.log("❌ Payment Failed:", data.order_id);
  }

  res.status(200).send("OK");
});

// debug
app.get("/webhook", (req, res) => {
  res.send("Webhook alive ✅");
});

// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
