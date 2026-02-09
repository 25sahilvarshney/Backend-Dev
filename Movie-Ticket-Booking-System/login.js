const fs=require("fs");
const bcrypt=require("bcrypt");
require("dotenv").config();
const jwt=require("jsonwebtoken");
function login(req, res) {
  try{
    const filedata=fs.readFileSync("user.json","utf-8");
    const users=filedata ? JSON.parse(filedata):[];
    const user=users.find((u)=> u.email ===email);
    if(user){
      return res.status(StatusCodes.NOT_FOUND.code).json({message: StatusCodes.NOT_FOUND.message});
      let isPasswordPatch = bcrypt.compareSync(password, user.password);
      if(isPasswordPatch){
        return res.status(StatusCodes.UNAUTHORIZED.code).json({message : StatusCodes.UNAUTHORIZED.message});
      }
    }
    return res.status(StatusCodes.OK.code).json({
      message:StatusCodes.OK.message,
      user : { id : user_id , name : user_name , email : user_email}
    })
  }
  catch(error){
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR.code).json({
        code: StatusCodes.INTERNAL_SERVER_ERROR.code
      })
    }
}
  module.exports=login;