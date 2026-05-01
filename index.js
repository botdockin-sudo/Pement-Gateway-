require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Home route
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ==========================
// Create Order API
// ==========================
app.post("/create-order", async (req, res) => {
  try {
    const { amount, mobile } = req.body;

    const response = await fetch("https://pay.zapupi.com/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        zap_key: process.env.ZAP_KEY,
        order_id: "ORD_" + Date.now(),
        amount: amount,
        customer_mobile: mobile,
        remark: "Test Order",
        success_url: "https://your-app.onrender.com/success",
        failed_url: "https://your-app.onrender.com/failed",
        timeout_url: "https://your-app.onrender.com/timeout"
      })
    });

    const data = await response.json();

    res.json({
      success: true,
      payment_url: data.payment_url,
      full: data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==========================
// Webhook
// ==========================
app.post("/webhook", (req, res) => {
  console.log("Webhook:", req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
