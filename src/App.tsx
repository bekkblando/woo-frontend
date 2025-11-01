import './App.css'
import { Routes, Route } from 'react-router-dom'
import { RequestFormProvider } from './context/RequestFormContext'
import Landing from './pages/Landing'
import RequestMaker from './pages/RequestMaker'
import Finalize from './pages/Finalize'
import CompletedRequest from './pages/CompletedRequest'
import Status from './pages/Status'
import Admin from './pages/Admin'

function App() {
  return (
    <RequestFormProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/request" element={<RequestMaker />} />
        <Route path="/finalize" element={<Finalize />} />
        <Route path="/completed-request" element={<CompletedRequest />} />
        <Route path="/status" element={<Status />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </RequestFormProvider>
  )
}

export default App
