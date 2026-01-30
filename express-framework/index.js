// const http=require("http");
// const home=require("./src/home");
// const about= require("./src/about");
// let server=http.createServer((req,res)=>{
//     switch(req.url){
//         case "/":{
//             res.end("<h1>hello</h1>");
//             console.log(req.method);
//             console.log(req);
//             break;
//         }
//         case "/home":{
//             res.end(home());
//             console.log(req.method);
//             break;
//         }
//         case "/about":{
//             res.end(about());
//             break;
//         }
//     }
// })
// server.listen(5173,()=>{
//     console.log("connect");
// })
// module.exports=server;

const express=require("express");

 let app=express();
 let port= 8000;
 app.listen(port,()=>{
    app.get("/",(req,res)=>{
        res.end("hi");
    })
    app.post("/home",(req,res)=>{
        console.log(req.body);
        res.end("this is home page");
    })
    console.log("connect");
 })