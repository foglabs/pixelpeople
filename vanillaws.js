const RED = 0
const ORANGE = 1
const YELLOW = 2
const GREEN = 3
const BLUE = 4
const INDIGO = 5
const VIOLET = 6

const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');

const MASTER_KEY = '123457'

// I'm maintaining all active connections in this object
const clients = {};
const client_modes = {}
const client_ready = {}

let master = ''

// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server
})
console.log('started websocky servy')

// connect in the first place
wsServer.on('request', function(request) {

  // we doin this REGARDLESS
  var userID = getUniqueID()

  let origin = request.origin;
  console.log((new Date()) + ' Recieved a new connection from origin ' + origin + '.');
  // rewrite this part of the code to accept only the requests from allowed origin (if ya feel that)
  const connection = request.accept(null, origin);

  // store ws conn for this user with init color
  clients[userID] = newClient()
  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients))

  connection.on('message', function(message) {

    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      let data = JSON.parse(message.utf8Data);
      // console.log(data)

      // get origin from client!
      if(!clients[userID].ready) {

        let data = JSON.stringify({userid: userID})
        clients[userID].ready = true
        clients[userID].connection.send(data)
        
      } else {
        // get the mode, get the note - boom
        let note_name = client_modes[data.userid] + data.note;

        // broadcast note to master connection
        // if(clients[master]){
        //   console.log('found master ' + master)
        //   clients[master].send(note_name);
        // }

      }
      
    }
  });
});



// This code generates unique userid for everyuser.
function getUniqueID(){
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  return s4() + s4() + '-' + s4()
}

function newClient(connection){
  let clientData = {}
  clientData.ready = false
  clientData.connection = connection
  clientData.color = RED
  return clientData
}

