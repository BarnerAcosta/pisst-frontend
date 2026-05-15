# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# PISST — Comandos de referencia rápida

## BACKEND (Python + FastAPI)

### Primera vez — clonar y configurar

```bash
# 1. Clonar el repositorio
git clone https://github.com/sharolpulgarinSENA/PISST.git
cd PISST

# 2. Obtener la rama Dev
git fetch origin
git checkout Dev

# 3. Crear el entorno virtual
python -m venv venv

# 4. Activar el entorno virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 5. Instalar dependencias
pip install -r requirements.txt

# 6. Crear el archivo .env en la raíz (pedir las keys al equipo)
# DATABASE_URL=postgresql://...
# SECRET_KEY=...
# GEMINI_API_KEY=...
# RECAPTCHA_SECRET_KEY=...
# ENVIRONMENT=development

# 7. Ejecutar el seed de datos demo (solo una vez)
python seed.py

# 8. Iniciar el servidor
uvicorn main:app --reload
```

---

### Uso diario — backend

```bash
# Antes de empezar siempre jalar lo último
git checkout Dev
git pull origin Dev

# Activar el entorno virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Iniciar el servidor
uvicorn main:app --reload

# Verificar en el navegador:
# http://localhost:8000        → {"status": "ok"}
# http://localhost:8000/docs   → Swagger con todos los endpoints
```

---

### Base de datos — Alembic

```bash
# PASO 1 — Inicializar Alembic (solo una vez, ya está hecho)
# NO volver a ejecutar
alembic init migrations

# PASO 2 — Generar migración cuando se agrega o cambia un modelo
# Cambiar el mensaje según lo que se modificó
alembic revision --autogenerate -m "descripcion_del_cambio"

# PASO 3 — Aplicar la migración a Neon
alembic upgrade head

# Ver el historial de migraciones aplicadas
alembic history

# Revertir la última migración (con cuidado)
alembic downgrade -1
```

---

### Git — flujo del equipo backend

```bash
# Siempre empezar desde Dev actualizado
git checkout Dev
git pull origin Dev

# Trabajar en tu rama personal
git checkout barner-acosta   # o sharon-pulgarin

# Guardar cambios
git add .
git commit -m "feat: descripcion del cambio"
git push origin barner-acosta   # o sharon-pulgarin

# Cuando terminas algo y Sharon aprobó → mergear a Dev
git checkout Dev
git pull origin Dev
git merge barner-acosta
git push origin Dev
git checkout barner-acosta

# Al final del sprint → Dev va a main → Render redesploya
git checkout main
git merge Dev
git push origin main
git checkout Dev
```

---

## FRONTEND (React + Vite + Tailwind)

### Primera vez — clonar y configurar

```bash
# 1. Clonar el repositorio
git clone https://github.com/BarnerAcosta/pisst-frontend.git
cd pisst-frontend

# 2. Obtener la rama Dev
git fetch origin
git checkout Dev

# 3. Instalar dependencias
npm install

# 4. Crear el archivo .env en la raíz (pedir al equipo)
# VITE_API_URL=http://localhost:8000

# 5. Iniciar el servidor de desarrollo
npm run dev

# Abrir en el navegador:
# http://localhost:5173
```

---

### Uso diario — frontend

```bash
# Antes de empezar siempre jalar lo último
git checkout Dev
git pull origin Dev

# Instalar dependencias nuevas si alguien las agregó
npm install

# Iniciar el servidor
npm run dev

# Abrir: http://localhost:5173
```

---

### Comandos útiles de npm

```bash
# Instalar una nueva librería
npm install nombre-libreria

# Instalar como dependencia de desarrollo
npm install -D nombre-libreria

# Construir para producción
npm run build

# Ver si hay errores de lint
npm run lint
```

---

### Git — flujo del equipo frontend

```bash
# Siempre empezar desde Dev actualizado
git checkout Dev
git pull origin Dev

# Trabajar en tu rama personal
git checkout barner-acosta

# Guardar cambios
git add .
git commit -m "feat: descripcion del cambio"
git push origin barner-acosta

# Cuando terminas algo → mergear a Dev
git checkout Dev
git pull origin Dev
git merge barner-acosta
git push origin Dev
git checkout barner-acosta

# Al final → Dev va a main → Vercel redesploya
git checkout main
git merge Dev
git push origin main
git checkout Dev
```

---

## Convenciones de commits

```
feat:     nueva funcionalidad
fix:      corrección de bug
chore:    cambios de configuración
docs:     documentación
test:     pruebas
refactor: refactorización sin cambiar funcionalidad
```

### Ejemplos
```bash
git commit -m "feat: módulo de incidentes completo"
git commit -m "fix: error en validación de token JWT"
git commit -m "chore: actualizar requirements.txt"
git commit -m "docs: agregar README con instrucciones"
```

---

## Credenciales demo (para pruebas locales)

| Rol | Email | Contraseña |
|---|---|---|
| Encargado SST | sst@pisst.demo | demo123 |
| Gerencia | gerencia@pisst.demo | demo123 |
| Empleado | empleado@pisst.demo | demo123 |

---

## URLs del proyecto

| Servicio | URL local | URL producción |
|---|---|---|
| Backend API | http://localhost:8000 | https://pisst.onrender.com |
| Swagger docs | http://localhost:8000/docs | https://pisst.onrender.com/docs |
| Frontend | http://localhost:5173 | https://pisst.vercel.app |
| Neon BD | — | neon.tech → proyecto pisst |