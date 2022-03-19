//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require("md5");

// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: "This is my little secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

// mongoose.set("usercreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
  res.render("home")
});

app.get("/login", function(req, res) {
  res.render("login")
});
app.get("/register", function(req, res) {
  res.render("register")
});

app.get("/secret", function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login")
  }
});

///////////////////logout function/////////////////
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/")
})

////////////////////////////For new User registration //////////////////////
app.post("/register", function(req, res) {
  User.register({username:req.body.username}, req.body.password,
     function(err, user){
       if(err){
         console.log(err);
       }else{
         passport.authenticate("local")(req, res, function(){
           res.redirect("/secret");
         })
       }
     })

});

////////////////////////For exixting User Login /////////////////////////
app.post("/login", function(req, res) {
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log(err);;
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secret")
      });
    }
  });
});



app.listen(3000, function() {
  console.log("server has started successfully");
});
