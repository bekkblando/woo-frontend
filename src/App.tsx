import './App.css'
import { Routes, Route } from 'react-router-dom'
import { RequestFormProvider } from './context/RequestFormContext'
import Landing from './pages/Landing'
import RequestMaker from './pages/RequestMaker'
import Finalize from './pages/Finalize'
import CompletedRequest from './pages/CompletedRequest'
import Status from './pages/Status'
import Admin from './pages/Admin'
import Privacy from './pages/Privacy'
import DocumentViewer from './pages/DocumentViewer'
import DocumentDownload from './pages/DocumentDownload'
import { useEffect } from 'react'
import { setCsrfTokenIfNotPresent } from './hooks/authentication_helper'

const AuthenticationHelper = () => {
  useEffect(() => {
    setCsrfTokenIfNotPresent();
  }, []);
  return null;
};  

function App() {
  return (
    <RequestFormProvider>
      <AuthenticationHelper />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/request" element={<RequestMaker />} />
        <Route path="/finalize" element={<Finalize />} />
        <Route path="/completed-request" element={<CompletedRequest />} />
        <Route path="/status" element={<Status />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/document" element={<DocumentViewer />} />
        <Route path="/download" element={<DocumentDownload />} />
      </Routes>
    </RequestFormProvider>
  )
}

export default App
