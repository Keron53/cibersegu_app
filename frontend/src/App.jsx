import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './components/login/LoginPage'
import RegisterPage from './components/register/RegisterPage'
import HomePage from './components/home/HomePage'
import { ThemeProvider } from './context/ThemeContext'
import { SessionProvider, useSession } from './context/SessionContext'                                                    
import SessionExpiredModal from './components/layout/SessionExpiredModal'
import CertificateUpload from './components/certificados/CertificateUpload'
import CertificateGenerator from './components/certificados/CertificateGenerator'
import CertificateList from './components/certificados/CertificateList'
import ProfilePage from './components/profile/ProfilePage'
import RecuperarContrasenaPage from './components/auth/RecuperarContrasenaPage'
import PDFValidationPage from './components/validacion/PDFValidationPage'
import EmailVerificationPage from './components/auth/EmailVerificationPage'
import { setSessionExpiredCallback } from './services/api'

function AppContent() {
  const { isSessionExpired, showSessionExpiredModal, hideSessionExpiredModal } = useSession()

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
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
          <Route path="/validar-pdf" element={<PDFValidationPage />} />
          <Route path="/verificar-email" element={<EmailVerificationPage />} />
        </Routes>
        
        {/* Modal de sesión expirada dentro del Router */}
        <SessionExpiredModal 
          isOpen={isSessionExpired} 
          onClose={hideSessionExpiredModal} 
        />
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