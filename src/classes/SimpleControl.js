function SimpleControl(props){

  return(
    <label className={ props.classes }>
      <button onTouchStart={ () => props.startHoldDown(props.changeFunction, props.fieldName, props.increment)  } onTouchEnd={ props.stopHoldDown } onMouseDown={ () => props.startHoldDown(props.changeFunction, props.fieldName, props.increment) } onMouseUp={ props.stopHoldDown } onClick={ () => props.changeFunction(props.value+props.increment) } >▲</button>
      <button onTouchStart={ () => props.startHoldDown(props.changeFunction, props.fieldName, -props.increment) } onTouchdEnd={ props.stopHoldDown } onMouseDown={ () => props.startHoldDown(props.changeFunction, props.fieldName, -props.increment) } onMouseUp={ props.stopHoldDown } onClick={ () => props.changeFunction(props.value-props.increment) } >▼</button>
      <div>{ props.label }</div>
      <div>{ (Math.round(props.value * 100) / 100).toFixed(2) }</div>
    </label>

  )
}

export default SimpleControl
