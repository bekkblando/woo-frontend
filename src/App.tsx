import './App.css'
import { Routes, Route } from 'react-router-dom'
import { RequestFormProvider } from './context/RequestFormContext'
import Landing from './pages/Landing'
import RequestMaker from './pages/RequestMaker'
import Finalize from './pages/Finalize'

function App() {
  return (
    <RequestFormProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/request" element={<RequestMaker />} />
        <Route path="/finalize" element={<Finalize />} />
      </Routes>
    </RequestFormProvider>
  )
}

export default App
