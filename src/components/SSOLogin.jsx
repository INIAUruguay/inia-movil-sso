import React, { useState, useEffect, useRef } from 'react';
import { INIA_CONFIG, saveTokens } from '../config';
import ErrorOverlay from './ErrorOverlay';
import EmailConfirmation from './EmailConfirmation';
import './Login.css';

const SSOLogin = () => {
    const [showEmailLogin, setShowEmailLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
    const [pendingUserData, setPendingUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [googleError, setGoogleError] = useState('');
    const [appleError, setAppleError] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [currentError, setCurrentError] = useState(null);
    const [retryFunction, setRetryFunction] = useState(null);
    const [errorContext, setErrorContext] = useState(null);
    const [returnUrl, setReturnUrl] = useState(null);
    const googleButtonInitialized = useRef(false);

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

    // Efecto para inicializar Google cuando el componente esté montado
    useEffect(() => {
        // Pequeño delay para asegurar que el DOM esté listo
        const timer = setTimeout(() => {
            console.log('🔍 DEBUG - Verificando Google SDK:', typeof google !== 'undefined');
            console.log('🔍 DEBUG - Google button initialized:', googleButtonInitialized.current);
            if (typeof google !== 'undefined' && !googleButtonInitialized.current) {
                console.log('🔍 DEBUG - Inicializando Google Sign In...');
                initializeGoogleSignIn();
            }
        }, 100);

        return () => clearTimeout(timer);
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

    // Función para mostrar errores específicos
    const showLoginError = (message) => {
        setLoginError(message);
        setTimeout(() => setLoginError(''), 5000);
    };

    const showGoogleError = (message) => {
        setGoogleError(message);
        setTimeout(() => setGoogleError(''), 5000);
    };

    const showAppleError = (message) => {
        setAppleError(message);
        setTimeout(() => setAppleError(''), 5000);
    };

    const showRegisterError = (message) => {
        setRegisterError(message);
        setTimeout(() => setRegisterError(''), 5000);
    };

    // Función para manejar éxito de confirmación de email
    const handleEmailConfirmationSuccess = (userInfo) => {
        handleLoginSuccess(userInfo);
        setShowEmailConfirmation(false);
        setPendingUserData(null);
    };

    // Función para volver del formulario de confirmación
    const handleBackFromConfirmation = () => {
        setShowEmailConfirmation(false);
        setPendingUserData(null);
        setShowRegister(true);
    };

    // Función para manejar éxito del login
    const handleLoginSuccess = (userInfo) => {
        // Guardar tokens
        saveTokens(userInfo.tokens);
        
        // Obtener return_url directamente de la URL actual (más confiable que el estado)
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrlParam = urlParams.get('return_url');
        const currentReturnUrl = returnUrlParam ? decodeURIComponent(returnUrlParam) : null;
        
        console.log('🔍 DEBUG - returnUrl (estado):', returnUrl);
        console.log('🔍 DEBUG - returnUrl (URL directa):', currentReturnUrl);
        console.log('🔍 DEBUG - userInfo:', userInfo);
        
        // Redirigir al return_url con los tokens y info del usuario (sin popup)
        if (currentReturnUrl) {
            console.log('✅ Redirigiendo a return_url:', currentReturnUrl);
            
            // Crear URL con los tokens y info del usuario como parámetros
            const url = new URL(currentReturnUrl);
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

            // Solo inicializar si no se ha hecho antes
            if (googleButtonInitialized.current) {
                console.log('Google Sign In ya inicializado, saltando...');
                return;
            }

            // Inicializar Google Sign In
            const config = {
                client_id: INIA_CONFIG.googleClientId,
                callback: handleGoogleCallback,
                auto_select: false,
                cancel_on_tap_outside: true,
                use_fedcm_for_prompt: false,
                itp_support: false,
                context: 'signin'
            };

            // Usar popup por defecto para evitar problemas de redirect_uri
            // En producción, puedes cambiar a 'redirect' si tienes las URIs configuradas
            config.ux_mode = 'popup';
            
            google.accounts.id.initialize(config);

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
                    width: '100%',
                    type: 'standard'
                });
                
                googleButtonInitialized.current = true;
                console.log('Botón de Google inicializado');
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
                showGoogleError(`Error: ${data.error}`);
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
            showGoogleError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Función para login con Apple
    const handleAppleLogin = async () => {
        try {
            setLoading(true);
            
            if (typeof AppleID === 'undefined') {
                showAppleError('Apple Sign In SDK no está disponible');
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
                showAppleError(`Error: ${response.error}`);
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
            showAppleError(`Error: ${error.message}`);
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
                showLoginError(`Error: ${data.error}`);
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
            showLoginError(`Error de conexión: ${error.message}`);
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
            showRegisterError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }
        
        if (password.length < 6) {
            showRegisterError('Contraseña muy corta (mínimo 6 caracteres)');
            setLoading(false);
            return;
        }
        
        if (!username || username.length < 3) {
            showRegisterError('Username muy corto (mínimo 3 caracteres)');
            setLoading(false);
            return;
        }
        
        // Validar que el username solo contenga letras, números y guiones bajos
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            showRegisterError('Username contiene caracteres inválidos (solo letras, números y _)');
            setLoading(false);
            return;
        }
        
        if (!acceptTerms) {
            showRegisterError('Debes aceptar los términos y condiciones');
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
                showRegisterError(`Error: ${data.error}`);
                return;
            }
            
            // Verificar si se requiere confirmación de email
            if (data.action === 'email_confirmation_required') {
                setPendingUserData({
                    user_id: data.user_id,
                    email: data.email
                });
                setShowEmailConfirmation(true);
                setShowRegister(false);
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
            showRegisterError(`Error de conexión: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Si se está mostrando la confirmación de email
    if (showEmailConfirmation && pendingUserData) {
        return (
            <EmailConfirmation
                userData={pendingUserData}
                onSuccess={handleEmailConfirmationSuccess}
                onBack={handleBackFromConfirmation}
            />
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Botón de retorno para registro */}
                {showRegister && (
                    <button 
                        className="back-btn" 
                        onClick={() => setShowRegister(false)}
                        disabled={loading}
                        tabIndex={-1}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                    </button>
                )}
                
                {/* Logo INIA */}
                <div className="logo-container">
                    <img src="/inia-logo.png" alt="INIA" className="inia-logo" />
                </div>
                
                {!showRegister ? (
                    <>
                        {/* Formulario de Login Principal */}
                        <form onSubmit={handleEmailLogin} className="main-login-form">
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="email" 
                                    placeholder="Email o Username" 
                                    required 
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group password-group">
                                <input 
                                    type={showPasswords ? "text" : "password"} 
                                    name="password" 
                                    placeholder="Contraseña" 
                                    required 
                                    disabled={loading}
                                    className="form-input"
                                />
                                <button 
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    disabled={loading}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        {showPasswords ? (
                                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                        ) : (
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        )}
                                    </svg>
                                </button>
                            </div>
                            <button type="submit" className="login-submit-btn" disabled={loading}>
                                {loading ? (
                                    <>
                                        Iniciando...
                                        <div className="button-spinner"></div>
                                    </>
                                ) : 'Iniciar Sesión'}
                            </button>
                        </form>
                        
                        {/* Error de login */}
                        {loginError && (
                            <div className="error-message">
                                {loginError}
                            </div>
                        )}
                        
                        {/* Botones Sociales */}
                        <div className="social-login-section">
                            {/* Botón oficial de Google */}
                            <div id="google-signin-button" className={`google-button-container ${loading ? 'disabled' : ''}`}></div>
                            
                            {/* Error de Google */}
                            {googleError && (
                                <div className="error-message">
                                    {googleError}
                                </div>
                            )}
                            
                            {/* Botón Apple */}
                            <button 
                                className="social-btn apple-btn" 
                                onClick={handleAppleLogin}
                                disabled={loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                                Iniciar sesión con Apple
                            </button>
                            
                            {/* Error de Apple */}
                            {appleError && (
                                <div className="error-message">
                                    {appleError}
                                </div>
                            )}
                        </div>
                        
                        {/* Botón Registro */}
                        <div className="register-section">
                            <button 
                                className="register-btn" 
                                onClick={() => setShowRegister(true)}
                                disabled={loading}
                            >
                                ¿No tienes cuenta? Regístrate
                            </button>
                        </div>
                    </>
                ) : (
                    /* Formulario de Registro */
                    <form onSubmit={handleRegister} className="main-login-form">
                        <div className="form-group">
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="Nombre completo" 
                                required 
                                disabled={loading}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="Email" 
                                required 
                                disabled={loading}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <input 
                                type="text" 
                                name="username" 
                                placeholder="Username" 
                                required 
                                disabled={loading}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group password-group">
                            <input 
                                type={showPasswords ? "text" : "password"} 
                                name="password" 
                                placeholder="Contraseña" 
                                required 
                                disabled={loading}
                                className="form-input"
                            />
                            <button 
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPasswords(!showPasswords)}
                                disabled={loading}
                                tabIndex={-1}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    {showPasswords ? (
                                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                    ) : (
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    )}
                                </svg>
                            </button>
                        </div>
                        <div className="form-group password-group">
                            <input 
                                type={showPasswords ? "text" : "password"} 
                                name="confirmPassword" 
                                placeholder="Confirmar contraseña" 
                                required 
                                disabled={loading}
                                className="form-input"
                            />
                            <button 
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPasswords(!showPasswords)}
                                disabled={loading}
                                tabIndex={-1}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    {showPasswords ? (
                                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                    ) : (
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    )}
                                </svg>
                            </button>
                        </div>
                        {/* Checkbox de términos y condiciones */}
                        <div className="terms-checkbox">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    disabled={loading}
                                    className="checkbox-input"
                                />
                                <span className="checkbox-text">
                                    Acepto los{' '}
                                    <a 
                                        href="https://inia-app-web-test.vercel.app/terms-of-service" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="terms-link"
                                    >
                                        términos y condiciones
                                    </a>
                                </span>
                            </label>
                        </div>
                        
                        {/* Error de registro */}
                        {registerError && (
                            <div className="error-message">
                                {registerError}
                            </div>
                        )}
                        
                        <button type="submit" className="login-submit-btn" disabled={loading || !acceptTerms}>
                            {loading ? (
                                <>
                                    Registrando...
                                    <div className="button-spinner"></div>
                                </>
                            ) : 'Crear Cuenta'}
                        </button>
                    </form>
                )}
                
            </div>



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
