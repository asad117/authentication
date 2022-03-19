//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended:true
}));

mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema =({
  email :String,
  password : String,
});
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const User = mongoose.model("User", userSchema)

app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res){
  res.render("home")
});

app.get("/login", function(req, res){
  res.render("login")
});
app.get("/register", function(req, res){
  res.render("register")
});

////////////////////////////For new User registration //////////////////////
app.post("/register", function(req,res){
  const newUser = new User({
    email:req.body.username,
    password:md5(req.body.password)
  });
  newUser.save(function(err){
    if(err){
      console.log(err);

    }else{
      res.render("secrets")
    }
  })
});

////////////////////////For exixting User Login /////////////////////////
app.post("/login", function(req,res){
  const useremail = req.body.username;
  const password = md5(req.body.password);
  User.findOne({email:useremail}, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets")
        }else{
        console.log("wrong login details");
        }
      }else{
        console.log("user details does't match");
      }
    }
  })
})


app.listen(3000, function(){
  console.log("server has started successfully");
});
