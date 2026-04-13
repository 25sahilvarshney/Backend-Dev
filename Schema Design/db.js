const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect("mongodb://localhost:27017/DesigningSchema", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

module.exports = db;