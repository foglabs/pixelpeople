function SoundShow(props){

  let classes = "sound-show"
  let color = "#000"
  if(props.color){
    classes += " playing"
    color = props.color

    if(props.isScheme){
      classes += " highlight"
    }

  }

  return (
    <div style={ {backgroundColor: color} } className={ classes }>
    </div>
  )  
}

export default SoundShow
