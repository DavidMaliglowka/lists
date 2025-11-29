import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import OGImage from './OGImage.jsx'

const isOG = window.location.search.includes('og');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isOG ? <OGImage /> : <App />}
  </StrictMode>,
)
