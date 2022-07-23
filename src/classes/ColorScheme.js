class ColorScheme{
  constructor(name){
    this.name = name
    this.matched = false
    this.matchedColors = []

    if(this.name == "triad"){
      this.colorDistance = 2
      this.numMatchesNeeded = 2  
    } else if(this.name == "analagous"){
      this.colorDistance = 1
      this.numMatchesNeeded = 2
    } else if(this.name == "complementary"){
      this.colorDistance = 3
      this.numMatchesNeeded = 1
    }
  }

  skipLength(){
    if(this.name == "triad"){
      return 2
    } else if(this.name == "analagous"){
      return 4
    } else if(this.name == "complementary"){
      return 6
    }
  }
}

export default ColorScheme
