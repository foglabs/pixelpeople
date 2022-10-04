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

app.listen(3000);
