function TransportControl(props){

  let buttonClasses = "transport-control "
  if(props.thin){
      buttonClasses += "thin "
  }
  if(props.active){
    let borderColor = "white"
    if(props.borderColor){
      borderColor = props.borderColor
    }
    buttonClasses += borderColor + "-border "
  }
  buttonClasses += props.code

  return(
    <div onClick={ props.onClick } className={ buttonClasses }>
      { props.code.toUpperCase() }
    </div>
  )
}

export default TransportControl
