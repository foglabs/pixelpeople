function Pixel(props){
  // let synth = new Synth('sine', 440)

  let pixelClasses = "pixel"
  if(props.border){
    pixelClasses += " border"
  }
  return(
    <div onClick={ props.onClick } className={ pixelClasses } style={{ backgroundColor: props.color }} />
  )
}

export default Pixel
