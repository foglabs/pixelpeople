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
      return 1
    } else if(this.name == "analagous"){
      return 2
    } else if(this.name == "complementary"){
      return 3
    }
  }
}

export default ColorScheme
