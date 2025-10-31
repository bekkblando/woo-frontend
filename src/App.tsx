
import './App.css'
import RequestMaker from './pages/RequestMaker'
import { RequestFormProvider } from './context/RequestFormContext'

function App() {

  return (
    <RequestFormProvider>
      <RequestMaker />
    </RequestFormProvider>
  )
}

export default App
