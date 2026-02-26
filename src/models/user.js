const fs = require("fs");
const express = require("express");
require("dotenv").config();
const bcrypt = require("bcrypt");
const http = require("http-status-pro-js");


function CreateUser(req,res){
    try{
        if (!username || !gender || !department) {
            return res.status(400).send("All fields are required");
    }
    if (fs.existsSync("user.json")) {
        const data = fs.readFileSync("user.json", "utf-8");
        users = JSON.parse(data);
        const isUser = users.find(a => a.username === username );
        if (isUser) {
            return res.status(409).send("User already exists");
        }
    }
    const newUser = {
        id: Date.now(),
        username,
        gender,
        department
    };
    users.push(newUser);
    fs.writeFileSync("user.json", JSON.stringify(users, null, 2));
    res.status(201).send("User created successfully");

  } 
    catch(error){
        res.send(StatusCodes.INTERNAL_SERVER_ERROR.code).json({
            code:StatusCodes.INTERNAL_SERVER_ERROR.code,
            message:StatusCodes.INTERNAL_SERVER_ERROR.message,
            data:null
        })
    }
}
