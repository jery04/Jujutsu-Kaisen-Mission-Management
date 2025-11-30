const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, message: 'No autenticado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: payload.id, role: payload.role, username: payload.username };
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'Token inválido' });
  }
}

function authorizeRoles(allowed) {
  const allowedSet = new Set((allowed || []).map(r => String(r).toLowerCase()));
  const hierarchy = ['estudiante', 'aprendiz', 'grado1', 'grado2', 'alto', 'especial', 'director', 'admin', 'soporte'];
  const normalize = (r) => String(r || '').toLowerCase();
  return (req, res, next) => {
    const role = normalize(req.user?.role);
    if (!role) return res.status(403).json({ ok: false, message: 'Sin rol' });
    if (allowedSet.has(role)) return next();
    // Ejemplo: si se permite 'director', permitir también 'admin' y 'soporte'
    if (allowedSet.has('director') && (role === 'admin' || role === 'soporte')) return next();
    return res.status(403).json({ ok: false, message: 'No autorizado' });
  };
}

module.exports = { requireAuth, authorizeRoles };
