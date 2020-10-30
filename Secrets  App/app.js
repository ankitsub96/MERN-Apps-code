//jshint esversion:6
require('dotenv').config();
const bodyParser=require('body-parser');
const express=require('express');
const app=express();
const mongoose=require('mongoose');
const session=require('express-session');
const ejs=require('ejs');
const passport=require('passport')
const passportLocalMongoose=require('passport-local-mongoose')
const saltRounds=10;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(session({
	secret:"fdrwovgfrwgfplk",
	resave:false,
	saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect('mongodb+srv://admin-Ankit:Mongo@123@cluster0.xq3rv.mongodb.net/<dbname>?retryWrites=true&w=majority',{useNewUrlParser:true, useUnifiedTopology:true});
mongoose.set('useCreateIndex',true)
const userSchema=new mongoose.Schema({
	username: { type: String, unique: true }, // values: email address, googleId, facebookId
	password: String,
    provider: String, // values: 'local', 'google', 'facebook'
    email: String,
    googleProfileInfo: Object,
    facebookProfileInfo: Object,
    secrets: Array()
})
userSchema.plugin(passportLocalMongoose, {
	usernameField: "username"
});
userSchema.plugin(findOrCreate);


const User=new mongoose.model('User',userSchema)
passport.use(User.createStrategy())

passport.serializeUser(function(user, done) {
	console.log('inside serializeUser'+user)
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		// console.log(user)
		done(err, user);
	});
});

passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: "https://rocky-sands-42615.herokuapp.com/auth/google/secrets",
	userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function (accessToken, refreshToken, profile, cb) {
	// console.log(profile)
	User.findOne({ email: profile._json.email }, function (err, user) {
		if(err){console.log(err)}
			else if(user==undefined){
				User.findOrCreate({ email: profile._json.email },
				{
					provider: "Google",
					profile: profile._json
				},
				function (err, user) {
						// console.log(user)
						return cb(err, user);
					}
					);
			}else{
				User.updateOne({ email: profile._json.email },{
					googleProfileInfo:  {
						provider:'Google', 
						profile: profile._json
					}
				}, 
				{upsert: true // Make this update into an upsert
				}, function(err){
					console.log(err)
				})
				User.findOne({email: profile._json.email}, function (err, user) {
  					// console.log('inside GoogleStrategy updateOne'+user)
  					return cb(err, user);
  				})
			}
		})
}
));

passport.use(new FacebookStrategy({
	clientID: process.env.FACEBOOK_APP_ID,
	clientSecret: process.env.FACEBOOK_APP_SECRET,
	callbackURL: "https://rocky-sands-42615.herokuapp.com/auth/facebook/secrets",
	profileFields: ['id', 'displayName', 'emails', 'name', 'gender', 'profileUrl']
},
function (accessToken, refreshToken, profile, cb) {
	// console.log(profile)
	User.findOne({ email: profile._json.email }, function (err, user) {
		if(err){console.log(err)}
			else if(user==undefined){
				User.findOrCreate({ email: profile._json.email },
				{
					provider: "Facebook",
					profile: profile._json
				},
				function (err, user) {
						// console.log(user)
						return cb(err, user);
					}
					);
			}else{
				User.updateOne({ email: profile._json.email },{
					facebookProfileInfo:  {
						provider:'Facebook', 
						profile: profile._json
					}
				}, 
				{upsert: true // Make this update into an upsert
				}, function(err){
					console.log(err)
				})
				User.findOne({email: profile._json.email}, function (err, user) {
  					// console.log('inside FacebookStrategy updateOne'+user)
  					return cb(err, user);
  				})
			}
		})
}
));

app.get('/',(req,res)=>{
	if(req.isAuthenticated()){
		res.redirect('/secrets')
	}else{
		res.render('home')
	}
})

app.get('/auth/google',
	passport.authenticate('google', { scope: ['email','profile'] })
	)

app.get('/auth/google/secrets',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get('/auth/facebook',
	passport.authenticate('facebook', { scope: ['email', 'user_gender'] }))

app.get('/auth/facebook/secrets',
	passport.authenticate('facebook', { failureRedirect: '/login' }),
	function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get('/login',(req,res)=>{
	res.render('login')
})

app.get('/register',(req,res)=>{
	res.render('register')
})

app.get('/secrets',(req,res)=>{
		if(req.isAuthenticated()){
			console.log('req. isAuthenticated ')
			User.find({'secrets':{$ne: null}}, function(err, foundUsers){
				if (err) {
					console.log(err)
				}else{
				//  console.log(foundUsers)
					if(foundUsers){
					res.render('secrets', {usersWithSecrets:foundUsers})
					}
				}
			})
		}
		else{
			res.redirect('/login')		
		}	
	})


app.get('/submit',function(req,res){
	if(req.isAuthenticated()){
		res.render('submit')
	}else{
		res.redirect('/login')
	}
})

app.post('/submit',function(req,res){
	const submittedSecret= req.body.secret;
	// console.log(req.user)
	User.findById((req.user.id), function(err, foundUser){
		if(err){
			console.log(err)
		}else{
			if(foundUser){
				foundUser.secrets.push(submittedSecret);
				foundUser.save(function(){
					res.redirect('/secrets')
				})
			}
		}
	})
})

app.get('/logout',(req,res)=>{
	req.logout()
	res.redirect('/')
})

app.post('/register',(req,res)=>{
	User.register({username: req.body.username}, req.body.password, function(err, user){
		if (err) {
			console.log(err);
			res.redirect("/register");
		} else {
			passport.authenticate('local')(req, res, () => {
				User.updateOne(
					{ _id: user._id },
					{ $set: { provider: "local", email: req.body.username } },
					() => {res.redirect('/secrets')
						console.log('redirecting')
					}
				);
			});
		}
	});
})

app.post('/login',(req,res)=>{
	const user=new User({
		username:req.body.username,
		password:req.body.password
	})
	req.login(user,(err)=>{
		if (err){
			console.log(err)
		}else{
			passport.authenticate('local')(req,res,()=>{
				res.redirect('/secrets')
			}) 	
		}
	})

})
app.listen(process.env.PORT||3000,function(){
	console.log('server started on port 3000')
})