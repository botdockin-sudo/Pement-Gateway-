const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const ZAP_KEY = "zap9d12dc7dbc63c120a91350a2f000793c";
const SECRET = "zapupi_secure_987654";

app.get("/", (req, res) => {
    res.send("Server Running 🚀");
});

// 🔥 Webhook
app.post("/webhook", async (req, res) => {
    const data = req.body;

    console.log("Webhook:", data);

    if (data.status !== "Success") {
        return res.send("Ignored");
    }

    try {
        // 🔁 VERIFY (ZapUPI se)
        const verify = await fetch("https://pay.zapupi.com/api/order-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                zap_key: ZAP_KEY,
                order_id: data.order_id
            })
        });

        const result = await verify.json();

        if (result.status === "Success") {

            // 🔁 PHP ko call
            await fetch("https://yourdomain.com/api/upgrade.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-secret": SECRET
                },
                body: JSON.stringify(result)
            });

            console.log("Verified & Sent to PHP");
        }

    } catch (err) {
        console.error(err);
    }

    res.send("OK");
});

app.listen(process.env.PORT || 3000);
