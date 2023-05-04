import Pixel from "./Pixel.js"

function ColorPicker(props){
  // let synth = new Synth('sine', 440)

  const COLORS = [ "red", "red-orange", "orange", "orange-yellow", "yellow", "yellow-green", "green", "green-blue", "blue", "blue-violet", "violet", "violet-red"]

  let pixels = COLORS.map( (color) => <Pixel key={ color } border={ color == props.userColor } onClick={ () => props.pixelClick(color) } color={ props.colorNameToHex(color) } /> )

  return(
    <div id={ props.id } className="color-picker">
      { pixels }
    </div>
  )
}

export default ColorPicker
