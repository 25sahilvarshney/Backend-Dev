const fs = require("fs");

function members(memberId , name  , membershipType){
    try { 
        let members=[];
        if(fs.existsSync("todo.json")){
            memebers=JSON.parse(fs.readFileSync("todo.json","utf-8"));
            const ismember=members.some(u.memberid==memberid || u.name==name || u.membershiptype==membershiptype);
        }
        const users={
            memberid,
            name,
            membershiptype
        }
        users.push(users);
        fs.writeFileSync("todo.json",JSON.stringify(user,null,2));
        return "member registered successfully";
        if(ismember){
            return "member already exists";
        }
        const discount1={
            if(membershipType="gold"){
                discount1=15
            }
        }
        const discount2={
            if(membershiptype="normal"){
                discount2=5
            }
        }
        // calculate the price books for the members based on their memebership type(normal and the gold)
        if(membershipType="gold"){
            let price=1500;
            let finalprice= price-discount1/100;
            return finalprice;
        }
        if(membershipType="normal"){
            let price=2000;
            let finalprice=price-discount2/100;
            return finalprice;
        }
    }
    catch(error){
        console.log("error");
    }
}
module.exports=members;