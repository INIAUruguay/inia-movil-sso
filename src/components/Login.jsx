import React, { useState, useEffect } from 'react';
import { INIA_CONFIG, saveTokens } from '../config';
import ErrorOverlay from './ErrorOverlay';
import './Login.css';

const Login = ({ onSuccess, onError }) => {
    const [showEmailLogin, setShowEmailLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentError, setCurrentError] = useState(null);
    const [retryFunction, setRetryFunction] = useState(null);
    const [errorContext, setErrorContext] = useState(null);

    // Función para mostrar error
    const showError = (error, retryFn = null, context = null) => {
        setCurrentError(error);
        setRetryFunction(() => retryFn);
        setErrorContext(context);
        if (onError) {
            onError(error, context);
        }
    };

    // Función para cerrar error
    const closeError = () => {
        setCurrentError(null);
        setRetryFunction(null);
        setErrorContext(null);
    };

    // Función para manejar éxito
    const handleSuccess = (message, userInfo) => {
        saveTokens(userInfo.tokens);
        if (onSuccess) {
            onSuccess(message, userInfo);
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

    // Función para login con Google (método tradicional)
    const handleGoogleLogin = () => {
        try {
            setLoading(true);
            
            if (typeof google === 'undefined') {
                showError(
                    'Google Sign In SDK no está disponible', 
                    handleGoogleLogin,
                    'El script de Google Sign In no se ha cargado correctamente. Verifica la conexión a internet y que el script se esté cargando desde https://accounts.google.com/gsi/client'
                );
                return;
            }

            // Verificar si el Client ID está configurado
            if (!INIA_CONFIG.googleClientId || INIA_CONFIG.googleClientId === 'TU_GOOGLE_CLIENT_ID') {
                showError(
                    'Google Client ID no configurado', 
                    handleGoogleLogin,
                    'El Google Client ID no está configurado en config.js. Necesitas obtener un Client ID de Google Cloud Console y configurarlo para localhost:5173'
                );
                return;
            }

            // Inicializar Google Sign In con configuración tradicional
            google.accounts.id.initialize({
                client_id: INIA_CONFIG.googleClientId,
                callback: handleGoogleCallback,
                auto_select: false,
                cancel_on_tap_outside: true,
                use_fedcm_for_prompt: false,
                itp_support: false,
                context: 'signin'
            });

            // Usar renderButton en lugar de prompt
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
                    width: '100%'
                });
            }

        } catch (error) {
            console.error('Error en Google Sign In:', error);
            showError(
                'Error en Google Sign In',
                handleGoogleLogin,
                `Error técnico: ${error.message}. Client ID: ${INIA_CONFIG.googleClientId}`
            );
        } finally {
            setLoading(false);
        }
    };



    // Callback de Google Sign In
    const handleGoogleCallback = async (response) => {
        try {
            setLoading(true);
            
            // Decodificar la respuesta de Google
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
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
            
            const data = await result.json();
            
            if (data.error) {
                showError(
                    `Error del backend: ${data.error}`, 
                    handleGoogleLogin,
                    `Backend INIA retornó error. Status: ${result.status}, URL: ${INIA_CONFIG.baseUrl}/oidc/social-login/, Payload enviado: ${JSON.stringify({
                        provider: 'google',
                        name: payload.name,
                        email: payload.email,
                        user: payload.email,
                        token: payload.sub
                    }, null, 2)}`
                );
                return;
            }
            
            // Mostrar mensaje según la acción
            const message = data.action === 'register' 
                ? '¡Bienvenido! Tu cuenta ha sido creada exitosamente' 
                : '¡Bienvenido de vuelta!';
            
            // Manejar éxito
            handleSuccess(message, {
                tokens: data.tokens,
                name: payload.name,
                email: payload.email
            });
            
        } catch (error) {
            console.error('Error en callback de Google:', error);
            showError(
                `Error al procesar respuesta de Google: ${error.message}`, 
                handleGoogleLogin,
                `Error técnico en el procesamiento del callback de Google. Tipo: ${error.name}, Stack trace disponible en consola.`
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
                    'El script de Apple Sign In no se ha cargado correctamente. Verifica la conexión a internet y que el script se esté cargando desde https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
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
                    `Backend INIA retornó error. Status: ${result.status}, URL: ${INIA_CONFIG.baseUrl}/oidc/social-login/, Payload enviado: ${JSON.stringify({
                        provider: 'apple',
                        name: data.user ? `${data.user.name.firstName} ${data.user.name.lastName}` : null,
                        email: data.user ? data.user.email : null,
                        user: data.user ? data.user.email : data.user,
                        token: data.user
                    }, null, 2)}`
                );
                return;
            }
            
            // Mostrar mensaje según la acción
            const message = response.action === 'register' 
                ? '¡Bienvenido! Tu cuenta ha sido creada exitosamente' 
                : '¡Bienvenido de vuelta!';
            
            // Manejar éxito
            handleSuccess(message, {
                tokens: response.tokens,
                name: data.user ? `${data.user.name.firstName} ${data.user.name.lastName}` : null,
                email: data.user ? data.user.email : null
            });
            
        } catch (error) {
            console.error('Error en Apple Sign In:', error);
            showError(
                `Error al procesar Apple Sign In: ${error.message}`, 
                handleAppleLogin,
                `Error técnico en Apple Sign In. Client ID: ${INIA_CONFIG.appleClientId}, Tipo: ${error.name}, Stack trace disponible en consola.`
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
            // Re-enviar el formulario
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
                    `Backend INIA retornó error en login. Status: ${result.status}, URL: ${INIA_CONFIG.baseUrl}/oidc/login/, Credenciales enviadas: email=${email}, password=***`
                );
                return;
            }
            
            // Manejar éxito
            handleSuccess('¡Bienvenido de vuelta!', {
                tokens: data.tokens,
                email: email
            });
            setShowEmailLogin(false);
            
        } catch (error) {
            console.error('Error en login:', error);
            showError(
                `Error de conexión: ${error.message}`, 
                retryFn,
                `Error técnico en login con email. URL: ${INIA_CONFIG.baseUrl}/oidc/login/, Tipo: ${error.name}, Stack trace disponible en consola.`
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
            // Re-enviar el formulario
            setTimeout(() => {
                const form = document.querySelector('form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }, 100);
        };
        
        // Validaciones
        if (password !== confirmPassword) {
            showError(
                'Validación fallida: Las contraseñas no coinciden', 
                retryFn,
                `Validación de contraseñas falló. Password: ${password.length} caracteres, ConfirmPassword: ${confirmPassword.length} caracteres`
            );
            setLoading(false);
            return;
        }
        
        if (password.length < 6) {
            showError(
                'Validación fallida: Contraseña muy corta', 
                retryFn,
                `Validación de longitud de contraseña falló. Longitud actual: ${password.length} caracteres, mínimo requerido: 6`
            );
            setLoading(false);
            return;
        }
        
        if (!username || username.length < 3) {
            showError(
                'Validación fallida: Username muy corto', 
                retryFn,
                `Validación de longitud de username falló. Longitud actual: ${username ? username.length : 0} caracteres, mínimo requerido: 3`
            );
            setLoading(false);
            return;
        }
        
        // Validar que el username solo contenga letras, números y guiones bajos
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            showError(
                'Validación fallida: Username contiene caracteres inválidos', 
                retryFn,
                `Validación de formato de username falló. Username: "${username}", regex aplicado: /^[a-zA-Z0-9_]+$/, caracteres permitidos: letras, números y guiones bajos`
            );
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
                    `Backend INIA retornó error en registro. Status: ${result.status}, URL: ${INIA_CONFIG.baseUrl}/oidc/register/, Datos enviados: name="${name}", email="${email}", username="${username}", password=***`
                );
                return;
            }
            
            // Manejar éxito
            handleSuccess('¡Bienvenido! Tu cuenta ha sido creada exitosamente', {
                tokens: data.tokens,
                name: name,
                email: email,
                username: username
            });
            setShowRegister(false);
            
        } catch (error) {
            console.error('Error en registro:', error);
            showError(
                `Error de conexión: ${error.message}`, 
                retryFn,
                `Error técnico en registro de usuario. URL: ${INIA_CONFIG.baseUrl}/oidc/register/, Tipo: ${error.name}, Stack trace disponible en consola.`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>🌾 Acceder a INIA</h1>
                <p className="subtitle">Miniapp de Prueba</p>
                
                <div className="login-buttons">
                    {/* Botón Google */}
                    <button 
                        className="login-btn google-btn" 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" />
                        Continuar con Google
                    </button>
                    
                    {/* Div para Google Sign In Button */}
                    <div id="google-signin-button" style={{ display: 'none' }}></div>
                    
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

export default Login;
