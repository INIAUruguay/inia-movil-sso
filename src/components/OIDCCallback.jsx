import React, { useEffect, useState } from 'react';
import { 
    INIA_CONFIG, 
    saveTokens, 
    validateState,
    setupTokenRefresh 
} from '../config';
import './Login.css';

const OIDCCallback = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        handleOIDCCallback();
    }, []);

    const handleOIDCCallback = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

            // Verificar si hay error en la URL
            if (error) {
                throw new Error(`Error de autorización: ${error}`);
            }

            // Verificar que tenemos el código de autorización
            if (!code) {
                throw new Error('No se recibió código de autorización');
            }

            // Validar state parameter (seguridad CSRF)
            if (!validateState(state)) {
                throw new Error('State parameter inválido');
            }

            // Intercambiar código por tokens
            const response = await fetch(`${INIA_CONFIG.baseUrl}/oidc/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: INIA_CONFIG.redirectUri,
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

            // Obtener información del usuario
            const userResponse = await fetch(`${INIA_CONFIG.baseUrl}/oidc/userinfo/`, {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            });

            if (!userResponse.ok) {
                throw new Error('Error obteniendo información del usuario');
            }

            const userInfo = await userResponse.json();

            // Guardar tokens
            saveTokens(data);
            
            // Configurar renovación automática
            setupTokenRefresh();

            // Obtener return_url de los parámetros de la URL
            const returnUrlParam = urlParams.get('return_url');
            const returnUrl = returnUrlParam ? decodeURIComponent(returnUrlParam) : null;

            if (returnUrl) {
                // Redirigir con tokens en la URL
                const url = new URL(returnUrl);
                url.searchParams.set('access_token', data.access_token);
                url.searchParams.set('id_token', data.id_token);
                url.searchParams.set('token_type', data.token_type);
                url.searchParams.set('expires_in', data.expires_in);
                url.searchParams.set('scope', data.scope);
                
                if (data.refresh_token) {
                    url.searchParams.set('refresh_token', data.refresh_token);
                }

                // Agregar información del usuario
                if (userInfo.sub) {
                    url.searchParams.set('user_id', userInfo.sub);
                }
                if (userInfo.name) {
                    url.searchParams.set('name', userInfo.name);
                }
                if (userInfo.email) {
                    url.searchParams.set('email', userInfo.email);
                }
                if (userInfo.preferred_username) {
                    url.searchParams.set('username', userInfo.preferred_username);
                }

                window.location.href = url.toString();
            } else {
                // Si no hay return_url, mostrar éxito
                setLoading(false);
            }

        } catch (error) {
            console.error('Error en callback OIDC:', error);
            setError(error.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="logo-container">
                        <img src="/inia-logo.png" alt="INIA" className="inia-logo" />
                    </div>
                    <div className="loading-message">
                        <div className="button-spinner"></div>
                        <p>Procesando autenticación...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="logo-container">
                        <img src="/inia-logo.png" alt="INIA" className="inia-logo" />
                    </div>
                    <div className="error-message">
                        <h3>Error de Autenticación</h3>
                        <p>{error}</p>
                        <button 
                            className="login-submit-btn" 
                            onClick={() => window.location.href = '/'}
                        >
                            Volver al Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="logo-container">
                    <img src="/inia-logo.png" alt="INIA" className="inia-logo" />
                </div>
                <div className="success-message">
                    <h3>¡Autenticación Exitosa!</h3>
                    <p>Redirigiendo...</p>
                </div>
            </div>
        </div>
    );
};

export default OIDCCallback;
