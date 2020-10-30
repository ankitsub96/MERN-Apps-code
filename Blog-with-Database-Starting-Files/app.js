//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

console.log(process.env.PASSWORD);

mongoose.connect('mongodb+srv://admin-Ankit:'+process.env.PASSWORD+'@cluster0.xq3rv.mongodb.net/<dbname>?retryWrites=true&w=majority',{useNewUrlParser:true, useUnifiedTopology:true});
const itemsSchema={
  title:String,
  content: String
}
const Item=mongoose.model('Item', itemsSchema);

const home=new Item({
  title: 'Home',
  content: "Welcome to the Home page of this Blog Website. The navbar at the top can be used to navigate through this website. \r \n"+
  '\r \n' +
  "Click on compose to Create a new post. A word to the wise: Kindly provide a unique title to every post to maintain uniformity and avoid confusion across the website. Kindly, also do not use question marks. Regretfully, right now, the Edit Post functionality hasn't been added. \r \n"+
  '\r \n' +
  'Once created, Previews of your posts can be accessed from the home page, where you can click on "Read More" to view the whole post.'
})

const about =new Item({
  title: 'About',
  content: "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui."
})

const contact=new Item({
  title: 'Contact',
  content: "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero."
})
Item.find({}, function(err, foundItems){
  if(!err){
    var homeFlag=false;
    var aboutFlag=false;
    var contactFlag=false;
    if(foundItems==""){
      insertMany([home,about,contact]);
    }

    foundItems.forEach(el=>{
      if(el.title=='Home'){
        homeFlag=true;
      }
      if(el.title=='About'){
        aboutFlag=true;
      }
      if(el.title=='Contact'){
        contactFlag=true;
      }
    })

    if(homeFlag==false){
      insertMany([home]);
    }
    if(aboutFlag==false){
      console.log(contact)
      insertMany([about]);
    }
    if(contactFlag==false){
      console.log(contact)
      insertMany([contact]);
    }

    function insertMany(arr){
      Item.insertMany(arr,function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log('All items inserted successfully');
        }
      })
    }
    
  }
})

app.get("/", function(req, res){
  Item.find({}, function(err, foundItems){
    if(err){
      console.log(err)
    } else{
      foundItems.forEach((el,index)=>{
        if(el.title=='About'){
          foundItems.splice(index, 1)
        }
      })
      foundItems.forEach((el,index)=>{
        if(el.title=='Contact'){
          foundItems.splice(index, 1)
        }
      })
      res.render("home", { posts:foundItems})   
    }
  })
});

app.get("/about", function(req, res){
  Item.find({title:'About'}, function(err, foundPost){
    if(err){
      console.log(err)
    } else{
      res.render("about", {aboutContent: foundPost[0].content});
    }
  })
});

app.get("/contact", function(req, res){
  Item.find({title:'Contact'}, function(err, foundPost){
    if(err){
      console.log(err)
    } else{
      res.render("contact", {contactContent: foundPost[0].content});
    }
  })
});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  const postTitle = _.capitalize(req.body.postTitle);
  const postContent = req.body.postBody;

  const post =new Item({
    title: postTitle,
    content: postContent
  })
  
  if(postTitle=='Home'){
    res.redirect("/");
  }

  Item.find({title:postTitle}, function(err, foundItems){
    if(err){
      console.log(err)
    } 
    else if(foundItems==""){
      console.log("post doesn't exist, creating...")

      Item.insertMany([post],function(err){
        if(err){
          console.log(err)
        } else{
          console.log('insertOne successful')
          setTimeout(function(){ 
            res.redirect("/posts/"+postTitle); }, 500); 
        }
      })
    }
    else{
      console.log('post exists already')
      res.render("postExists");
    }  
    
  })

});

app.get("/posts/:postName", function(req, res){
  const requestedTitle = _.capitalize(req.params.postName);
  console.log(requestedTitle)

  Item.find({title:requestedTitle}, function(err,foundPost){
    if(!err){
      if(foundPost==''){
        console.log('rendering postNotFound.ejs')
        res.render('postNotFound');
      }
      else{
          console.log('rendering post.ejs')
          res.render("post", {
            title: foundPost[0].title,
            content: foundPost[0].content
          });
        
      }
    }
  })
});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on the appropriate port ");
});