# 🏦 Banco Sánchez – Aplicación Web Bancaria

Este proyecto consiste en una **aplicación web de banca online**, desarrollada con **Node.js**, **Express**, **TypeScript** y **MongoDB**.  
Permite simular el funcionamiento básico de un banco: autenticación de usuarios, panel personal, gestión de cuentas y operaciones bancarias.

---

## 🚀 Cómo ejecutar el proyecto paso a paso

### 1️⃣ Clonar el repositorio

Abrir la **Terminal** (macOS / Linux) o **PowerShell / CMD** (Windows) y ejecutar:

```bash
git clone https://github.com/Jorge-Sanchez-dev/CapacidadesDeLaEmpresa_I.git
```
Acceder a la carpeta del proyecto:

```bash
cd CapacidadesDeLaEmpresa_I
```

### 2️⃣ Instalar dependencias

Es necesario tener instalado Node.js (versión recomendada: 18 o superior).
Ejecutar:

```bash
npm install
```

### 3️⃣ Configurar variables de entorno

Crear un archivo llamado .env en la raíz del proyecto con el siguiente contenido:

```bash
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/nombreBD
SECRET=clave_secreta_larga_y_segura
PORT=3000
```

📌 Notas importantes:

Sustituye los datos de MongoDB por los tuyos propios.

El archivo .env no debe subirse a GitHub.

### 4️⃣ Compilar el proyecto

Antes de ejecutar la aplicación, compila el código TypeScript:

```bash
npm run build
```


### 5️⃣ Ejecutar la aplicación

Para iniciar el servidor:
```bash
npm start
```
O en modo desarrollo:
```bash
npm run dev
```

### 6️⃣ Acceder a la aplicación

Abrir el navegador y acceder a:

```bash
http://localhost:3000
```
