const booksRegistration = require("./booksRegistration");
const Members=require("./Members");
const borrowRecord=require("./borrowRecord");
let books1=booksRegistration(
    {booksid:"A091"},
    {title:"java"},
    {price:500},
    {author:"xyz"}
)
console.log(books1);

