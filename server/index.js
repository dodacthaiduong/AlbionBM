require("dotenv").config();
const express = require("express");
const cors = require("cors");
const itemsRoutes = require("./routes/items");
const pricesRoutes = require("./routes/prices");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello backend" });
});

app.use("/api/items", itemsRoutes);
app.use("/api/prices", pricesRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});