import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './components/login/LoginPage'
import RegisterPage from './components/register/RegisterPage'
import HomePage from './components/home/HomePage.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { SessionProvider, useSession } from './context/SessionContext.jsx'
import CertificateUpload from './components/certificados/CertificateUpload'
import CertificateGenerator from './components/certificados/CertificateGenerator'
import CertificateList from './components/certificados/CertificateList'
import { setSessionExpiredCallback } from './services/api'

function AppContent() {
  const { showSessionExpiredModal } = useSession()

  useEffect(() => {
    // Configurar el callback para mostrar el modal cuando expire la sesión
    setSessionExpiredCallback(() => {
      showSessionExpiredModal()
    })
  }, [showSessionExpiredModal])

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/certificado" element={<CertificateUpload />} />
          <Route path="/generar-certificado" element={<CertificateGenerator />} />
          <Route path="/mis-certificados" element={<CertificateList />} />
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </ThemeProvider>
  )
}

export default App