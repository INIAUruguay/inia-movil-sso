// Configuración de la miniapp
export const INIA_CONFIG = {
    // URL del backend INIA (producción)
    baseUrl: 'https://repositorioapptest.inia.uy/api',
    
    // Credenciales OIDC (obtener de INIA)
    clientId: '815547',
    clientSecret: 'c792c7de465b00126292ea68cc5fbf5ce491a64c6c26fad8509b3419',
    
    // URLs de callback
    redirectUri: 'https://inia-movilo-sso.vercel.app/auth/callback',
    logoutUri: 'https://inia-movilo-sso.vercel.app/logout',
    
    // Scopes necesarios
    scope: 'openid profile email',
    
    // Configuración de Google (obtener de Google Cloud Console)
    // ⚠️ NECESITAS CREAR TU PROPIO CLIENT ID DE GOOGLE
    // El Client ID temporal no funciona porque no está autorizado para tu dominio
    googleClientId: '1090482067186-fim5udv24sdibvjvf6q9dfl0s3j9hqhk.apps.googleusercontent.com', // ⚠️ REEMPLAZAR CON TU CLIENT ID
    // googleClientId: '549996348904-5j8m810ig5por1krvromsjuhc3i18l8e.apps.googleusercontent.com', // Client ID temporal (no funciona)
    // googleClientId: '1090482067186-aqo1fs1k6utu1k55t94qq13vp2sv7gom.apps.googleusercontent.com', // Tu Client ID de React Native (no funciona para web)
    
    // Configuración de Apple (obtener de Apple Developer)
    appleClientId: 'TU_APPLE_CLIENT_ID', // Reemplazar con tu Apple Client ID
};

// Función para mostrar mensajes
export const showMessage = (message, type = 'info') => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    // Estilos
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Colores según tipo
    switch (type) {
        case 'success':
            messageDiv.style.backgroundColor = '#28a745';
            break;
        case 'error':
            messageDiv.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            messageDiv.style.backgroundColor = '#ffc107';
            messageDiv.style.color = '#000';
            break;
        default:
            messageDiv.style.backgroundColor = '#007bff';
    }
    
    document.body.appendChild(messageDiv);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
};

// Función para guardar tokens
export const saveTokens = (tokens) => {
    localStorage.setItem('inia_access_token', tokens.access_token);
    localStorage.setItem('inia_id_token', tokens.id_token);
    localStorage.setItem('inia_token_type', tokens.token_type);
    localStorage.setItem('inia_expires_in', tokens.expires_in);
    localStorage.setItem('inia_scope', tokens.scope);
    
    // Guardar timestamp de expiración
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    localStorage.setItem('inia_expires_at', expiresAt);
};

// Función para obtener tokens
export const getTokens = () => {
    const accessToken = localStorage.getItem('inia_access_token');
    const idToken = localStorage.getItem('inia_id_token');
    const tokenType = localStorage.getItem('inia_token_type');
    const expiresAt = localStorage.getItem('inia_expires_at');
    
    if (!accessToken || !idToken) {
        return null;
    }
    
    // Verificar si el token ha expirado
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
        clearTokens();
        return null;
    }
    
    return {
        access_token: accessToken,
        id_token: idToken,
        token_type: tokenType
    };
};

// Función para limpiar tokens
export const clearTokens = () => {
    localStorage.removeItem('inia_access_token');
    localStorage.removeItem('inia_id_token');
    localStorage.removeItem('inia_token_type');
    localStorage.removeItem('inia_expires_in');
    localStorage.removeItem('inia_scope');
    localStorage.removeItem('inia_expires_at');
};

// Función para verificar si el usuario está autenticado
export const isAuthenticated = () => {
    return getTokens() !== null;
};

// Función para redirigir después del login
export const redirectAfterLogin = () => {
    const returnUrl = localStorage.getItem('inia_return_url') || '/dashboard';
    localStorage.removeItem('inia_return_url');
    window.location.href = returnUrl;
};

