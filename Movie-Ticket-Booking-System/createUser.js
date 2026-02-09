const fs=require("fs");
const brcypt=require("bcrypt");

function createUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send("All fields are required");
    }

    let users = [];

    if (fs.existsSync("user.json")) {
      const data = fs.readFileSync("user.json", "utf-8");
      users = JSON.parse(data);

      const isUser = users.find(a => a.email === email );
      if (isUser) {
        return res.status(409).send("User already exists");
      }
    }
    users.push(newUser);

    fs.writeFileSync("user.json", JSON.stringify(users, null, 2));

    res.status(201).send("User created successfully");

    let salt=brcypt.genSaltSync(10);
    let hasPassword= brcypt.hashSync(password,salt);
    password = hasPassword;

    let ob = {
      id: Date.now(),
      name,
      email,
      password
    };
    users.push(ob);
    fs.writeFileSync("user.json",JSON.stringify(users,null,2));
    res.status(STATUS_CODES.OK.code).json({code:StatusCodes.OK.message});
    

  } catch (error) {
    logger("error","internal server error",error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR.code).json({code:StatusCodes.INTERNAL_SERVER_ERROR.code});
  }
}

module.exports=createUser;