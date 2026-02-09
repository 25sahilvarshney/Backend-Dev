require("dotenv").config();
const jwt=require("jsonwebtoken");
function auth2(req, res, next){
    try {
        let authorization = req?.headers?.authorization  
        if(!authorization || !authorization.startsWith("Bearer ")){
            console.log(authorization);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR.code).json({
                code:StatusCodes.INTERNAL_SERVER_ERROR.code,
                message:StatusCodes.INTERNAL_SERVER_ERROR.message,
                data:null
            })
            return;
        }

        let auth = authorization.split(" ")[1]
        let token = jwt.verify(auth, process.env.TOKENKEY)
        console.log(token);
        req.user = token.id;
        console.log(req);

        next()
       
    } catch (error) {
        console.log(error);
        res.status(StatusCodes.UNAUTHORIZED.code).json({
            code:StatusCodes.UNAUTHORIZED.code,
            message:error.message,
            data:null
        })
       
    }

}
module.exports=auth2;