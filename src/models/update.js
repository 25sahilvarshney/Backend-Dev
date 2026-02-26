const express = require("express");
const joi = require("joi");
const bcrypt = require("bcrypt");
const fs = require("fs");

function updateUser(req, res) {
  try {
    const { id } = req.params;        
    const { email, name } = req.body;  
    console.log(req.body);
    console.log(req.params);

    if (!id || !email || !name) {
      return res.status(400).send("ID, email, and name are required");
    }
""
    if (!fs.existsSync("user.json")) {
      return res.status(404).send("No users found");
    }

    const users = JSON.parse(fs.readFileSync("user.json", "utf-8"));

    const userIndex = users.findIndex(user => user.id == id);

    if (userIndex === -1) {
      return res.status(404).send("User not found");
    }

    // Update user data name and email
    users[userIndex].email = email;
    users[userIndex].name = name;

    // Save back to file
    fs.writeFileSync("user.json", JSON.stringify(users, null, 2));

    res.status(200).send("User updated successfully");

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}