// Middleware para verificar autenticación y adjuntar usuario a req
module.exports = function() {
  return function(req, res, next) {
    // Ejemplo: el nombre de usuario viene en el header 'x-usuario'
    const username = req.headers['x-usuario'];
    if (!username) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    req.user = { id: username };
    next();
  };
};
