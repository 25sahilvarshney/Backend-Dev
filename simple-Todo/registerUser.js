const fs = require("fs");

function registerUser(name, email, password) {
    try {
        let users = [];

        if (fs.existsSync("todo.json")) {
            users = JSON.parse(fs.readFileSync("todo.json", "utf-8"));

            const isUser = users.some(
                (u) => u.name === name || u.email === email
            );

            if (isUser) {
                return "user already exists";
            }
        }

        const user = {
            name,
            email,
            password,
            todo: []
        };

        users.push(user);

        fs.writeFileSync("todo.json", JSON.stringify(users, null, 2));
        return "registered successfully";
    } catch (error) {
        console.error(error);
        return "error";
    }
}

module.exports = registerUser;
