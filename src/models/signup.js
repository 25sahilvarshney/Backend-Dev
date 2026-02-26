const fs = require("fs");
const express = require("express");
const { StatusCodes } = require("http-status-pro-js");
require("dotenv").config();

function userSignup(req , res){
    try{
        if(!fs.existsFileSync("employees.json")){
            return null;
        }
        const {username , password}=req.body;
        const data = JSON.parse(fs.readFileSync("employees.json","utf-8"));
        const user = data.some((value)=>value.username==username && value.password==password);


    }
    catch(error){
        res.send(StatusCodes.INTERNAL_SERVER_CODE_ERROR.code).json({
            name:StatusCodes.INTERNAL_SERVER_ERROR.name,
            password:StatusCodes.INTERNAL_SERVER_ERROR.password
        })
    }
}
