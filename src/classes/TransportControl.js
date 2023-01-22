function TransportControl(props){

  let buttonClasses = "transport-control"
  // if(props.thin){
  //     buttonClasses += "thin "
  // }
  if(props.active){
    let borderColor = " white"
    if(props.borderColor){
      borderColor = props.borderColor
    }
    buttonClasses += borderColor + "-border"
  }
  buttonClasses += " " + props.code

  let subButtons
  if(props.subButtons){
    if(props.open){
      subButtons = props.subButtons
    }

    buttonClasses += " folder"
  }

  if(props.isSubButton){
    buttonClasses += " sub-button"
  }

  return(
    <div onClick={ props.onClick } className={ buttonClasses }>
      { props.code.toUpperCase() }
      { subButtons }
    </div>
  )
}

export default TransportControl
