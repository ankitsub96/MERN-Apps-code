//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _= require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-Ankit:'+process.env.PASSWORD+'@cluster0.xq3rv.mongodb.net/todolistDB',{useNewUrlParser:true, useUnifiedTopology:true});
const itemsSchema={
	name:String
}
const Item=mongoose.model('Item', itemsSchema);

const Item1=new Item({
	name:'Welcome to your todolist!'
});

const Item2=new Item({
	name:'Hit the + to add a new item'
});
const Item3=new Item({
	name:'<-- Hit this to delete an item'
});
const defaultItems=[Item1,Item2,Item3];

const listSchema={
	name:String,
	items:[itemsSchema]
}
const List=mongoose.model('List',listSchema);

Item.deleteMany({},function(err,items){
	if(err){
		console.log(err);
	}
	else{
		console.log('deleteMany successful')
	}
	
})


app.get('/', function(req,res){
	
	Item.find({},function(err,foundItems){
		if(err){
			console.log(err);
		}
		else if(foundItems.length==0){
			Item.insertMany(defaultItems,function(err){
				if(err){
					console.log(err);
				}
				else{
					console.log('All items inserted successfully');
				}
			})
			res.redirect('/');
		}
		else{

			var today= new Date();
			var options={
				weekday:'long',
				day:'numeric',
				month:'long',
				year:'numeric'
			}
			var day=today.toLocaleDateString('en-UK',options);

			res.render('list',{listTitle:'Today',newListItems:foundItems,kindOfDay:day});

		}
	})
	
})

app.get('/:customListName', function(req,res){
	customListName= _.capitalize(req.params.customListName);
	List.findOne({name:customListName},async function(err, foundList){
		if(!err){
			if(!foundList){
				const list= new List({
					name: customListName,
					items: defaultItems
				})
				await list.save();
				await res.redirect('/'+customListName);
			}
			else{
				var today= new Date();
			var options={
				weekday:'long',
				day:'numeric',
				month:'long',
				year:'numeric'
			}
			var day=today.toLocaleDateString('en-UK',options);
				res.render('list',{listTitle:foundList.name,newListItems:foundList.items,kindOfDay:day})		}
			}
		})

	
	
})

app.post('/', function(req,res){
	var itemName= req.body.newItem;
	const listName=req.body.list;

	const item=new Item({
		name:itemName
	});

	if(listName==="Today"){
		item.save();
		res.redirect('/');
	}else{
		List.findOne({name:listName},async function(err, foundList){
			if(err){
				console.log(err);
			}else{
				console.log(await foundList);
				await foundList.items.push(item);
				await foundList.save();
				res.redirect('/'+listName);
			}
		})
	}

})

app.post('/delete', function(req,res){
	const checkedItemId=req.body.checkbox;
	const listName=req.body.listName;
	console.log(listName);	
	console.log(checkedItemId);
	if(listName==='Today'){
		Item.deleteOne({'_id':checkedItemId},function(err){
			if(err){
				console.log(err);
			}
			else{
				console.log('Items deleted successfully');
				res.redirect('/');
			}
		})
	}
	else{
		List.findOneAndUpdate({name: listName},{$pull:{items:{_id:checkedItemId}}}, function(err,foundList){
			if(!err){
				res.redirect('/'+listName);
			}
		})
	}
	
	
})


app.listen(process.env.PORT || 3000, function() {
	console.log("Server started on the appropriate port ");
});
