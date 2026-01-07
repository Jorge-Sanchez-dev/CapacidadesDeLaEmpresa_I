🚀 Cómo ejecutar el proyecto paso a paso
1️⃣ Clonar el proyecto
Abrir la Terminal (o Símbolo del sistema).
Ejecutar el siguiente comando:
git clone https://github.com/Jorge-Sanchez-dev/CapacidadesDeLaEmpresa_I.git
Entrar en la carpeta del proyecto:
cd CapacidadesDeLaEmpresa_I
2️⃣ Instalar las dependencias
Una vez dentro del proyecto, ejecutar:
npm install
Este comando descargará automáticamente todo lo necesario para que el proyecto funcione correctamente.
3️⃣ Configurar el archivo .env
En la carpeta raíz del proyecto, crear un archivo llamado .env.
Abrir el archivo .env con un editor de texto.
Añadir las siguientes líneas (ejemplo):
PORT=3000
SECRET=clave_secreta
MONGO_URL=mongodb://localhost:27017/banco_sanchez
Guardar el archivo.
⚠️ Los valores pueden variar según la configuración del proyecto.
4️⃣ Ejecutar el proyecto
Para iniciar la aplicación, ejecutar una de las siguientes opciones:
Opción 1: modo normal
npm start
Opción 2: modo desarrollo
npm run dev
5️⃣ Acceder a la aplicación
Una vez iniciado el proyecto, abrir un navegador web y escribir:
http://localhost:3000
La aplicación se cargará automáticamente.