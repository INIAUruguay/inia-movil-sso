import React from 'react';
import SSOLogin from './components/SSOLogin';
import OIDCLogin from './components/OIDCLogin';
import OIDCCallback from './components/OIDCCallback';
import './App.css';

function AppSSO() {
  // Detectar si estamos en el callback OIDC
  const urlParams = new URLSearchParams(window.location.search);
  const isOIDCCallback = window.location.pathname.includes('/auth/callback') || urlParams.has('code');
  
  // Detectar si se solicita flujo OIDC estándar
  const useOIDC = urlParams.get('oidc') === 'true' || window.location.pathname.includes('/oidc');

  if (isOIDCCallback) {
    return <OIDCCallback />;
  }

  if (useOIDC) {
    return <OIDCLogin />;
  }

  // Flujo SSO tradicional por defecto
  return <SSOLogin />;
}

export default AppSSO;
