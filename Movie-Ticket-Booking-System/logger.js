const fs=require("fs");
function logger(message){
    const loadmessage=`${new Date().toString()} - ${message}\n`;
    fs.appendFileSync("server.log",loadmessage); 
}
module.exports=logger;