// 🚨 나쁜 코드 예시 1: 하드코딩된 비밀정보

const express = require("express");
const app = express();

// ❌ API 키가 하드코딩되어 있음!
const api_key = "sk-1234567890abcdefghijklmnop";
const password = "mySecretPassword123!";
const github_token = "ghp_1234567890abcdefghijklmnop";

// ❌ AWS Secret이 노출됨!
const aws_secret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

app.post("/login", (req, res) => {
  // ❌ SQL Injection 위험!
  const query = `SELECT * FROM users WHERE email='${req.body.email}' AND password='${req.body.password}'`;

  // ❌ 디버그 코드가 남아있음!
  console.log("Login attempt:", req.body);
  console.debug("Query:", query);

  db.query(query, (err, result) => {
    if (err) {
      console.error("Database error:", err);
    }
    res.json(result);
  });
});

// ❌ 또 다른 하드코딩된 토큰
const secret_token = "my-super-secret-token-12345";

module.exports = app;
