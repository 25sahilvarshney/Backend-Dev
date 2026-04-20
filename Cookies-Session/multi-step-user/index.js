const express = require("express");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5005;

app.listen(PORT,()=>{
    console.log(`server is running at https://localhost:${PORT}`);
})