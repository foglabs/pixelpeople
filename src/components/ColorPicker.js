import Pixel from "./Pixel.js"

function ColorPicker(props){
  // let synth = new Synth('sine', 440)

  const COLORS = [ "red", "red-orange", "orange", "orange-yellow", "yellow", "yellow-green", "green", "green-blue", "blue", "blue-violet", "violet", "violet-red"]

  let pixels = COLORS.map( color => <Pixel style={{ border: (color == props.userColor ? "1px solid black" : "none") }} onClick={ () => props.changeColor(color) } color={ props.colorNameToHex(color) } /> )

  return(
    <div className="color-picker">
      { pixels }
    </div>
  )
}

export default ColorPicker
