import "./App.css";
// core
import React, { Component, useEffect } from "react"
import { w3cwebsocket as W3CWebSocket } from "websocket"

// me
import Pixel from "./components/Pixel.js"
import SoundShow from "./components/SoundShow.js"
import ColorPicker from "./components/ColorPicker.js"
import Synth from "./classes/Synth.js"
import MasterSequencer from "./classes/MasterSequencer.js"
import ColorScheme from "./classes/ColorScheme.js"
import BigDisplay from "./components/BigDisplay.js"
import SimpleControl from "./classes/SimpleControl.js"
import TransportControl from "./classes/TransportControl.js"

import WorkerBuilder from "./wb.js"
import SequencerWorker from "./seqWorker.js"

// handles timing
var seqWorker = new WorkerBuilder(SequencerWorker)

// online
const SOCKET_BACKEND = "wss://" + window.location.hostname + "/s"
// const SOCKET_BACKEND = "ws://" + window.location.hostname + ":8000"
var client = new W3CWebSocket(SOCKET_BACKEND)


function sendDataToServer(data) {
  let str = JSON.stringify(data)
  client.send(str)
  // console.log( 'lol!', data )
}

function killOnline(userID){
  sendDataToServer({disconnect: true, userID: userID})
}

// tell server we're disconnecting before close
window.onbeforeunload = function() {
  client.onclose = function () {}; // disable onclose handler first
  killOnline(client.userID)
  client.close();
}

// const COLORS = [ "red", "red-orange", "orange", "orange-yellow", "yellow", "yellow-green", "green", "green-blue", "blue", "blue-violet", "violet", "violet-red"]
const SCHEMEMODE0 = 0
const SCHEMEMODE1 = 1

class App extends Component { 
  constructor(props){
    super(props)

    this.sequencerTrackLength = 16

    this.state = {
      tempo: 64,
      numPix: 0,
      pixels: [],
      synths: [],
      // kind of stupid but easier to track v
      synthsPlaying: [],
      playing: false,
      masterGain: 0.36,
      masterSequencerSteps: new Array(this.sequencerTrackLength).fill(true),
      masterSequencerColors: new Array(this.sequencerTrackLength).fill("#000"),
      schemeColors: [],
      randomizePixels: false,
      randomizePixelsInterval: 3600,
      noteLength: 1.64,
      semitoneShift: -24,
      schemeMode: SCHEMEMODE0,
      
      online: true,
      userID: false,
      userColor: false,

      // is the server in group mode
      groupMode: false,
      lastTempoChange: Date.now(),
      // who is da masta
      groupMasterID: false,
      beatChecks: new Array(this.sequencerTrackLength).fill(false),

      heldDown: false,
      holdTimer: false,
      holdFactor: 0.5,

      darkMode: true,
      coarse: false,
      optionsMenu: false,

    }

    this.reset = this.reset.bind(this)
    this.toggleMasterSequencerStep = this.toggleMasterSequencerStep.bind(this)
    this.addPixel = this.addPixel.bind(this)
    this.removePixel = this.removePixel.bind(this)
    this.changeMasterGain = this.changeMasterGain.bind(this)
    this.changeTempo = this.changeTempo.bind(this)
    this.changeNoteLength = this.changeNoteLength.bind(this)
    this.changeSemitoneShift = this.changeSemitoneShift.bind(this)

    this.changeRandomizePixelsInterval = this.changeRandomizePixelsInterval.bind(this)
    this.changeNumPix = this.changeNumPix.bind(this)

    this.changeColor = this.changeColor.bind(this)
    this.addOnlinePixel = this.addOnlinePixel.bind(this)

    this.playSounds = this.playSounds.bind(this)
    this.stopSounds = this.stopSounds.bind(this)
    this.toggleOnline = this.toggleOnline.bind(this)
    this.incrementSchemeMode = this.incrementSchemeMode.bind(this)
    this.toggleDarkMode = this.toggleDarkMode.bind(this)
    this.toggleGroupMode = this.toggleGroupMode.bind(this)
    this.toggleBeatMode = this.toggleBeatMode.bind(this)
    this.toggleAddMode = this.toggleAddMode.bind(this)
    this.toggleShowMode = this.toggleShowMode.bind(this)
    this.toggleRandomizePixels = this.toggleRandomizePixels.bind(this)
    this.toggleCoarse = this.toggleCoarse.bind(this)
    this.incrementSchemeMode = this.incrementSchemeMode.bind(this)

    this.tapBeatButton = this.tapBeatButton.bind(this)

    this.toggleMoreMenu = this.toggleMoreMenu.bind(this)
    this.toggleModeMenu = this.toggleModeMenu.bind(this)
    this.toggleOptionsMenu = this.toggleOptionsMenu.bind(this)

    this.startHoldDown = this.startHoldDown.bind(this)
    this.stopHoldDown = this.stopHoldDown.bind(this)
  }

  componentDidMount(props){
    this.startAudioContext()

    this.setupSocketEvents()

    // let synth1,synth2,synth3
    // synth1 = new Synth(this.audioContext, this.gainNode, 0.2, "sine", 440, 0.1, 0.1, 0.1)
    // synth2 = new Synth(this.audioContext, this.gainNode, 0.2, "sine", 880, 0.1, 0.1, 0.1)
    // synth3 = new Synth(this.audioContext, this.gainNode, 0.2, "sine", 220, 0.1, 0.1, 0.1)

    this.setState({pixels: this.getPixels()}, () => {
      // in online, this wont do antying ^ pixels arrive over socket

      // after grabbing pixel state, make sounds
      this.updateSounds()
      this.setColorScheme(this.state.pixels)

      this.changeMasterGain(this.state.masterGain)
      this.changeTempo(this.state.tempo)
      this.changeNoteLength(this.state.noteLength)
      this.changeSemitoneShift(this.state.semitoneShift)
      this.changeNumPix(this.state.numPix)
      this.changeRandomizePixelsInterval(this.state.randomizePixelsInterval)
      this.playSounds()

      // start seq
      // var sequencerWorker = new Worker(sequencer)
      seqWorker.onmessage = (action) => {
        if(action) {
          // console.log("Message from sequencer", action.data);
          if(action.data.playSynth){
            // play synth now, since seq said so
            
            // console.log( 'playing synth', action.data.playSynth.index )

            if(this.isBeatMode() && this.isMaster()){

              // checking beat check, but server doesnt yet diff which users tapping
              if( this.state.masterSequencerSteps[this.state.lightStep] && this.state.beatChecks[this.state.lightStep] ){
                this.state.synths[action.data.playSynth.index].play()
              }
            } else if(!(this.state.groupMode == "group" || this.state.groupMode == "beat") || this.isMaster() ){
              // save the check of group OR beatmode ^

              // regular or group mode play
              this.state.synths[action.data.playSynth.index].play()
            }

          } else if(action.data.lightStep){
            if(this.isBeatMode() && this.isMaster()){
              sendDataToServer({userID: this.state.userID, lightStep: action.data.lightStep})
            }
            this.setState({lightStep: action.data.lightStep})
          } else if(action.data.randomizePixels){
            if(this.state.playing){

              // get rid of old pixels
              this.setState({pixels: []}, () => {

                // get/generate new ones
                this.setState({pixels: this.getPixels()}, () => {
                  // change synths
                  this.setColorScheme(this.state.pixels)
                  this.updateSounds()
                })
              })
            }
          }
        }
      }

      setInterval(() => {
        // update sounds frequently!!
        if(this.state.playing){
          // update seq tracks every 30ms
          
          // pattern sounds could get created in here v
          // and new seq tracks get created
          this.updateSounds()
          // sequencer steps are all set in here v
          this.setColorScheme(this.state.pixels)
          // update from master sequencer
          // this.updateSequencerTracks()
        }
      }, 60)
    })
  }

  startHoldDown(daFunc, fieldName, increment, round=false){
    // this.setState({holdDownField: "tempo", )

    if(this.state.holdDown != fieldName){
      var holdTimer = setInterval( () => {

        console.log( 'holding down... ', fieldName, increment )
        // let data = {}
        // data[fieldName] = this.state[fieldName] + increment
        // this.setState({data})

        let change
        // run the changer function every 1s
        if(this.state.coarse){
          change = increment
        } else {
          change = increment*this.state.holdFactor
          if(round){
            change = Math.floor(change)
          }
        }
        
        daFunc(this.state[fieldName] + change)
        this.setState({holdFactor: this.state.holdFactor*1.3})
      }, 280 )

      this.setState({holdDown: fieldName, holdTimer: holdTimer})  
    }
    
  }

  stopHoldDown(){
    clearInterval(this.state.holdTimer)
    this.setState({holdTimer: false, holdDown: false, holdFactor: 1})
  }

  setupSocketEvents(){
    client.onopen = () => {
      console.log('WebSocket Client Connectedzz');
      sendDataToServer({url: URL})
    }

    client.onmessage = (message) => {
      // console.log('da message', message)
      let data = JSON.parse(message.data)

      if(data.ping){
        // console.log( 'sending ping wiht usid', this.state.userID )
        sendDataToServer({userID: this.state.userID, pong: true})

        // ?ButtonReset=PRESS
        var p = new URL(window.location)
        if(p.searchParams.get("ButtonReset") == "PRESS"){
          // tell all to reset and refresh
          this.resetAll()
          window.location.href = window.location.hostname
        } else if(p.searchParams.get("Show") == "SET"){
          if(this.state.userID){
            console.log( 'ok, im gonna =do it ',window.location.pathname )
            // only once we have userid, switch showmode
            this.toggleShowMode()
            // get rid of url param
            window.history.replaceState(null, '', window.location.pathname)
          }
          // window.location.href = window.location.hostname
        }

      } else {
 

        // actual state change
        let localData = {}
        if(!this.state.userID){
          // only update on init
          console.log( 'changed userid to ', data.userID )
          localData.userID = data.userID
          localData.userColor = data.userColor

          // store on client as well so we know how to close socket without state
          client.userID = data.userID
        }

        // regular pixel update
        if(data.pixelData){
          localData.pixels = this.pixelsFromColors(data.pixelData)
        }

        if(data.groupMode){
          // console.log( 'groupmoddata ', data )
          if(data.groupMode === "group"){
            // start group mode
            // console.log( 'starting groupmode with master ', data.groupMasterID )

            this.setState({groupMode: "group", groupMasterID: data.groupMasterID})

            if(data.groupMasterID !== this.state.userID){
              this.changeMasterGain(0)
            }

          } else if(data.groupMode === "beat"){
            // start beat mode

            this.setState({groupMode: "beat", groupMasterID: data.groupMasterID, beatColor: data.beatColor})

            if(data.groupMasterID !== this.state.userID){
              this.changeMasterGain(0)
            }

          } else if(data.groupMode === "add"){
            // start add mode

            this.setState({groupMode: "add", beatColor: data.beatColor, tempo: data.tempo})
          } else if(data.groupMode === "show"){
            // start show groupadd mode

            this.setState({groupMode: "show", groupMasterID: data.groupMasterID, tempo: data.tempo})
            // turn everyones damn volume down
            if(data.groupMasterID !== this.state.userID){
              this.changeMasterGain(0)
            }
          } else {


            this.setState({groupMode: false, groupMasterID: false})
            this.changeMasterGain(this.state.masterGain)
            if(data.resetAll == "MANGO"){
              console.log( 'Mango!' )
              window.location.href = window.location.hostname
            }
          }
        }

        if(data.changeTempo){
          // server said change our tempo
          this.changeTempo(data.changeTempo, true)
        }

        if(data.beatChecks){
          localData.beatChecks = data.beatChecks
        }

        this.setState(localData, () => {
          this.updateSounds()
          this.setColorScheme(this.state.pixels)
        })
      }

    }
  }

  isMaster(){
    return ( ( this.isGroupMode() || this.isShowMode() || this.isBeatMode() ) && this.state.groupMasterID == this.state.userID)
  }
  
  isGroupMode(){
    return this.state.groupMode == "group"
  }
  
  isBeatMode(){
    return this.state.groupMode == "beat"
  }

  isAddMode(){
    return this.state.groupMode == "add"
  }

  isShowMode(){
    return this.state.groupMode == "show"
  }

  reset(){
    let localData = {}
    if(this.state.online){
      sendDataToServer({userID: this.state.userID, reset: true})
    } else {
      // if offline, we wont get these from server
      localData.tempo = 64
      localData.pixels = []
      localData.schemeColors = []
    }

    localData.masterGain = 0.36
    localData.masterSequencerSteps = new Array(this.sequencerTrackLength).fill(true)
    localData.masterSequencerColors = new Array(this.sequencerTrackLength).fill("#000")
    localData.noteLength = 1.64
    localData.semitoneShift = -24
    localData.schemeMode = SCHEMEMODE0
    
    localData.numPix = 0
    localData.randomizePixels = false
    localData.randomizePixelsInterval = 3600
    this.setState(localData)
  }

  resetAll(){
    if(this.state.online){
      sendDataToServer({userID: this.state.userID, resetAll: true})
    }
  }

  restartOnline(){
    client = new W3CWebSocket(SOCKET_BACKEND)
    // have to re-set this up because old ones refered to dead socket
    this.setupSocketEvents()
  }

  stopOnline(){
    // tell server were disconnecting, close socket
    killOnline(this.state.userID)
    if(this.state.userID){
      // null out the local stuff
      this.setState({userID: false, pixels: []})
    }
  }

  toggleRandomizePixels(){
    this.setState( prevState => ({randomizePixels: !prevState.randomizePixels}), () => {
      seqWorker.postMessage({changeRandomizePixels: {value: this.state.randomizePixels} })
    })
  }

  toggleMoreMenu(){
    this.setState( prevState => ({moreMenu: !prevState.moreMenu}) )
  }

  toggleModeMenu(){
    this.setState( prevState => ({modeMenu: !prevState.modeMenu}) )
  }

  toggleOptionsMenu(){
    this.setState( prevState => ({optionsMenu: !prevState.optionsMenu}) )
  }

  toggleDarkMode(){
    this.setState( prevState => ({darkMode: !prevState.darkMode}) )
  }

  toggleCoarse(){
    this.setState( prevState => ({coarse: !prevState.coarse}) )
  }

  toggleMasterSequencerSteps(){
    this.setState( prevState => ({masterSequencerSteps: prevState.masterSequencerSteps.map( (step) => { return !step }) }), () => {
    })
  }

  changeRandomizePixelsInterval(newInterval){
  this.setState( prevState => ({randomizePixelsInterval: newInterval}), () => {
      seqWorker.postMessage({changeRandomizePixelsInterval: this.state.randomizePixelsInterval})
    }) 
  }

  incrementSchemeMode(){
    let newSchemeMode = this.state.schemeMode + 1
    if(newSchemeMode > SCHEMEMODE1){
      newSchemeMode = SCHEMEMODE0
    }
    this.setState({schemeMode: newSchemeMode})
  }

  toggleGroupMode(){
    // send server start/stop group mode
    // when starting, server will mute everyone other than the user that sent this

    let groupModeValue = this.isGroupMode() ? "stop" : "group"
    // always turn off beatmode since its either already off or we're using this method to turn it off
    sendDataToServer({userID: this.state.userID, groupMode: groupModeValue})
  }

  toggleBeatMode(){
    // send server start/stop group mode
    // when starting, server will mute everyone other than the user that sent this

    let beatModeValue = this.isBeatMode() ? "stop" : "beat"

    // send tempo and current seq steps so ss can keep track
    sendDataToServer({userID: this.state.userID, groupMode: beatModeValue, tempo: this.state.tempo, steps: this.state.masterSequencerSteps})
  }

  toggleAddMode(){
    // send server start/stop group mode
    // when starting, server will mute everyone other than the user that sent this

    let addModeValue = this.isAddMode() ? "stop" : "add"

    // send tempo and current seq steps so ss can keep track
    sendDataToServer({userID: this.state.userID, groupMode: addModeValue, tempo: this.state.tempo})
  }

  toggleShowMode(){
    // send server start/stop group mode
    // when starting, server will mute everyone other than the user that sent this

    let showModeValue = this.isShowMode() ? "stop" : "show"

    // send tempo and current seq steps so ss can keep track
    sendDataToServer({userID: this.state.userID, groupMode: showModeValue, tempo: this.state.tempo})
  }

  toggleOnline(){
    this.setState(prevState => ({online: !prevState.online}), () => {
      if(!this.state.online){
        this.stopOnline()
      } else {
        this.restartOnline()
      }
    })
  }

  toggleMasterSequencerStep(step){
    let steps  = [...this.state.masterSequencerSteps];
    let newStepVal = !steps[step]

    steps[step] = newStepVal
    this.setState({masterSequencerSteps: steps})

    // let newMasterSequencerSteps = [...masterSequencerSteps]
    // newMasterSequencerSteps[step] = !masterSequencerSteps[step]
    // setMasterSequencerSteps(newMasterSequencerSteps)
  }

  startAudioContext(){
    // create audio context and connect gain to it
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = 0.4
    this.gainNode.connect(this.audioContext.destination)
  }

  createSynth(index, gain, wave, freq, attk, hold, rels, color){
    // console.log( 'create synth ', index )
    let synth = new Synth(this.audioContext, this.gainNode, gain, wave, freq, attk, hold, rels)

    synth.index = index
    synth.color = color

    return synth
  }

  removeSynths(){
    for(var i=0; i<this.state.synths.length; i++){
      // delete each seq track
      seqWorker.postMessage({removeTrack: {index: i} })
    }

    // remove the actual synths and sp
    this.setState({synths: [], synthsPlaying: []})
  }

  shiftBySemitones(freq, semitones){
    // 2^(s/12)*freq
    return Math.pow(2, (semitones/12) ) * freq
  }

  getFrequency(colorName){
    // select which set of frequencies
    if(this.isGroupMode() || this.isShowMode()){
      return this.colorNameToFriendlyFreq(colorName)
    } else {
      return this.colorNameToFreq(colorName)
    }
  }

  colorNameToFreq(colorName){
    if(colorName == "red"){
      return this.shiftBySemitones(523.2511, this.state.semitoneShift)
    } else if(colorName == "red-orange"){
      return this.shiftBySemitones(587.3295, this.state.semitoneShift)
    } else if(colorName == "orange"){
      return this.shiftBySemitones(659.2551, this.state.semitoneShift)
    } else if(colorName == "orange-yellow"){
      return this.shiftBySemitones(698.4565, this.state.semitoneShift)
    } else if(colorName == "yellow"){
      return this.shiftBySemitones(783.9909, this.state.semitoneShift)
    } else if(colorName == "yellow-green"){
      return this.shiftBySemitones(880.0000, this.state.semitoneShift)      
    } else if(colorName == "green"){
      return this.shiftBySemitones(987.77, this.state.semitoneShift)
    } else if(colorName == "green-blue"){
      return this.shiftBySemitones(1046.5, this.state.semitoneShift)
    } else if(colorName == "blue"){
      return this.shiftBySemitones(1174.7, this.state.semitoneShift)
    } else if(colorName == "blue-violet"){
      return this.shiftBySemitones(1318.5, this.state.semitoneShift)      
    } else if(colorName == "violet"){
      return this.shiftBySemitones(1396.9, this.state.semitoneShift)
    } else if(colorName == "violet-red"){
      return this.shiftBySemitones(1568.0, this.state.semitoneShift)
    }
  }

  // CDEGA...
  colorNameToFriendlyFreq(colorName){
    if(colorName == "red"){
      return this.shiftBySemitones(523.2511, this.state.semitoneShift)
    } else if(colorName == "red-orange"){
      return this.shiftBySemitones(587.3295, this.state.semitoneShift)
    } else if(colorName == "orange"){
      return this.shiftBySemitones(659.2551, this.state.semitoneShift)
    } else if(colorName == "orange-yellow"){
      return this.shiftBySemitones(783.9909, this.state.semitoneShift)
    } else if(colorName == "yellow"){
      return this.shiftBySemitones(880.0000, this.state.semitoneShift)
    } else if(colorName == "yellow-green"){
      return this.shiftBySemitones(1046.502, this.state.semitoneShift)      
    } else if(colorName == "green"){
      return this.shiftBySemitones(1174.659, this.state.semitoneShift)
    } else if(colorName == "green-blue"){
      return this.shiftBySemitones(1318.510, this.state.semitoneShift)
    } else if(colorName == "blue"){
      return this.shiftBySemitones(1567.982, this.state.semitoneShift)
    } else if(colorName == "blue-violet"){
      return this.shiftBySemitones(1760.000, this.state.semitoneShift)      
    } else if(colorName == "violet"){
      return this.shiftBySemitones(2093.005, this.state.semitoneShift)
    } else if(colorName == "violet-red"){
      return this.shiftBySemitones(2349.318, this.state.semitoneShift)
    }

  }

  colorNameToHex(colorName){
    if(colorName == "red"){
      return "#ff0000"
    } else if(colorName == "red-orange"){
      return "#FF5349"
    } else if(colorName == "orange"){
      return "#FFA500"
    } else if(colorName == "orange-yellow"){
      return "#FFAE42"
    } else if(colorName == "yellow"){
      return "#ffff00"
    } else if(colorName == "yellow-green"){
      return "#ADFF2F"
    } else if(colorName == "green"){
      return "#00ff00"
    } else if(colorName == "green-blue"){
      return "#48D1CC"
    } else if(colorName == "blue"){
      return "#0000ff"
    } else if(colorName == "blue-violet"){
      return "#8A2BE2" 
    } else if(colorName == "violet"){
      return "#EE82EE"
    } else if(colorName == "violet-red"){
      return "#C71585"
    }
  }

  colorNameToDarkHex(colorName){
    if(colorName == "red"){
      return "#7f0000"
    } else if(colorName == "red-orange"){
      return "#7f2924"
    } else if(colorName == "orange"){
      return "#7f5200"
    } else if(colorName == "orange-yellow"){
      return "#7f5721"
    } else if(colorName == "yellow"){
      return "#7f7f00"
    } else if(colorName == "yellow-green"){
      return "#567f17"
    } else if(colorName == "green"){
      return "#007f00"
    } else if(colorName == "green-blue"){
      return "#246866"
    } else if(colorName == "blue"){
      return "#00007f"
    } else if(colorName == "blue-violet"){
      return "#451571"
    } else if(colorName == "violet"){
      return "#774177"
    } else if(colorName == "violet-red"){
      return "#630a42"
    }
  }

  colorNameToVeryDarkHex(colorName){
    if(colorName == "red"){
      return "#770000"
    } else if(colorName == "red-orange"){
      return "#772924"
    } else if(colorName == "orange"){
      return "#775200"
    } else if(colorName == "orange-yellow"){
      return "#775721"
    } else if(colorName == "yellow"){
      return "#777700"
    } else if(colorName == "yellow-green"){
      return "#567717"
    } else if(colorName == "green"){
      return "#007700"
    } else if(colorName == "green-blue"){
      return "#246866"
    } else if(colorName == "blue"){
      return "#000077"
    } else if(colorName == "blue-violet"){
      return "#451571"
    } else if(colorName == "violet"){
      return "#774177"
    } else if(colorName == "violet-red"){
      return "#630442"
    }
  }

  colorNameToInt(colorName){
    if(colorName == "red"){
      return 0
    } else if(colorName == "red-orange"){
      return 1
    } else if(colorName == "orange"){
      return 2
    } else if(colorName == "orange-yellow"){
      return 3
    } else if(colorName == "yellow"){
      return 4
    } else if(colorName == "yellow-green"){
      return 5
    } else if(colorName == "green"){
      return 6
    } else if(colorName == "green-blue"){
      return 7
    } else if(colorName == "blue"){
      return 8
    } else if(colorName == "blue-violet"){
      return 9
    } else if(colorName == "violet"){
      return 10
    } else if(colorName == "violet-red"){
      return 11
    }
  }

  intToColorName(int){
    if(int == 0){
      return "red"
    } else if(int == 1){
      return "red-orange"
    } else if(int == 2){
      return "orange"
    } else if(int == 3){
      return "orange-yellow"
    } else if(int == 4){
      return "yellow"
    } else if(int == 5){
      return "yellow-green"
    } else if(int == 6){
      return "green"
    } else if(int == 7){
      return "green-blue"
    } else if(int == 8){
      return "blue"
    } else if(int == 9){
      return "blue-violet"
    } else if(int == 10){
      return "violet"
    } else if(int == 11){
      return "violet-red"
    }
  }

  rainbow(){
    return [ "red", "red-orange", "orange", "orange-yellow", "yellow", "yellow-green", "green", "green-blue", "blue", "blue-violet", "violet", "violet-red"]
  }

  randomColor(){
    let color = this.rainbow().sort(() => Math.random() - 0.5)[ Math.floor( Math.random() * this.rainbow().length )]
    console.log( 'color', color )
    return color
  }

  randomWaveform(){
    // return "sine"
    return ["sine","square","sawtooth","triangle"].sort(() => Math.random() - 0.5)[0]
  }

  updateSequencerTracks(){
    for(var i=0; i<this.state.synths.length; i++){
      // color scheme sequence determinations instead of this

      // either pass option in to use index for which steps
      // or separate method
      // dont want to alter the array 
      this.updateSequencerTrack(i, this.state.masterSequencerSteps, this.state.synths.length)
    }
  }

  updateSequencerTrack(trackIndex, steps, currentNonSchemePix=false, numTracks=false){
    // if numtracks passed in, then only play on seq steps that correspond to the synth's track index
    let minStep, maxStep
    if(numTracks){
      minStep = Math.floor(steps.length/numTracks) * currentNonSchemePix
      maxStep = ( Math.floor(steps.length/numTracks) * (currentNonSchemePix+1) ) - 1
    }

    let enable
    for(var stepIndex=0; stepIndex<this.sequencerTrackLength; stepIndex++){

      if( steps[stepIndex] && (!numTracks || (stepIndex >= minStep && stepIndex <= maxStep))  ){
        // enable = Math.random() > 0.5 ? true : false
        enable = true
        // if(trackIndex == 2){
        //   console.log( stepIndex, 'was enabled' )
        // }
      } else {
        enable = false
        // console.log( stepIndex, 'was disabled' )
      }
      seqWorker.postMessage({changeNote: {track: trackIndex, step: stepIndex, enable: enable}})
    }
  }

  addRandomPixels(num){
    let newPix = []
    for(var i=0; i<num; i++){
      // need new reference for each pix
      let pix = this.newPixel()
      newPix.push(pix)
    }

    return newPix
  }

  addPixel(color){
    let newPix = this.newPixel(color)
    this.setState(prevState => ({pixels: [...prevState.pixels, newPix] }), () => {

      this.updateSounds()
      this.setColorScheme(this.state.pixels)
    } )
  }

  removePixel(index){
    if(this.state.online){
      if(this.isAddMode() || (this.isMaster() && this.isShowMode()) ){
        // need to tell server to remove!
        // userid is required for all msgs from clients
        sendDataToServer({removeOnlinePixel: index, userID: this.state.userID})
      }
    } else {
      let pixels = [...this.state.pixels]
      pixels.splice( index, 1 )
      this.setState({pixels: pixels}, () => {
        this.updateSounds()
        this.setColorScheme(this.state.pixels)
      })
    }
    
  }

  pixelsFromColors(colorDatas){
    return colorDatas.map( (colorData) => this.newPixel(colorData.color, colorData.userID))
  }

  getPixels(){
    // get pixel array from server

    // return [
    //   {clientId: "abc", color: "violet", gain: 0.5},
    //   {clientId: "def", color: "yellow", gain: 0.5},
    // ]
    
    if(this.state.online){
      return []
    } else {
      return this.addRandomPixels(this.state.numPix)
    }
    // return []
  }

  synthGain(){
    // lower gain wiht more pix
    // return 0.1 / (this.state.pixels.length * 10)
    // let val = -(Math.pow(this.state.pixels.length, 2)/100000) + 0.1
    let val = -(7000 * this.state.pixels.length + Math.pow(this.state.pixels.length, 3)/8000000) + 0.1
    // return Math.max(val, 0.000001)
    return val > 0 ? val : 0.000000000000000001
  }

  tempoToStepTime(tempo){
    return Math.floor(15000/tempo)
  }

  changeColor(newColor){
    this.massageAudioContext()

    this.setState({userColor: newColor}, () => {
      sendDataToServer({userID: this.state.userID, changeColor: newColor})
    }) 
  }

  addOnlinePixel(color){
    this.massageAudioContext()
    sendDataToServer({userID: this.state.userID, addOnlinePixel: color})
  }

  changeTempo(newTempo, fromServer=false){
    // fromserver to avoid feedback loops from tempo changes
    let stepTime = this.tempoToStepTime(newTempo)
    if(newTempo >= 0){
      this.setState({tempo: newTempo}, () => {
        seqWorker.postMessage({changeTempo: {value: stepTime} })

        if((this.isAddMode() || this.isShowMode()) && !fromServer ){
          // inform server of tempo changes if addmode, but were not reacting to server

          sendDataToServer({userID: this.state.userID, changeTempo: newTempo})
          this.setState({lastTempoChange: Date.now()})
        }
      })  
    }
    
  }

  changeSemitoneShift(newSemitoneShift){
    this.setState({semitoneShift: newSemitoneShift}, () => {
      let synths = this.state.synths
      // change playing synths to new freq
      for(var i=0; i<synths.length; i++){
        synths[i].update( this.getFrequency(synths[i].color) )
      }

    })
  }

  changeMasterGain(newGain){
    if(!(newGain > 0)){
      newGain = 0.00001
    }
    if(newGain > 0){
      this.setState({masterGain: newGain}, () => {
        this.gainNode.gain.exponentialRampToValueAtTime(newGain, this.audioContext.currentTime+0.08)
      })
    }
  }

  changeNoteLength(length){
    if(!(length > 0)){
      length = 0.00001
    }

    this.setState({noteLength: length}, () => {
      let synths = this.state.synths
      let a,h,r
      a = length * 0.10
      h = length * 0.40
      r = length * 0.20
      synths.map( (synth) => {
        synth.setNoteLength(a,h,r)
      })

    })

    
  }

  newPixel(color=null, userID=null){
    var pix = {}
    pix.color = color || this.randomColor()
    pix.gain = 0.4
    pix.clientId = Math.floor( Math.random() * 100 )

    if(userID) {
      pix.userID = userID
    }

    return pix
  }

  changeNumPix(newNum){
    newNum = newNum > 64 ? 64 : newNum
    this.setState({numPix: newNum}) 
  }

  // synth utilities
  updateSounds(){
    if(this.state.pixels.length < 1){
      this.removeSynths()
    }

    var keepSynthIds = []

    let oldNumSynths = this.state.synths.length

    let newSynths = []

    let a,h,r
    // let oldLength = this.state.noteLength
    a = this.state.noteLength * 0.10
    h = this.state.noteLength * 0.40
    r = this.state.noteLength * 0.20

    // map through pixels making synth based on color and index
    this.state.pixels.map( (pixel,index) => {

      // if thers new pixelw ithout synth, it gets created here

      var synth
      if(this.state.synths[index]){
        // getting prserved erroneously here
        if(!this.state.synths[index].parentSynthId) {
          // existing synth, ramp instead

          synth = this.state.synths[index]
          synth.update( this.getFrequency(pixel.color) )
          keepSynthIds.push(synth.id)
          // console.log( 'keeping existing', synth.id )  
        }
        
      } else {
        // new synth
        synth = this.createSynth(index, this.state.masterGain, this.randomWaveform(), this.getFrequency(pixel.color), a, h, r, pixel.color)

        // console.log( 'i will craete pix synth of color ', pixel.color, ' at index ', index )
        // same order as 
        synth.index = index
        newSynths.push(synth)
        // console.log( 'new synth!', synth.id )
      }


      if(synth){
        // sometimes synths will be empty but pixels will not
        synth.color = pixel.color
      }
    })


    if(true){
      // detect n pix repeats
      // add sound with freq * n of repeats (harmonics)
      //  1 pix repeat gives freq
      //  2 pix repeat gives freq * 2 etc

      // account for synths were adding right now!
      // at which synths index to start adding patternsynths
      let patternSoundIndex = this.state.synths.length + newSynths.length

      let colorInts = this.state.pixels.map( (pixel) => { return this.colorNameToInt(pixel.color) } )

      let existingPatternSoundId
      let skip = 0
      for(var i=0; i<colorInts.length-1; i++){
        if(skip > 0){
          skip--
          continue
        }
        let thisColorIndex = i

        // which color are we checking for pattern from
        let thisColor = colorInts[thisColorIndex]

        for(var repeatLength=1; repeatLength < 3; repeatLength++){
          let numberOfRepeats = 0

          // pass in colors, first one to check, color to check against, and how many to skip between matches
          numberOfRepeats = this.checkRepeat(colorInts, thisColorIndex+repeatLength, thisColor, repeatLength)

          if(numberOfRepeats > 0){
            // skip forward num repeats*repeatlength if found, since we already checked em
            skip = (numberOfRepeats*repeatLength)+1

            // add pattern sounds
            for(var x=1; x<numberOfRepeats+1; x++){

              // is there an existing one?

              if(this.state.synths[thisColorIndex]){
                existingPatternSoundId = this.findExistingPatternSound( this.state.synths[thisColorIndex].id , x) 
                if( existingPatternSoundId ){
                  keepSynthIds.push(existingPatternSoundId)
                } else {
                  newSynths.push( this.createPatternSound( this.state.synths[thisColorIndex].id, this.state.synths[thisColorIndex].color, x, patternSoundIndex, 0.4 ) )
                }

                patternSoundIndex++
              
              }

            }
          }

        }
      }
    }

    // update indexes for synths before we send them off
    newSynths = newSynths.map( (sound,i) => { 
      keepSynthIds.push(sound.id)
      sound.index = i + this.state.pixels.length
      return sound
    })

    // console.log( 'keepSynthIds length', keepSynthIds.length)
    let deleteSynthIds = []
    if(keepSynthIds.length > 0){

      for(var i=0; i<this.state.synths.length; i++){
        if( this.state.synths[i] && keepSynthIds.indexOf(this.state.synths[i].id) === -1 ){
          // if this synth is not in new ids, stop it so it dies when we lose its reference
          // console.log( 'hardstopped id!', this.state.synths[i].id, keepSynthIds.indexOf(this.state.synths[i].id) )
          this.state.synths[i].hardStop()
          deleteSynthIds.push(this.state.synths[i].id)

        }
      }
    }
    
    this.setState(prevState => ({synths: [...prevState.synths.filter((synth) => deleteSynthIds.indexOf(synth.id) === -1  ), ...newSynths]}), () => {

      let newNumSynths = this.state.synths.length
      var numToChange = Math.abs(oldNumSynths - newNumSynths)
      // console.log( 'sylength, oldNumSynths, newNumSynths', this.state.synths.length, oldNumSynths, newNumSynths )

      for(var i=0; i<numToChange; i++){
        if(oldNumSynths > newNumSynths){
          // remove a track
          seqWorker.postMessage({removeTrack: {index: oldNumSynths-numToChange} })
        } else if(newNumSynths > oldNumSynths){
          seqWorker.postMessage({addTrack: true})
        } 
      }

      // this.updateSequencerTracks()
    })
  }

  setColorScheme(pixels){

    // index is color int
    var numEachColor = {
      ["red"]: 0,
      ["orange"]: 0,
      ["yellow"]: 0,
      ["green"]: 0,
      ["blue"]: 0,
      ["violet"]: 0
    }

    for(var i=0; i<pixels.length; i++){
      // tally up color counts
      numEachColor[ pixels[i].color ]++
    }

    let foundScheme = false
    var sortedColors = Object.keys(numEachColor).filter( (color) => { return numEachColor[color] > 0 } ).sort( (val1, val2) => { return numEachColor[val1] < numEachColor[val2] } )

    // color wheel distances, use this to determine color relationship

    let schemes = [new ColorScheme("triad"), new ColorScheme("analagous"), new ColorScheme("complementary")]
    for(var i=0; i<sortedColors.length; i++){
      // check each color

      let scheme
      for(var x=0; x<schemes.length; x++){
        // check for each color distance match
        scheme = schemes[x]
        // check each scheme

        // get the colors in the scheme (if any)
        let matchedColors = this.colorsByColorDistance(scheme.colorDistance, sortedColors, i, scheme.numMatchesNeeded)
        if( matchedColors.length > 0 ){
          schemes[x].matched = true
          schemes[x].matchedColors = matchedColors
          // stop looking for more schemes on this color
          break
        }
      }
    }

    //  count these so we can evenly spread the non scheme ones over the whole seq
    let numSchemePix = this.state.synths.filter( synth => schemes.some( scheme => scheme.matchedColors.includes(synth.color) ) ).length
    let numNonSchemePix = this.state.synths.length - numSchemePix
    // need to track which nonschemem pix because trackindex is no longer an indication of nonschemepix order (because schemepix can be anywhere in synths)
    let currentNonSchemePix = 0

    // seq ui colors
    let msColors = new Array(this.sequencerTrackLength).fill("#000")
    let nonSchemeColors = []

    // dict it so that we can easily check if a color is included elsewhere
    let schemeColors = {}

    for(var i=0; i<this.state.synths.length; i++){
      // determine steps for each synth
      let steps = []

      var numToPlay = 0

      let isSchemePix = false

      let matchedSchemes = schemes.filter( scheme => scheme.matched )

      for(var x=0; x<matchedSchemes.length; x++){

        // regular scheme skpping numbres of steps defined in ColorScheme

        let matchedColorIndex = matchedSchemes[x].matchedColors.indexOf(this.state.synths[i].color)
        if(matchedColorIndex > -1){
          isSchemePix = true
          
          schemeColors[this.state.synths[i].color] = true

          if(this.state.schemeMode == SCHEMEMODE1){

            // add in more to play if scheme  was matched
            numToPlay += matchedSchemes[x].numToPlay
          } else {
            // SCHEMEMODE0 (default)

            // console.log( 'I am schemin on scheme', x )

            // only change this track if scheme matched and this colors in it

            for(var y=0; y<this.sequencerTrackLength; y++){
              // use which scheme color we're on to spread across seq
              let enable
              // if( ((y-matchedColorIndex*2) % matchedSchemes[x].skipLength()) == 0){
              if( (y-1) % matchedSchemes[x].skipLength() == 0){

                enable = true
              } else {
                enable = false
              }
              steps[y] = enable
            }
          }
        }  
 
      }

      if(numToPlay > 0){

        // only happens in schememode1

        let whichSchemesSkipValue = Math.floor(Math.random()*matchedSchemes.length)
        // let whichSchemesSkipValue = 0
        let lastPlayedIndex = 0

        for(var y=0; y<this.sequencerTrackLength; y++){

          // use which scheme color we're on to spread across seq
          let enable
          // if( ((y-matchedColorIndex*2) % schemes[x].skipLength()) == 0){

          if( (lastPlayedIndex - y) % matchedSchemes[whichSchemesSkipValue].skipValue == 0 ){ 
            // if distance between last matched step and current step is a multiple of the current schemes skipvalue

            enable = true
            lastPlayedIndex = y

            whichSchemesSkipValue++
            if(whichSchemesSkipValue == matchedSchemes.length){
              // roll through the schemes using their skipvalues
              whichSchemesSkipValue = 0
            }
          } else {
            enable = false
          }
          
          steps[y] = enable
        }
      }

      if(steps.length > 0){
        // this synth is being used by a scheme
        this.updateSequencerTrack(i, steps)
      } else {
        // set to master seq, spread playing evenly across non scheme pix

        this.updateSequencerTrack(i, this.state.masterSequencerSteps, currentNonSchemePix, numNonSchemePix)
      }

      if(!isSchemePix){
        // we found another nonschem pix, increment spreader counter
        currentNonSchemePix++
        // collect all the nonscheme colors
        nonSchemeColors.push(this.state.synths[i].color)
      }
    }

    // get array of ui step colors woo
    for(var a=0; a<nonSchemeColors.length; a++){
      let minStep, maxStep
      minStep = Math.floor(this.sequencerTrackLength/nonSchemeColors.length) * a
      maxStep = ( Math.floor(this.sequencerTrackLength/nonSchemeColors.length) * (a+1) ) - 1

      for(var z=minStep; z<maxStep+1; z++){
        if(this.state.darkMode){
          msColors[z] = this.colorNameToDarkHex(nonSchemeColors[a])
        } else {
          msColors[z] = this.colorNameToHex(nonSchemeColors[a])
        }
      }
    }

    // fill in blank mssteps for steps that didnt divide evenly
    let refillIndex = 0
    for(var b=0; b<msColors.length; b++){
      if(msColors[b] == "#000"){
        msColors[b] = msColors[refillIndex]
        refillIndex++
      }
    }

    this.setState({masterSequencerColors: msColors, schemeColors: schemeColors})
  }

  updateMasterSequencerColors(){
    // let msColors = []
    // for(var i=0; i<this.state.synths.length; i++){
    //   if(this.synths.parentSynthId){
    //     // dont show on seq if repeat synth
    //     continue
    //   }

    //   let minStep, maxStep
    //   minStep = Math.floor(steps.length/this.state.synths.length) * currentNonSchemePix
    //   maxStep = ( Math.floor(steps.length/this.state.synths.length) * (currentNonSchemePix+1) ) - 1

    //   for(var y=minStep; y<=maxStep; y++){
    //     // console.log( 'lol its ', this.state.pixels[ this.state.synths[i].index ].color )
    //     msColors[y] = this.state.pixels[ this.state.synths[i].index ].color
    //   }
    // }

  }

  getStepsForSexyScheme(schemes, ){
    // add up matched schemes to get total number steps to play on N
    // play N steps by cycling through skpping each matched schemes skipValue until N met
  }

  colorsByColorDistance(colorDistance, sortedColors, startingColorIndex, numMatchesNeeded){
    let triadMatches = 0
    let schemeColors = [ sortedColors[startingColorIndex] ]

    for(var x=0; x<sortedColors.length; x++){
      // to see if it matches eith every other coolor
      if(x != startingColorIndex && this.distanceBetweenColors(sortedColors[startingColorIndex], sortedColors[x]) == colorDistance ){
        triadMatches += 1
        // console.log( 'found scheme color', sortedColors[x], "matched", triadMatches, "looking for", numMatchesNeeded, "matches" )
        schemeColors.push(sortedColors[x])
      }

      if(triadMatches >= numMatchesNeeded){
        // console.log( 'hEY BITCH~!!!' )
        // stop as soon as scheme match detected
        return schemeColors
      }
    }

    return []
  }

  distanceBetweenColors(color1, color2){
    var colors = this.rainbow()
    let ci1, ci2
    ci1 = colors.indexOf(color1)
    ci2 = colors.indexOf(color2)
    // check to left and right
    return Math.min( Math.abs(ci1 - ci2), ( this.rainbow().length-Math.abs(ci1 - ci2) ) )
  }

  shuffle(array) {
    var tmp, current, top = array.length
    if(top) while(--top) {
      current = Math.floor(Math.random() * (top + 1))
      tmp = array[current]
      array[current] = array[top]
      array[top] = tmp
    }
    return array
  }

  // checkConsec(array, startingIndex, testVal){
  //   let consecCount = 0
  //   for(var i=startingIndex; i<array.length; i++){
  //     if(array[i] === testVal){
  //       consecCount += 1
  //     } else {
  //       // exit early if no match found
  //       break
  //     }
  //   }
  //   return consecCount    
  // }

  checkRepeat(array, startingIndex, testVal, increment){
    let consecCount = 0
    for(var i=startingIndex; i<array.length; i+=increment){
      if(array[i] === testVal){
        consecCount += 1
      } else {
        // exit early if no match found
        break
      }
    }
    return consecCount
  }

  findExistingPatternSound(parentSynthId, patternMagnitude){
    for(var i=0; i<this.state.synths.length; i++){
      if(this.state.synths[i].parentSynthId == parentSynthId && this.state.synths[i].patternMagnitude == patternMagnitude){
        return this.state.synths[i].id
      }
    }
  }
 
  createPatternSound(parentSynthId, color, numberOfRepeats, index, gain){

    // console.log( 'fuc! im makin pattern sound with psi ', index )

    let frequency = this.getFrequency(color) * (numberOfRepeats+1)
    let a,h,r
    a = this.state.noteLength * 0.10
    h = this.state.noteLength * 0.40
    r = this.state.noteLength * 0.20
    let newSynth = this.createSynth(index, gain, this.randomWaveform(), frequency, a, h, r, color)

    newSynth.parentSynthId = parentSynthId
    newSynth.patternMagnitude = numberOfRepeats
    
    return newSynth
  }

  massageAudioContext(){
    if(this.audioContext.state == "suspended"){
      this.audioContext.resume()
    }
  }

  playSounds(){
    this.massageAudioContext()
    // console.log( 'play the sounds' )
    seqWorker.postMessage({play: true})
    this.setState({playing: true})
  }

  stopSounds(){
    // console.log( 'stop the sounds' )
    // actually kills oscs..
    // this.state.synths.map ( (synth) => { synth.hardStop() } )

    seqWorker.postMessage({stop: true})
    this.setState({playing: false})
  }

  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  colorBrightness(hex, bright){
    var r,g,b = this.hexToRgb(hex)
    r = this.componentBrightness(r, bright)
    g = this.componentBrightness(g, bright)
    b = this.componentBrightness(b, bright)
    return this.rgbToHex(r,g,b)
  }

  componentBrightness(comp, bright){
    return comp * bright
  }

  tapBeatButton(){
    if(this.state.online){

      // will get users beat color from clients[] in server
      sendDataToServer({userID: this.state.userID, beat: true})
    }
  }

  fadeDuration(tempo){
    let val = Math.round( -(tempo / 8) + 32 )
    return val > 0 ? val : 1
  }

  render(){

    // its the big app!
    let containerClasses = "container"
    if(this.state.darkMode){
      containerClasses += " dark-mode"
    }

    let soundShows, soundShowsContainer
    soundShows = this.state.synths.map( (synth, index) => {
      let hexColor
      if(synth.playing){
        hexColor = this.colorNameToHex(synth.color)
      } else {
        hexColor = this.colorNameToDarkHex(synth.color)
      }
      return <SoundShow isScheme={ this.state.schemeColors[synth.color] } color={ hexColor } />
    })

    let pixels
    if(this.state.pixels){

      let colorNameFunc = !this.state.darkMode ? this.colorNameToHex : this.colorNameToVeryDarkHex
      pixels = this.state.pixels.map( (pixel, index) => { return <Pixel onClick={ () => { this.removePixel(index) } } color={ colorNameFunc(pixel.color) } show={ typeof pixel.userID !== undefined } border={ this.state.userID === pixel.userID } fadePixel={ this.isAddMode() || (this.isShowMode() && !pixel.userID) } fadeDuration={ this.fadeDuration(this.state.tempo) } /> })
    }

    let colorPalette, colorPaletteAdd
    let colorNameFunc = !this.state.darkMode ? this.colorNameToHex : this.colorNameToVeryDarkHex
    if(this.state.online){
      // change your color online

      // show: for master, adder and changer, for user, just charnger
      
      if(this.isAddMode()){
        // just add
        colorPaletteAdd = <ColorPicker id="add-picker" colorNameToHex={ colorNameFunc } pixelClick={ this.addOnlinePixel } />
      } else if(this.isShowMode()){
        // add and 
        colorPalette = <ColorPicker id={ this.isMaster() ? "master-user-picker" : "user-picker" } userColor={ this.state.userColor } colorNameToHex={ colorNameFunc } pixelClick={ this.changeColor } />

        if(this.isMaster()){
          colorPaletteAdd = <ColorPicker id="add-picker" colorNameToHex={ colorNameFunc } pixelClick={ this.addOnlinePixel } />
        }

      } else {
        colorPalette = <ColorPicker id="user-picker" userColor={ this.state.userColor } colorNameToHex={ colorNameFunc } pixelClick={ this.changeColor } />
      }

    } else {
      // add extra colors offline
      let colors = this.rainbow().map( (color) => <Pixel color={ colorNameFunc(color) } onClick={ () => { this.addPixel(color) } } /> )
      colorPalette = (
        <div className="color-picker">
          { colors }
        </div>
      )
    }

    let colorPaletteClasses = "pixels-container"
    if(!this.isMaster()){
      if(this.isGroupMode()){
        // if grpp and you are user, show big color selector
        colorPaletteClasses += " big"
      } else if(this.isShowMode()){
        colorPaletteClasses += " show"
      }
    }
    let colorPaletteContainer = (
      <div className={ colorPaletteClasses } >
        { colorPalette }
        { colorPaletteAdd }
      </div>
    )

    let simpleControlClasses = "simple-control"
    let randomizePixelsIntervalControl, numPixControl
    if(this.state.randomizePixels){

      randomizePixelsIntervalControl = (
        <SimpleControl changeFunction={ this.changeRandomizePixelsInterval } round={ true } startHoldDown={ this.startHoldDown } stopHoldDown={ this.stopHoldDown } classes={ simpleControlClasses } fieldName="randomizePixelsInterval" increment={ 100 } label="RANDOM INTERVAL" value={ this.state.randomizePixelsInterval } /> 
      )

      numPixControl = (
        <SimpleControl changeFunction={ this.changeNumPix } round={ true } startHoldDown={ this.startHoldDown } stopHoldDown={ this.stopHoldDown } classes={ simpleControlClasses } fieldName="numPix" increment={ 1 } label="RANDOM NUM TO ADD" value={ this.state.numPix } /> 
      )

    } else {
      // if not randiom, add wide class to simple control classes
      simpleControlClasses += " wide"
    }

    let transportButtonsContainer
    let transportButtons
    if(!this.isShowMode() || this.isMaster() ){

      let moreCode
      if(this.state.moreMenu){
        // OPTIONS MENU

        let coarseCode
        if(this.state.coarse){
          coarseCode = "crse"
        } else {
          coarseCode = "fine"
        }

        transportButtons = [

          <TransportControl thin={ this.state.moreMenu } onClick={ this.toggleOptionsMenu } code={ "opts" } active={ this.state.optionsMenu } subButtons={[
              <TransportControl isSubButton={true} onClick={ this.incrementSchemeMode } code={ "schm" } active={ true } borderColor={ this.state.schemeMode === SCHEMEMODE0 ? " white" : " green" } />,
              <TransportControl isSubButton={true} onClick={ prevState => this.setState({darkMode: !this.state.darkMode}) } code={ "dark" } active={ this.state.darkMode } />,
              <TransportControl isSubButton={true} onClick={ this.toggleCoarse } active={ this.state.coarse } code={ coarseCode } />
            ]} open={ this.state.optionsMenu } />,
            <TransportControl onClick={ this.reset } code="rset" />
          ]
        moreCode = "less"

        if(this.state.online){
          // show group mode toggle only when we're online
          
          transportButtons.push(
            <TransportControl onClick={ this.toggleModeMenu } thin={ this.state.moreMenu } subButtons={[
              <TransportControl isSubButton={true} thin={ this.state.moreMenu } onClick={ this.toggleGroupMode } active={ this.isGroupMode() } code="grpp" />,
              <TransportControl isSubButton={true} thin={ this.state.moreMenu } onClick={ this.toggleBeatMode } active={ this.isBeatMode() } code="beat" />,
              <TransportControl isSubButton={true} thin={ this.state.moreMenu } onClick={ this.toggleAddMode } active={ this.isAddMode() } code="addi" />,
              <TransportControl isSubButton={true} thin={ this.state.moreMenu } onClick={ this.toggleShowMode } active={ this.isShowMode() } code="show" />
            ]} code="mode" open={ this.state.modeMenu } />
          )

        } else {
          // only show rand button in offline
          transportButtons.push(<TransportControl thin={ this.state.moreMenu } onClick={ this.toggleRandomizePixels } active={ this.state.randomizePixels } code="rand" />)
        }

      } else {

        transportButtons = [
          <TransportControl thin={ this.state.moreMenu } onClick={ this.playSounds } active={ this.state.playing } code={ "play" } />,
          <TransportControl thin={ this.state.moreMenu } onClick={ this.stopSounds } active={ !this.state.playing } code={ "stop" } />,
          <TransportControl thin={ this.state.moreMenu } onClick={ this.toggleOnline }  active={ this.state.online } code={ "fnet" } />
        ]
        moreCode = "more"
      }
      
      transportButtons.push(<TransportControl thin={ this.state.moreMenu } onClick={ this.toggleMoreMenu } active={ this.state.moreMenu } code={ moreCode } />)

      transportButtonsContainer = (
        <span id="transport">
          { transportButtons }
        </span>
      )
    }

    let userControls, masterSequencer, pixelsContainer, display

      display = (
        <div className="user-controls-display">
          <BigDisplay value={ this.state.masterGain } />
          <BigDisplay value={ this.state.tempo } />
          <BigDisplay value={ this.state.noteLength } />
          <BigDisplay value={ this.state.semitoneShift } />
        </div>
      )


    if( !this.state.online || !( this.isGroupMode() || this.isShowMode() || this.isBeatMode() ) || this.isMaster() ){

      userControls = (
        <div className="user-controls-container">

          { display }
          <span id="simple">
            <SimpleControl changeFunction={ this.changeMasterGain } startHoldDown={ this.startHoldDown } stopHoldDown={ this.stopHoldDown } classes={ simpleControlClasses } changeFunction={ this.changeMasterGain } fieldName="masterGain" increment={ this.state.coarse ? 0.08 : 0.02 } label="VOLUME" value={ this.state.masterGain } /> 
     
            <SimpleControl changeFunction={ this.changeTempo } startHoldDown={ this.startHoldDown } stopHoldDown={ this.stopHoldDown } classes={ simpleControlClasses } fieldName="tempo" increment={ this.state.coarse ? 1 : 0.08 } label="TEMPO" value={ this.state.tempo } /> 
            
            { numPixControl }
            { randomizePixelsIntervalControl }
       
            <SimpleControl changeFunction={ this.changeNoteLength } startHoldDown={ this.startHoldDown } stopHoldDown={ this.stopHoldDown } classes={ simpleControlClasses } fieldName="noteLength" increment={ this.state.coarse ? 0.2 : 0.08 } label="NOTE LENGTH" value={ this.state.noteLength } />

            <SimpleControl changeFunction={ this.changeSemitoneShift } startHoldDown={ this.startHoldDown } stopHoldDown={ this.stopHoldDown } classes={ simpleControlClasses } fieldName="semitoneShift" increment={ this.state.coarse ? 1 : 0.01 } label="PITCH" value={ this.state.semitoneShift } /> 
          </span>
        </div>
      )

      masterSequencer = (
        <MasterSequencer lightStep={ this.state.lightStep } beatColors={ this.state.beatChecks } toggleMasterSequencerStep={ this.toggleMasterSequencerStep } steps={ this.state.masterSequencerSteps } colors={ this.state.masterSequencerColors }  />
      )

      soundShowsContainer = (
        <div className="soundshower-container">
          { soundShows }
        </div>
      )

      pixelsContainer = (
        <div className="user-pixels-container graph">
          { pixels }
        </div>
      )
    }

    if(this.isShowMode()){
      // let soundShowClasses = "soundshower-container"
      // if(!this.isMaster()){
      //   soundShowClasses += " show"
      // }
      // soundShowsContainer = (
      //   <div className={ soundShowClasses }>
      //     { soundShows }
      //   </div>
      // )

      let userPixClasses = "user-pixels-container graph show"

      if(this.isMaster()){
        userPixClasses += " master"
      }
      // second chance to show during show
      pixelsContainer = (
        <div className={ userPixClasses }>
          { pixels }
        </div>
      )
    }

    let beatButton, beatColor
    if(this.state.online){

      if(this.isBeatMode() && !this.isMaster()){
        // users in beatmode see big button
        beatButton = (
          <button className="beat-button" onClick={ this.tapBeatButton } />
        )

        beatColor = this.state.beatColor
      }
    }
    return (
      <div style={ {backgroundColor: beatColor} } className={ containerClasses } onTouchEnd={ this.stopHoldDown } onMouseUp={ this.stopHoldDown } >

        { soundShowsContainer }

        { masterSequencer }

        { pixelsContainer }

        { colorPaletteContainer }

        { userControls }
        
        { beatButton }

        { transportButtonsContainer }

      </div>
    )  
  }
}

export default App
