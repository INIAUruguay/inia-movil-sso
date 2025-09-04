# INIA SSO - Servicio de Autenticación

Este es el servicio de Single Sign-On (SSO) de INIA, que permite a las aplicaciones externas autenticar usuarios de forma centralizada.

## 🚀 Características

- **Login con Google**: Integración con Google Sign-In
- **Login con Apple**: Integración con Apple Sign-In  
- **Login tradicional**: Email/Username y contraseña
- **Registro de usuarios**: Creación de nuevas cuentas
- **Redirección automática**: Retorna tokens a la aplicación origen

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

### Para aplicaciones externas

Las aplicaciones pueden redirigir usuarios al SSO usando:

```
https://tu-servidor-sso.com/?return_url=https://tu-app.com/auth/callback
```

### Parámetros

- `return_url`: URL donde se redirigirá al usuario después del login exitoso

### Respuesta

Después del login exitoso, el usuario será redirigido a `return_url` con los siguientes parámetros:

- `access_token`: Token de acceso JWT
- `id_token`: Token de identidad JWT
- `token_type`: Tipo de token (Bearer)
- `expires_in`: Tiempo de expiración en segundos
- `scope`: Scopes del token

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

- Los tokens JWT tienen tiempo de expiración
- Se valida la autenticidad de los tokens de Google/Apple
- Los tokens se envían por URL (considerar usar POST en el futuro)

## 📋 Endpoints del Backend

El SSO se comunica con los siguientes endpoints:

- `POST /api/oidc/social-login/` - Login con Google/Apple
- `POST /api/oidc/login/` - Login tradicional
- `POST /api/oidc/register/` - Registro de usuarios

## 🚀 Despliegue

1. Build del proyecto: `npm run build`
2. Subir archivos de `dist/` al servidor
3. Configurar servidor web (nginx/apache) para servir archivos estáticos
4. Configurar HTTPS (requerido para Google/Apple Sign-In)

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo de INIA.
