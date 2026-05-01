const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔐 API KEY
const ZAP_KEY = "YOUR_ZAP_KEY";

// ==========================
// CREATE ORDER (mobile optional)
// ==========================
app.post("/create-order", async (req, res) => {
  try {
    const { order_id, amount } = req.body;

    const response = await axios.post(
      "https://pay.zapupi.com/api/create-order",
      {
        zap_key: ZAP_KEY,
        order_id: order_id,
        amount: amount,
        // ❌ mobile hata diya
        remark: "Test Order"
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error("Create Order Error:", err.message);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ==========================
// CHECK ORDER STATUS
// ==========================
app.post("/check-status", async (req, res) => {
  try {
    const { order_id } = req.body;

    const response = await axios.post(
      "https://pay.zapupi.com/api/order-status",
      {
        zap_key: ZAP_KEY,
        order_id: order_id
      }
    );

    // Example response handling
    if (response.data.status === "SUCCESS") {
      console.log("✅ Payment Success:", order_id);
    } else {
      console.log("❌ Payment Pending/Failed:", order_id);
    }

    res.json(response.data);

  } catch (err) {
    console.error("Status Check Error:", err.message);
    res.status(500).json({ error: "Failed to check status" });
  }
});

// ==========================
// WEBHOOK (AUTO VERIFY)
// ==========================
app.post("/webhook", (req, res) => {
  try {
    const data = req.body;

    if (data.status === "SUCCESS") {
      console.log("✅ Payment Success:", data.order_id);
    } else {
      console.log("❌ Payment Failed:", data.order_id);
    }

    res.status(200).send("OK");

  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// GET webhook (debug)
app.get("/webhook", (req, res) => {
  res.send("Webhook alive ✅");
});

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
