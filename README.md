# Banco Sánchez – Full Stack Banking App

Este proyecto es una aplicación bancaria completa que incluye un backend en Node.js + TypeScript + MongoDB y un frontend estático seguro con autenticación por JWT.

## 📂 Estructura del proyecto

### `/public/`
Archivos visibles para el usuario final.

- **index.html** – Página inicial.
- **login.html** – Formulario de inicio de sesión.
- **register.html** – Registro del cliente.
- **panel.html** – Panel privado con cuentas y movimientos.
- **styles.css** – Estilos globales.
- **main.js** – Lógica del frontend (fetch, login, registro).
- **logo.png** – Identidad visual.

### `/src/`
Código backend en TypeScript.

#### **controllers/**
- **authController.ts** – Control de registro, login y perfil del usuario.

#### **middleware/**
- **verifyToken.ts** – Middleware que verifica JWT y añade `req.userId`.

#### **models/**
- **User.ts** – Esquema del usuario.
- **Account.ts** – Esquema de cuentas bancarias.
- **Transfer.ts** – Esquema de transferencias/movimientos.

#### **routes/**
- **auth.ts** – Rutas de autenticación (`/auth/register`, `/auth/login`, `/auth/me`).
- **index.ts** – Router principal.
- **mongo.ts** – Conexión a MongoDB Atlas.

#### **types.ts**
Tipos e interfaces compartidas (payload JWT, tipos de modelos, etc.).

### Archivos raíz
- **.env** – Variables de entorno (JWT secret, Mongo URL…).
- **package.json** – Scripts y dependencias.
- **tsconfig.json** – Configuración de TypeScript.

---

## 🚀 Scripts

```bash
npm run dev   # Ejecuta el backend con nodemon + ts-node
npm run build # Compila TypeScript a JavaScript (carpeta dist/)
npm start     # Ejecuta la versión compilada
