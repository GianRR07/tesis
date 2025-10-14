-- Eliminar tablas si existen (para desarrollo/pruebas)
DROP TABLE IF EXISTS evaluaciones;
DROP TABLE IF EXISTS examenes;
DROP TABLE IF EXISTS estudiantes_aulas;
DROP TABLE IF EXISTS aulas_cursos;
DROP TABLE IF EXISTS estudiantes;
DROP TABLE IF EXISTS aulas;
DROP TABLE IF EXISTS cursos;
DROP TABLE IF EXISTS docentes;
DROP TABLE IF EXISTS tutores;

-- DOCENTES
CREATE TABLE docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,           -- correo de contacto
    telefono TEXT,                        -- teléfono del docente
    cursos_que_ensena TEXT,               -- texto con cursos (uno por línea o separados por coma)
    correo_ingreso TEXT UNIQUE NOT NULL,  -- usuario para login
    password_hash TEXT NOT NULL           -- hash de la contraseña
);

-- TUTORES
CREATE TABLE tutores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
);

-- CURSOS (ej. Matemáticas, Comunicación, etc.)
CREATE TABLE cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    docente_id INTEGER,                    -- docente asignado al curso
    FOREIGN KEY (docente_id) REFERENCES docentes(id)
);

-- AULAS (ej. Aula 1, Aula 2, etc.)
CREATE TABLE aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    grado TEXT NOT NULL,
    seccion TEXT NOT NULL,
    tutor_id INTEGER,
    FOREIGN KEY (tutor_id) REFERENCES tutores(id)
);

-- Relación muchos-a-muchos: AULAS - CURSOS
CREATE TABLE aulas_cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aula_id INTEGER NOT NULL,
    curso_id INTEGER NOT NULL,
    docente_id INTEGER,
    FOREIGN KEY (aula_id) REFERENCES aulas(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    FOREIGN KEY (docente_id) REFERENCES docentes(id)
);

-- Relación: AULA - TUTORES (un aula puede tener hasta 2 tutores; se valida en backend)
CREATE TABLE IF NOT EXISTS aula_tutores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aula_id INTEGER NOT NULL,
  tutor_id INTEGER NOT NULL,
  UNIQUE(aula_id, tutor_id),
  FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE,
  FOREIGN KEY (tutor_id) REFERENCES tutores(id) ON DELETE CASCADE
);


-- ESTUDIANTES
CREATE TABLE estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
);

-- Relación muchos-a-muchos: ESTUDIANTES - AULAS
CREATE TABLE estudiantes_aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    aula_id INTEGER NOT NULL,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY (aula_id) REFERENCES aulas(id)
);

-- EXÁMENES
CREATE TABLE examenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    curso_id INTEGER NOT NULL,
    archivo TEXT, -- ruta al archivo pdf/jpg/etc.
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- EVALUACIONES (examen resuelto de un estudiante)
CREATE TABLE evaluaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    examen_id INTEGER NOT NULL,
    nota REAL,
    archivo_resuelto TEXT, -- ruta al archivo del alumno
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY (examen_id) REFERENCES examenes(id)
);
