const { processHierarchy } = require("../utils/graphProcessor");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function sendJson(res, statusCode, payload) {
  res.status(statusCode);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }
  return res.json(payload);
}

module.exports = (req, res) => {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      error: "Method Not Allowed",
    });
  }

  const { data } = req.body || {};

  if (!Array.isArray(data)) {
    return sendJson(res, 400, {
      error: "Request body must have a 'data' array.",
    });
  }

  const result = processHierarchy(data);

  return sendJson(res, 200, {
    user_id: "pt4592@srmist.edu.in",
    email_id: "pt4592@srmist.edu.in",
    college_roll_number: "RA2311003010573",
    ...result,
  });
};