const EventEmitter = require('events');
// Event bus (Observer/Publisher): desacopla servicios de la capa de transporte (Socket.IO).
// Eventos soportados: 'mission:created', 'mission:started', 'mission:closed', 'transfer:updated'.
class Bus extends EventEmitter { }
module.exports = new Bus();
