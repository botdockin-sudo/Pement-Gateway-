app.post("/webhook", async (req, res) => {
    const data = req.body;

    console.log("Webhook:", data);

    const order_id = data.order_id;
    const status = data.status;

    // ❌ Ignore failed
    if (status !== "Success") {
        return res.send("Ignored");
    }

    try {
        // 🔥 DOUBLE VERIFY (MOST IMPORTANT)
        const params = new URLSearchParams();
        params.append("zap_key", "zap9d12dc7dbc63c120a91350a2f000793c");
        params.append("order_id", order_id);

        const verify = await fetch("https://pay.zapupi.com/api/order-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        const result = await verify.json();

        console.log("Verify:", result);

        // ✅ FINAL CHECK
        if (result.status === "Success") {

            // 🔁 PHP ko send karo (user upgrade)
            await fetch("https://yourdomain.com/api/upgrade.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-secret": "YOUR_SECRET"
                },
                body: JSON.stringify(result)
            });

            console.log("User upgraded");
        }

    } catch (err) {
        console.error("ERROR:", err);
    }

    // ⚠️ Always 200 return
    res.send("OK");
});
