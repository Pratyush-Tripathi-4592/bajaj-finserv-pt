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
    user_id: "pt4592@srmist.edu.in",
    email_id: "pt4592@srmist.edu.in",
    college_roll_number: "RA2311003010573",
    ...result,
  });
});

module.exports = router;
