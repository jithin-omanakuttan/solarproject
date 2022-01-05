const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const ejs = require("ejs");
var validate = require('mongoose-validator')
const app = express();

// setting the path
const staticpath=path.join(__dirname,"../public")
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use('/css',express.static(path.join(__dirname,"../node_modules/bootstrap/dist/css")))
app.use('/js',express.static(path.join(__dirname,"../node_modules/bootstrap/dist/js")))
app.use('/jq',express.static(path.join(__dirname,"../node_modules/jquery/dist")))
app.use('/parlx',express.static(path.join(__dirname,"../node_modules/parlx.js/lib")))
app.use(express.static(staticpath))
app.use(express.static("./public/images"));
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname,"../views"));

///////////////////////////////////////////////
mongoose.connect('mongodb://localhost:27017/myApp')
mongoose.connection.on('connected', () => console.log('Connected'));
mongoose.connection.on('error', () => console.log('Connection failed with - ',err));



// Mongo URI
const mongoURI = 'mongodb://localhost:27017/mongouploads';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

//db
const contSchema={
  Name:{
    type:String ,
    required: true},
  
  email:{
    type:String,
    required: true
  },
  phone: 
  {
    type:Number,
    required: true
  },

  message:{

  type:String,
  required: true
  }
}
const postSchema = {
  title: String,
  content: String,
  date: String
};

const Cont= mongoose.model("Cont",contSchema)
const Post = mongoose.model("Post", postSchema);

                      //gallery section of the page-gridfs system

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,

  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET /

app.get('/gallery', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('gallery', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('gallery', { files: files });
    }
  });
});


app.get('/upload', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('index', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('index', { files: files });
    }
  });
});

// @route POST /upload
// @desc  Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
  // res.json({ file: req.file });
  res.redirect('/gallery');
});

// @route GET /files
// @desc  Display all files in JSON
app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/gallery');
  });
});

//////////////////////////////////////////////////////////////////////////

//handling post req of contact section

app.post("/contact",(req,res)=>{
   
  const cont= new Cont({
      Name:req.body.name,
      email:req.body.contactEmail,
      phone: req.body.contactPhone,
      message:req.body.comment
  })
  cont.save(function(err){
      if (!err){
          res.redirect("/success")
      }
    });
})

/////////////////////////////////////////////////////////

//handling post and get req of blog section
app.post("/compose", function(req, res){
  console.log(req.body.postTitle);
  console.log(req.body.postBody);
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody,
      date:new Date().toLocaleDateString()
    
    });
  
  
    post.save(function(err){
      if (!err){
          res.redirect("/");
      }
      else
      {
        console.log("error");
      }
    });
  });

  app.get("/blog", (req, res)=>{
  Post.find({}, (err, posts)=>{
    res.render("blog", {
        posts: posts,
        });
    });
  });

  app.get("/blogs/:blogsId", (req, res)=>{

    const requestedblogsId = req.params.blogsId;
    
      Post.findOne({_id: requestedblogsId}, (err, post)=>{
        res.render("blogs", {
        
          title: post.title,
          content: post.content
        });
      });
    
    });

///////////////////////////////////////

   

  /////////////////////////////////////////////////////////////////
  //general routing
  app.get("/",
(req,res)=>{
  
    res.render("home")
})
app.get("/:id",(req,res)=>{
  const parameter=req.params.id
  res.render(parameter)
}
)


const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));