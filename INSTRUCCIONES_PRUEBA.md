# 🧪 Instrucciones de Prueba - Miniapp INIA

## 🚀 Pasos para Probar la Integración

### 1. Preparar el Backend
```bash
# En el directorio del backend
cd C:\inia_material\iniaApp\inia-app-backend

# Activar entorno virtual
myenv\bin\activate

# Ejecutar migraciones (si es necesario)
myenv\bin\python manage.py makemigrations
myenv\bin\python manage.py migrate

# Iniciar servidor Django
myenv\bin\python manage.py runserver 0.0.0.0:8000
```

### 2. Preparar la Miniapp
```bash
# En el directorio de la miniapp
cd C:\inia_material\iniaApp\inia-app-miniapp-web-test

# Instalar dependencias (si es necesario)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Configurar Cliente OIDC en Django Admin

1. **Ir a Django Admin:**
   ```
   http://localhost:8000/admin/
   ```

2. **Crear Cliente OIDC:**
   - Ir a "OIDC Provider" > "Clients"
   - Clic en "Add Client"
   - Configurar:
     - **Name**: `Miniapp Test Client`
     - **Client Type**: `confidential`
     - **Response Type**: `code`
     - **Redirect URIs**: `http://localhost:5173/auth/callback`
     - **Scope**: `openid profile email`
     - **Owner**: Seleccionar un usuario admin

3. **Guardar y copiar credenciales:**
   - **Client ID**: Copiar para usar en pruebas
   - **Client Secret**: Copiar para usar en pruebas

## 🧪 Flujos de Prueba

### Prueba 1: Registro Tradicional
1. **Abrir miniapp:** `http://localhost:5173`
2. **Clic en "Registrarse"**
3. **Completar formulario:**
   - Nombre: `Usuario Prueba`
   - Email: `prueba@test.com`
   - Username: `usuarioprueba`
   - Contraseña: `123456`
   - Confirmar contraseña: `123456`
4. **Clic en "Crear Cuenta"**
5. **Verificar:** Debe redirigir al dashboard y mostrar información del usuario

### Prueba 2: Login Tradicional (con Email)
1. **Cerrar sesión** (botón "Cerrar Sesión")
2. **Clic en "Login con Email/Username"**
3. **Ingresar credenciales:**
   - Email/Username: `prueba@test.com`
   - Contraseña: `123456`
4. **Clic en "Iniciar Sesión"**
5. **Verificar:** Debe redirigir al dashboard

### Prueba 2b: Login Tradicional (con Username)
1. **Cerrar sesión** (botón "Cerrar Sesión")
2. **Clic en "Login con Email/Username"**
3. **Ingresar credenciales:**
   - Email/Username: `usuarioprueba`
   - Contraseña: `123456`
4. **Clic en "Iniciar Sesión"**
5. **Verificar:** Debe redirigir al dashboard

### Prueba 3: Login con Google (Simulado)
1. **Clic en "Continuar con Google"**
2. **Nota:** Como no tenemos Google Client ID configurado, verás un error
3. **Para probar Google:** Configurar `googleClientId` en `src/config.js`

### Prueba 4: Login con Apple (Simulado)
1. **Clic en "Continuar con Apple"**
2. **Nota:** Como no tenemos Apple Client ID configurado, verás un error
3. **Para probar Apple:** Configurar `appleClientId` en `src/config.js`

## 🔍 Verificaciones en el Dashboard

### Información del Usuario
- ✅ Nombre: Debe mostrar el nombre del usuario
- ✅ Email: Debe mostrar el email del usuario
- ✅ Username: Debe mostrar el username generado

### Tokens OIDC
- ✅ Access Token: Debe mostrar token válido
- ✅ ID Token: Debe mostrar token válido
- ✅ Token Type: Debe mostrar "Bearer"

### Payload JWT
- ✅ Issuer (iss): Debe mostrar URL del backend
- ✅ Subject (sub): Debe mostrar ID del usuario
- ✅ Audience (aud): Debe mostrar Client ID
- ✅ Expires (exp): Debe mostrar fecha de expiración
- ✅ Issued At (iat): Debe mostrar fecha de emisión

### Acciones de Prueba
- ✅ **Refrescar Info Usuario**: Debe actualizar información
- ✅ **Ver Payload Completo**: Debe mostrar en consola del navegador
- ✅ **Copiar Access Token**: Debe copiar al portapapeles

## 🐛 Solución de Problemas

### Error: "No estás autenticado"
- **Causa:** Backend no está ejecutándose
- **Solución:** Verificar que Django esté corriendo en puerto 8000

### Error: "CORS policy"
- **Causa:** CORS no configurado correctamente
- **Solución:** Verificar que `CORS_ALLOW_ALL_ORIGINS = True` en settings.py

### Error: "Client not found"
- **Causa:** Cliente OIDC no creado en Django Admin
- **Solución:** Crear cliente OIDC con las credenciales correctas

### Error: "Google Sign In no está cargado"
- **Causa:** Google Client ID no configurado
- **Solución:** Configurar `googleClientId` en `src/config.js`

## 📊 Logs a Revisar

### Consola del Navegador (F12)
- Ver requests a endpoints OIDC
- Ver respuestas del backend
- Ver errores de JavaScript

### Terminal del Backend
- Ver requests HTTP
- Ver errores de Django
- Ver logs de autenticación

## ✅ Checklist de Pruebas

- [ ] Backend Django ejecutándose en puerto 8000
- [ ] Miniapp React ejecutándose en puerto 5173
- [ ] Cliente OIDC creado en Django Admin
- [ ] Registro tradicional funciona
- [ ] Login tradicional funciona
- [ ] Dashboard muestra información correcta
- [ ] Tokens OIDC se generan correctamente
- [ ] Payload JWT se decodifica correctamente
- [ ] Logout funciona correctamente
- [ ] CORS permite requests desde localhost:5173

## 🎯 Objetivos de la Prueba

1. **Verificar integración OIDC:** Los tokens se generan y validan correctamente
2. **Verificar transparencia:** El usuario no sabe que se crea cuenta en superapp
3. **Verificar unificación:** La misma cuenta funciona en miniapp y superapp
4. **Verificar flujos:** Todos los métodos de autenticación funcionan
5. **Verificar UI/UX:** La experiencia de usuario es fluida

---

**¡Listo para probar!** 🚀

Una vez que todo funcione, podrás usar esta miniapp como referencia para que los proveedores externos implementen la integración OIDC con INIA.
