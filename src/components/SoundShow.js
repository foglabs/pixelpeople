function SoundShow(props){

  let classes = "sound-show"
  let color = "#000"
  if(props.playing){
    classes += " playing"
    color = props.color
  }
  return (
    <div style={ {backgroundColor: color} } className={ classes }>
    </div>
  )  
}

export default SoundShow
