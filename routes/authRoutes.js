const express = require("express");
console.log("authRoutes Loaded");
const router = express.Router();

router.get("/test", (req, res) => {
    res.json({ message: "Auth Route Working ✅" });
});

const { login } = require("../controllers/authController");

router.post("/login", login);

module.exports = router;