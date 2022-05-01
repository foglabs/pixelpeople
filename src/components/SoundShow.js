// import React, { useState, useEffect } from 'react'

function SoundShow(props){
  // const [isPlaying, setIsPlaying] = useState(false)

  // useEffect(() => {
  //   if(props.playing){
  //     setIsPlaying( (isPlaying) => true)

  //     var soundTimer = setTimeout(() => {
  //       setIsPlaying( (isPlaying) => false )
  //     }, props.soundLength)

  //     return () => clearTimeout(soundTimer)
  //   }

  // }, [isPlaying])
  
      // { isPlaying ? "boners" : "vaginas" }

  return (
    <div className="sound-show">
      { props.playing ? "PLAYING" : "SOMEOTHING ELSE" }
    </div>
  )  
}

export default SoundShow
