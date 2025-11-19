module.exports = function errorHandler(err, _req, res, _next) {
    const status = err.status || 500;
    const payload = {
        ok: false,
        message: err.message || 'Internal Server Error'
    };
    if (process.env.NODE_ENV !== 'production' && err.stack) payload.stack = err.stack;
    res.status(status).json(payload);
};
