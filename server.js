var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());
app.options('*', cors());


app.use(express.static('seq'));

const path = require('path');

app.get('/', function(req, res, next){
  res.header('Content-Type', 'text/html')
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.get('/static/css/main.d678fb26.css', function(req, res, next){
  res.header('Content-Type', 'text/css')
  res.sendFile(path.join(__dirname, 'build', 'static', 'css', 'main.d678fb26.css'))
})

app.get('/static/js/main.5e994eaa.js', function(req, res, next){
  res.header('Content-Type', 'text/javascript')
  res.sendFile(path.join(__dirname, 'build', 'static', 'js', 'main.5e994eaa.js'))
})

app.listen(3000);
