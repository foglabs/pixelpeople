function MasterSequencer(props){

  let buttons = props.steps.map((step, stepIndex) => { 
    let seqClasses = props.steps[stepIndex] ? "sequencer-button enable" : "sequencer-button disable"
    return (<input className={ seqClasses } onClick={ () => props.toggleMasterSequencerStep(stepIndex) } type="button" value={ props.steps[stepIndex] ? "On" : "Off"} />) })

  return(
    <div className="sequencer-container">
      { buttons }
    </div>
  )
}

export default MasterSequencer
