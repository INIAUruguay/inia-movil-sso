# INIA SSO - Servicio de Autenticación

Este es el servicio de Single Sign-On (SSO) de INIA, que permite a las aplicaciones externas autenticar usuarios de forma centralizada.

## 🚀 Características

- **Flujo OIDC Estándar**: Implementación completa de OpenID Connect
- **Refresh Tokens**: Renovación automática de tokens de acceso
- **Login con Google**: Integración con Google Sign-In
- **Login con Apple**: Integración con Apple Sign-In  
- **Login tradicional**: Email/Username y contraseña
- **Registro de usuarios**: Creación de nuevas cuentas
- **Redirección automática**: Retorna tokens a la aplicación origen
- **Seguridad mejorada**: Validación de state, scopes granulares

## 🔧 Configuración

### Variables de entorno

El proyecto está configurado para usar el backend de producción:
- **Backend URL**: `https://repositorioapptest.inia.uy/api`

### Google Sign-In

Para habilitar Google Sign-In, necesitas:
1. Crear un proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Google Sign-In API
3. Crear credenciales OAuth 2.0
4. Actualizar `googleClientId` en `src/config.js`

### Apple Sign-In

Para habilitar Apple Sign-In, necesitas:
1. Configurar Apple Sign-In en [Apple Developer](https://developer.apple.com/)
2. Actualizar `appleClientId` en `src/config.js`

## 📱 Uso

### Flujo SSO Tradicional (Recomendado para miniapps)

Las aplicaciones pueden redirigir usuarios al SSO usando:

```
https://inia-movil-sso.vercel.app/?return_url=https://tu-app.com/auth/callback
```

### Flujo OIDC Estándar (Para aplicaciones avanzadas)

Para usar el flujo OIDC estándar:

```
https://inia-movil-sso.vercel.app/?oidc=true&return_url=https://tu-app.com/auth/callback
```

### Parámetros

- `return_url`: URL donde se redirigirá al usuario después del login exitoso
- `oidc`: Si es `true`, usa el flujo OIDC estándar

### Respuesta

Después del login exitoso, el usuario será redirigido a `return_url` con los siguientes parámetros:

- `access_token`: Token de acceso JWT
- `id_token`: Token de identidad JWT
- `refresh_token`: Token de renovación (solo en flujo OIDC)
- `token_type`: Tipo de token (Bearer)
- `expires_in`: Tiempo de expiración en segundos
- `scope`: Scopes del token
- `user_id`: ID único del usuario
- `name`: Nombre del usuario
- `email`: Email del usuario
- `username`: Username del usuario

## 🔄 Refresh Tokens

### Para Desarrolladores de Miniapps

Los refresh tokens permiten renovar automáticamente los access tokens sin que el usuario tenga que volver a loguearse:

```javascript
// Verificar si el token está próximo a expirar
if (isTokenExpiringSoon()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
        // Usar el nuevo token
        console.log('Token renovado:', newToken);
    } else {
        // Redirigir a login
        window.location.href = 'https://inia-movil-sso.vercel.app/';
    }
}

// Hacer requests autenticados con renovación automática
const response = await makeAuthenticatedRequest('/api/protected-endpoint', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
});
```

### Configuración Automática

El sistema configura automáticamente la renovación de tokens cada 5 minutos. No es necesario hacer nada adicional.

## 🛠️ Desarrollo

### Instalación

```bash
npm install
```

### Desarrollo local

```bash
npm run dev
```

### Build para producción

```bash
npm run build
```

### Preview del build

```bash
npm run preview
```

## 🔒 Seguridad

- **Tokens JWT seguros** con tiempo de expiración
- **Refresh tokens** para renovación automática
- **Validación de state** para prevenir ataques CSRF
- **Scopes granulares** para control de permisos
- **Validación de autenticidad** de tokens de Google/Apple
- **Renovación automática** de tokens próximos a expirar

## 📋 Endpoints del Backend

El SSO se comunica con los siguientes endpoints:

### Flujo SSO Tradicional
- `POST /api/oidc/social-login/` - Login con Google/Apple
- `POST /api/oidc/login/` - Login tradicional
- `POST /api/oidc/register/` - Registro de usuarios

### Flujo OIDC Estándar
- `GET /api/oidc/authorize/` - Iniciar flujo de autorización
- `POST /api/oidc/token/` - Intercambiar código por tokens
- `POST /api/oidc/refresh/` - Renovar access token
- `GET /api/oidc/userinfo/` - Obtener información del usuario
- `POST /api/oidc/social-login/` - Login con Google/Apple (compatible)

## 🚀 Despliegue

1. Build del proyecto: `npm run build`
2. Subir archivos de `dist/` al servidor
3. Configurar servidor web (nginx/apache) para servir archivos estáticos
4. Configurar HTTPS (requerido para Google/Apple Sign-In)

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo de INIA.
