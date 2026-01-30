const http=require("http");
const home=require("./src/home");
const about= require("./src/about");
let server=http.createServer((res,req)=>{
    switch(req.url){
        case "/":{
            res.end("<h1>hello</h1>");
            console.log(req.method);
            break;
        }
        case "/home":{
            res.end(home());
            console.log(req.method);
            break;
        }
        case "/about":{
            res.end(about());
            break;
        }
    }
})
server.listen(8000,()=>{
    console.log("connect");
})
module.exports=server;