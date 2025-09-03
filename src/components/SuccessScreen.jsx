import React, { useEffect } from 'react';
import { redirectAfterLogin } from '../config';
import './SuccessScreen.css';

const SuccessScreen = ({ message, userInfo, onContinue }) => {
    useEffect(() => {
        // Auto-redirigir después de 3 segundos
        const timer = setTimeout(() => {
            if (onContinue) {
                onContinue();
            } else {
                redirectAfterLogin();
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [onContinue]);

    return (
        <div className="success-screen">
            <div className="success-content">
                <div className="success-icon">
                    <div className="checkmark">
                        <div className="checkmark-circle"></div>
                        <div className="checkmark-stem"></div>
                        <div className="checkmark-kick"></div>
                    </div>
                </div>
                
                <h1 className="success-title">¡Éxito!</h1>
                <p className="success-message">{message}</p>
                
                {userInfo && (
                    <div className="user-welcome">
                        <p className="welcome-text">Bienvenido, <strong>{userInfo.name || userInfo.email}</strong></p>
                    </div>
                )}
                
                <div className="success-actions">
                    <button 
                        className="continue-btn"
                        onClick={() => {
                            if (onContinue) {
                                onContinue();
                            } else {
                                redirectAfterLogin();
                            }
                        }}
                    >
                        Continuar al Dashboard
                    </button>
                </div>
                
                <p className="auto-redirect">
                    Serás redirigido automáticamente en unos segundos...
                </p>
            </div>
        </div>
    );
};

export default SuccessScreen;
