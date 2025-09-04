import React, { useState, useEffect } from 'react';
import { INIA_CONFIG, saveTokens } from '../config';
import ErrorOverlay from './ErrorOverlay';
import './Login.css';

const SSOLogin = () => {
    const [showEmailLogin, setShowEmailLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentError, setCurrentError] = useState(null);
    const [retryFunction, setRetryFunction] = useState(null);
    const [errorContext, setErrorContext] = useState(null);
    const [returnUrl, setReturnUrl] = useState(null);

    // Obtener return_url de los parámetros de la URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrlParam = urlParams.get('return_url');
        console.log('🔍 DEBUG - URL actual:', window.location.href);
        console.log('🔍 DEBUG - return_url param:', returnUrlParam);
        
        if (returnUrlParam) {
            const decodedUrl = decodeURIComponent(returnUrlParam);
            console.log('🔍 DEBUG - return_url decodificado:', decodedUrl);
            setReturnUrl(decodedUrl);
        } else {
            console.log('⚠️ No se encontró return_url en la URL');
        }
    }, []);

    // Función para mostrar error
    const showError = (error, retryFn = null, context = null) => {
        setCurrentError(error);
        setRetryFunction(() => retryFn);
        setErrorContext(context);
    };

    // Función para cerrar error
    const closeError = () => {
        setCurrentError(null);
        setRetryFunction(null);
        setErrorContext(null);
    };

    // Función para manejar éxito del login
    const handleLoginSuccess = (userInfo) => {
        // Guardar tokens
        saveTokens(userInfo.tokens);
        
        console.log('🔍 DEBUG - returnUrl:', returnUrl);
        console.log('🔍 DEBUG - userInfo:', userInfo);
        
        // Redirigir al return_url con los tokens y info del usuario (sin popup)
        if (returnUrl) {
            console.log('✅ Redirigiendo a return_url:', returnUrl);
            
            // Crear URL con los tokens y info del usuario como parámetros
            const url = new URL(returnUrl);
            url.searchParams.set('access_token', userInfo.tokens.access_token);
            url.searchParams.set('id_token', userInfo.tokens.id_token);
            url.searchParams.set('token_type', userInfo.tokens.token_type);
            url.searchParams.set('expires_in', userInfo.tokens.expires_in);
            url.searchParams.set('scope', userInfo.tokens.scope);
            
            // Agregar información del usuario (como en el backend)
            if (userInfo.user_id) {
                url.searchParams.set('user_id', userInfo.user_id);
            }
            if (userInfo.name) {
                url.searchParams.set('name', userInfo.name);
            }
            if (userInfo.email) {
                url.searchParams.set('email', userInfo.email);
            }
            if (userInfo.username) {
                url.searchParams.set('username', userInfo.username);
            }
            
            console.log('🚀 URL final de redirección:', url.toString());
            
            // Redirigir
            window.location.href = url.toString();
        } else {
            // Si no hay return_url, mostrar mensaje de éxito y recargar la página
            console.log('Login exitoso:', userInfo);
            
            // Mostrar mensaje de éxito temporal
            const successMessage = document.createElement('div');
            successMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            successMessage.textContent = '¡Login exitoso! Redirigiendo...';
            document.body.appendChild(successMessage);
            
            // Remover el mensaje después de 3 segundos
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.parentNode.removeChild(successMessage);
                }
            }, 3000);
            
            // Recargar la página para mostrar el estado autenticado
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    // Cargar scripts de Google y Apple
    useEffect(() => {
        // Cargar Google Sign In
        const googleScript = document.createElement('script');
        googleScript.src = 'https://accounts.google.com/gsi/client';
        googleScript.async = true;
        googleScript.defer = true;
        document.head.appendChild(googleScript);

        // Cargar Apple Sign In
        const appleScript = document.createElement('script');
        appleScript.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        appleScript.async = true;
        appleScript.defer = true;
        document.head.appendChild(appleScript);

        // Inicializar Google Sign In cuando el script esté cargado
        googleScript.onload = () => {
            initializeGoogleSignIn();
        };

        return () => {
            // Limpiar scripts al desmontar
            if (googleScript.parentNode) {
                googleScript.parentNode.removeChild(googleScript);
            }
            if (appleScript.parentNode) {
                appleScript.parentNode.removeChild(appleScript);
            }
        };
    }, []);

    // Función para inicializar Google Sign In
    const initializeGoogleSignIn = () => {
        try {
            if (typeof google === 'undefined') {
                console.warn('Google Sign In SDK no está disponible aún');
                return;
            }

            // Verificar si el Client ID está configurado
            if (!INIA_CONFIG.googleClientId || INIA_CONFIG.googleClientId === 'TU_GOOGLE_CLIENT_ID') {
                console.warn('Google Client ID no configurado');
                return;
            }

            // Inicializar Google Sign In
            google.accounts.id.initialize({
                client_id: INIA_CONFIG.googleClientId,
                callback: handleGoogleCallback,
                auto_select: false,
                cancel_on_tap_outside: true,
                use_fedcm_for_prompt: false,
                itp_support: false,
                context: 'signin',
                ux_mode: 'redirect',
                state: 'random_state_string'
            });

            // Renderizar el botón de Google directamente
            const buttonDiv = document.getElementById('google-signin-button');
            if (buttonDiv) {
                buttonDiv.innerHTML = '';
                buttonDiv.style.display = 'block';
                
                google.accounts.id.renderButton(buttonDiv, {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                    width: 300,
                    type: 'standard'
                });
            }

        } catch (error) {
            console.error('Error al inicializar Google Sign In:', error);
        }
    };

    // Callback de Google Sign In
    const handleGoogleCallback = async (response) => {
        try {
            setLoading(true);
            
            // Verificar que la respuesta sea válida
            if (!response || !response.credential) {
                throw new Error('Respuesta inválida de Google');
            }
            
            // Decodificar la respuesta de Google
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            // Verificar que el payload sea válido
            if (!payload.email) {
                throw new Error('Email no encontrado en la respuesta de Google');
            }
            
            // Enviar a backend INIA
            const result = await fetch(`${INIA_CONFIG.baseUrl}/oidc/social-login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: 'google',
                    name: payload.name,
                    email: payload.email,
                    user: payload.email,
                    token: payload.sub // ID único de Google
                })
            });
            
            if (!result.ok) {
                throw new Error(`Error del servidor: ${result.status}`);
            }
            
            const data = await result.json();
            
            if (data.error) {
                showError(
                    `Error del backend: ${data.error}`, 
                    null, // No retry para errores del backend
                    `Backend INIA retornó error. Status: ${result.status}`
                );
                return;
            }
            
            // Manejar éxito (sin mensaje)
            handleLoginSuccess({
                tokens: data.tokens,
                user_id: data.user?.id || null,
                name: data.user?.name || payload.name,
                email: data.user?.email || payload.email,
                username: data.user?.username || null
            });
            
        } catch (error) {
            console.error('Error en callback de Google:', error);
            showError(
                `Error al procesar respuesta de Google: ${error.message}`, 
                null, // No retry para errores técnicos
                `Error técnico en el procesamiento del callback de Google.`
            );
        } finally {
            setLoading(false);
        }
    };

    // Función para login con Apple
    const handleAppleLogin = async () => {
        try {
            setLoading(true);
            
            if (typeof AppleID === 'undefined') {
                showError(
                    'Apple Sign In SDK no está disponible', 
                    handleAppleLogin,
                    'El script de Apple Sign In no se ha cargado correctamente.'
                );
                return;
            }
            
            // Inicializar Apple Sign In
            AppleID.auth.init({
                clientId: INIA_CONFIG.appleClientId,
                scope: 'name email',
                redirectURI: window.location.origin + '/auth/apple/callback',
                state: 'random_state_string',
                usePopup: true
            });
            
            const data = await AppleID.auth.signIn();
            
            // Enviar a backend INIA
            const result = await fetch(`${INIA_CONFIG.baseUrl}/oidc/social-login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: 'apple',
                    name: data.user ? `${data.user.name.firstName} ${data.user.name.lastName}` : null,
                    email: data.user ? data.user.email : null,
                    user: data.user ? data.user.email : data.user,
                    token: data.user // ID único de Apple
                })
            });
            
            const response = await result.json();
            
            if (response.error) {
                showError(
                    `Error del backend: ${response.error}`, 
                    handleAppleLogin,
                    `Backend INIA retornó error. Status: ${result.status}`
                );
                return;
            }
            
            // Manejar éxito (sin mensaje)
            handleLoginSuccess({
                tokens: response.tokens,
                user_id: response.user?.id || null,
                name: response.user?.name || (data.user ? `${data.user.name.firstName} ${data.user.name.lastName}` : null),
                email: response.user?.email || (data.user ? data.user.email : null),
                username: response.user?.username || null
            });
            
        } catch (error) {
            console.error('Error en Apple Sign In:', error);
            showError(
                `Error al procesar Apple Sign In: ${error.message}`, 
                handleAppleLogin,
                `Error técnico en Apple Sign In.`
            );
        } finally {
            setLoading(false);
        }
    };

    // Función para login con email
    const handleEmailLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        const retryFn = () => {
            setShowEmailLogin(true);
            setTimeout(() => {
                const form = document.querySelector('form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }, 100);
        };
        
        try {
            const result = await fetch(`${INIA_CONFIG.baseUrl}/oidc/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email_or_username: email,
                    password: password
                })
            });
            
            const data = await result.json();
            
            if (data.error) {
                showError(
                    `Error del backend: ${data.error}`, 
                    retryFn,
                    `Backend INIA retornó error en login. Status: ${result.status}`
                );
                return;
            }
            
            // Manejar éxito (sin mensaje)
            handleLoginSuccess({
                tokens: data.tokens,
                user_id: data.user?.id || null,
                name: data.user?.name || null,
                email: data.user?.email || email,
                username: data.user?.username || null
            });
            setShowEmailLogin(false);
            
        } catch (error) {
            console.error('Error en login:', error);
            showError(
                `Error de conexión: ${error.message}`, 
                retryFn,
                `Error técnico en login con email.`
            );
        } finally {
            setLoading(false);
        }
    };

    // Función para registro
    const handleRegister = async (event) => {
        event.preventDefault();
        setLoading(true);
        
        const formData = new FormData(event.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const username = formData.get('username');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        const retryFn = () => {
            setShowRegister(true);
            setTimeout(() => {
                const form = document.querySelector('form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }, 100);
        };
        
        // Validaciones
        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden', retryFn);
            setLoading(false);
            return;
        }
        
        if (password.length < 6) {
            showError('Contraseña muy corta (mínimo 6 caracteres)', retryFn);
            setLoading(false);
            return;
        }
        
        if (!username || username.length < 3) {
            showError('Username muy corto (mínimo 3 caracteres)', retryFn);
            setLoading(false);
            return;
        }
        
        // Validar que el username solo contenga letras, números y guiones bajos
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            showError('Username contiene caracteres inválidos (solo letras, números y _)', retryFn);
            setLoading(false);
            return;
        }
        
        try {
            const result = await fetch(`${INIA_CONFIG.baseUrl}/oidc/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    username: username,
                    password: password
                })
            });
            
            const data = await result.json();
            
            if (data.error) {
                showError(
                    `Error del backend: ${data.error}`, 
                    retryFn,
                    `Backend INIA retornó error en registro. Status: ${result.status}`
                );
                return;
            }
            
            // Manejar éxito (sin mensaje)
            handleLoginSuccess({
                tokens: data.tokens,
                user_id: data.user?.id || null,
                name: data.user?.name || name,
                email: data.user?.email || email,
                username: data.user?.username || username
            });
            setShowRegister(false);
            
        } catch (error) {
            console.error('Error en registro:', error);
            showError(
                `Error de conexión: ${error.message}`, 
                retryFn,
                `Error técnico en registro de usuario.`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>🌾 INIA SSO</h1>
                <p className="subtitle">Iniciar Sesión</p>
                
                {returnUrl && (
                    <div className="return-url-info">
                        <p>Serás redirigido a: <strong>{returnUrl}</strong></p>
                    </div>
                )}
                
                <div className="login-buttons">
                    {/* Botón oficial de Google */}
                    <div id="google-signin-button" className="google-button-container"></div>
                    
                    {/* Botón Apple */}
                    <button 
                        className="login-btn apple-btn" 
                        onClick={handleAppleLogin}
                        disabled={loading}
                    >
                        <img src="https://developer.apple.com/assets/elements/icons/sign-in-with-apple/sign-in-with-apple-black.png" alt="Apple" width="20" />
                        Continuar con Apple
                    </button>
                    
                    {/* Botón Login con Email/Username */}
                    <button 
                        className="login-btn email-btn" 
                        onClick={() => setShowEmailLogin(true)}
                        disabled={loading}
                    >
                        📧 Login con Email/Username
                    </button>
                    
                    {/* Botón Registrarse */}
                    <button 
                        className="login-btn register-btn" 
                        onClick={() => setShowRegister(true)}
                        disabled={loading}
                    >
                        ✏️ Registrarse
                    </button>
                </div>
                
                <p className="info-text">
                    Al hacer clic en Google/Apple, se creará tu cuenta automáticamente si no existe
                </p>
                
                {loading && (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Procesando...</p>
                    </div>
                )}
            </div>

            {/* Modal para Login con Email */}
            {showEmailLogin && (
                <div className="modal-overlay" onClick={() => setShowEmailLogin(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Login con Email/Username</h2>
                        <form onSubmit={handleEmailLogin}>
                            <input 
                                type="text" 
                                name="email" 
                                placeholder="Email o Username" 
                                required 
                                disabled={loading}
                            />
                            <input 
                                type="password" 
                                name="password" 
                                placeholder="Contraseña" 
                                required 
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                            </button>
                        </form>
                        <button 
                            className="close-btn" 
                            onClick={() => setShowEmailLogin(false)}
                            disabled={loading}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal para Registro */}
            {showRegister && (
                <div className="modal-overlay" onClick={() => setShowRegister(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Crear Cuenta</h2>
                        <form onSubmit={handleRegister}>
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="Nombre completo" 
                                required 
                                disabled={loading}
                            />
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="Email" 
                                required 
                                disabled={loading}
                            />
                            <input 
                                type="text" 
                                name="username" 
                                placeholder="Username (solo letras, números y _)" 
                                required 
                                disabled={loading}
                            />
                            <input 
                                type="password" 
                                name="password" 
                                placeholder="Contraseña (mínimo 6 caracteres)" 
                                required 
                                disabled={loading}
                            />
                            <input 
                                type="password" 
                                name="confirmPassword" 
                                placeholder="Confirmar contraseña" 
                                required 
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? 'Creando...' : 'Crear Cuenta'}
                            </button>
                        </form>
                        <button 
                            className="close-btn" 
                            onClick={() => setShowRegister(false)}
                            disabled={loading}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Error Overlay */}
            {currentError && (
                <ErrorOverlay 
                    error={currentError}
                    onClose={closeError}
                    onRetry={retryFunction}
                    errorDetails={errorContext}
                />
            )}
        </div>
    );
};

export default SSOLogin;
