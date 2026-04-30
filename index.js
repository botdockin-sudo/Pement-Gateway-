const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔐 API KEY
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

        const params = new URLSearchParams();
        params.append("zap_key", ZAP_KEY);
        params.append("order_id", order_id);
        params.append("amount", amount);

        const response = await fetch("https://pay.zapupi.com/api/create-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        const data = await response.json();

        console.log("Create Order:", data);

        if (!data.payment_url) {
            return res.send("Payment link error");
        }

        // 🔥 REAL PAYMENT REDIRECT
        return res.redirect(data.payment_url);

    } catch (err) {
        console.error(err);
        res.send("Server error");
    }
});


// 🔥 WEBHOOK (ZapUPI se)
app.post("/webhook", async (req, res) => {
    const data = req.body;

    console.log("Webhook:", data);

    if (data.status !== "Success") {
        return res.send("Ignored");
    }

    try {
        // 🔥 VERIFY PAYMENT
        const params = new URLSearchParams();
        params.append("zap_key", ZAP_KEY);
        params.append("order_id", data.order_id);

        const verify = await fetch("https://pay.zapupi.com/api/order-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        const result = await verify.json();

        console.log("Verify Result:", result);

        if (result.status === "Success") {
            console.log("Payment verified ✅");

            // 👉 Yaha user upgrade logic lagao
            // example:
            // update DB, activate plan, etc.
        }

    } catch (err) {
        console.error("Webhook Error:", err);
    }

    res.send("OK");
});


// 🔥 SERVER START
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started 🚀");
});
