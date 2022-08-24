const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');

// I'm maintaining all active connections in this object
const clients = {};

const COLORS = [ "red", "red-orange", "orange", "orange-yellow", "yellow", "yellow-green", "green", "green-blue", "blue", "blue-violet", "violet", "violet-red"]

// This code generates unique userid for every beepr
function getUniqueID() {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
}

function randomColor(){
  return COLORS.sort(() => Math.random() - 0.5)[0]
}

function deleteClient(userID){
  clients[userID].close()
  delete clients[userID]
}

function updatePixels(){
  let pixelColors = Object.keys(clients).map( (userID) => {
    if(clients[userID]){
      return clients[userID].pixelColor
    }
  })

  console.log( 'these are my current colors!', pixelColors )

  Object.keys(clients).forEach( (userID) => {
    // update each client on current colors
    console.log( 'updating colors for ', userID )

    let data = {userID: userID, pixelColors: pixelColors}

    sendDataToClient(userID, data)
  })
}

function sendDataToClient(userID, data){
  let msg = JSON.stringify(data)
  console.log( 'sending msg ', msg )
  clients[userID].send(msg)
}

function userColors(){
  return Object.keys(clients).map(userID => clients[userID].pixelColor)
}

// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort);

console.log('Welcome To Your Baby Beeper Sockets...')
const wsServer = new webSocketServer({
  httpServer: server
})

// connect in the first place
wsServer.on('request', function(request) {

  // we doin this REGARDLESS
  var userID = getUniqueID()

  let origin = request.origin
  console.log((new Date()) + ' Recieved a new connection from origin ' + origin + '.')

  // could be usd to accept only from specififc origin, now takes any
  const connection = request.accept(null, origin)

  clients[userID] = connection
  // init rand color for new user, will be sent when we 
  clients[userID].pixelColor = randomColor()
  clients[userID].pixelActive = true
  // tell the new client who they is and what the pixels are
  updatePixels()

  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients))

  connection.on('message', function(message) {

    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      let data = JSON.parse(message.utf8Data);

      // // get origin from client!
      // if(!client[data.userID].pixelReady) {
      //   // set up initial state for newly connected client
          
      //   // pixel player
      //   clients[userID].pixelColor = randomColor()

      //   let data = JSON.stringify({userID: userID, userColor: clients[userID].pixelColor })
      //   client[userID].pixelReady = true

      // } else {

      //   // clients already ready!!!

      //   // record clients pix change
      //   let newColor = data.pixelColor
      //   if(clients[data.userID].pixelColor !== newColor){
      //     clients[data.userID].pixelColor = newColor
      //   }

      //   // get the mode, get the note - boom
      //   // let note_name = client_modes[data.userid] + data.note;
      //   // // broadcast note to master connection
      //   // if(clients[master]){
      //   //   console.log('found master ' + master)
      //   //   clients[master].send(note_name);
      //   // }

      // }

      if( clients[data.userID] ){

        if(data.pong){
          // client responded to our ping!!!
          console.log( 'received pong from client ', data.userID )
          clients[data.userID].pixelActive = true
        } else {

          // actual state change
          if(data.changeColor){
            // if user asked to change their color, do it
            clients[data.userID].pixelColor = data.changeColor
          } else if(data.disconnect){
            console.log( 'disconnect ', data.userID )
            deleteClient(data.userID)
          }

          // then update everybody with all the colors
          updatePixels()
        }

      }

    }
  })


  setInterval(() => {
    let data = {ping: true}
    Object.keys(clients).forEach( (userID) => {
      console.log( 'sent ping ', userID )
      sendDataToClient(userID, data)
    })
  }, 5000)
  setInterval(() => {
    Object.keys(clients).forEach( (userID) => {
      if(!clients[userID].pixelActive){
        console.log( 'culled dead client ', userID )
        deleteClient(userID)
      }
    })
  }, 10000)

})
