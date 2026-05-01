require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// ✅ allow all origins (frontend use ke liye)
app.use(cors({
  origin: "*"
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// ==========================
// Validation
// ==========================
function isValidAmount(amount) {
  return /^[0-9]+(\.[0-9]{1,2})?$/.test(amount);
}

function isValidMobile(mobile) {
  return /^[6-9][0-9]{9}$/.test(mobile);
}

// ==========================
// API Endpoint
// ==========================
app.post("/api/create-order", async (req, res) => {
  try {
    let { amount, mobile } = req.body;

    amount = String(amount);
    mobile = String(mobile);

    if (!isValidAmount(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({ error: "Invalid mobile" });
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
      payment_url: data.payment_url
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("API running 🚀");
});
