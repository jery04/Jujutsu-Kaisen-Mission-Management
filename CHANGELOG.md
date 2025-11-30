# CHANGELOG

## 2025-11-29
- feat(events): bus de eventos y puente Socket.IO (`mission:created`, `mission:started`, `mission:closed`)
- feat(mision): autogeneración de misión al crear maldición y asignación de equipo
- feat(ranking): `RankingService` para puntuar y seleccionar equipo
- feat(api): endpoints `POST /missions/:id/start`, `POST /missions/:id/close`, `GET /missions/by-curse/:id`, `GET /missions/recent`
- docs: README actualizado con estados/eventos/endpoints
- plan: AUDIT_PLAN.md agregado
