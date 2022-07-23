import logo from "./logo.svg";
import "./App.css";
// core
import React, { Component, useEffect } from "react"

// extra
import { Knob, Arc, Pointer, Value } from 'rc-knob'

// me
import Pixel from "./components/Pixel.js"
import SoundShow from "./components/SoundShow.js"
import Synth from "./classes/Synth.js"
import MasterSequencer from "./classes/MasterSequencer.js"
import ColorScheme from "./classes/ColorScheme.js"


import WorkerBuilder from "./wb.js"
import SequencerWorker from "./seqWorker.js"
var seqWorker = new WorkerBuilder(SequencerWorker)

class App extends Component { 
  constructor(props){
    super(props)

    this.sequencerTrackLength = 16

    this.state = {
      tempo: 60,
      numPix: 0,
      pixels: [],
      synths: [],
      // kind of stupid but easier to track v
      synthsPlaying: [],
      playing: false,
      masterGain: 0.035,
      masterSequencerSteps: new Array(this.sequencerTrackLength).fill(true),
      randomizePixels: false,
      randomizePixelsInterval: 3600,
      noteLength: 0.3,
      semitoneShift: 0
    }

    this.toggleMasterSequencerStep = this.toggleMasterSequencerStep.bind(this)
    this.addPixel = this.addPixel.bind(this)
    this.removePixel = this.removePixel.bind(this)
    this.changeMasterGain = this.changeMasterGain.bind(this)
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
      this.setColorScheme(this.state.pixels)

      this.changeTempo(this.state.tempo)
      this.playSounds()

      // start seq
      // var sequencerWorker = new Worker(sequencer)
      seqWorker.onmessage = (action) => {
        if(action) {
          // console.log("Message from sequencer", action.data);
          if(action.data.playSynth){
            // play synth now, since seq said so

            // console.log( 'playing synth', action.data.playSynth.index )
            this.state.synths[action.data.playSynth.index].play()
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
        if(this.state.playing){
          // update seq tracks every 30ms
          this.setColorScheme(this.state.pixels)
          // update from master sequencer
          // this.updateSequencerTracks()

          let sp = []
          for(var i=0; i<this.state.synths.length; i++){
            // poll for are synths playing
            // this.updateSynthPlaying(this.state.synths[i].playing, i)  
            sp[i] = this.state.synths[i].playing
          }

          this.setState({synthsPlaying: sp})
        }
      }, 30)
    })
  }

  toggleRandomizePixels(){
    this.setState( prevState => ({randomizePixels: !prevState.randomizePixels}), () => {
      seqWorker.postMessage({changeRandomizePixels: {value: this.state.randomizePixels} })
    })
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
    console.log( 'create synth ', index )
    // let freq = this.colorNameToFreq(color)
    let synth = new Synth(this.audioContext, this.gainNode, gain, wave, freq, attk, hold, rels)

    synth.index = index
    synth.color = color

    return synth
  }

// 2^(s/12)*freq

  shiftBySemitones(freq, semitones){
    return Math.pow(2, (semitones/12) ) * freq
  }

  colorNameToFreq(colorName){
   if(colorName == "red"){
      return this.shiftBySemitones(523.2511, this.state.semitoneShift)
    } else if(colorName == "orange"){
      return this.shiftBySemitones(587.3295, this.state.semitoneShift)
    } else if(colorName == "yellow"){
      return this.shiftBySemitones(659.2551, this.state.semitoneShift)
    } else if(colorName == "green"){
      return this.shiftBySemitones(698.4565, this.state.semitoneShift)
    } else if(colorName == "blue"){
      return this.shiftBySemitones(783.9909, this.state.semitoneShift)
    } else if(colorName == "violet"){
      return this.shiftBySemitones(880.0000, this.state.semitoneShift)
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
    } else if(colorName == "violet"){
      return "#EE82EE"
    }
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
    } else if(colorName == "violet"){
      return 5
    } 
  }

  intToColorName(int){
   if(int == 0){
      return "red"
    } else if(int == 1){
      return "orange"
    } else if(int == 2){
      return "yellow"
    } else if(int == 3){
      return "green"
    } else if(int == 4){
      return "blue"
    } else if(int == 5){
      return "violet"
    } 
  }

  randomColor(){
    return ["red","orange","yellow","green","blue","violet"].sort(() => Math.random() - 0.5)[0]
  }

  randomWaveform(){
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

  updateSequencerTrack(trackIndex, steps, numTracks=false){
    // if numtracks passed in, then only play on seq steps that correspond to the synth's track index
    let minStep, maxStep
    if(numTracks){
      minStep = Math.floor(steps.length/numTracks) * trackIndex
      maxStep = ( Math.floor(steps.length/numTracks) * (trackIndex+1) ) - 1
    }

    let enable
    for(var stepIndex=0; stepIndex<this.sequencerTrackLength; stepIndex++){

      if( steps[stepIndex] && (!numTracks || (stepIndex >= minStep && stepIndex <= maxStep))  ){
        // enable = Math.random() > 0.5 ? true : false
        enable = true
        // console.log( stepIndex, 'was enabled' )
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
    let pixels = [...this.state.pixels]
    pixels.splice( index, 1 )
    this.setState({pixels: pixels}, () => {
      this.updateSounds()
    })
  }

  getPixels(){
    // get pixel array from server

    // return [
    //   {clientId: "abc", color: "violet", gain: 0.5},
    //   {clientId: "def", color: "yellow", gain: 0.5},
    // ]
    
    return this.addRandomPixels(this.state.numPix)
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

  changeTempo(newTempo){
    let stepTime = this.tempoToStepTime(newTempo)
    this.setState({tempo: newTempo}, () => {
      seqWorker.postMessage({changeTempo: {value: stepTime} })
    })
  }

  changeSemitoneShift(newSemitoneShift){
    this.setState({semitoneShift: newSemitoneShift}, () => {
      let synths = this.state.synths
      // change playing synths to new freq
      for(var i=0; i<synths.length; i++){
        synths[i].update( this.colorNameToFreq(synths[i].color) )
      }

    })
  }

  changeMasterGain(newGain){
    
    this.setState({masterGain: newGain}, () => {
      if(newGain === 0 || newGain > 0){
        this.gainNode.gain.exponentialRampToValueAtTime(newGain, this.audioContext.currentTime+0.08)
      }
    })
  }

  changeNoteLength(length){
    let synths = this.state.synths
    let a,h,r
    // let oldLength = this.state.noteLength
    a = length * 0.10
    h = length * 0.40
    r = length * 0.20
    synths.map( (synth) => {
      synth.setNoteLength(a,h,r)
    })
    // this.setState({synths: synths})
  }

  newPixel(color=null){
    var pix = {}
    pix.color = color || this.randomColor()
    pix.gain = 0.4
    pix.clientId = Math.floor( Math.random() * 100 )
    return pix
  }

  changeNumPix(newNum){
    newNum = newNum > 64 ? 64 : newNum
    this.setState({numPix: newNum}) 
  }

  // synth utilities
  updateSounds(){

    let keepSynthIds = []

    let oldNumSynths = this.state.synths.length

    let a,h,r
    // let oldLength = this.state.noteLength
    a = this.state.noteLength * 0.10
    h = this.state.noteLength * 0.40
    r = this.state.noteLength * 0.20

    // map through pixels making synth based on color and index
    let sounds = this.state.pixels.map( (pixel,index) => {
      var synth
      if(this.state.synths[index]){
        // existing synth, ramp instead

        synth = this.state.synths[index]
        synth.update( this.colorNameToFreq(synth.color) )
      } else {
        // new synth
        synth = this.createSynth(index, pixel.gain, this.randomWaveform(), this.colorNameToFreq(pixel.color), a, h, r, pixel.color)
        // same order as 
        synth.index = index
      }

      // new or old synth, keep id
      keepSynthIds.push(synth.id)
      // this.randomizeSequencerTrack(index)

      return synth
    })

    for(var i=0; i<this.state.synths.length; i++){
      if( keepSynthIds.indexOf(this.state.synths[i].id) === -1 ){
        // if this synth is not in new ids, stop it so it dies when we lose its reference
        this.state.synths[i].hardStop()
      }
    }

    // let patternSounds = this.createPatternSounds(this.state.pixels)
    let patternSounds = []

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
    let numSchemePix = 0
    for(var i=0; i<this.state.synths.length; i++){
      let steps = []

      for(var x=0; x<schemes.length; x++){

        let matchedColorIndex = schemes[x].matchedColors.indexOf(this.state.synths[i].color)
        if(schemes[x].matched && matchedColorIndex > -1){
          numSchemePix += 1

          // only change this track if scheme matched and this colors in it

          for(var y=0; y<this.sequencerTrackLength; y++){

            // use which scheme color we're on to spread across seq
            let enable
            // if( ((y-matchedColorIndex*2) % schemes[x].skipLength()) == 0){
            if( (y-1) % schemes[x].skipLength() == 0){

              enable = true
            } else {
              enable = false
            }
            steps[y] = enable
          }
        }   
      }

      if(steps.length > 0){
       this.updateSequencerTrack(i, steps)
      } else {
        // set to master seq, spread playing evenly across non scheme pix
        this.updateSequencerTrack(i, this.state.masterSequencerSteps, this.state.synths.length - numSchemePix)
      }
    }

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
    var colors = ["red","orange","yellow","green","blue","violet"]
    let ci1, ci2
    ci1 = colors.indexOf(color1)
    ci2 = colors.indexOf(color2)
    // check to left and right
    return Math.min( Math.abs(ci1 - ci2), ( 6-Math.abs(ci1 - ci2) ) )
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
    for(var i=0; i<colorInts.length-1; i++){
      if(skip > 0){
        skip--
        continue
      }
      let thisColorIndex = i

      // which color are we checking for pattern from
      let thisColor = colorInts[thisColorIndex]

      for(var repeatLength=1; repeatLength < 2; repeatLength++){
        let numberOfRepeats = 0

        // pass in colors, first one to check, color to check against, and how many to skip between matches
        numberOfRepeats = this.checkRepeat(colorInts, thisColorIndex+repeatLength, thisColor, repeatLength)

        if(numberOfRepeats > 0){
          // skip forward num repeats*repeatlength if found, since we already checked em
          skip = (numberOfRepeats*repeatLength)+1

          // add pattern sounds
          for(var x=0; x<numberOfRepeats; x++){

            // frequency is 
            let frequency = this.colorNameToFreq(pixels[thisColorIndex].color) * repeatLength

            let newSynth = this.createSynth(patternSoundIndex, pixels[thisColorIndex].gain, this.randomWaveform(), frequency, 0.2, this.synthGain(), 0.2, pixels[thisColorIndex].color)
            patternSounds.push(newSynth)
            patternSoundIndex++
          }
        }  

        // console.log('starting with color ', this.intToColorName(thisColor), ' number of ', repeatLength, ' pix repeats is ', numberOfRepeats )

      }
      
    }

    return patternSounds
  }

  playSounds(){
    console.log( 'play the sounds' )
    seqWorker.postMessage({play: true})
    this.setState({playing: true})
  }

  stopSounds(){
    console.log( 'stop the sounds' )
    // actually kills oscs..
    // this.state.synths.map ( (synth) => { synth.hardStop() } )

    seqWorker.postMessage({stop: true})
    this.setState({playing: false})
  }

  render(){

    let tempoKnob = (
      <div className="user-control knob-container">
        <Knob 
          size={100}
          angleOffset={220}
          angleRange={280}
          min={0}
          max={200}
          value={this.state.tempo}
          onChange={value => this.changeTempo(value)}
        >
          <circle
            r="35"
            cx="50"
            cy="50"
            fill="#eee"
          />
          <Arc 
            arcWidth={5}
            color="#888"
            radius={47.5} 
          />
          <Pointer 
            width={5}
            radius={40}
            type="circle"
            color="#808"
          />
          <Value 
            marginBottom={40} 
            className="value" 
          />

        </Knob>
        <label>
          tempo
        </label>
      </div>
    )

    let masterGainKnob = (

      <div className="user-control knob-container">
        <Knob 
          size={100}
          angleOffset={220}
          angleRange={280}
          min={0.001}
          max={1}
          value={this.state.masterGain}
          onChange={value => this.changeMasterGain(value)}
        >
          <circle
            r="35"
            cx="50"
            cy="50"
            fill="#eee"
          />
          <Arc 
            arcWidth={5}
            color="#888"
            radius={47.5} 
          />
          <Pointer 
            width={5}
            radius={40}
            type="circle"
            color="#808"
          />
          <Value 
            marginBottom={40} 
            className="value" 
            decimalPlace={3}
          />


        </Knob>
        <label>
          masterGain
        </label>
      </div>
    )

    let randomizePixelsIntervalKnob = (
      <div className="user-control knob-container">
        <Knob 
          size={100}
          angleOffset={220}
          angleRange={280}
          min={1}
          max={8000}
          onChange={value => this.changeRandomizePixelsInterval(value)}
        >
          <circle
            r="35"
            cx="50"
            cy="50"
            fill="#eee"
          />
          <Arc 
            arcWidth={5}
            color="#888"
            radius={47.5} 
          />
          <Pointer 
            width={5}
            radius={40}
            type="circle"
            color="#808"
          />
          <Value 
            marginBottom={40} 
            className="value" 
          />

        </Knob>
        <label>
          randomizePixelsInterval
        </label>
      </div>
    )

    let numPixKnob = (
      <div className="user-control knob-container">
        <Knob 
          size={100}
          angleOffset={220}
          angleRange={280}
          min={0}
          max={32}
          onChange={value => this.changeNumPix(Math.floor(value))}
        >
          <circle
            r="35"
            cx="50"
            cy="50"
            fill="#eee"
          />
          <Arc 
            arcWidth={5}
            color="#888"
            radius={47.5} 
          />
          <Pointer 
            width={5}
            radius={40}
            type="circle"
            color="#808"
          />
          <Value 
            marginBottom={40} 
            className="value" 
          />

        </Knob>
        <label>
          numPix
        </label>
      </div>
    )

    let noteLengthKnob = (
      <div className="user-control knob-container">
        <Knob 
          size={100}
          angleOffset={220}
          angleRange={280}
          min={0}
          max={2}
          onChange={value => this.changeNoteLength(value)}
        >
          <circle
            r="35"
            cx="50"
            cy="50"
            fill="#eee"
          />
          <Arc 
            arcWidth={5}
            color="#888"
            radius={47.5} 
          />
          <Pointer 
            width={5}
            radius={40}
            type="circle"
            color="#808"
          />
          <Value 
            marginBottom={40} 
            className="value"
            decimalPlace={2}
          />

        </Knob>
        <label>
          noteLength
        </label>
      </div>
    )

    let semitoneShiftKnob = (
      <div className="user-control knob-container">
        <Knob 
          size={100}
          angleOffset={220}
          angleRange={280}
          min={-24}
          max={24}
          steps={48}
          snap={true}
          onChange={value => this.changeSemitoneShift(Math.ceil(value))}
          value={this.state.semitoneShift}
        >
          <circle
            r="35"
            cx="50"
            cy="50"
            fill="#eee"
          />
          <Arc 
            arcWidth={5}
            color="#888"
            radius={47.5} 
          />
          <Pointer 
            width={5}
            radius={40}
            type="circle"
            color="#808"
          />
          <Value 
            marginBottom={40} 
            className="value"
          />

        </Knob>
        <label>
          semitoneShift
        </label>
      </div>
    )
    let soundShows
    if(this.state.synthsPlaying){
      soundShows = this.state.synthsPlaying.map( (isPlaying, index) => { return <SoundShow color={ this.state.synths[index] ? this.state.synths[index].color : "#eee"  } playing={ isPlaying } /> })
    }

    let pixels
    if(this.state.pixels){
      pixels = this.state.pixels.map( (pixel, index) => { return <Pixel onClick={ () => { this.removePixel(index) } } color={ this.colorNameToHex(pixel.color) } /> })
    }

    let colorPalette = ["red","orange","yellow","green","blue","violet"].map( (color) => <Pixel color={ this.colorNameToHex(color) } onClick={ () => { this.addPixel(color) } } /> )

    let buttonClasses = "user-control button "
    let playButtonClasses = buttonClasses + "play"
    let stopButtonClasses = buttonClasses + "stop"
    let randButtonClasses = buttonClasses + "rand"

    if(this.state.playing){
      playButtonClasses += " white-border"
    } else {
      stopButtonClasses += " white-border"
    }

    if(this.state.randomizePixels){
      randButtonClasses += " white-border"
    }

    return (
      <div className="container">

        <div className="pixels-container">
          { colorPalette }
        </div>
        <div className="user-controls-container">
          { masterGainKnob }
          { tempoKnob }
          { randomizePixelsIntervalKnob }
          { numPixKnob }
          { noteLengthKnob }
          { semitoneShiftKnob }



          <div onClick={ () => { this.playSounds() } } className={playButtonClasses}>PLAY</div>
          <div onClick={ () => { this.stopSounds() } } className={stopButtonClasses}>STOP</div>
          <div onClick={ () => { this.toggleRandomizePixels() } }  className={randButtonClasses}>RAND</div>

        </div>
          <MasterSequencer toggleMasterSequencerStep={ this.toggleMasterSequencerStep } steps={ this.state.masterSequencerSteps } />

        <div className="hide user-controls-container">
          <div className="pixels-container">
            { colorPalette }
          </div>

          <div onClick={ () => { this.playSounds() } } className="button play">PLAY</div>
          <div onClick={ () => { this.stopSounds() } } className="button stop">STOP</div>
          
          <label>
            masterGain
            <input onChange={ (e) => this.changeMasterGain(e.target.value) } type="text" name="masterGain" value={ this.state.masterGain } placeholder="masterGain" />
          </label>

          <label>
            tempo
            <input onChange={ (e) => this.changeTempo(e.target.value) } type="text" name="tempo" value={ this.state.tempo } placeholder="tempo" />
          </label>
          
          <label>
            randomizePixelsInterval
            <input onChange={ (e) => this.changeRandomizePixelsInterval(e.target.value) } type="text" name="randomizePixelsInterval" value={ this.state.randomizePixelsInterval } placeholder="tempo" />
          </label>
          
          <label>
            noteLength
            <input onChange={ (e) => this.setNoteLength(e.target.value) } type="text" name="noteLength" value={ this.state.noteLength } placeholder="tempo" />
          </label>

          <label>
            <input onClick={ (e) => this.toggleRandomizePixels() } type="button" name="randomizePixels" value={ "randomize" + (this.state.randomizePixels ? "(ON)" : "(OFF)") } />
          </label>

          <label>
            <input onClick={ (e) => this.toggleMasterSequencerSteps() } type="button" name="toggleMasterSequencerSteps" value="toggle steps" />
          </label>

          <label>
            numRandomPix
            <input onChange={ (e) => this.changeNumPix(e.target.value) } type="text" name="numPix" value={ this.state.numPix } placeholder="numPix" />
          </label>

          <label>
            semitoneShift
            <input onChange={ (e) => this.changeNumPix(e.target.value) } type="text" name="semitoneShift" value={ this.state.semitoneShift } placeholder="semitoneShift" />
          </label>

          <MasterSequencer toggleMasterSequencerStep={ this.toggleMasterSequencerStep } steps={ this.state.masterSequencerSteps } />
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
