// eslint-disable-next-line import/no-anonymous-default-export


// import { Sequencer } from './classes/Sequencer.js'
export default () => {
  class Timer {
    constructor(countdownTime=null){

      this.startTime = performance.now()
      this.endTime = this.startTime
      this.running = false

      this.countdownTime = countdownTime
    }

    start(){
      this.running = true
      this.startTime = performance.now()
    }

    stop(){
      this.running = false
      this.endTime = performance.now()
    }

    reset(){
      // console.log("I reset!")
      let now = performance.now()
      this.startTime = now

      this.running = true

      if(!this.countdownTime){
        this.endTime = now
      }
    }

    time(){
      if(this.running){
        let now = performance.now()
        let msecs = now - this.startTime

        if(this.countdownTime){
          // flip it for countdown
          let remain = this.countdownTime - msecs

          if(remain <= 0){

            this.running = false
            return 0
          } else {
            
            // divide so we can display in seconds
            return Math.floor(remain / 1000)
          }

        } else {
          return msecs
        }
        // # of seconds since start time
        
      } else {
        return 0
      }
    }
  }

  class Sequencer {
    constructor(stepTime){
      this.transport = STOPPED
      this.timer = new Timer
      this.timer.start()

      this.debugTimer = new Timer
      this.debugTimer.start()

      this.randomizePixels = false
      this.randomizePixelsInterval = 3600
      this.randomizePixelsTimer = new Timer
      this.randomizePixelsTimer.start()

      // how long is one step in ms
      this.stepTime = stepTime

      this.globalStep = 0
      // how many steps per track
      this.trackLength = 16

      this.tracks = []
      // this.tracks = [
      //   [true,false,false,true,false,false,false,false],
      //   [false,false,false,true,false,true,false,false],
      //   [false,true,false,false,false,false,false,true],
      //   [false,false,false,false,true,false,true,false],
      // ]

      // repeat 10ms
      this.heartbeatLength = 10
    }

    startPlaying(){
      this.transport = PLAYING

      // set heartbeat
      this.sequencerHeartbeat = setInterval( () => {
        if(this.transport === PLAYING){
          this.playLoop()
        }
      }, this.heartbeatLength)
    }
  
    stopPlaying(){
      this.transport = STOPPED

      // clear heartbeat
      clearInterval( this.sequencerHeartbeat )
    }

    changeTempo(tempo){
      this.stepTime = tempo
    }

    changeRandomizePixels(newRand){
      this.randomizePixels = newRand
    }

    changeRandomizePixelsInterval(newInterval){
      this.randomizePixelsInterval = newInterval
    }

    addTrack(){
      let newTrack = new Array(this.trackLength).fill(false)
      this.tracks.push(newTrack)
    }

    removeTrack(index){
      this.tracks.splice(index,1)
    }

    changeNote(note){
      this.tracks[note.track][note.step] = note.enable
    }

    playLoop(){
      // if(this.debugTimer.time() > 4000){
      //   this.debugTimer.reset()
      //   console.log( 'Num Sequencers: ', this.tracks.length )
      //   for(var i=0; i<this.tracks.length; i++){
      //     console.log( 'Steps for Seq ', i, ": ", this.tracks[i])
      //   }
      // }

      if(this.timer.time() > this.stepTime){
        this.timer.reset()

        for(var i=0; i<this.tracks.length; i++){
          if(this.tracks[i][this.globalStep]){

            // play note if enabled
            // track and this.state.synths[index] are the same lol
            postMessage({playSynth: {index: i}})
          }
        }

        // tell sequencer UI to light up corresponding step
        postMessage({lightStep: this.globalStep })

        this.globalStep++
        if(this.globalStep == this.trackLength){
          this.globalStep = 0
        }
      }

      // random pixels if enabled...
      if(this.randomizePixels){
        if(this.randomizePixelsTimer.time() > this.randomizePixelsInterval){
          console.log( 'time to randomize pixels!' )
          this.randomizePixelsTimer.reset()
          // randomize that shit!
          postMessage({randomizePixels: true})
        }
      }
    }
  }

  const STOPPED = 0
  const PLAYING = 1

  console.log( 'Welcome to sequcner worker!' )
  // initial step length in ms
  var sequencer = new Sequencer(120)

  // eslint-disable-next-line no-restricted-globals  
  self.onmessage = (action) => { 
    // postMessage("I did " + JSON.stringify(action.data))

    if(action.data.play && sequencer.transport !== PLAYING ){
      sequencer.startPlaying()
      // postMessage({"played"})
    } else if(action.data.stop){
      sequencer.stopPlaying()
      // postMessage("stopped")
    } else if(action.data.changeNote){
      // pass in which sequence
      sequencer.changeNote(action.data.changeNote)
    } else if(action.data.addTrack){
      sequencer.addTrack()
    } else if(action.data.removeTrack){
      sequencer.removeTrack(action.data.removeTrack.index)
    } else if(action.data.changeTempo){
      // this is steptime coming in, not tempo
      sequencer.changeTempo(action.data.changeTempo.value)
    } else if(action.data.changeRandomizePixels){
      sequencer.changeRandomizePixels(action.data.changeRandomizePixels.value)
    } else if(action.data.changeRandomizePixelsInterval){
      sequencer.changeRandomizePixelsInterval(action.data.changeRandomizePixelsInterval)
    }
    //  else if(action.data.ensureNumTracks){
    //   let numTracks = action.data.ensureNumTracks.numTracks
    //   if(sequencer.tracks.length > numTracks){}
    // }
  }
}



// {
//   action: "play"
// }

// {
//   action: "stop"
// }


// {
//   action: "changeNote",
//   note: {
//     enable: true
//     track: int 0-3,
//     step: int 0-7,
//   }
// }





