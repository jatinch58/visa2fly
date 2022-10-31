const express = require("express");
const router = express.Router();
const loginRoutes = require("./login");

router.use("/user", loginRoutes);
module.exports = router;
