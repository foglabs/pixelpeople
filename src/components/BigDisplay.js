function BigDisplay(props){
  return(
    <div className="big-display">
      { parseFloat(props.value).toFixed(2) }
    </div>
  )
}

export default BigDisplay
