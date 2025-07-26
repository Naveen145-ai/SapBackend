const Mentor = require('../models/mentorAuthModel');


const mentorSignUp = async (req,res) => {
    const {name,email,password,confirmPassword} = req.body;

    if(password != confirmPassword){
        return res.status(400).json({message:"Password do not match"});
    }

    try{

        const exist = await Mentor.findOne({email});

        if(exist){
            return res.status(400).json({message:"Mentor Already exits"});
        }

        const newMentor = new Mentor({name,email,password,confirmPassword});

        await newMentor.save();

        res.status(200).json({message:"Mentor registered succesfully"});

    }catch(err){
        res.status(500).json({error:err.message})
    }
}

// Login
const mentorLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const mentor = await Mentor.findOne({ email });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    if (mentor.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", mentor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { mentorSignUp, mentorLogin };