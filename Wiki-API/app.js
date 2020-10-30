const bodyParser=require('body-parser');
const express=require('express');
const app=express();
const mongoose=require('mongoose');
const ejs=require('ejs');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/wikiDB',{useNewUrlParser:true, useUnifiedTopology:true});
const articleSchema={
	title:String,
	content:String
}
const Article=mongoose.model('Article',articleSchema);

app.route('/articles')

.get(function(req,res){
	Article.find({},function(err, foundArticles){
		if(err){
			res.send(err)
		}
		else{
			res.send(foundArticles)
		}
	})
})

.post(function(req,res){
	const title= req.body.title;
	const content=req.body.content;
	const newArticle= new Article({
		title: title,
		content:content
	})

	Article.find({title:title},function(err, foundArticles){
		if(err){
			res.send(err)
		}
		else{
			console.log(foundArticles)
			if(foundArticles==''){
				newArticle.save(function(err){
					if(err){
						res.send(err);
					}
				});
				res.redirect('/articles')
				
			}
			else{
				console.log("Article with this title exists already, kindly assign a new title")
				res.send("Article with this title exists already, kindly assign a new title")
			}
		}
	})
})

.delete(function(req,res){
	Article.deleteMany({}, function(err){
		if(err){
			res.send(err);
		}
		else{
			res.redirect('/articles')
		}
	})
})


app.route('/articles/:articleName')

.get(function(req,res){
	const articleName=req.params.articleName;
	Article.findOne({title:articleName},function(err, foundArticles){
		if(err){
			console.log(err)
			res.send(err)
		}
		else{
			if(foundArticles==''){
				res.send('No such Articles found')
				console.log('No such Articles found')
			}
			else{
				console.log(foundArticles)
				res.send(foundArticles)
			}
		}
	})
})

.put(function(req,res){
	const articleName=req.params.articleName;
	Article.updateOne({title:articleName}, {
		title: req.body.title,
		content:req.body.content
	},{overwrite:true}, function(err){
		if(err){
			res.send(err);
		}
		else{
			res.redirect('/articles')
		}
	})
})
.patch(function(req,res){
	const articleName=req.params.articleName;
	Article.updateOne({title:articleName}, {
		$set: req.body
	}, function(err){
		if(err){
			res.send(err);
		}
		else{
			res.redirect('/articles')
		}
	})
})

.delete(function(req,res){
	const articleName=req.params.articleName;
	Article.deleteOne({title:articleName},function(err){
		if(err){
			console.log(err)
			res.send(err)
		}
		else{
			console.log('Delete operation successful')
			res.send('Delete operation successful')
		}
	})
})

app.listen(3000||process.env.PORT,function(){
	console.log('server started on port 3000')
})