function SimpleControl(props){

  return(
    <div className={ props.classes }>
      <button onTouchStart={ () => props.startHoldDown(props.changeFunction, props.fieldName, props.increment, props.round)  } onMouseDown={ () => props.startHoldDown(props.changeFunction, props.fieldName, props.increment, props.round) } onClick={ () => props.changeFunction(props.value+props.increment) } >▲</button>
      <button onTouchStart={ () => props.startHoldDown(props.changeFunction, props.fieldName, -props.increment, props.round) } onMouseDown={ () => props.startHoldDown(props.changeFunction, props.fieldName, -props.increment, props.round) } onClick={ () => props.changeFunction(props.value-props.increment) } >▼</button>
      <div>{ props.label }</div>
    </div>

  )
}

export default SimpleControl


// <div>{ (Math.round(props.value * 100) / 100).toFixed(2) }</div>

// onTouchEnd={ props.stopHoldDown } onMouseUp={ props.stopHoldDown }

// onTouchEnd={ props.stopHoldDown } onMouseUp={ props.stopHoldDown }