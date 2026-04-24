const express = require("express");
const router = express.Router();
const { processHierarchy } = require("../utils/graphProcessor");

router.post("/", (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Request body must have a 'data' array." });
  }

  const result = processHierarchy(data);

  return res.json({
    user_id: process.env.BFHL_USER_ID || "yourname_ddmmyyyy",
    email_id: process.env.BFHL_EMAIL_ID || "your_email",
    college_roll_number: process.env.BFHL_COLLEGE_ROLL_NUMBER || "your_roll",
    ...result,
  });
});

module.exports = router;
