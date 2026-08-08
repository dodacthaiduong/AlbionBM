const express = require("express");
const pricesController = require("../controllers/pricesController");
const flipController = require("../controllers/flipController");

const router = express.Router();

router.get("/current", pricesController.getCurrentPrices);
router.get("/flip", flipController.getFlipOpportunities);
router.post("/update-all", pricesController.startUpdateAll);
router.get("/update-all", pricesController.getLatestUpdate);
router.get("/update-all/:jobId", pricesController.getUpdateStatus);

module.exports = router;
