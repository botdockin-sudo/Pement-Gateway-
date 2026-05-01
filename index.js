require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// ==========================
// MEMORY STORE
// ==========================
const orders = {};

// ==========================
// HOME
// ==========================
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ==========================
// CREATE ORDER
// ==========================
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount required" });
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
      })
    });

    const data = await response.json();

    if (data.status !== "success") {
      return res.status(400).json(data);
    }

    // pending store
    orders[orderId] = "Pending";

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
// LOCAL STATUS (WEBHOOK BASED)
// ==========================
app.post("/api/check-status", (req, res) => {
  const { order_id } = req.body;

  const status = orders[order_id] || "Pending";

  res.json({
    status: status
  });
});

// ==========================
// WEBHOOK
// ==========================
app.post("/webhook", (req, res) => {
  const data = req.body;

  console.log("📩 Webhook:", data);

  if (data && data.order_id) {
    orders[data.order_id] = data.status;

    if (data.status === "Success") {
      console.log("✅ Payment Success:", data.order_id);
    } else {
      console.log("❌ Payment Failed:", data.order_id);
    }
  }

  res.status(200).send("OK");
});

// debug
app.get("/webhook", (req, res) => {
  res.send("Webhook alive ✅");
});

// ==========================
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
