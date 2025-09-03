import React, { useState, useEffect } from 'react';
import { INIA_CONFIG, getTokens, clearTokens, showMessage } from '../config';
import './Dashboard.css';

const Dashboard = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tokens, setTokens] = useState(null);

    useEffect(() => {
        // Verificar si hay tokens válidos
        const userTokens = getTokens();
        if (!userTokens) {
            showMessage('No estás autenticado. Redirigiendo al login...', 'warning');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        setTokens(userTokens);
        fetchUserInfo(userTokens);
    }, []);

    const fetchUserInfo = async (userTokens) => {
        try {
            setLoading(true);
            
            // Obtener información del usuario desde el endpoint OIDC
            const response = await fetch(`${INIA_CONFIG.baseUrl}/oidc/userinfo/`, {
                headers: {
                    'Authorization': `Bearer ${userTokens.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener información del usuario');
            }

            const data = await response.json();
            setUserInfo(data);
            
        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
            showMessage('Error al cargar información del usuario', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearTokens();
        showMessage('Sesión cerrada exitosamente', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    };

    const decodeJWT = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error al decodificar JWT:', error);
            return null;
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Cargando información del usuario...</p>
                </div>
            </div>
        );
    }

    const idTokenPayload = tokens ? decodeJWT(tokens.id_token) : null;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>🌾 Dashboard - Miniapp INIA</h1>
                <button className="logout-btn" onClick={handleLogout}>
                    Cerrar Sesión
                </button>
            </div>

            <div className="dashboard-content">
                <div className="user-info-card">
                    <h2>👤 Información del Usuario</h2>
                    {userInfo ? (
                        <div className="user-details">
                            <div className="user-field">
                                <strong>Nombre:</strong> {userInfo.name || 'No disponible'}
                            </div>
                            <div className="user-field">
                                <strong>Email:</strong> {userInfo.email || 'No disponible'}
                            </div>
                            <div className="user-field">
                                <strong>Username:</strong> {userInfo.username || 'No disponible'}
                            </div>
                        </div>
                    ) : (
                        <p>No se pudo cargar la información del usuario</p>
                    )}
                </div>

                <div className="tokens-card">
                    <h2>🔑 Información de Tokens</h2>
                    <div className="token-details">
                        <div className="token-field">
                            <strong>Token Type:</strong> {tokens?.token_type || 'No disponible'}
                        </div>
                        <div className="token-field">
                            <strong>Access Token:</strong> 
                            <div className="token-value">
                                {tokens?.access_token ? `${tokens.access_token.substring(0, 50)}...` : 'No disponible'}
                            </div>
                        </div>
                        <div className="token-field">
                            <strong>ID Token:</strong>
                            <div className="token-value">
                                {tokens?.id_token ? `${tokens.id_token.substring(0, 50)}...` : 'No disponible'}
                            </div>
                        </div>
                    </div>
                </div>

                {idTokenPayload && (
                    <div className="jwt-card">
                        <h2>📋 Payload del ID Token (JWT)</h2>
                        <div className="jwt-details">
                            <div className="jwt-field">
                                <strong>Issuer (iss):</strong> {idTokenPayload.iss || 'No disponible'}
                            </div>
                            <div className="jwt-field">
                                <strong>Subject (sub):</strong> {idTokenPayload.sub || 'No disponible'}
                            </div>
                            <div className="jwt-field">
                                <strong>Audience (aud):</strong> {idTokenPayload.aud || 'No disponible'}
                            </div>
                            <div className="jwt-field">
                                <strong>Expires (exp):</strong> {idTokenPayload.exp ? new Date(idTokenPayload.exp * 1000).toLocaleString() : 'No disponible'}
                            </div>
                            <div className="jwt-field">
                                <strong>Issued At (iat):</strong> {idTokenPayload.iat ? new Date(idTokenPayload.iat * 1000).toLocaleString() : 'No disponible'}
                            </div>
                            <div className="jwt-field">
                                <strong>Nonce:</strong> {idTokenPayload.nonce || 'No disponible'}
                            </div>
                        </div>
                    </div>
                )}

                <div className="test-actions-card">
                    <h2>🧪 Acciones de Prueba</h2>
                    <div className="test-buttons">
                        <button 
                            className="test-btn"
                            onClick={() => fetchUserInfo(tokens)}
                        >
                            🔄 Refrescar Info Usuario
                        </button>
                        <button 
                            className="test-btn"
                            onClick={() => {
                                const payload = decodeJWT(tokens.id_token);
                                console.log('ID Token Payload:', payload);
                                showMessage('Payload del ID Token mostrado en consola', 'info');
                            }}
                        >
                            📝 Ver Payload Completo (Consola)
                        </button>
                        <button 
                            className="test-btn"
                            onClick={() => {
                                navigator.clipboard.writeText(tokens.access_token);
                                showMessage('Access Token copiado al portapapeles', 'success');
                            }}
                        >
                            📋 Copiar Access Token
                        </button>
                    </div>
                </div>

                <div className="info-card">
                    <h2>ℹ️ Información de la Miniapp</h2>
                    <div className="info-details">
                        <div className="info-field">
                            <strong>Backend URL:</strong> {INIA_CONFIG.baseUrl}
                        </div>
                        <div className="info-field">
                            <strong>Client ID:</strong> {INIA_CONFIG.clientId}
                        </div>
                        <div className="info-field">
                            <strong>Scopes:</strong> {INIA_CONFIG.scope}
                        </div>
                        <div className="info-field">
                            <strong>Redirect URI:</strong> {INIA_CONFIG.redirectUri}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

