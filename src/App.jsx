import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SuccessScreen from './components/SuccessScreen';
import { isAuthenticated } from './config';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [isLoading, setIsLoading] = useState(true);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado al cargar la app
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setCurrentView(authenticated ? 'dashboard' : 'login');
      setIsLoading(false);
    };

    // Simular un pequeño delay para mostrar el loading
    setTimeout(checkAuth, 500);
  }, []);

  // Manejar cambios de vista
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Manejar éxito del login/registro
  const handleLoginSuccess = (message, userInfo) => {
    setSuccessData({ message, userInfo });
    setCurrentView('success');
  };

  // Manejar error del login/registro
  const handleLoginError = (error) => {
    // El error se maneja en el componente Login con el overlay
    console.log('Error de login:', error);
  };

  // Continuar al dashboard desde la pantalla de éxito
  const handleContinueToDashboard = () => {
    setCurrentView('dashboard');
    setSuccessData(null);
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando Miniapp INIA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {currentView === 'login' && (
        <Login 
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
      )}
      {currentView === 'success' && successData && (
        <SuccessScreen 
          message={successData.message}
          userInfo={successData.userInfo}
          onContinue={handleContinueToDashboard}
        />
      )}
      {currentView === 'dashboard' && (
        <Dashboard onLogout={() => handleViewChange('login')} />
      )}
    </div>
  );
}

export default App;
