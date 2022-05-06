import logo from "./logo.svg";
import "./App.css";
import React, { Component, useEffect } from "react"

import Pixel from "./components/Pixel.js"
import SoundShow from "./components/SoundShow.js"
import Synth from "./classes/Synth.js"


import WorkerBuilder from "./wb.js"
import SequencerWorker from "./seqWorker.js"
var seqWorker = new WorkerBuilder(SequencerWorker)

class App extends Component { 
  constructor(props){
    super(props)

    this.sequencerTrackLength = 8
    this.defaultSynthGain = 0.1

    this.state = {
      pixels: [],
      synths: [],
      playing: false
    }
  }

  componentDidMount(props){
    this.startAudioContext()

    // let synth1,synth2,synth3
    // synth1 = new Synth(this.audioContext, this.gainNode, 0.2, "sine", 440, 0.1, 0.1, 0.1)
    // synth2 = new Synth(this.audioContext, this.gainNode, 0.2, "sine", 880, 0.1, 0.1, 0.1)
    // synth3 = new Synth(this.audioContext, this.gainNode, 0.2, "sine", 220, 0.1, 0.1, 0.1)
    this.setState({pixels: this.getPixels()}, () => {
      // after grabbing pixel state, make sounds
      this.updateSounds()

      // start seq
      // var sequencerWorker = new Worker(sequencer)
      seqWorker.onmessage = (action) => {
        if(action) {
          // console.log("Message from sequencer", action.data);
          if(action.data.playSynth){
            // play synth now, since seq said so
            

            // console.log( 'playing synth', action.data.playSynth.index )
            this.state.synths[action.data.playSynth.index].play()
          }

        }
      }

      // testing, change pixels every 8s I guess
      setInterval(() => {
        if(this.state.playing){

          this.setState({pixels: this.getPixels()}, () => {
            this.updateSounds()
            
          })  
        }
        
      }, 3200)
    })
  }

  addPixel(color, gain){
    return {
      color: color,
      gain: gain
    }
  }

  startAudioContext(){
    // create audio context and connect gain to it
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = 0.4
    this.gainNode.connect(this.audioContext.destination)
  }

  createSynth(index, gain, wave, freq, attk, hold, rels){
    // let freq = this.colorNameToFreq(color)
    let synth = new Synth(this.audioContext, this.gainNode, gain, wave, freq, attk, hold, rels)

    synth.index = index
    return synth
  }

  colorNameToFreq(colorName){
   if(colorName == "red"){
      return 523.2511
    } else if(colorName == "orange"){
      return 587.3295
    } else if(colorName == "yellow"){
      return 659.2551
    } else if(colorName == "green"){
      return 698.4565
    } else if(colorName == "blue"){
      return 783.9909
    } else if(colorName == "indigo"){
      return 880.0000
    } else if(colorName == "violet"){
      return 987.7666
    } 
  }

  colorNameToHex(colorName){
    if(colorName == "red"){
      return "#ff0000"
    } else if(colorName == "orange"){
      return "#FFA500"
    } else if(colorName == "yellow"){
      return "#ffff00"
    } else if(colorName == "green"){
      return "#00ff00"
    } else if(colorName == "blue"){
      return "#0000ff"
    } else if(colorName == "indigo"){
      return "#4B0082"
    } else if(colorName == "violet"){
      return "#EE82EE"
    }
  }

  randomColor(){
    return ["red","orange","yellow","green","blue","indigo","violet"].sort(() => Math.random() - 0.5)[0]
  }

  randomWaveform(){
    return ["sine","square","sawtooth","triangle"].sort(() => Math.random() - 0.5)[0]
  }

  randomizeSequencerTrack(trackIndex){
    let enable
    for(var stepIndex=0; stepIndex<this.sequencerTrackLength; stepIndex++){
      enable = Math.random() > 0.5 ? true : false
      seqWorker.postMessage({changeNote: {track: trackIndex, step: stepIndex, enable: enable}})
    }
  }

  addRandomPixels(num){
    let newPix = []
    for(var i=0; i<num; i++){
      // need new reference for each pix
      var pix = {}
      pix.color = this.randomColor()
      pix.gain = 0.4
      pix.clientId = Math.floor( Math.random() * 100 )
      newPix.push(pix)
    }

    return newPix
  }

  getPixels(){
    // get pixel array from server

    // return [
    //   {clientId: "abc", color: "violet", gain: 0.5},
    //   {clientId: "def", color: "yellow", gain: 0.5},
    //   {clientId: "ghi", color: "indigo", gain: 0.5}
    // ]
    return this.addRandomPixels(4)
  }

  pixNoteLength(){
    return 2000
  }

  soundPatternLength(){
    // do tempo or whatever later
    // each note is 4 seconds
    return this.state.pixels.length * this.pixNoteLength()
  }

  // synth utilities
  updateSounds(){

    let keepSynthIds = []

    let oldNumSynths = this.state.synths.length

    // map through pixels making synth based on color and index
    let sounds = this.state.pixels.map( (pixel,index) => {
      var synth
      if(this.state.synths[index]){
        // existing synth, ramp instead

        synth = this.state.synths[index]
        synth.update( this.colorNameToFreq(pixel.color) )
      } else {
        // new synth
        synth = this.createSynth(index, pixel.gain, this.randomWaveform(), this.colorNameToFreq(pixel.color), 0.2, this.defaultSynthGain, 0.2)
        // same order as 
        synth.index = index
        // seqWorker.postMessage({addTrack: true})
      }

      // new or old synth, keep id
      keepSynthIds.push(synth.id)
      // this.randomizeSequencerTrack(index)

      return synth
    })

    for(var i=0; i<this.state.synths.length; i++){
      console.log( 'find newsynthid result ',keepSynthIds.indexOf(this.state.synths[i].id) )
      if( keepSynthIds.indexOf(this.state.synths[i].id) === -1 ){
        // if this synth is not in new ids, stop it so it dies when we lose its reference
        this.state.synths[i].hardStop()
      }
    }

    let patternSounds = this.createPatternSounds(this.state.pixels)


    // current state of pixels tells us the length of nonpattsounds
    if(patternSounds.length > 0){
      sounds = sounds.concat(patternSounds)
    }

    // update indexes for synths before we send them off
    sounds = sounds.map( (sound,i) => {
      sound.index = i
      return sound
    })

    this.setState({synths: sounds}, () => {
      let newNumSynths = this.state.synths.length
      var numToChange = Math.abs(oldNumSynths - newNumSynths)
      console.log( 'oldNumSynths', oldNumSynths, newNumSynths, numToChange )

      for(var i=0; i<numToChange; i++){
        if(oldNumSynths > newNumSynths){
          // remove a track
          console.log( 'REMOVE' )
          seqWorker.postMessage({removeTrack: {index: oldNumSynths-numToChange} })
        } else if(newNumSynths > oldNumSynths){
          console.log( 'ADD' )
          seqWorker.postMessage({addTrack: true})
        }

      }

      for(var i=0; i<this.state.synths.length; i++){
        // color scheme sequence determinations instead of this
        this.randomizeSequencerTrack(i)
      }

    })
  }

  checkConsec(array, startingIndex, testVal){
    let consecCount = 0
    for(var i=startingIndex; i<array.length; i++){
      if(array[i] === testVal){
        consecCount += 1
      } else {
        // exit early if no match found
        break
      }
    }
    return consecCount    
  }

  createPatternSounds(pixels){
    // detect n pix repeats
    // add sound with freq * n of repeats (harmonics)
    //  1 pix repeat gives freq
    //  2 pix repeat gives freq * 2 etc
    let colorInts = pixels.map( (pixel) => { return this.colorNameToInt(pixel.color) } )

    // ik right
    let patternSoundIndex = pixels.length

    let patternSounds = []

    let skip = 0
    // -1 because 
    for(var i=0; i<colorInts.length-1; i++){
      if(skip > 0){
        skip--
        continue
      }
      let thisColorIndex = i

      // which color are we checking for pattern from
      let thisColor = colorInts[thisColorIndex]
      let numberOfRepeats = 0
      numberOfRepeats = this.checkConsec(colorInts, thisColorIndex+1, thisColor)

      if(numberOfRepeats > 0){
        // skip forward num repeats if found
        skip = numberOfRepeats+1

        // add pattern sounds
        for(var x=0; x<numberOfRepeats; x++){
          let newSynth = this.createSynth(patternSoundIndex, pixels[thisColorIndex].gain, this.randomWaveform(), this.colorNameToFreq(pixels[thisColorIndex].color), 0.2, this.defaultSynthGain, 0.2)
          patternSounds.push(newSynth)
          patternSoundIndex++
        }
      }
      console.log(thisColor, ' number consecutive is ', numberOfRepeats )
    }

    return patternSounds
  }

  colorNameToInt(colorName){
   if(colorName == "red"){
      return 0
    } else if(colorName == "orange"){
      return 1
    } else if(colorName == "yellow"){
      return 2
    } else if(colorName == "green"){
      return 3
    } else if(colorName == "blue"){
      return 4
    } else if(colorName == "indigo"){
      return 5
    } else if(colorName == "violet"){
      return 6
    } 
  }

  playSounds(){
    console.log( 'play the sounds' )
    seqWorker.postMessage({play: true})
    this.setState({playing: true})
    // this.state.synths.map ( (synth) => { synth.playRepeat(this.soundPatternLength(), this.pixNoteLength()*synth.index) } )
  }

  stopSounds(){
    console.log( 'stop the sounds' )
    // actually kills oscs..
    // this.state.synths.map ( (synth) => { synth.hardStop() } )
    seqWorker.postMessage({stop: true})
  }

  render(){
    let soundShows
    if(this.state.synths){
      // soundShows = this.state.synths.map( (synth) => { return <SoundShow playing={ synth.playing } soundLength={ synth.noteLength() * 1000 } /> })
    }

    let pixels
    if(this.state.pixels){
      pixels = this.state.pixels.map( (pixel) => { return <Pixel color={ this.colorNameToHex(pixel.color) } /> })
    }

    return (
      <div className="container">

        <div className="user-controls-container">
          <div onClick={ () => { this.playSounds() } } className="button play">PLAY</div>
          <div onClick={ () => { this.stopSounds() } } className="button stop">STOP</div>
          
        </div>

        <div className="soundshower-container">
          { soundShows }
        </div>


        <div className="pixels-container">
          { pixels }
        </div>
      </div>
    )  
  }
}

export default App
