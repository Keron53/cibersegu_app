import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <h2>¡Bienvenido!</h2>
      <p>Has accedido correctamente.</p>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
};

export default Welcome;
