SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Limpieza de tablas existentes para evitar errores al ejecutar el script varias veces
DROP TABLE IF EXISTS mission_technique_usage;
DROP TABLE IF EXISTS mission_participant;
DROP TABLE IF EXISTS transfer;
DROP TABLE IF EXISTS mission;
DROP TABLE IF EXISTS curse;
DROP TABLE IF EXISTS technique;
DROP TABLE IF EXISTS sorcerer_relationship;
DROP TABLE IF EXISTS sorcerer_status_history;
DROP TABLE IF EXISTS support_staff;
DROP TABLE IF EXISTS sorcerer;
DROP TABLE IF EXISTS location;

-- Tabla de ubicaciones: almacena lugares donde ocurren eventos importantes
CREATE TABLE IF NOT EXISTS location (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  region VARCHAR(100) NOT NULL,
  tipo VARCHAR(60) NULL,
  lat DECIMAL(9,6) NULL,
  lon DECIMAL(9,6) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_location_nombre_region (nombre, region),
  KEY idx_location_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de hechiceros: información sobre los hechiceros y su estado
CREATE TABLE IF NOT EXISTS sorcerer (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  grado ENUM('estudiante','aprendiz','grado_medio','grado_alto','grado_especial') NOT NULL,
  tecnica_principal_id BIGINT NULL,
  anios_experiencia TINYINT UNSIGNED NOT NULL DEFAULT 0,
  estado_operativo ENUM('activo','lesionado','recuperacion','baja','inactivo_temporal','fallecido') NOT NULL DEFAULT 'activo',
  tipo_fallecimiento ENUM('','en_mision','por_edad') NOT NULL DEFAULT '',
  curse_causa_muerte_id BIGINT NULL,
  fecha_fallecimiento DATE NULL,
  nivel_exito_cache DECIMAL(5,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sorcerer_nombre (nombre),
  KEY idx_sorcerer_grado (grado),
  KEY idx_sorcerer_estado (estado_operativo),
  KEY idx_sorcerer_tipo_fallecimiento (tipo_fallecimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de personal de soporte: roles y estados del personal auxiliar
CREATE TABLE IF NOT EXISTS support_staff (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  rol ENUM('logistica','coordinacion','comunicaciones','otro') NOT NULL DEFAULT 'logistica',
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_support_staff_nombre (nombre),
  KEY idx_support_staff_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de estados: cambios en el estado operativo de los hechiceros
CREATE TABLE IF NOT EXISTS sorcerer_status_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sorcerer_id BIGINT NOT NULL,
  estado_anterior ENUM('activo','lesionado','recuperacion','baja','inactivo_temporal','fallecido') NULL,
  estado_nuevo ENUM('activo','lesionado','recuperacion','baja','inactivo_temporal','fallecido') NOT NULL,
  fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_status_history_sorcerer_fecha (sorcerer_id, fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relaciones entre hechiceros: mentoría o trabajo en equipo
CREATE TABLE IF NOT EXISTS sorcerer_relationship (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mentor_id BIGINT NOT NULL,
  subordinado_id BIGINT NOT NULL,
  tipo ENUM('mentoria','equipo') NOT NULL DEFAULT 'mentoria',
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_relationship (mentor_id, subordinado_id, tipo, fecha_inicio),
  KEY idx_relationship_subordinado (subordinado_id),
  KEY idx_relationship_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de técnicas: habilidades utilizadas por los hechiceros
CREATE TABLE IF NOT EXISTS technique (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  tipo ENUM('amplificacion','dominio','restriccion','soporte') NOT NULL,
  sorcerer_id BIGINT NOT NULL,
  nivel_dominio TINYINT UNSIGNED NOT NULL DEFAULT 0,
  efectividad_inicial ENUM('alta','media','baja') NOT NULL DEFAULT 'media',
  condiciones TEXT NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_technique_nombre_sorcerer (nombre, sorcerer_id),
  KEY idx_technique_tipo (tipo),
  KEY idx_technique_sorcerer (sorcerer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maldiciones: entidades que los hechiceros deben enfrentar
CREATE TABLE IF NOT EXISTS curse (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  grado ENUM('1','2','3','semi-especial','especial') NOT NULL,
  tipo ENUM('maligna','semi-maldicion','residual','desconocida') NOT NULL,
  location_id BIGINT NOT NULL,
  fecha_aparicion DATETIME NOT NULL,
  estado ENUM('activa','en_proceso_exorcismo','exorcizada') NOT NULL DEFAULT 'activa',
  assigned_sorcerer_id BIGINT NULL,
  mission_exorcismo_id BIGINT NULL,
  descripcion TEXT NULL,
  threat_nivel TINYINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_curse_nombre_fecha (nombre, fecha_aparicion),
  KEY idx_curse_estado (estado),
  KEY idx_curse_grado (grado),
  KEY idx_curse_location (location_id),
  KEY idx_curse_mission_exorcismo (mission_exorcismo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Misiones
CREATE TABLE IF NOT EXISTS mission (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NULL,
  location_id BIGINT NOT NULL,
  urgencia ENUM('planificada','urgente','emergencia_critica') NOT NULL,
  curse_id BIGINT NULL,
  supervisor_id BIGINT NOT NULL,
  estado ENUM('pendiente','en_progreso','completada_exito','completada_fracaso','cancelada') NOT NULL DEFAULT 'pendiente',
  descripcion_eventos TEXT NULL,
  tecnicas_resumen TEXT NULL,
  danos_colaterales TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_mission_estado (estado),
  KEY idx_mission_urgencia (urgencia),
  KEY idx_mission_location (location_id),
  KEY idx_mission_curse (curse_id),
  KEY idx_mission_supervisor (supervisor_id),
  KEY idx_mission_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Participantes de mision
CREATE TABLE IF NOT EXISTS mission_participant (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mission_id BIGINT NOT NULL,
  sorcerer_id BIGINT NOT NULL,
  rol ENUM('ejecutor','apoyo','supervisor','refuerzo') NOT NULL DEFAULT 'ejecutor',
  resultado ENUM('exito','fracaso','retirado','herido','fallecido','cancelado') NULL,
  observaciones TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mission_participant (mission_id, sorcerer_id),
  KEY idx_participant_rol (rol),
  KEY idx_participant_resultado (resultado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Uso de tecnicas en mision
CREATE TABLE IF NOT EXISTS mission_technique_usage (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mission_id BIGINT NOT NULL,
  technique_id BIGINT NOT NULL,
  sorcerer_id BIGINT NOT NULL,
  efectividad_valor TINYINT UNSIGNED NOT NULL,
  descripcion TEXT NULL,
  dano_estimado INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usage (mission_id, technique_id, sorcerer_id),
  KEY idx_usage_mission (mission_id),
  KEY idx_usage_sorcerer (sorcerer_id),
  KEY idx_usage_effect (efectividad_valor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Traslados
CREATE TABLE IF NOT EXISTS transfer (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mission_id BIGINT NULL,
  fecha DATETIME NOT NULL,
  origen_location_id BIGINT NOT NULL,
  destino_location_id BIGINT NOT NULL,
  motivo VARCHAR(255) NULL,
  support_staff_id BIGINT NOT NULL,
  estado ENUM('programado','en_curso','finalizado') NOT NULL DEFAULT 'programado',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_transfer_mission (mission_id),
  KEY idx_transfer_staff (support_staff_id),
  KEY idx_transfer_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relaciones (FOREIGN KEYS)
-- Nota: Se agregan con ALTER para evitar problemas de orden de creación

-- technique -> sorcerer
ALTER TABLE technique
  ADD CONSTRAINT fk_technique_sorcerer
  FOREIGN KEY (sorcerer_id)
  REFERENCES sorcerer(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

-- sorcerer_status_history -> sorcerer
ALTER TABLE sorcerer_status_history
  ADD CONSTRAINT fk_status_history_sorcerer
  FOREIGN KEY (sorcerer_id)
  REFERENCES sorcerer(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

-- sorcerer_relationship -> sorcerer
ALTER TABLE sorcerer_relationship
  ADD CONSTRAINT fk_relationship_mentor
  FOREIGN KEY (mentor_id)
  REFERENCES sorcerer(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_relationship_subordinado
  FOREIGN KEY (subordinado_id)
  REFERENCES sorcerer(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

-- curse -> location, sorcerer, mission
ALTER TABLE curse
  ADD CONSTRAINT fk_curse_location
  FOREIGN KEY (location_id)
  REFERENCES location(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_curse_assigned_sorcerer
  FOREIGN KEY (assigned_sorcerer_id)
  REFERENCES sorcerer(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_curse_mission_exorcismo
  FOREIGN KEY (mission_exorcismo_id)
  REFERENCES mission(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- mission -> location, curse, sorcerer
ALTER TABLE mission
  ADD CONSTRAINT fk_mission_location
  FOREIGN KEY (location_id)
  REFERENCES location(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_mission_curse
  FOREIGN KEY (curse_id)
  REFERENCES curse(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_mission_supervisor
  FOREIGN KEY (supervisor_id)
  REFERENCES sorcerer(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

-- mission_participant -> mission, sorcerer
ALTER TABLE mission_participant
  ADD CONSTRAINT fk_participant_mission
  FOREIGN KEY (mission_id)
  REFERENCES mission(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_participant_sorcerer
  FOREIGN KEY (sorcerer_id)
  REFERENCES sorcerer(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

-- mission_technique_usage -> mission, technique, sorcerer
ALTER TABLE mission_technique_usage
  ADD CONSTRAINT fk_usage_mission
  FOREIGN KEY (mission_id)
  REFERENCES mission(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_usage_technique
  FOREIGN KEY (technique_id)
  REFERENCES technique(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_usage_sorcerer
  FOREIGN KEY (sorcerer_id)
  REFERENCES sorcerer(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- transfer -> mission, location, support_staff
ALTER TABLE transfer
  ADD CONSTRAINT fk_transfer_mission
  FOREIGN KEY (mission_id)
  REFERENCES mission(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_transfer_origen
  FOREIGN KEY (origen_location_id)
  REFERENCES location(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_transfer_destino
  FOREIGN KEY (destino_location_id)
  REFERENCES location(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_transfer_staff
  FOREIGN KEY (support_staff_id)
  REFERENCES support_staff(id)
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

-- sorcerer -> technique (tecnica principal) y curse (causa muerte)
ALTER TABLE sorcerer
  ADD CONSTRAINT fk_sorcerer_tecnica_principal
  FOREIGN KEY (tecnica_principal_id)
  REFERENCES technique(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_sorcerer_causa_muerte
  FOREIGN KEY (curse_causa_muerte_id)
  REFERENCES curse(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
