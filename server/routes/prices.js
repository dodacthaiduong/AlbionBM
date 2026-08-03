const express = require("express");
const pricesController = require("../controllers/pricesController");

const router = express.Router();

router.get("/current", pricesController.getCurrentPrices);
router.post("/update-all", pricesController.startUpdateAll);
router.get("/update-all", pricesController.getLatestUpdate);
router.get("/update-all/:jobId", pricesController.getUpdateStatus);

module.exports = router;
