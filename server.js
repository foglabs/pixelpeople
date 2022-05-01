var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());
app.options('*', cors());


app.use(express.static('seq'));

// app.use(express.static('vr'));
const path = require('path');

// app.get('/seq.js', function(req, res, next){
//   res.header('Content-Type', 'text/javascript')
//   res.sendFile(path.join(__dirname, 'src', 'seq.js'))
// })

app.get('/lib/:filename', function(req, res){
  res.header('Content-Type', 'text/javascript')
  console.log("filenammeme", req.params.filename)
  res.sendFile(path.join(__dirname, 'src', req.params.filename))
})

app.listen(4000);
