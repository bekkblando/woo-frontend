import './App.css'
import { Routes, Route } from 'react-router-dom'
import { RequestFormProvider } from './context/RequestFormContext'
import Landing from './pages/Landing'
import RequestMaker from './pages/RequestMaker'

function App() {
  return (
    <RequestFormProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/request" element={<RequestMaker />} />
      </Routes>
    </RequestFormProvider>
  )
}

export default App
