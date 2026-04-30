<?php

$headers = getallheaders();

// 🔐 Secret check
if (!isset($headers['x-secret']) || $headers['x-secret'] !== "zapupi_secure_987654") {
    http_response_code(403);
    exit("Unauthorized");
}

$data = json_decode(file_get_contents("php://input"), true);

$order_id = $data['order_id'];
$txn_id   = $data['txn_id'];
$amount   = $data['amount'];

// 🗄️ DB connect
$conn = new mysqli("localhost", "username", "password", "database");

// 🔁 Duplicate check
$check = $conn->query("SELECT * FROM payments WHERE txn_id='$txn_id'");
if ($check->num_rows > 0) {
    exit("Already done");
}

// 💾 Save
$conn->query("INSERT INTO payments (order_id, txn_id, amount) VALUES ('$order_id','$txn_id','$amount')");

// 🎯 USER FIND
$res = $conn->query("SELECT user_id FROM orders WHERE order_id='$order_id'");
$row = $res->fetch_assoc();
$user_id = $row['user_id'];

// 🚀 Upgrade
$conn->query("UPDATE users SET plan='pro' WHERE id='$user_id'");

echo "User upgraded";
