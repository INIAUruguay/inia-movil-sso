// Configuración de la miniapp
export const INIA_CONFIG = {
    // URL del backend INIA (producción)
    baseUrl: 'https://repositorioapptest.inia.uy/api',
    
    // Credenciales OIDC (obtener de INIA)
    clientId: '815547',
    clientSecret: 'c792c7de465b00126292ea68cc5fbf5ce491a64c6c26fad8509b3419',
    
    // URLs de callback
    redirectUri: 'https://inia-movil-sso.vercel.app/auth/callback',
    logoutUri: 'https://inia-movil-sso.vercel.app/logout',
    
    // Scopes necesarios
    scope: 'openid profile email',
    
    // Configuración de Google (obtener de Google Cloud Console)
    googleClientId: '1090482067186-fim5udv24sdibvjvf6q9dfl0s3j9hqhk.apps.googleusercontent.com',
    
    // Configuración de Apple (obtener de Apple Developer)
    appleClientId: 'com.inia.app',
    
    // Configuración de tokens
    tokenExpiryBuffer: 300, // 5 minutos antes de expirar
    refreshCheckInterval: 5 * 60 * 1000, // Verificar cada 5 minutos
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
    
    // Guardar refresh token si existe
    if (tokens.refresh_token) {
        localStorage.setItem('inia_refresh_token', tokens.refresh_token);
    }
    
    // Guardar timestamp de expiración
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    localStorage.setItem('inia_expires_at', expiresAt);
};

// Función para obtener tokens
export const getTokens = () => {
    const accessToken = localStorage.getItem('inia_access_token');
    const idToken = localStorage.getItem('inia_id_token');
    const tokenType = localStorage.getItem('inia_token_type');
    const refreshToken = localStorage.getItem('inia_refresh_token');
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
        token_type: tokenType,
        refresh_token: refreshToken
    };
};

// Función para limpiar tokens
export const clearTokens = () => {
    localStorage.removeItem('inia_access_token');
    localStorage.removeItem('inia_id_token');
    localStorage.removeItem('inia_token_type');
    localStorage.removeItem('inia_expires_in');
    localStorage.removeItem('inia_scope');
    localStorage.removeItem('inia_refresh_token');
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

// Función para verificar si un token está próximo a expirar
export const isTokenExpiringSoon = (bufferSeconds = INIA_CONFIG.tokenExpiryBuffer) => {
    const expiresAt = localStorage.getItem('inia_expires_at');
    if (!expiresAt) return true;
    
    const now = Date.now();
    const expiryTime = parseInt(expiresAt);
    const bufferTime = bufferSeconds * 1000;
    
    return (now + bufferTime) >= expiryTime;
};

// Función para renovar access token usando refresh token
export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('inia_refresh_token');
    if (!refreshToken) {
        console.warn('No hay refresh token disponible');
        return null;
    }

    try {
        const response = await fetch(`${INIA_CONFIG.baseUrl}/oidc/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: refreshToken,
                client_id: INIA_CONFIG.clientId,
                client_secret: INIA_CONFIG.clientSecret
            })
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Guardar los nuevos tokens
        saveTokens(data.tokens);
        
        console.log('✅ Token renovado exitosamente');
        return data.tokens.access_token;

    } catch (error) {
        console.error('❌ Error renovando token:', error);
        // Si falla la renovación, limpiar tokens y redirigir a login
        clearTokens();
        return null;
    }
};

// Función para hacer requests autenticados con renovación automática
export const makeAuthenticatedRequest = async (url, options = {}) => {
    let accessToken = localStorage.getItem('inia_access_token');
    
    // Verificar si el token está próximo a expirar
    if (isTokenExpiringSoon()) {
        console.log('🔄 Token próximo a expirar, renovando...');
        const newToken = await refreshAccessToken();
        if (newToken) {
            accessToken = newToken;
        } else {
            // Si no se pudo renovar, redirigir a login
            window.location.href = '/';
            return;
        }
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`
        }
    });
};

// Función para configurar renovación automática de tokens
export const setupTokenRefresh = () => {
    // Verificar tokens cada X minutos
    setInterval(async () => {
        const tokens = getTokens();
        if (!tokens) return;

        if (isTokenExpiringSoon()) {
            console.log('🔄 Renovando token automáticamente...');
            await refreshAccessToken();
        }
    }, INIA_CONFIG.refreshCheckInterval);
};

// Función para generar state parameter para OIDC
export const generateState = () => {
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    localStorage.setItem('inia_oidc_state', state);
    return state;
};

// Función para validar state parameter
export const validateState = (receivedState) => {
    const storedState = localStorage.getItem('inia_oidc_state');
    localStorage.removeItem('inia_oidc_state');
    return storedState === receivedState;
};

