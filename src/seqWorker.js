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
    constructor(something){
      this.transport = STOPPED
      this.timer = new Timer
      this.timer.start()

      // how long is one step in ms
      this.stepTime = 800

      this.globalStep = 0
      this.trackLength = 8

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

    addTrack(){
      this.tracks.push([false,false,false,false,false,false,false,false])
    }

    changeNote(note){
      console.log( 'hey fuckface', note )
      this.tracks[note.track][note.step] = note.enable
    }

    playLoop(){
      if(this.timer.time() > this.stepTime){
        this.timer.reset()

        for(var i=0; i<this.tracks.length; i++){
          if(this.tracks[i][this.globalStep]){
            // postMessage("PLAY NOTE Track " + i + "Note " + this.globalStep)
            // track and this.state.synths[index] are the same
            console.log( 'PLAY IT' )
            postMessage({playSynth: {index: i}})
          }
        }

        console.log( 'Seconds go by...')
        this.globalStep++
        if(this.globalStep == this.trackLength){
          this.globalStep = 0
        }
      }
    }
  }

  const STOPPED = 0
  const PLAYING = 1

  console.log( 'Welcome to sequcner worker!' )
  var sequencer = new Sequencer()

  // eslint-disable-next-line no-restricted-globals  
  self.onmessage = (action) => { 
    postMessage("I did " + JSON.stringify(action.data))

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
    }
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





