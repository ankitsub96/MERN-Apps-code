require('dotenv').config()
const bodyParser= require('body-parser')
const express= require('express')
const app= express()
const mongoose= require('mongoose')
const ejs= require('ejs')
const session= require('express-session')
var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth20').Strategy
var FacebookStrategy = require('passport-facebook').Strategy
const passportLocalMongoose=require('passport-local-mongoose')



app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require('express-session')({ secret: 'dfsdsghdfh', resave: true, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static('public'))
app.set('view engine', 'ejs')

//'mongodb://localhost:27017/votes'
mongoose.connect('mongodb+srv://admin-Ankit:Mongo@123@cluster0.xq3rv.mongodb.net/votes?retryWrites=true&w=majority', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true
})

const userSchema = new mongoose.Schema({
	name: String,
	username: { type: String, unique: true },
	googleProfileInfo: Object,
	facebookProfileInfo: Object,
	vote: String
});
userSchema.plugin(passportLocalMongoose, {
	usernameField: "username"
});

const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy())

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});



passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: 'https://fast-stream-91915.herokuapp.com/auth/callback/google',
	userProfileURL: "https://www.googleapis.com/userinfo/v2/me"
},
function(accessToken, refreshToken, profile, cb) {
	User.updateMany({
		name: profile.displayName,
		username: profile._json.email,
		googleProfileInfo: profile,
	},{upsert: true}, function(err){
		User.findOne({ username: profile._json.email}, function (err, user) {
			return cb(err, user)
		})
	})
}
));


passport.use(new FacebookStrategy({
	clientID: process.env.FACEBOOK_APP_ID,
	clientSecret: process.env.FACEBOOK_APP_SECRET,
	callbackURL: "https://fast-stream-91915.herokuapp.com/auth/facebook/callback",
	profileFields: ['id', 'displayName', 'name', 'gender', 'profileUrl', 'email']
},
function(accessToken, refreshToken, profile, cb) {
	User.updateMany({
		name: profile.displayName,
		username: profile._json.email,
		facebookProfileInfo: profile,
	},{upsert: true}, function(err){
		User.findOne({ username: profile._json.email}, function (err, user) {
			return cb(err, user)
		})
	})
}
));

app.get('/auth/google',
	passport.authenticate('google', { scope: ['email'] }))

app.get('/auth/callback/google', 
	passport.authenticate('google', { failureRedirect: '/login-fail' }),
	function(req, res) {
        // Successful authentication, redirect to your app.
        res.redirect('/voting-page')
    }
    )

app.get('/auth/facebook',
	passport.authenticate('facebook', { scope: ['email']}))

app.get('/auth/facebook/callback',
	passport.authenticate('facebook', { failureRedirect: '/login-fail' }),
	function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/voting-page')
});

app.get('/logout', function(req, res){
	req.logout()
	res.redirect('/')
});
app.get('/login-fail',(req,res)=>{
	res.render('login-failure')
})
app.post('/vote',(req,res)=>{
	console.log(req.body.Flavour)
	if(req.user.username==undefined){
		res.redirect('/')
	}
	User.updateOne({username: req.user.username}, {vote: req.body.Flavour}, function(err){
		console.log(err)
	})
	if(req.isAuthenticated()){
		res.redirect('/voting-results')
	}else{
		res.redirect('/')
	}
})

app.get('/voting-results',(req,res)=>{
	var chocolate=0
	var butterscotch=0
	var vanilla=0
	var strawberry=0
	User.find({vote:'Chocolate'}, function(err,foundChocolates){
		console.log(foundChocolates.length)
		if(err){
			console.log(err)
		}
		chocolate=foundChocolates.length;
		User.find({vote:'Butterscotch'}, function(err,foundButterscotch){
			console.log(foundButterscotch.length)
			butterscotch=foundButterscotch.length;
			User.find({vote:'Vanilla'}, function(err,foundVanilla){
				console.log(foundVanilla.length)
				vanilla=foundVanilla.length;
				User.find({vote:'Strawberry'}, function(err,foundStrawberry){
					console.log(foundStrawberry.length)
					strawberry=foundStrawberry.length;

					if(req.isAuthenticated()){
						res.render('voting-results', {chocolate:chocolate, butterscotch:butterscotch, vanilla:vanilla, strawberry:strawberry})
					}else{
						res.redirect('/')
					}
				})
			})
		})
	})
	
})

app.get('/voting-page',(req,res)=>{
	if(req.isAuthenticated()){
		res.render('voting-page')
	}else{
		res.redirect('/')
	}
})
app.get('/',(req,res)=>{
	req.logout()
	res.render('login')
})
app.listen(process.env.PORT||3000, ()=>{
	console.log('Server started');
})