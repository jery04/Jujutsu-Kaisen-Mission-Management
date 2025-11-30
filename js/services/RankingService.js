/**
 * RankingService: calcula puntajes y selecciona equipos para misiones.
 * Patrón: Strategy (posible) para diferentes agregadores de score.
 */

function gradeWeight(grade) {
  const g = (grade || '').toLowerCase();
  if (g.includes('especial')) return 5;
  if (g.includes('alto')) return 4;
  if (g.includes('medio')) return 3;
  if (g.includes('aprendiz') || g.includes('estudiante')) return 2;
  return 1;
}

function baseScore(hechicero, context = {}) {
  const wGrade = gradeWeight(hechicero.grado) * 10;
  const exp = Number(hechicero.anios_experiencia) || 0;
  // Placeholder para tasa de éxito y otros factores
  const success = Number(hechicero.tasa_exito || 0); // 0..100
  const successWeight = success * 0.2; // peso configurable
  // Proximidad o región (si aplica)
  const regionBoost = (context.region && hechicero.region === context.region) ? 3 : 0;
  return wGrade + exp + successWeight + regionBoost;
}

function rank(list, context) {
  return [...(list || [])]
    .map(s => ({ ...s, _score: baseScore(s, context) }))
    .sort((a, b) => b._score - a._score);
}

function selectTeam(ranked, maxMembers = 3) {
  const team = ranked.slice(0, Math.max(1, Math.min(maxMembers, ranked.length)));
  const principal = team[0] || null;
  return { principal, team };
}

module.exports = { rank, selectTeam };
