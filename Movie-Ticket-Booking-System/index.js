const createUser = require("./createUser");
const login = require("./login");
const booking = require("./booking");
const Update = require("./UpdateUser");
const deleteUser = require("./delete");
const movie = require("./movie");
const logger = require("./logger");
const middleware = require("./middleware");
const auth=require("./auth");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const morgan = require("morgan");

let app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

let port = process.env.PORT || 8103;

app.get("/", (req, res) => {
  res.end("hi");
});

app.post("/createUser", (req, res) => {
  console.log(req.body);
  res.send("registration successfully");
});

app.post("/login", (req, res) => {
  console.log(req.body);
  res.send("login successfully");
});

app.post("/booking", (req, res) => {
  console.log(req.body);
  res.send("booking successfully");
});

app.get("/UpdateUser/:id", (req, res) => {
  console.log(req.body);
  console.log(req.params);
  res.send("update successfully");
});

app.post("/deleteUser", (req, res) => {
  console.log(req.body);
  res.send("deletion successfully");
});

app.post("/movieUser", (req, res) => {
  console.log(req.body);
  res.send("movie selected successfully");
});

app.post("/middleware", (req, res) => {
  console.log(req.body);
  res.send("middleware connect successfully");
});

app.get("/logger", (req, res) => {
  console.log(req.body);
  res.send("logger connect successfully");
});
app.get("/auth",(req,res)=>{
    console.log(req.body);
    res.send("authorization successfull");
})


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
