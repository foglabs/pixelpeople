import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"


const root = ReactDOM.createRoot(document.getElementById("root"))
const app = <App />
root.render(
  <React.StrictMode>
    { app }
  </React.StrictMode>
)
