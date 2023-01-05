function MasterSequencer(props){

  let buttons = props.steps.map((step, stepIndex) => { 
    let seqClasses, beatBorder
    let bgColor = "#000"
    if(props.steps[stepIndex]){
      seqClasses = "sequencer-button enable"
      if(props.colors){
        bgColor = props.colors[stepIndex]
      }
      
    } else {
      seqClasses = "sequencer-button disable"
    }

    if(props.lightStep === stepIndex){
      seqClasses += " lit"
      bgColor = "#ff0"
    }

    if(props.beatColors[stepIndex]){
      beatBorder = "12px solid " + props.beatColors[stepIndex]
    }
    // value={ props.steps[stepIndex] ? "On" : "Off"}
    return (<input style={{ border: beatBorder, backgroundColor: bgColor }} className={ seqClasses } onClick={ () => props.toggleMasterSequencerStep(stepIndex) } type="button" />) })

  return(
    <div className="sequencer-container">
      { buttons }
    </div>
  )
}

export default MasterSequencer
