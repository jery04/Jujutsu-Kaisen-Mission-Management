const missionControllerFactory = require('../js/controllers/missionController');
const missionService = require('../js/services/missionService');

describe('missionController', () => {
  test('start llama servicio y devuelve respuesta json', async () => {
    missionService.startMission = jest.fn().mockResolvedValue({ ok: true, mission: { id: 1, estado: 'en_ejecucion' } });
    const controller = missionControllerFactory(null);
    const req = { params: { id: 1 } };
    const res = { json: jest.fn() };
    await controller.start(req, res);
    expect(missionService.startMission).toHaveBeenCalledWith(null, 1);
    expect(res.json).toHaveBeenCalledWith({ ok: true, mission: { id: 1, estado: 'en_ejecucion' } });
  });

  test('close exige rol soporte/admin y usa req.user', async () => {
    missionService.closeMission = jest.fn().mockResolvedValue({ ok: true, mission: { id: 1, estado: 'completada_exito' } });
    const controller = missionControllerFactory(null);
    const req = { params: { id: 1 }, body: { resultado: 'exito' }, user: { id: '7', role: 'soporte' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    await controller.close(req, res);
    expect(missionService.closeMission).toHaveBeenCalledWith(null, 1, { resultado: 'exito' }, { id: '7', role: 'soporte' });
    expect(res.json).toHaveBeenCalledWith({ ok: true, mission: { id: 1, estado: 'completada_exito' } });
  });
});
