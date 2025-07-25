const mongoose = require("mongoose");

const userAuth = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String, required:true},
     confirmPassword:{type:String, required:true}
})

const User = mongoose.model('User',userAuth);


module.exports = User;