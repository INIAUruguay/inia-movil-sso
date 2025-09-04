import React, { useState, useRef, useEffect } from 'react';
import { INIA_CONFIG, saveTokens } from '../config';
import './EmailConfirmation.css';

const EmailConfirmation = ({ userData, onSuccess, onBack }) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);

    // Auto-focus en el primer input al montar
    useEffect(() => {
        console.log('Component mounted, focusing first input');
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    // Manejar entrada de caracteres (números y letras)
    const handleInputChange = (index, value) => {
        console.log('Input change:', index, value);
        
        // Permitir números y letras (alfanumérico)
        if (!/^[a-zA-Z0-9]*$/.test(value)) {
            console.log('Not alphanumeric, ignoring');
            return;
        }

        // Convertir letras a mayúsculas
        const upperValue = value.toUpperCase();

        const newCode = [...code];
        newCode[index] = upperValue;
        setCode(newCode);
        
        console.log('New code:', newCode);

        // Limpiar error al escribir
        if (error) setError('');

        // Si se ingresó un carácter, pasar al siguiente campo
        if (upperValue && index < 5) {
            setTimeout(() => {
                inputRefs.current[index + 1]?.focus();
            }, 50);
        }
    };

    // Manejar tecla backspace
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Manejar pegado de código completo
    const handlePaste = (e) => {
        console.log('Paste event');
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        console.log('Pasted data:', pastedData);
        
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            console.log('Set code from paste:', newCode);
            
            // Enfocar el último campo
            setTimeout(() => {
                inputRefs.current[5]?.focus();
            }, 50);
        }
    };

    // Auto-confirmar cuando se complete el código
    useEffect(() => {
        const fullCode = code.join('');
        console.log('Code changed:', fullCode);
        
        if (fullCode.length === 6 && !loading && /^[a-zA-Z0-9]{6}$/.test(fullCode)) {
            console.log('Auto-confirming...');
            const timer = setTimeout(() => {
                handleSubmit();
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [code, loading]);

    // Manejar envío del código
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        console.log('Submitting code...');
        
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError('Por favor ingresa el código completo de 6 dígitos');
            return;
        }

        // Evitar múltiples envíos simultáneos
        if (loading) return;

        setLoading(true);
        setError('');

        try {
            const result = await fetch(`${INIA_CONFIG.baseUrl}/oidc/confirm-email/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userData.user_id,
                    code: fullCode
                })
            });

            const data = await result.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            if (data.action === 'email_confirmed') {
                // Guardar tokens
                saveTokens(data.tokens);
                
                // Llamar callback de éxito
                onSuccess({
                    tokens: data.tokens,
                    user_id: data.user?.id,
                    name: data.user?.name,
                    email: data.user?.email,
                    username: data.user?.username
                });
            }

        } catch (error) {
            console.error('Error confirmando email:', error);
            setError('Error de conexión. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Reenviar código
    const handleResendCode = async () => {
        setLoading(true);
        setError('');

        try {
            alert('Código reenviado. Revisa tu email.');
        } catch (error) {
            setError('Error reenviando código');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="email-confirmation-container">
            <div className="email-confirmation-card">
                {/* Botón de retorno */}
                <button 
                    className="back-btn" 
                    onClick={onBack}
                    disabled={loading}
                    tabIndex={-1}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                </button>

                {/* Logo INIA */}
                <div className="logo-container">
                    <img src="/inia-logo.png" alt="INIA" className="inia-logo" />
                </div>

                {/* Título y descripción */}
                <div className="confirmation-header">
                    <h2>Confirma tu email</h2>
                    <p>Hemos enviado un código de 6 dígitos a:</p>
                    <p className="email-address">{userData.email}</p>
                </div>

                {/* Formulario de código */}
                <form onSubmit={handleSubmit} className="code-form">
                    <div className="code-inputs">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => {
                                    inputRefs.current[index] = el;
                                    console.log('Ref set for index:', index, el);
                                }}
                                type="text"
                                inputMode="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => {
                                    console.log('onChange triggered for index:', index, e.target.value);
                                    handleInputChange(index, e.target.value);
                                }}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="code-input"
                                disabled={loading}
                                autoComplete="off"
                                style={{ 
                                    pointerEvents: 'auto',
                                    userSelect: 'text',
                                    WebkitUserSelect: 'text',
                                    textTransform: 'uppercase'
                                }}
                            />
                        ))}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {/* Botón de confirmar */}
                    <button 
                        type="submit" 
                        className="confirm-btn" 
                        disabled={loading || code.join('').length !== 6}
                    >
                        {loading ? (
                            <>
                                Confirmando...
                                <div className="button-spinner"></div>
                            </>
                        ) : code.join('').length === 6 ? 'Confirmando automáticamente...' : 'Ingresa el código'}
                    </button>
                </form>

                {/* Reenviar código */}
                <div className="resend-section">
                    <p>¿No recibiste el código?</p>
                    <button 
                        className="resend-btn" 
                        onClick={handleResendCode}
                        disabled={loading}
                    >
                        Reenviar código
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailConfirmation;