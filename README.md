# 🌾 INIA Miniapp Web - Prueba de Autenticación

Una aplicación web de prueba para probar el sistema de autenticación del backend INIA, incluyendo login con email/username, Google OAuth y Apple OAuth.

## 🚀 Características

- ✅ **Login con Email/Username**: Autenticación tradicional
- ✅ **Google OAuth**: Integración con Google Sign In
- ⏳ **Apple OAuth**: Preparado para configuración
- ✅ **Pantalla de Éxito**: Experiencia de usuario mejorada
- ✅ **Sistema de Errores**: Errores descriptivos y técnicos
- ✅ **Responsive Design**: Compatible con móviles y desktop

## 🛠️ Tecnologías

- **React 18** - Framework de frontend
- **Vite** - Build tool y dev server
- **Google OAuth 2.0** - Autenticación con Google
- **CSS3** - Estilos modernos y animaciones
- **JavaScript ES6+** - Lógica de la aplicación

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd inia-app-miniapp-web-test
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Editar `src/config.js`
   - Configurar tu Google Client ID
   - Configurar la URL del backend INIA

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## ⚙️ Configuración

### Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Identity
4. Crea un OAuth 2.0 Client ID:
   - **Tipo**: Web application
   - **Orígenes autorizados**: `http://localhost:5173`
   - **URIs de redirección**: `http://localhost:5173/auth/callback`
5. Copia el Client ID y actualiza `src/config.js`

### Backend INIA

Configura la URL del backend en `src/config.js`:
```javascript
export const INIA_CONFIG = {
    baseUrl: 'http://localhost:8000/api', // Cambiar por tu URL
    // ... otras configuraciones
};
```

## 🎯 Uso

### Login con Email/Username
1. Haz clic en "Login con Email/Username"
2. Ingresa tu email/username y contraseña
3. El sistema te redirigirá al dashboard

### Login con Google
1. Haz clic en "Continuar con Google"
2. Se abrirá el popup de Google
3. Selecciona tu cuenta de Google
4. El sistema te redirigirá al dashboard

### Registro
1. Haz clic en "Registrarse"
2. Completa el formulario de registro
3. El sistema creará tu cuenta y te logueará automáticamente

## 🔧 Desarrollo

### Estructura del Proyecto
```
src/
├── components/
│   ├── Login.jsx          # Componente principal de login
│   ├── Dashboard.jsx      # Dashboard después del login
│   ├── SuccessScreen.jsx  # Pantalla de éxito
│   ├── ErrorOverlay.jsx   # Overlay de errores
│   └── *.css             # Estilos de los componentes
├── config.js             # Configuración de la aplicación
├── App.jsx               # Componente principal
└── main.jsx              # Punto de entrada
```

### Scripts Disponibles
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Linter de código

## 🐛 Troubleshooting

### Google OAuth no funciona
- Verifica que el Client ID esté configurado correctamente
- Asegúrate de que `http://localhost:5173` esté en los orígenes autorizados
- Revisa la consola del navegador para errores específicos

### Backend no responde
- Verifica que el backend INIA esté ejecutándose
- Confirma que la URL en `config.js` sea correcta
- Revisa los logs del backend

### Errores de CORS
- El backend debe permitir requests desde `http://localhost:5173`
- Verifica la configuración de CORS en el backend

## 📝 Notas de Desarrollo

- **Método Google OAuth**: Se usa el método tradicional (`renderButton`) en lugar de FedCM para mejor compatibilidad
- **Sistema de Errores**: Incluye información técnica detallada para facilitar el debugging
- **Responsive**: Optimizado para dispositivos móviles y desktop
- **Animaciones**: Incluye animaciones CSS para mejorar la UX

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es para pruebas del sistema INIA. Consulta con el equipo de INIA para más información sobre la licencia.

## 📞 Soporte

Para soporte técnico o preguntas sobre la integración con el backend INIA, contacta al equipo de desarrollo.