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

const findOrCreate = require("mongoose-findorcreate")
// const findOrCreate = require('mongoose-find-or-create')
const GoogleStrategy = require('passport-google-oauth20').Strategy;





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
  googleId:String,
  secret:String,
  name:String
});
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
const User  = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"

  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({googleId: profile.id, name:profile. displayName }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
  res.render("home")
});

// app.get("/auth/google",function(req,res){
//   passport.authenticate("google", {scope:["profile"]})
// });
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secret',
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
  });

app.get("/login", function(req, res) {
  res.render("login")
});
app.get("/register", function(req, res) {
  res.render("register")
});

app.get("/secret", function(req,res){
  // if(req.isAuthenticated()){
  //   res.render("secrets");
  // }else{
  //   res.redirect("/login")
  // }
User.find({secret:{$ne:null}}, function(err, foundUsers){
  if(err){
    console.log(err);
  }else{
    if(foundUsers){
      res.render("secrets", {userwithSecret:foundUsers})
    }
  }
})

});

app.get("/submit", function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login")
  }
});

app.post("/submit", function(req, res){
  const submitSecret = req.body.secret;
  const uploadImage = req.file;
  console.log(req.user._id);
  User.findById(req.user._id, function(err, foundUser){
    if(err){
      console.log(err);
    }else {
      if(foundUser){
        foundUser.secret = submitSecret;
        foundUser.save(function(){
          res.redirect("/secret")
        });
      }
    }
  });
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
