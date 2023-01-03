function MasterSequencer(props){

  let buttons = props.steps.map((step, stepIndex) => { 
    let seqClasses
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

    if(props.canPlay[stepIndex]){
      seqClasses += " can-play"
    }
    // value={ props.steps[stepIndex] ? "On" : "Off"}
    return (<input style={{ backgroundColor: bgColor }} className={ seqClasses } onClick={ () => props.toggleMasterSequencerStep(stepIndex) } type="button" />) })

  return(
    <div className="sequencer-container">
      { buttons }
    </div>
  )
}

export default MasterSequencer
