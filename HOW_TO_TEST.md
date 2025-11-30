# Cómo Probar Funcionalidades

## Preparación
1. Instalar dependencias: `npm install`
2. Iniciar servidor: `npm start`

## Crear maldición y verificar misión autogenerada
- Crear maldición:
```
Invoke-RestMethod -Uri http://localhost:3000/curses -Method Post -ContentType 'application/json' -Body '{"nombre":"AutoGen","grado":"2","tipo":"maligna","fecha_aparicion":"2025-11-29T10:00:00.000Z","ubicacion":"Tokyo","estado_actual":"activa"}'
```
- Consultar misión por maldición:
```
Invoke-RestMethod -Uri http://localhost:3000/missions/by-curse/<<CURSE_ID>> -Method Get
```
- Consultar recientes:
```
Invoke-RestMethod -Uri http://localhost:3000/missions/recent -Method Get
```

## Iniciar y cerrar misión
```
Invoke-RestMethod -Uri http://localhost:3000/missions/<<MISSION_ID>>/start -Method Post -ContentType 'application/json' -Body '{}'
Invoke-RestMethod -Uri http://localhost:3000/missions/<<MISSION_ID>>/close -Method Post -ContentType 'application/json' -Body '{"resultado":"exito","descripcion_evento":"Operación completada","danos_colaterales":"Mínimos"}'
```

## Tiempo real (Socket.IO)
- Conectar cliente Socket.IO al servidor y suscribirse a `mission:created`, `mission:started`, `mission:closed` para ver eventos en vivo.
