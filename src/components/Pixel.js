function Pixel(props){
  // let synth = new Synth('sine', 440)

  return(
    <div onClick={ props.onClick } className="pixel" style={{ backgroundColor: props.color }} />
  )
}

export default Pixel
