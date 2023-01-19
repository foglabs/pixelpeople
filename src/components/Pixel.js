function Pixel(props){
  // let synth = new Synth('sine', 440)

  let boxShadow = ""
  let pixelClasses = "pixel"
  // let style = { backgroundColor: props.color }
  if(props.border){
    pixelClasses += " border"
    
  } else {
    boxShadow = "0px 0px 4px " + props.color;
  }

  let stylez = {backgroundColor: props.color, boxShadow: boxShadow }
  if(props.fadePixel){

    stylez.animationName = "fade-animation"
    stylez.animationDuration = `${ props.fadeDuration }s`
  
  }
  
  return(
    <div onClick={ props.onClick } className={ pixelClasses } style={ stylez } />
  )
}

export default Pixel
