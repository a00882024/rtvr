# RTVR - Sistema de Gestión de Documentos y Notebooks

RTVR es un sistema de gestión de documentos y notebooks construido con Flask (backend), PostgreSQL (base de datos), MinIO (almacenamiento de objetos) y React Router v7 (frontend). La aplicación permite a los usuarios organizar documentos dentro de notebooks, con soporte para procesamiento de documentos y gestión de metadatos.

## Características

- **Gestión de Notebooks**: Crea, edita y elimina notebooks con categorización por colores, visibilidad y materia
- **Gestión de Documentos**: Sube, visualiza y gestiona archivos de texto (.txt)
- **Almacenamiento en MinIO**: Almacenamiento de objetos escalable para archivos
- **API RESTful**: API versionada (v1) con endpoints completos CRUD
- **Interfaz Moderna**: UI construida con React Router v7 y Tailwind CSS v4
- **Modo Oscuro**: Soporte completo para modo oscuro en toda la aplicación

## Arquitectura

### Diagrama de Arquitectura

```mermaid
graph TB
    subgraph "Cliente"
        Browser[Navegador Web]
    end

    subgraph "Frontend - React Router v7"
        UI[Interfaz de Usuario]
        Routes[Rutas]
        API_Client[Cliente API]
    end

    subgraph "Backend - Flask"
        Flask_App[Aplicación Flask]
        Blueprints[Blueprints]

        subgraph "Blueprints"
            Notebooks_BP[Notebooks Routes]
            Documents_BP[Documents Routes]
        end

        subgraph "Models"
            Notebook_Model[Notebook Model]
            Document_Model[Document Model]
        end

        SQLAlchemy[SQLAlchemy ORM]
        MinIO_Client[Cliente MinIO]
    end

    subgraph "Infraestructura - Docker"
        PostgreSQL[(PostgreSQL 15)]
        MinIO_Storage[MinIO Object Storage]
        MinIO_Console[MinIO Console]
    end

    Browser --> UI
    UI --> Routes
    Routes --> API_Client
    API_Client -->|HTTP/REST API v1| Flask_App

    Flask_App --> Blueprints
    Blueprints --> Notebooks_BP
    Blueprints --> Documents_BP

    Notebooks_BP --> Notebook_Model
    Documents_BP --> Document_Model
    Documents_BP --> MinIO_Client

    Notebook_Model --> SQLAlchemy
    Document_Model --> SQLAlchemy

    SQLAlchemy -->|SQL Queries| PostgreSQL
    MinIO_Client -->|S3 API| MinIO_Storage

    MinIO_Storage -.->|Gestión| MinIO_Console

    style Browser fill:#e1f5ff
    style UI fill:#fff3cd
    style Flask_App fill:#d4edda
    style PostgreSQL fill:#f8d7da
    style MinIO_Storage fill:#d1ecf1
    style MinIO_Console fill:#d1ecf1
```

### Flujo de Datos

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant API as Flask API
    participant DB as PostgreSQL
    participant S3 as MinIO

    Note over U,S3: Crear Notebook
    U->>F: Completa formulario de notebook
    F->>API: POST /v1/notebooks
    API->>DB: INSERT notebook
    DB-->>API: Notebook creado
    API-->>F: JSON response
    F-->>U: Muestra notebook creado

    Note over U,S3: Subir Documento
    U->>F: Selecciona archivo .txt
    F->>API: POST /v1/documents (FormData)
    API->>S3: PUT object (archivo)
    S3-->>API: Confirmación
    API->>DB: INSERT document metadata
    DB-->>API: Document creado
    API-->>F: JSON response
    F-->>U: Muestra documento creado

    Note over U,S3: Descargar Documento
    U->>F: Click en descargar
    F->>API: GET /v1/documents/:id/download
    API->>DB: SELECT document metadata
    DB-->>API: Metadata del documento
    API->>S3: GET object
    S3-->>API: Contenido del archivo
    API-->>F: Archivo
    F-->>U: Descarga archivo
```

### Backend (Flask)

El backend sigue una arquitectura Flask modular:

- **app.py** - Punto de entrada principal que inicializa Flask, SQLAlchemy, MinIO y registra blueprints
- **database.py** - Instancia singleton de SQLAlchemy
- **models/** - Modelos de base de datos:
  - `document.py` - Modelo de documentos con campos: title, description, extracted_content, file_name, file_type, file_size, processed, notebook_id
  - `notebook.py` - Modelo de notebooks con campos: title, description, visibility, subject, color_tag, document_count
- **routes/** - Endpoints de API basados en blueprints:
  - `documents.py` - Operaciones CRUD para documentos
  - `notebooks.py` - Operaciones CRUD para notebooks

**Relación**: Un notebook puede tener muchos documentos (uno a muchos). Eliminar un notebook elimina en cascada todos sus documentos.

### Base de Datos

- PostgreSQL 15 (Alpine) ejecutándose en Docker
- Gestión de conexiones vía SQLAlchemy ORM
- Configuración mediante variables de entorno

### Almacenamiento de Archivos

- MinIO para almacenamiento de objetos S3-compatible
- Bucket: `rtvr-documents`
- Consola web disponible en http://localhost:9001
- API en puerto 9000

### Frontend

- React Router v7 con enrutamiento basado en archivos y SSR
- Tailwind CSS v4 con soporte para modo oscuro
- TypeScript para seguridad de tipos
- Componentes reutilizables para formularios y vistas

## Requisitos Previos

- Docker y Docker Compose
- Python 3.8+
- Node.js 18+ y npm/yarn/pnpm
- Git

## Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd rtvr
```

### 2. Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# En macOS/Linux:
source .venv/bin/activate
# En Windows:
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno

Las variables de entorno ya están configuradas en `backend/.env`:

```env
# Configuración de Base de Datos
DB_USER=rtvr_user
DB_PASSWORD=rtvr_password
DB_HOST=127.0.0.1
DB_PORT=55432
DB_NAME=rtvr_db

# Configuración de Carga de Archivos
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=16777216

# Configuración de MinIO
MINIO_ENDPOINT=127.0.0.1:9000
MINIO_ACCESS_KEY=rtvr_minio
MINIO_SECRET_KEY=rtvr_minio_password
MINIO_BUCKET_NAME=rtvr-documents
MINIO_SECURE=False
```

### 4. Iniciar Servicios con Docker

```bash
# Desde el directorio raíz del proyecto
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en el puerto `55432`
- MinIO API en el puerto `9000`
- MinIO Console en el puerto `9001`

### 5. Iniciar el Backend

```bash
cd backend
python app.py
```

El API estará disponible en http://127.0.0.1:5000

### 6. Configurar e Iniciar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en http://localhost:5173

## Uso

### Acceder a la Aplicación

1. Abre tu navegador en http://localhost:5173
2. Navega a "Notebooks" para crear un nuevo notebook
3. Dentro de un notebook, puedes agregar documentos (.txt)
4. Los archivos se almacenan automáticamente en MinIO

### Consola de MinIO

Para ver los archivos almacenados:

1. Abre http://localhost:9001
2. Inicia sesión con:
   - Usuario: `rtvr_minio`
   - Contraseña: `rtvr_minio_password`
3. Navega al bucket `rtvr-documents`

### API Endpoints

Todos los endpoints están prefijados con `/v1`:

#### Notebooks

- `GET /v1/notebooks` - Listar todos los notebooks
- `GET /v1/notebooks/<id>` - Obtener un notebook específico
- `GET /v1/notebooks/<id>?include_documents=true` - Obtener notebook con documentos anidados
- `GET /v1/notebooks/<id>/documents` - Listar documentos de un notebook
- `POST /v1/notebooks` - Crear nuevo notebook
- `PUT /v1/notebooks/<id>` - Actualizar notebook
- `DELETE /v1/notebooks/<id>` - Eliminar notebook

#### Documentos

- `GET /v1/documents` - Listar todos los documentos
- `GET /v1/documents/<id>` - Obtener un documento específico
- `POST /v1/documents` - Crear nuevo documento (soporta FormData para carga de archivos)
- `PUT /v1/documents/<id>` - Actualizar documento
- `DELETE /v1/documents/<id>` - Eliminar documento (también elimina de MinIO)
- `GET /v1/documents/<id>/download` - Descargar archivo del documento

## Estructura del Proyecto

```
rtvr/
├── backend/
│   ├── models/
│   │   ├── document.py
│   │   └── notebook.py
│   ├── routes/
│   │   ├── documents.py
│   │   └── notebooks.py
│   ├── app.py
│   ├── database.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── home.tsx
│   │   │   ├── notebooks.tsx
│   │   │   ├── notebooks.new.tsx
│   │   │   ├── notebooks.$id.tsx
│   │   │   ├── notebooks.$id.edit.tsx
│   │   │   ├── notebooks.$id.documents.new.tsx
│   │   │   ├── documents.tsx
│   │   │   └── documents.$id.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── root.tsx
│   │   └── routes.ts
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Tecnologías Utilizadas

### Backend
- Flask 3.1.2
- Flask-SQLAlchemy 3.1.1
- Flask-CORS 5.0.0
- PostgreSQL (psycopg2-binary 2.9.10)
- MinIO 7.2.15
- Python-dotenv 1.0.1

### Frontend
- React Router v7
- Tailwind CSS v4
- TypeScript
- Vite

### Infraestructura
- Docker & Docker Compose
- PostgreSQL 15 Alpine
- MinIO (última versión)

## Desarrollo

### Comandos Útiles

```bash
# Detener servicios Docker
docker-compose down

# Reiniciar servicios Docker
docker-compose restart

# Ver logs de PostgreSQL
docker logs rtvr

# Ver logs de MinIO
docker logs rtvr-minio

# Limpiar volúmenes Docker (¡cuidado! esto eliminará todos los datos)
docker-compose down -v
```

### Estructura de Datos

#### Modelo Notebook

```typescript
interface Notebook {
  id: number;
  title: string;
  description: string | null;
  visibility: 'public' | 'private';
  subject: string | null;
  color_tag: string;
  document_count: number;
  created_at: string;
  updated_at: string;
  documents?: Document[];
}
```

#### Modelo Document

```typescript
interface Document {
  id: number;
  title: string;
  description: string | null;
  extracted_content: string;
  file_name: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  notebook_id: number | null;
  created_at: string;
  updated_at: string;
}
```

## Solución de Problemas

### Error de Conexión a PostgreSQL

Si no puedes conectarte a PostgreSQL:
1. Verifica que Docker esté ejecutándose
2. Asegúrate de que el contenedor esté activo: `docker ps`
3. Verifica el puerto en `.env` (debe ser `55432`)

### Error de Conexión a MinIO

Si los archivos no se suben:
1. Verifica que MinIO esté ejecutándose: `docker ps`
2. Verifica las credenciales en `.env`
3. Revisa los logs: `docker logs rtvr-minio`

### Error CORS en el Frontend

Si ves errores CORS:
1. Asegúrate de que Flask-CORS esté instalado: `pip install Flask-CORS`
2. Verifica que el frontend esté ejecutándose en `http://localhost:5173`
3. Reinicia el servidor Flask

### Errores de Hidratación en React

Si ves errores de hidratación relacionados con Tailwind:
- Esto ya está resuelto usando mapas de clases estáticas
- No uses template literals con clases de Tailwind (ej: `` bg-${color}-500 ``)

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es parte de un trabajo académico para el curso de Análisis, Diseño y Construcción de Software.

## Contacto

Para preguntas o soporte, por favor abre un issue en el repositorio.
