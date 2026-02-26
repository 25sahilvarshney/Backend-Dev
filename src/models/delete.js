const fs = require("fs");
const express = require("express");
const { StatusCodes } = require("http-status-pro-js");

function UserDelete(id){
    try{
        if(!fs.existsFileSync("user.json")){
            return null;
        }
        let data = JSON.parse(fs.readFileSync("user.json","utf-8"));
        let checkUser = data.some((value)=>value.id==id);
            if(!checkUser){
                return "not found";
            }
        let users = data.findfilter((value)=>value.id==id);
        fs.writeFileSync("user.json",JSON.stringify(users, null , 2));
        return "user deleted";
       
    }
    catch(error){
        console.log(error);
        res.send(StatusCodes.INTERNAL_SERVER_ERROR.code).json({
            code:StatusCodes.INTERNAL_SERVER_ERROR.code,
            message:StatusCodes.INTERNAL_SERVER_ERROR.message,
            data:null
        })
    }
}
