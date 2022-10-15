var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());
app.options('*', cors());


const path = require('path');

app.get('/', function(req, res, next){
  res.header('Content-Type', 'text/html')
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/main.min.css', function(req, res, next){
  res.header('Content-Type', 'text/css')
  res.sendFile(path.join(__dirname, 'build', 'static', 'css', 'main.min.css'))
})

app.get('/main.min.js', function(req, res, next){
  res.header('Content-Type', 'text/javascript')
  res.sendFile(path.join(__dirname, 'build', 'static', 'js', 'main.min.js'))
})

app.listen(3000);
