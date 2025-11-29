const EventEmitter = require('events');

// Event bus simple para comunicar servicios con el servidor Socket.IO
// Eventos: 'mission:created', 'mission:started', 'mission:closed', 'transfer:updated'
class Bus extends EventEmitter { }

module.exports = new Bus();
