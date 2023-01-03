const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');

// I'm maintaining all active connections in this object
const clients = {};

const COLORS = [ "red", "red-orange", "orange", "orange-yellow", "yellow", "yellow-green", "green", "green-blue", "blue", "blue-violet", "violet", "violet-red"]

var groupModeEnabled = false

var beatModeEnabled = false
var beatModeSeqStartTime = false
var beatModeCurrentStep = false

var beatModeTempo = false
var beatModeSteps = false
var beatChecks = new Array(sequencerTrackLength).fill(false)

var sequencerTrackLength = 16

var groupMasterUserID = false


// This code generates unique userid for every beepr
function getUniqueID() {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
}

function randomColor(){
  // this mutates the muphuckin array but it doesnt matter
  return COLORS.sort(() => Math.random() - 0.5)[0]
}

function deleteClient(userID){
  clients[userID].close()
  delete clients[userID]
}

function updatePixels(){
  let pixelData = Object.keys(clients).map( (userID) => {
    if(clients[userID]){
      return { color: clients[userID].pixelColor, userID: userID }
    }
  })

  Object.keys(clients).forEach( (userID) => {
    // update each client on current colors
    console.log( 'updating colors for ', userID )

    let data = {userID: userID, userColor: clients[userID].pixelColor, pixelData: pixelData }

    sendDataToClient(userID, data)
  })
}

function startGroupMode(masterUserID){
  groupModeEnabled = true
  groupMasterUserID = masterUserID
  Object.keys(clients).forEach( (userID) => {
    let data = {userID: userID, groupMode: "start", groupMasterID: groupMasterUserID}
    sendDataToClient(userID, data)   
  })
}

function stopGroupMode(){
  groupModeEnabled = false
  groupMasterUserID = false
  
  beatModeEnabled = false
  beatModeSeqStartTime = false
  beatModeCurrentStep = false
  beatModeTempo = false
  beatModeSteps = false

  Object.keys(clients).forEach( (userID) => {
    let data = {userID: userID, groupMode: "stop", groupMasterID: false}
    sendDataToClient(userID, data)   
  })
}

function startBeatMode(masterUserID, tempo, steps){
  beatModeEnabled = true
  beatModeSeqStartTime = performance.now()
  beatModeCurrentStep = 0
  beatModeTempo = tempo
  beatModeSteps = steps

  groupMasterUserID = masterUserID
  Object.keys(clients).forEach( (userID) => {
    let data = {userID: userID, groupMode: "beat", groupMasterID: groupMasterUserID}
    sendDataToClient(userID, data)   
  })
}

function sendDataToClient(userID, data){
  if(clients[userID]){
    let msg = JSON.stringify(data)
    console.log( 'sending msg ', msg )
    clients[userID].send(msg)  
  }
  
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
  clients[userID].lives = 2

  if(groupModeEnabled){
    // tell the new client about group mode
    sendDataToClient(userID, {groupMode: "start", groupMasterID: groupMasterUserID})
  } else if(beatModeEnabled){
    // tell the new client about beat mode
    sendDataToClient(userID, {groupMode: "beat", groupMasterID: groupMasterUserID})
  }

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
          // console.log( 'received pong from client ', data.userID )
          if(clients[data.userID].lives < 8){
            clients[data.userID].lives += 1
          }
        } else {

          // actual state change
          if(data.changeColor){
            // if user asked to change their color, do it
            clients[data.userID].pixelColor = data.changeColor
          } else if(data.lightStep){
            beatModeCurrentStep = parseInt(data.lightStep)
          } else if(data.beat && beatModeEnabled){
            // this is a user tapping their button and sending a 'beat' event

            // if(current step goes with data.userID){
            if(isBeatUserID(beatModeCurrentStep, data.userID)){
              // all this step to play since user tapped butt in time
              console.log( 'hey i got it', beatModeCurrentStep )
              beatChecks[beatModeCurrentStep] = true
              sendDataToClient(groupMasterUserID, { beatChecks: beatChecks })
            }



          } else if(data.disconnect){
            console.log( 'disconnect ', data.userID )
            deleteClient(data.userID)
          } else if(data.groupMode){
            if(data.groupMode === "start"){
              // silence all users other than sender
              console.log( 'starting groupmode with master ', data.userID )
              startGroupMode(data.userID)
            } else if(data.groupMode === "beat"){
              // silence all users other than sender
              console.log( 'starting beatmode with beatmaster ', data.userID )

              // set tempo to use for beat tap timers
              startBeatMode(data.userID, data.tempo, data.steps)
            } else {
              // go back to normal
              console.log( 'stopping groupmode :: master ', data.userID )
              stopGroupMode()
            }
          } else if(data.changeTempo){
            // receive tempo from beatmaster change
            beatModeTempo = data.changeTempo
          }

          // then update everybody with all the colors
          updatePixels()
        }

      }

    }
  })

  setInterval(() => {
    // beatmode loop -> check whether we expect beattap now
    if(beatModeEnabled){
      if(beatModeCurrentStep == sequencerTrackLength-1){
          resetBeatChecks()

          // tell client thbat beat checks are off!
          sendDataToClient(groupMasterUserID, { currentStep: beatModeCurrentStep, beatChecks: beatChecks })
      }

      // // every sequencer run
      // // someone is responsible for tapping each step

      // if(performance.now() > ( beatModeSeqStartTime + (stepLength(beatModeTempo) * beatModeCurrentStep) ) ){
      //   console.log( `finished ${beatModeCurrentStep}` )
      //   beatModeCurrentStep += 1

      //   if(beatModeCurrentStep == sequencerTrackLength){
      //     // reset loop, end of seq
      //     console.log( 'finished seq, resetting' )
      //     beatModeCurrentStep = 0
      //     beatModeSeqStartTime = performance.now()
      //     resetBeatChecks()

      //     // tell client thbat beat checks are off!
      //     sendDataToClient(groupMasterUserID, { currentStep: beatModeCurrentStep, beatChecks: beatChecks })
      //   }
      // }
    }

  }, 1)

  function stepLength(tempo){
    // tempotosteptime
    return Math.floor(15000/tempo)
  }

  function resetBeatChecks(){
    // set every beat block bool to false, will later flip true if we get beattap
    beatChecks = new Array(sequencerTrackLength).fill(false)
  }

  function isBeatUserID(step, userID){
    // not real
    return true
    return beatModeStepIDs[step] == userID
  }

  setInterval(() => {
    let data = {ping: true}
    Object.keys(clients).forEach( (userID) => {
      // console.log( 'sent ping ', userID )
      sendDataToClient(userID, data)
    })
  }, 2000)
  setInterval(() => {
    Object.keys(clients).forEach( (userID) => {
      if(clients[userID].lives == 0){
        console.log( 'culled dead client ', userID )
        // clean em up
        deleteClient(userID)
        // let em know
        updatePixels()
      } else {
        // take health off client 
        clients[userID].lives -= 1
      }
    })
  }, 4000)

})
