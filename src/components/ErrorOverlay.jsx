import React, { useState } from 'react';
import './ErrorOverlay.css';

const ErrorOverlay = ({ error, onClose, onRetry, errorDetails = null }) => {
    const [showDetails, setShowDetails] = useState(false);

    // Función para formatear el error y extraer información técnica
    const formatError = (error) => {
        if (typeof error === 'string') {
            return {
                message: error,
                type: 'String Error',
                details: null
            };
        }
        
        if (error instanceof Error) {
            return {
                message: error.message,
                type: error.name || 'Error',
                details: error.stack
            };
        }
        
        if (typeof error === 'object' && error !== null) {
            return {
                message: error.message || error.error || JSON.stringify(error),
                type: error.type || error.name || 'Object Error',
                details: error.details || error.stack || JSON.stringify(error, null, 2)
            };
        }
        
        return {
            message: String(error),
            type: 'Unknown Error',
            details: null
        };
    };

    const formattedError = formatError(error);
    const hasDetails = formattedError.details || errorDetails;

    return (
        <div className="error-overlay">
            <div className="error-content">
                <div className="error-icon">
                    <div className="error-symbol">
                        <div className="error-circle"></div>
                        <div className="error-line-1"></div>
                        <div className="error-line-2"></div>
                    </div>
                </div>
                
                <h2 className="error-title">Error de Autenticación</h2>
                
                <div className="error-info">
                    <div className="error-type">
                        <strong>Tipo:</strong> {formattedError.type}
                    </div>
                    <div className="error-message">
                        <strong>Mensaje:</strong> {formattedError.message}
                    </div>
                    
                    {errorDetails && (
                        <div className="error-context">
                            <strong>Contexto:</strong> {errorDetails}
                        </div>
                    )}
                </div>
                
                {hasDetails && (
                    <div className="error-details-section">
                        <button 
                            className="toggle-details-btn"
                            onClick={() => setShowDetails(!showDetails)}
                        >
                            {showDetails ? 'Ocultar' : 'Mostrar'} Detalles Técnicos
                        </button>
                        
                        {showDetails && (
                            <div className="error-details">
                                <pre>{formattedError.details || errorDetails}</pre>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="error-actions">
                    {onRetry && (
                        <button 
                            className="retry-btn"
                            onClick={onRetry}
                        >
                            Intentar Nuevamente
                        </button>
                    )}
                    <button 
                        className="close-btn"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorOverlay;
