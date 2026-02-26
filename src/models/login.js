const fs = require("fs");
const bcrypt = require("bcrypt");
const express = require("express");
const joi = require("joi");
const jsonwebtoken = require("jsonwebtoken");
const { StatusCodes } = require("http-status-pro-js");

function userlogin(req, res){
    try{
        const {username , department}=req.body;
        if (!username || !department) {
            return res.status(400).send("username is required");
        }
        if (!fs.existsSync("employees.json")) {
            return res.status(404).send("No users found");
        }
        const users = JSON.parse(fs.readFileSync("employees.json", "utf-8"));
        const isUser = users.find(user => user.username === username && user.department === department);
        if (!isUser) {
            return res.status(401).send("department is not found");
        }
        res.status(200).send("Login successful");
    }
    catch(error){
        console.log(error);
        res.send(StatusCodes.INTERNAL_SERVER_ERROR.code).json({
            code:StatusCodes.INTERNAL_SERVER_ERROR.code,
            messsage:StatusCodes.INTERNAL_SERVER_ERROR.message,
            data:null
        })
    }
}