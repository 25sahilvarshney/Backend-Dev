const fs=require("fs");
function deleteUser(req,res){
    try{
        const {userId,movieId}=req.body;
        if(fs.existsSync("movie.json"));
        
    }
    catch(error){
        console.log("error is running");
    }
}