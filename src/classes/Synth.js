class Synth {
  constructor(audioContext, globalGain, initialGain, waveform, frequency, attackLength, holdLength, releaseLength){

    this.audioContext = audioContext

    this.attackLength = attackLength
    this.holdLength = holdLength
    this.releaseLength = releaseLength

    this.initialGain = initialGain

    // create Oscillator node
    this.oscillator = audioContext.createOscillator()
    this.oscillator.type = waveform

    this.gainNode = audioContext.createGain()
    // this.gainNode.gain.value = initialGain

    // connect new osc to its own gain
    this.oscillator.connect(this.gainNode)
    // connect new osc to global vol
    this.gainNode.connect(globalGain)

    this.oscillator.start()

    this.frequency = frequency
    this.stop()

    this.id = new Date().getTime() + Math.random().toString(16).slice(2)

    // eh?
    // this.gainNode.value = 0.0000001
    // fade in 2s later
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
  }

  rampToFrequency(frequency, slideTime){
    // ramp to it baby
    this.oscillator.frequency.exponentialRampToValueAtTime(frequency, this.audioContext.currentTime+slideTime)
  }

  setFrequency(frequency){
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    this.oscillator.frequency.setValueAtTime(0.0001, this.audioContext.currentTime + this.noteLength() )
  }

  setGain(gain){
    this.gainNode.value = gain
  }

  play(){
    // if(this.gainNode.gain.value === 0){
    //   console.log( 'its happen' )
    //   this.gainNode.gain.linearRampToValueAtTime(this.initialGain, this.audioContext.currentTime, this.audioContext.currentTime+1)
    // }

    this.enable = true

    this.attack()
    // this.hold(this.holdLength)
    this.release()
    this.setFrequency(this.frequency)

    // // show sounds while playing
    // this.noteIsPlaying = setTimeout( () => {
    //   // note is done playing
    //   console.log( 'its false' )
    //   this.playing = false
    // }, 10000 )

    this.playing = true
    this.startTimer()
  }

  startTimer(){
    this.timer = setTimeout( () => {
      this.playing = false
      this.stopTimer()
      // console.log( 'stupid!', this.noteLength() )
    }, 80 )  
  }

  stopTimer(){
    clearTimeout(this.timer)
  }

  // playRepeat(repeatLength, delay){

  //   this.delay = setTimeout( () => {
  //     this.play()
  //     this.randomNoteLength()
  
  //     this.timer = setInterval( () => {
  //       if(this.enable){
  //         this.stop()

  //         // sets new atack etc
  //         this.randomNoteLength()

  //         this.play()
  //       }
        
  //     }, repeatLength)
  //   }, delay)
  // }

  // stopRepeat(){
  //   if(this.timer){
  //     clearInterval(this.timer)
  //   }
  // }

  stop(){
    this.setFrequency(0.0001)
    this.setGain(0)
    this.enable = false

    this.stopTimer()
  }

  hardStop(){
    this.oscillator.stop()
    this.stopTimer()
    // this.playing = false
  }

  update(frequency){
    this.frequency = frequency
    this.rampToFrequency( frequency, 0.1 )
    // in case we need to change waveform or other stuff along with freq
    // console.log( 'duh', this.index, this.oscillator.frequency, frequency )
  }

  randomNoteLength(){
    this.attackLength = Math.random(2)
    this.holdLength = Math.random(1)
    this.releaseLength = Math.random(2)
  }

  setNoteLength(a,h,r){
    this.attackLength = a
    this.holdLength = h
    this.releaseLength = r
  }

  noteLength(){
    // seconds
    return this.attackLength + this.holdLength + this.releaseLength
  }

  attack(){
    // start at nothing
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    this.gainNode.gain.linearRampToValueAtTime(this.initialGain, this.audioContext.currentTime + this.attackLength)
  }
  
  release(){
    let finishReleasing = this.noteLength()
    this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + finishReleasing)
  }
}

export default Synth
