const { getRepository } = require('../repositories');
const events = require('../utils/events');

module.exports = {
    async updateStatus(db, id, payload, user) {
        if (!user || !user.role) { const err = new Error('Usuario no autenticado'); err.status = 401; throw err; }
        // Permitir solo soporte o admin para actualizar estado de transfer
        if (!['soporte', 'admin'].includes(String(user.role).toLowerCase())) {
            const err = new Error('No autorizado'); err.status = 403; throw err;
        }
        const repo = getRepository(db, 'Transfer');
        const transfer = await repo.getById(id);
        if (!transfer) { const err = new Error('Traslado no encontrado'); err.status = 404; throw err; }
        const { estado } = payload || {};
        if (!estado || typeof estado !== 'string') { const err = new Error('Estado inválido'); err.status = 400; throw err; }
        const updated = await repo.update(id, { estado });
        try { events.emit('transfer:updated', { transfer_id: Number(id), estado }); } catch (_) { }
        return { ok: true, transfer: updated };
    }
};
