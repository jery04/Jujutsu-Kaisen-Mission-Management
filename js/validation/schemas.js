const { z } = require('../middleware/validate');

// Common helpers
const nonEmpty = (msg = 'Este campo es requerido') => z.string().trim().min(1, msg);
const optionalNonEmpty = () => z.string().trim().min(1).optional();
const intId = z.coerce.number().int().positive();

// Sorcerer schema
const sorcererCreate = z.object({
  nombre: nonEmpty('Nombre es requerido').max(120),
  grado: nonEmpty('Grado es requerido').max(60),
  anios_experiencia: z.coerce.number().int().min(0).default(0),
  estado_operativo: z.enum(['activo', 'lesionado', 'en_recuperacion', 'dado_de_baja', 'inactivo_temporalmente']).default('activo'),
  causa_muerte: z.string().trim().max(255).optional().nullable(),
  fecha_fallecimiento: z.string().trim().optional().nullable(),
  // Nombre de la técnica principal a vincular (opcional)
  tecnica: z.string().trim().min(1).optional(),
  // Lista opcional de técnicas adicionales por nombre
  tecnicas_adicionales: z.array(z.string().trim().min(1)).optional(),
  // Nuevo: id del superior (opcional)
  superior_id: z.coerce.number().int().positive().optional(),
  // Nuevo: fecha de inicio de la subordinación (opcional)
  fecha_inicio_subordinacion: z.string().trim().optional()
});

const sorcererUpdate = sorcererCreate.partial();

// Technique schema
const techniqueCreate = z.object({
  nombre: nonEmpty('Nombre es requerido').max(150),
  tipo: nonEmpty('Tipo es requerido').max(100),
  descripcion: z.string().optional(),
  condiciones_de_uso: z.string().optional()
});
const techniqueUpdate = techniqueCreate.partial();

// Curse schema
const curseCreate = z.object({
  nombre: nonEmpty('Nombre es requerido').max(150),
  grado: nonEmpty('Grado es requerido').max(60),
  tipo: nonEmpty('Tipo es requerido').max(100),
  fecha_aparicion: nonEmpty('Fecha de aparición es requerida'),
  ubicacion: nonEmpty('Ubicación es requerida').max(150),
  estado_actual: nonEmpty('Estado actual es requerido').max(100)
});
// En actualizaciones, se permite enviar "ubicacion" pero la lógica de negocio
// decidirá si se puede cambiar (comparado contra el valor almacenado).
const curseUpdate = curseCreate.partial();

// Mission schema (not wired to routes yet)
const missionCreate = z.object({
  estado: nonEmpty('Estado es requerido').max(100),
  descripcion_evento: z.string().optional(),
  fecha_inicio: nonEmpty('Fecha inicio es requerida'),
  fecha_fin: z.string().optional(),
  danos_colaterales: z.string().optional(),
  nivel_urgencia: nonEmpty('Nivel de urgencia es requerido').max(60),
  ubicacion: nonEmpty('Ubicación es requerida').max(150),
  curse_id: intId
});

const missionUpdate = missionCreate.partial();

// Mission start/close minimal schemas
const missionStart = z.object({});
const missionClose = z.object({
  resultado: z.enum(['exito', 'fracaso']),
  descripcion_evento: z.string().optional(),
  danos_colaterales: z.string().optional(),
  tecnicas_usadas: z.array(z.object({
    technique_id: z.coerce.number().int().positive(),
    sorcerer_id: z.coerce.number().int().positive()
  })).optional()
});

// Usuario schemas

const userRegister = z.object({
  username: nonEmpty('Usuario es requerido').max(120),
  password: nonEmpty('Contraseña es requerida').max(255)
});
const userLogin = userRegister;

// Resource schema
const resourceCreate = z.object({
  nombre: nonEmpty('Nombre es requerido').max(150)
});
const resourceUpdate = resourceCreate.partial();

module.exports = {
  sorcererCreate,
  sorcererUpdate,
  techniqueCreate,
  techniqueUpdate,
  curseCreate,
  curseUpdate,
  missionCreate,
  missionUpdate,
  missionStart,
  missionClose,
  userRegister,
  userLogin,
  resourceCreate,
  resourceUpdate,
  transferStatusUpdate: z.object({ estado: nonEmpty('Estado es requerido').max(100) })
};
