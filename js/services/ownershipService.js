const { getRepository } = require('../repositories');

module.exports = {
    async check(db, { entity, id, userId }) {
        if (!entity || !id) return { canEdit: false, message: 'Parámetros inválidos' };
        if (!userId) return { canEdit: false, message: 'Usuario no autenticado' };
        if (String(userId) === 'admin') return { canEdit: true, message: 'Acceso administrador' };
        const normalizedEntity = String(entity).trim().toLowerCase();
        const map = {
            resource: { name: 'Resource', field: 'createdBy' },
            technique: { name: 'Technique', field: 'createBy' },
            sorcerer: { name: 'Sorcerer', field: 'createBy' },
            curses: { name: 'Curse', field: 'createBy' }
        };
        const cfg = map[normalizedEntity];
        if (!cfg) return { canEdit: false, message: 'Entidad no soportada' };
        const repo = getRepository(db, cfg.name);
        const item = await repo.getById(id);
        if (!item) return { canEdit: false, message: 'Entidad no encontrada' };
        if (String(item[cfg.field]) === String(userId)) {
            return { canEdit: true, message: 'Usuario es el creador' };
        }
        return { canEdit: false, message: 'No autorizado: solo el creador puede editar/eliminar' };
    }
};
