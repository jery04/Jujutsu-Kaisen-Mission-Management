const { rank, selectTeam, loadConfig, setStrategy } = require('../js/services/RankingService');

describe('RankingService', () => {
  test('ordena hechiceros por score y selecciona principal', () => {
    const hechiceros = [
      { id: 1, nombre: 'A', grado: 'especial', anios_experiencia: 5, tasa_exito: 80 },
      { id: 2, nombre: 'B', grado: 'alto', anios_experiencia: 10, tasa_exito: 60 },
      { id: 3, nombre: 'C', grado: 'medio', anios_experiencia: 7, tasa_exito: 90 },
      { id: 4, nombre: 'D', grado: 'aprendiz', anios_experiencia: 1, tasa_exito: 50 }
    ];
    const ranked = rank(hechiceros, {});
    expect(ranked[0].grado).toMatch(/especial/); // especial primero
    const { principal, team } = selectTeam(ranked, 3);
    expect(principal).toBeTruthy();
    expect(team.length).toBe(3);
    expect(team[0].id).toBe(principal.id);
  });

  test('config externa aplicada (pesos grados)', () => {
    const cfg = loadConfig();
    expect(cfg.gradeWeights.especial).toBe(5);
    expect(cfg.gradeWeights.aprendiz).toBe(2);
    expect(cfg.gradeWeights.estudiante).toBe(1);
  });

  test('Strategy injection modifica cálculo', () => {
    const hechiceros = [
      { id: 10, nombre: 'X', grado: 'medio', anios_experiencia: 0 },
      { id: 11, nombre: 'Y', grado: 'medio', anios_experiencia: 0 }
    ];
    setStrategy((s) => ({ gradePart: 0, expPart: 0, successPart: 0, regionPart: 0, total: s.id }));
    const ranked = rank(hechiceros, {});
    expect(ranked[0].id).toBe(11); // ordena por id mayor ahora
  });
});
