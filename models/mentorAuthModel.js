const mongoose = require("mongoose");

const mentorAuth = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String, required:true},
     confirmPassword:{type:String, required:true}
})

const Mentor = mongoose.model('Mentor',mentorAuth);


module.exports = Mentor;