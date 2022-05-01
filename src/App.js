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

    this.state = {
      pixels: [],
      synths: [],
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
        this.setState({pixels: this.getPixels()}, () => {
          this.updateSounds()
          
          // for(var i=0; i<this.state.pixels.length; i++){
          //   this.randomizeSequencerTrack(i)
          // }
        })
      }, 8000)
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
    this.gainNode.gain.value = 0.2
    this.gainNode.connect(this.audioContext.destination)
  }

  createSynth(index, gain, wave, color, attk, hold, rels){
    let freq = this.colorNameToFreq(color)
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
    return this.addRandomPixels(100)
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
    // map through pixels making synth based on color and index
    let sounds = this.state.pixels.map( (pixel,index) => {
      var synth
      if(this.state.synths[index]){
        // existing synth, ramp instead

        synth = this.state.synths[index]
        synth.update( this.colorNameToFreq(pixel.color) )
      } else {
        // new synth
        synth = this.createSynth(index, pixel.gain, this.randomWaveform(), pixel.color, 0.2, 0.4, 0.2)
        // same order as 
        synth.index = index
        seqWorker.postMessage({addTrack: true})
      }

      this.randomizeSequencerTrack(index)

      // seqWorker.postMessage({changeNote: {track: index, step: 0, enable: true, }})
      // seqWorker.postMessage({changeNote: {track: index, step: 2, enable: true, }})
      // seqWorker.postMessage({changeNote: {track: index, step: 4, enable: true, }})
      // seqWorker.postMessage({changeNote: {track: index, step: 6, enable: true, }})
      return synth
    })

    this.setState({synths: sounds})
  }

  randomizeSequencerTrack(trackIndex){
    let enable
    for(var stepIndex=0; stepIndex<this.sequencerTrackLength; stepIndex++){
      enable = Math.random() > 0.5 ? true : false
      seqWorker.postMessage({changeNote: {track: trackIndex, step: stepIndex, enable: enable}})
    }
  }

  playSounds(){
    console.log( 'play the sounds' )
    seqWorker.postMessage({play: true})
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
