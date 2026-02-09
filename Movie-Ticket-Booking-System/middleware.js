const fs=require("fs");

function middleware(){
    try{
        let { name  , email , password}=req.body;
        let ab=joi.object({
            name:joi.string().lowercase().trim().min(2).max(200).required(),
            email:joi.string().lowercase().trim().email().min(6).max(200).required(),
            password:joi.string().trim().min(6).max(10).required()
        })
        let{error,value}=ab.validate(req.body);
        if(error){
            res.status(StatusCodes.BAD_REQUEST.code).json({
                code:StatusCodes.BAD_REQUEST.code,
                message:error.message,
                data:null
            })
        }
        req.body = value;
        next();

    }
    catch(error){
        console.log(error);
        logger("error",StatusCodes.INTERNAL_SERVER_ERROR.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR.code).json({
            code:StatusCodes.INTERNAL_SERVER_ERROR.code,
            email:StatusCodes.INTERNAL_SERVER_ERROR.code

        })
    }
}
module.exports=middleware;