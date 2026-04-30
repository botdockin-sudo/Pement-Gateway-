const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔐 अपनी API KEY डालो
const ZAP_KEY = "zap9d12dc7dbc63c120a91350a2f000793c";

// 🟢 TEST ROUTE
app.get("/", (req, res) => {
    res.send("Server Running 🚀");
});


// 🔥 CREATE ORDER + DIRECT REDIRECT
app.get("/create-order/:amount", async (req, res) => {
    try {
        const amount = req.params.amount;
        const order_id = "ORD_" + Date.now();

        const response = await axios.post("https://pay.zapupi.com/api/create-order", {
            zap_key: ZAP_KEY,
            order_id: order_id,
            amount: amount,
            customer_mobile: "9999999999",
            remark: "Plan Purchase",
            cashier_id: "422",
            success_url: "https://yourdomain.com/success",
            failed_url: "https://yourdomain.com/failed",
            timeout_url: "https://yourdomain.com/timeout"
        });

        const data = response.data;

        console.log("Create Order:", data);

        if (!data.payment_url) {
            return res.send("Error: " + JSON.stringify(data));
        }

        // 🔥 DIRECT REDIRECT (REAL PAYMENT FLOW)
        return res.redirect(data.payment_url);

    } catch (err) {
        console.error("ERROR:", err.response?.data || err.message);
        res.send("Server error");
    }
});


// 🔥 WEBHOOK (PAYMENT CONFIRMATION)
app.post("/webhook", async (req, res) => {
    const data = req.body;

    console.log("Webhook:", data);

    if (data.status !== "Success") {
        return res.send("Ignored");
    }

    try {
        const verify = await axios.post("https://pay.zapupi.com/api/order-status", {
            zap_key: ZAP_KEY,
            order_id: data.order_id
        });

        const result = verify.data;

        console.log("Verify Result:", result);

        if (result.status === "Success") {
            console.log("Payment verified ✅");

            // 👉 यहाँ अपना logic डालो
            // user upgrade / DB update etc.
        }

    } catch (err) {
        console.error("Webhook Error:", err.response?.data || err.message);
    }

    res.send("OK");
});


// 🔥 SERVER START
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started 🚀");
});
