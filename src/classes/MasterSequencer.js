function MasterSequencer(props){

  let buttons = props.steps.map((step, stepIndex) => { 
    let seqClasses = props.steps[stepIndex] ? "sequencer-button enable" : "sequencer-button disable"
    // value={ props.steps[stepIndex] ? "On" : "Off"}
    return (<input className={ seqClasses } onClick={ () => props.toggleMasterSequencerStep(stepIndex) } type="button"  />) })

  return(
    <div className="sequencer-container">
      { buttons }
    </div>
  )
}

export default MasterSequencer
