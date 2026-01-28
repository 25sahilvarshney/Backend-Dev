const fs = require("fs");

function createTodo(name, task, status) {
    try {
        if (!fs.existsSync("todo.json")) {
            return "no users found";
        }
        const data = JSON.parse(fs.readFileSync("todo.json", "utf-8"));
        const user = data.find((u) => u.name === name);
        if (!user) {
            return "user not found";
        }

        const todo = {
            createTime: new Date(),
            task,
            status
        };

        user.todo.push(todo);

        fs.writeFileSync("todo.json", JSON.stringify(data, null, 2));
        return "todo created successfully";
    } catch (error) {
        console.error(error);
        return "error";
    }
}

module.exports = createTodo;
