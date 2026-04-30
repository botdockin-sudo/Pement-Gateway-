const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// 🔐 apni ZapUPI API key daalo
const ZAP_KEY = "zap9d12dc7dbc63c120a91350a2f000793c";

// 🔐 PHP secret (optional)
const SECRET = "zapupi_secure_987654";

// 🟢 TEST ROUTE
app.get("/", (req, res) => {
    res.send("Server Running 🚀");
});


// 🔹 CREATE ORDER
app.post("/create-order", async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.json({ error: "Amount missing" });
        }

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
            return res.json({ error: "No payment link", full: data });
        }

        res.json({
            payment_url: data.payment_url,
            order_id: order_id
        });

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// 🔹 WEBHOOK (ZapUPI se)
app.post("/webhook", async (req, res) => {
    const data = req.body;

    console.log("Webhook:", data);

    // ❌ Ignore failed
    if (data.status !== "Success") {
        return res.send("Ignored");
    }

    try {
        // 🔥 VERIFY FROM ZapUPI
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

        // ✅ FINAL CHECK
        if (result.status === "Success") {
            console.log("Payment verified ✅");

            // 🔁 PHP ko bhejna (optional)
            await fetch("https://yourdomain.com/api/upgrade.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-secret": SECRET
                },
                body: JSON.stringify(result)
            });

            console.log("User upgrade call sent");
        }

    } catch (err) {
        console.error("Webhook Error:", err);
    }

    // ⚠️ Always respond fast
    res.send("OK");
});


// 🔥 SERVER START
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started 🚀");
});
