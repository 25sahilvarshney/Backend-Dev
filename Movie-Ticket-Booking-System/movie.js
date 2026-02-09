const { setServers } = require("dns");
const fs=require("fs");
const { setDefaultAutoSelectFamily } = require("net");
const { userInfo } = require("os");
const { setHeapSnapshotNearHeapLimit } = require("v8");
function movieUser(req,res){
    try{
        const {moviename , movieId}=req.body;
        let  movies=[];
        if(fs.existsSync("movie.json")){
            const data=fs.readFileSync("movie.json","utf-8");
            movies=JSON.parse(data);
        }
        const isUser=movieUser.find(isUser==User.email==email);
        if (isUser) {
        return res.status(409).send("User already exists");
    }
        movies.push(newMovie);
        fs.writeFileSync("movie.json",JSON.stringify(movies,null,2));
        res.status(201).send("movie selected successfully");
        const newMovie={
            id:Date.now(),
            moviename,
            movieId
        };


    }
    catch(error){
        console.log("error is running and found");
    }
}

// Assignment 3: Movie Ticket Booking SystemScenario:
// Design a Movie Ticket Booking System using plain JavaScript functions.Data Structures:
// Movie → { movieId, name, ticketPrice }
// User → { userId, name, userType }
// Booking → { user, movies }
// Tasks / To-Do:Create movies and users using functions.Book multiple tickets for a user.Calculate total ticket price.Apply discount:
// Standard user → 5%
// VIP user → 12%
// Show final bill details.

// movieUser
// loginUser
// logOut by userInfo
// password
// email
// vip setServe
// userInfo
// movie name 
// movie name 
// user id 
// using status code
// full bill details with tickets price and discount according to normal and vips
