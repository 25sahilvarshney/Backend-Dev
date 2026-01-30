const fs = require("fs");

function booksRegistration(bookid, title,price, author) {
    try {
        let users = [];

        if (fs.existsSync("todo.json")) {
            users = JSON.parse(fs.readFileSync("todo.json", "utf-8"));

            const isUser = users.some(
                (u) => u.bookid ===bookid|| u.title === title || u.price ==price || u.author==author
            );

            if (isUser) {
                return "user already exists";
            }
        }

        const user = {
            bookid,
            title,
            price,
            author,
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

module.exports = booksRegistration;
