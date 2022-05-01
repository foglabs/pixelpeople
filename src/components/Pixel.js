import React, { Component } from 'react';
function Pixel(props){
  // let synth = new Synth('sine', 440)

  return(
    <div className="pixel" style={{ backgroundColor: props.color }}>
    </div>
  )
}

export default Pixel
