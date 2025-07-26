const User = require('../models/userAuthModel');


const userSignUp = async (req,res) => {
    const {name,email,password,confirmPassword} = req.body;

    if(password != confirmPassword){
        return res.status(400).json({message:"Password do not match"});
    }

    try{

        const exist = await User.findOne({email});

        if(exist){
            return res.status(400).json({message:"User Already exits"});
        }

        const newUser = new User({name,email,password,confirmPassword});

        await newUser.save();

        res.status(200).json({message:"User registered succesfully"});

    }catch(err){
        res.status(500).json({error:err.message})
    }
}

// Login
const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { userSignUp, userLogin };