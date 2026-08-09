require("dotenv").config();
const express = require("express");
const cors = require("cors");
const itemsRoutes = require("./routes/items");
const pricesRoutes = require("./routes/prices");
const { getServerConfig } = require("./config/env");

const app = express();
const config = getServerConfig();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello backend" });
});

app.use("/api/items", itemsRoutes);
app.use("/api/prices", pricesRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});