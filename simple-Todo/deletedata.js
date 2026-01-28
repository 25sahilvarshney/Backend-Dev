const fs = require("fs");

function deletedata(name,status) {
    try {
        const data = JSON.parse(fs.readFileSync("todo.json", "utf-8"));
        const user = data.find((u) => u.name === name);
        if (!user) {
            return "user not found";
        }

        const todo = {
            createTime: new Date(),
            status
        };

        user.todo.pop(todo);

        // fs.writeFileSync("todo.json", JSON.stringify(data, null, 2));
        return "todo deleted successfully";
    } catch (error) {
        return "error";
    }
}

module.exports = deletedata;
