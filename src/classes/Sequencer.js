class Sequencer {
  constructor(something){
    this.transport = STOPPED
  }

  startPlaying(){
    this.transport = PLAYING
    while(this.transport === PLAYING){
      // keep tracking events once we start
      this.playLoop()
    }
  }

  playLoop(){
    console.log( 'pee pee' )
  }
}

const STOPPED = 0
const PLAYING = 1


export { Sequencer }
