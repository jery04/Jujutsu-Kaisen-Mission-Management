const crypto = require('crypto');
const { getRepository } = require('../repositories');

function hashPassword(password, salt = null) {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return `${usedSalt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = hashPassword(password, salt).split(':')[1];
  // timingSafeEqual requires buffers of same length
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
  } catch {
    return false;
  }
}

module.exports = (db) => {
  const repo = getRepository(db, 'Usuario');

  return {
    async register({ username, password }) {
      const existing = await repo.getOne({ nombre_usuario: username });
      if (existing) {
        const err = new Error('El nombre de usuario ya existe');
        err.status = 409;
        throw err;
      }
      const hashed = hashPassword(password);
      const entity = await repo.add({ nombre_usuario: username, contrasenna: hashed });
      return { nombre_usuario: entity.nombre_usuario };
    },

    async login({ username, password }) {
      const user = await repo.getOne({ nombre_usuario: username });
      if (!user) {
        const err = new Error('Credenciales inválidas');
        err.status = 401;
        throw err;
      }
      const ok = verifyPassword(password, user.contrasenna);
      if (!ok) {
        const err = new Error('Credenciales inválidas');
        err.status = 401;
        throw err;
      }
      return { nombre_usuario: user.nombre_usuario };
    }
  };
};
