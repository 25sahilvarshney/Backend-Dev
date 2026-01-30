const loginUser = require("./loginUser");
const registerUser = require("./registerUser");
const createTodo = require("./createTodo");
const deletedata= require("./deletedata");

// register user
let res1 = registerUser("prem", "prem@gmail.com", "1234");
let res2=registerUser("anurag","anurag123@gmail.com","875264");
let res3=registerUser("shivansh","shivansh25@gmail.com","12qwer34");

// login user
let login1 = loginUser("prem", "prem@gmail.com", "1234");
let login2=loginUser("anurag","anurag123@gmail.com","875264");
let login3=loginUser("shivansh","shivansh25@gmail.com","12qwer34");


// create todo
let create1 = createTodo("prem", "buy groceries", false);
let create2=createTodo("anurag","do homework",true);
let create3=createTodo("shivansh","clean room",false);

// delete data
let deletedata1 = deletedata("anurag","true");
let deletedata2=deletedata("prem","false");

console.log(res1);
console.log(res2);
console.log(res3);
console.log("..............................");

console.log(login1);
console.log(login2);
console.log(login3);
console.log("..............................");

console.log(create1);
console.log(create2);
console.log(create3);
console.log("..............................");

console.log(deletedata1);
console.log(deletedata2);
console.log("the end.......................");

const express=require("express");

 let app=express();
 let port= 8475;
 app.listen(port,()=>{
    app.get("/",(req,res)=>{
        res.end("hi");
    })
    app.get("/registerUser",(req,res)=>{
        console.log(req.body);
        res.end("this is home page");
    })
    console.log("connect");
 })
