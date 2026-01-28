const fs = require("fs");

function loginUser(name, email, password) {
    try {
        if (!fs.existsSync("todo.json")) {
            return "no users";
        }

        const data = JSON.parse(fs.readFileSync("todo.json", "utf-8"));

        const isUser = data.some(
            (u) => u.name === name && u.email === email && u.password === password
        );

        return isUser ? "login successful" : "invalid credentials";
    } catch (error) {
        console.error(error);
        return "error";
    }
}

module.exports = loginUser;
