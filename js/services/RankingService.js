/**
 * RankingService
 * - Cálculo de puntajes desacoplado mediante una estrategia base configurable.
 * - Lee pesos desde config/ranking.config.json (gradeWeights, teamSizeDefault, etc.).
 * - Expone funciones rank/selectTeam y utilidades para breakdown del score.
 * - Preparado para Pattern Strategy: se puede inyectar otra función de cálculo.
 */

const fs = require('fs');
const path = require('path');

// Carga perezosa de configuración externa
let _configCache = null;
function loadConfig() {
    if (_configCache) return _configCache;
    const cfgPath = path.join(__dirname, '..', '..', 'config', 'ranking.config.json');
    try {
        const raw = fs.readFileSync(cfgPath, 'utf8');
        _configCache = JSON.parse(raw);
    } catch (e) {
        // Fallback seguro si el archivo no existe
        _configCache = {
            gradeWeights: { especial: 5, alto: 4, medio: 3, aprendiz: 2, estudiante: 1 },
            teamSizeDefault: 3,
            successWeightMultiplier: 0.2,
            regionBoost: 3
        };
    }
    return _configCache;
}

function getGradeWeight(grade) {
    const cfg = loadConfig();
    const map = cfg.gradeWeights || {};
    const g = (grade || '').toLowerCase();
    // Emparejar claves aproximadas (contains)
    if (g.includes('especial')) return map.especial || 5;
    if (g.includes('alto')) return map.alto || 4;
    if (g.includes('medio')) return map.medio || 3;
    if (g.includes('aprendiz')) return map.aprendiz || 2;
    if (g.includes('estudiante')) return map.estudiante || 1; // estudiante explícito
    // Sin "otro" según requerimiento; fallback al menor peso definido.
    return Math.min(...Object.values(map));
}

// Estrategia base (puede reemplazarse por inyección futura)
function defaultScoreStrategy(hechicero, context = {}, cfg = loadConfig()) {
    const gradePart = getGradeWeight(hechicero.grado) * 10;
    const expPart = Number(hechicero.anios_experiencia) || 0;
    const success = Number(hechicero.tasa_exito || 0); // 0..100
    const successPart = success * (cfg.successWeightMultiplier || 0.2);
    const regionPart = (context.region && hechicero.region === context.region) ? (cfg.regionBoost || 3) : 0;
    return {
        gradePart,
        expPart,
        successPart,
        regionPart,
        total: gradePart + expPart + successPart + regionPart
    };
}

let activeStrategy = defaultScoreStrategy;
function setStrategy(fn) {
    if (typeof fn === 'function') activeStrategy = fn;
}

function rank(list, context) {
    const cfg = loadConfig();
    return [...(list || [])]
        .map(s => {
            const breakdown = activeStrategy(s, context, cfg);
            return { ...s, _score: breakdown.total, _breakdown: breakdown };
        })
        .sort((a, b) => b._score - a._score);
}

function selectTeam(ranked, maxMembers) {
    const cfg = loadConfig();
    const size = Number(maxMembers || process.env.RANKING_TEAM_SIZE || cfg.teamSizeDefault || 3);
    const team = ranked.slice(0, Math.max(1, Math.min(size, ranked.length)));
    const principal = team[0] || null;
    return { principal, team };
}

function getDefaultTeamSize() {
    const cfg = loadConfig();
    return Number(process.env.RANKING_TEAM_SIZE || cfg.teamSizeDefault || 3);
}

module.exports = {
    loadConfig,
    getDefaultTeamSize,
    getGradeWeight,
    setStrategy,
    rank,
    selectTeam
};
