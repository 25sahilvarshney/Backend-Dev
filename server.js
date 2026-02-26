const fs = require("fs");
const express = require("express");
require("dotenv").config();

const port = 8000;
let app = express();
app.use(express.static("public"));

app.set('view engine','ejs');

app.get("/",function(req,res){
    res.render("index(DASHBOARD)");
})

app.get("/user",(req,res)=>{
    req.body;
    console.log("created successfully");
    
})

app.get("/login",(req,res)=>{
    req.body;
    console.log("login successfull");
    
})
app.get("/fileHandler",(req,res)=>{
    req.body;
    console.log("file created");
})
app.post("/update",(req,res)=>{
    req.body;
    console.log("updated successfully");
})
app.delete("/delete",(req,res)=>{
    req.body;
    console.log("user deleted completed");
})
app.post("/userAUTHORIZATION",(req,res)=>{
    console.log(req.body);
    res.render("userAUTHORIZATION");
})
app.get("/addREGISTRATION",(req,res)=>{
    res.render("addREGISTRATION");
})
app.get("/editUPDATEEMPLOYEEFORM",(req,res)=>{
    res.render("editUPDATEEMPLOYEEFORM");
})
app.get("/adminRegistration",(req,res)=>{
    console.log("admin registration sucessfully");
})


app.listen(port,()=>{
    console.log(`server is connected at http://localhost:${port}`);
})

