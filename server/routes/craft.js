const express = require("express");
const craftController = require("../controllers/craftController");

const router = express.Router();

router.get("/", craftController.getCraftOpportunities);

module.exports = router;
