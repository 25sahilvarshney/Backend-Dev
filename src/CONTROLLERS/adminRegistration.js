const fs = require("fs");
const express = require("express");
require("dotenv").config();

function adminRegistration(req,res){
    try{
        if(!fs.existsFileSync("employees.json")){
            return null;
        }
        const {username  , gender , department , salary} = req.body;
        const data = JSON.parse(fs.readFileSync("employees.json","utf-8"));
        const user = data.find((value)=>value.username==username,
        value.gender==gender, value.department==department, value.salary==salary);
        if(!checkuser){
            return null;
        }
        const users=[
            username,
            gender,
            department,
            salary
        ]
        users.push(user);
    }
    catch(error){
        res.send(StatusCodes.INTERNAL_SERVER_ERROR.code).json({
            username:StatusCodes.INTERNAL_SERVER_ERROR.username,
            gender:StatusCodes.INTERNAL_SERVER_ERROR.gender,
            department:StatusCodes.INTERNAL_SERVER_ERROR.department,
            salary:StatusCodes.INTERNAL_SERVER_ERROR.salary,
    })
    }
}