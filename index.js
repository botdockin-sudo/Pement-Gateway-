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
// Health
// ==========================
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ==========================
// Validation
// ==========================
function isValidAmount(amount) {
  return /^[0-9]+(\.[0-9]{1,2})?$/.test(amount);
}

// ==========================
// Timeout Fetch
// ==========================
async function fetchWithTimeout(url, options, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    )
  ]);
}

// ==========================
// Retry Logic
// ==========================
async function createOrderWithRetry(bodyData, retries = 2) {
  try {
    const response = await fetchWithTimeout(
      "https://pay.zapupi.com/api/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
      },
      10000
    );

    return await response.json();

  } catch (err) {
    console.log("Retrying...", err.message);

    if (retries > 0) {
      return createOrderWithRetry(bodyData, retries - 1);
    }

    throw err;
  }
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

    const bodyData = {
      zap_key: process.env.ZAP_KEY,
      order_id: orderId,
      amount: amount,
      customer_mobile: "9999999999" // 🔥 dummy mobile fix
    };

    const data = await createOrderWithRetry(bodyData);

    if (!data || data.status !== "success") {
      return res.status(400).json({
        success: false,
        data: data
      });
    }

    res.json({
      success: true,
      payment_url: data.payment_url,
      order_id: orderId
    });

  } catch (err) {
    console.error("Create order error:", err.message);

    res.status(500).json({
      success: false,
      message: "Server busy, try again"
    });
  }
});

// ==========================
// ORDER STATUS
// ==========================
app.post("/api/order-status", async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "order_id required"
      });
    }

    const response = await fetchWithTimeout(
      "https://pay.zapupi.com/api/order-status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          zap_key: process.env.ZAP_KEY,
          order_id: order_id
        })
      },
      10000
    );

    const data = await response.json();

    res.json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error("Order status error:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to check status"
    });
  }
});

// ==========================
// WEBHOOK
// ==========================
app.post("/webhook", (req, res) => {
  try {
    const data = req.body;

    console.log("📩 Webhook received:", data);

    if (!data || !data.order_id) {
      return res.status(400).send("Invalid");
    }

    const status = (data.status || "").toLowerCase();

    if (status === "success") {
      console.log("✅ Payment Success:", data.order_id);
    } else if (status === "pending") {
      console.log("⏳ Payment Pending:", data.order_id);
    } else {
      console.log("❌ Payment Failed:", data.order_id);
    }

    // ⚡ VERY IMPORTANT
    res.status(200).send("OK");

  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// ==========================
// DEBUG
// ==========================
app.get("/webhook", (req, res) => {
  res.send("Webhook alive ✅");
});

// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
