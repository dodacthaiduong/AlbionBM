const express = require("express");
const router = express.Router();
const itemsController = require("../controllers/itemsController");

router.get("/", itemsController.getAllItems);
router.get("/filter-options", itemsController.getShopFilterOptions);
router.get("/:uniqueName", itemsController.getItemByUniqueName);

module.exports = router;