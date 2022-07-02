function SoundShow(props){

  let classes = "sound-show"
  if(props.playing){
    classes += " playing"
  }
  return (
    <div className={ classes }>
    </div>
  )  
}

export default SoundShow
