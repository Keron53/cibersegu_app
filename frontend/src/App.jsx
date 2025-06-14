import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './components/login/LoginPage'
import RegisterPage from './components/register/RegisterPage'
import HomePage from './components/home/HomePage'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/" element={<LoginPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App