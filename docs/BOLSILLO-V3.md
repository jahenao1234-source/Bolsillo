# Bolsillo v3 — el sistema

Documento de traspaso para seguir construyendo (Antigravity u otra herramienta).
Estado al 12 sep 2026. Lo que dice aquí está verificado contra el código.

Maqueta de referencia: https://claude.ai/code/artifact/217e37af-0c97-481d-b91e-f06ff226f384

---

## 1. La idea en una línea

**Todo Bolsillo es el traspaso:** cuando algo llega a su meta, su plata no se queda quieta, pasa a lo siguiente.

```
Mastercard $400.000 → Nu $520.000 → Crédito $970.000 → Colchón $400.000 → Inversión $800.000
└──────────── Salir de deudas ────────────┘   └─ Blindar ─┘           └─ Crecer ─┘
```

La persona siempre sabe tres cosas: **en qué fase está**, **qué hace este mes** y **a dónde va su plata cuando algo se completa**. Cada pantalla responde una sola pregunta y tiene un solo botón.

## 2. Fases y navegación

| Fase | Cuándo | Navegación |
|---|---|---|
| Salir de deudas | Hay deudas activas | Mi plan · Deudas · Billetera |
| Blindar | Sin deudas, colchón < $1.000.000 | Inicio · Sobres · Más (Pro) |
| Crecer | Colchón completo | Inicio · Sobres · Más (Pro) |

- Si es **Pro y tiene deudas activas**, aparece el **conmutador Deuda/Pro** en la cabecera.
- **Sin su mes configurado** (`PerfilFlujo` = null), la app abre primero **Armar el plan**.
- **Nunca hay candados.** Lo que no toca todavía, no se enseña.

## 3. Los momentos

| Momento | Disparador | Qué enseña |
|---|---|---|
| Traspaso | Una deuda llega a $0 y quedan otras | "Su cuota pasa a la siguiente": mínimo + lo liberado = nuevo ataque. **No se ofrece Pro**: esa plata no quedó libre. |
| Graduación | La última deuda llega a $0 | "Desde este mes te quedan $X sin dueño". Aquí sí se ofrece Pro ($19.900/mes o $97.000 de por vida). |

Se evalúan en `App.tsx` contra las deudas **de antes** del pago.

## 4. Dónde está cada cosa

```
src/logic/sistema.ts            ← EL SISTEMA. Lógica pura, sin React.
  faseActual, pagosDelMes, escaleraAtaque, compararConMinimos,
  diasDeRetraso, techoSemanal, gastoDeLaSemana, repartoPro,
  mensualDesdeEA / eaDesdeMensual
src/logic/planDeudas.ts         ← el motor de bola de nieve (calcularPlan)

src/App.tsx                     ← modo por fase, secciones, momentos
src/components/navigation/Navegacion.tsx   ← barra inferior, riel, conmutador
src/components/sistema/         ← piezas: RailPasos, PagosDelMes, EscaleraAtaque,
                                   GraficoExtincion, HojaGastoRapido, Momentos

src/screens/PantallaPlanListo.tsx   ← armar el plan (tu mes · tus deudas · tu plan)
src/screens/PantallaMiPlan.tsx      ← qué hago este mes
src/screens/PantallaDeudas.tsx      ← qué debo y qué no toco
src/screens/PantallaBilletera.tsx   ← dónde está la plata · techo de la semana
src/screens/PantallaProInicio.tsx   ← blindar y crecer
src/screens/PantallaCrecer.tsx      ← "Más": presupuesto, retos, suscripciones, tarjetas, reportes (v2, sin cambios)

src/data/store.ts               ← ÚNICA capa que toca localStorage
src/hooks/useBolsilloData.ts    ← el hook que usan las pantallas
```

## 5. Datos

- **`PerfilFlujo`** `{ ingresoMensual, gastosBasicos, configuradoEn }`. `setPerfilFlujo` también fija `disponibleMensual = ingreso − básicos`: **la plata para deudas no se adivina**.
- **`Deuda`** suma `tasaEA` (la manda; `tasaMensual` se deriva), `diaCorte`, `diaPago` y `cupo`.
- **Sobres del sistema** (`sobre-colchon`, `sobre-inversion`, `basico-arriendo`, etc.) se aseguran siempre. Tienen `sistema: true` y no se borran. Se dividen por `grupo` (`'basico' | 'libre'`) o sin grupo (propios). Tienen `presupuestoMensual` para calcular el disponible y pueden tener un arreglo de `historial` de movimientos (`{ id, fecha, monto, descripcion }`).
- **Movimiento** ahora tiene `sobreId` opcional para restar del presupuesto de sobres básicos o de gustos.
- **Ejemplo** (`VITE_DATOS_EJEMPLO`, activo en desarrollo): Mastercard $1.200.000 (28% E.A.), Nu $2.500.000 (29%), libre inversión $6.100.000 (19,5%). Ingreso $3.200.000, básicos $2.230.000, **$970.000 para deudas**.

### Números de referencia (motor, perfil de ejemplo)

| | Resultado |
|---|---|
| Con el plan | agosto 2027 · 11 meses · $822.229 de interés |
| Solo mínimos | enero 2029 · 28 meses · $1.484.373 |
| Diferencia | 17 meses y $662.144 |
| Misma plata sin traspaso | ~3 meses menos que el plan (la ganancia varía mucho por perfil) |
| Gasto de $50.000 sobre el techo | la fecha se corre 2 días |
| Techo semanal | $515.000 (básicos × 12 / 52) |
| Reparto Pro de $970.000 | colchón $400.000 · inversión $400.000 · gustos $170.000 |

Si cambias la lógica, estos números son la prueba rápida de que no rompiste nada.

## 6. Reglas del código que no se rompen

1. **Nunca `overflow` ni `min-h-0` en el marco o sus columnas.** Ponen en cero el tamaño mínimo del item flex y el contenido se recorta o se encima.
2. **Dentro de `Columna`, container queries (`@xl:`)**, no `sm:`/`md:`: esos miran la ventana, no la columna.
3. **Por debajo de 1280 px el marco se deshace** y todo se apila. Verificar siempre a **375 px**.
4. **Para ocultar en móvil usa `max-xl:hidden`**, no `hidden xl:flex`: con `flex` en la misma clase, el orden del CSS decide y a veces pierde.
5. **`Zona plana`** cuando la zona ya lleva tarjetas: evita tarjetas dentro de tarjetas en móvil.
6. **Nunca `style={{ order }}`**: ignora los breakpoints. Usa `ordenMovil`.
7. **Cualquier cifra que se le muestre al cliente sale del motor**, no se escribe a mano. Si es de ejemplo, lleva el chip "Ejemplo".
8. **Validar siempre con `npx tsc --noEmit`** antes de dar algo por listo.

## 7. Cómo verificar

- Escritorio a **1792×745, zoom 100%**: Mi plan, Deudas, Billetera y Pro Inicio miden hoy **745 px** de alto (una pantalla), sin barras internas ni scroll horizontal.
- Celular a **375×812**.
- Flujos probados de punta a punta: gasto sobre el techo ("se corre 2 días"), deuda saldada → traspaso ($120.000 + $400.000 = $520.000), última deuda → graduación → Pro, mover al colchón, armar el plan desde cero.
- El `ResizeObserver` no dispara en el panel de navegador de Claude: lo que dependa de él se prueba en un navegador real.

## 8. Pendiente (no construido)

**Del documento maestro:**
- [ ] **Cuentas, sync y cobro recurrente (Supabase).** Pro mensual necesita backend; hoy la licencia es local (`logic/licencia.ts`, códigos `DEUDACERO` / `BOLSILLOPRO`). Confirmar con Wompi el cobro recurrente con Nequi/PSE antes de fijar el precio mensual.
- [ ] **Protocolo anti-recaída:** compra a 1 cuota (no es deuda) vs. compra diferida (reabre el plan o se cubre con el colchón).
- [ ] **Lista de compras anti-impulso** ligada a un sobre.
- [ ] **Activos y F.I.R.E.** Ojo: el documento dice $2.200.000 × 12 × 25 = $264.000.000 y da **$660.000.000**.
- [ ] **Auditor bancario.** Ojo: sus dos casos suman $334.000, no $558.000.
- [ ] **Salud patrimonial (score)** y **balance imprimible.** El patrimonio no debe sumar billeteras **y** sobres: los sobres son plata que ya está en las billeteras.
- [ ] Estadísticas del documento sin fuente ("el 85%…"): no usarlas en la app sin fuente.

**De esta construcción:**
- [x] **Mover al colchón no tiene tope mensual ni historial**: resuelto (se valida si ya se movió en el mes y se guarda historial).
- [ ] **Eliminar billetera** es un botón flotante provisional mientras el modal está abierto; debería vivir dentro de `ModalAgregarBilletera`.
- [ ] El **simulador de Deudas** es de abono extra mensual; el documento pide también el abono extraordinario (prima).
- [ ] **"Más" (`PantallaCrecer`) sigue siendo v2**, y su módulo Tarjetas se solapa con las tarjetas de Deudas.
- [ ] El **historial de ejemplo** (abril–julio) se ajustó a las deudas nuevas solo en nombres y montos de abono.
- [ ] **Contrastes WCAG** de la paleta Teal + Naranja sin medir.
- [ ] El build avisa que el chunk pasa de 500 kB: conviene dividirlo por pantallas.
