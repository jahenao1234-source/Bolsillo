# Brief para diseñar pantallas del prototipo de Bolsillo

Bolsillo es una app de finanzas personales para Colombia. Tiene dos modos:
- **Deuda:** te saca de deudas con el método bola de nieve.
- **Pro:** después de pagar, ordena la plata que queda libre con sobres, activos y otras herramientas.

Estamos armando un **prototipo navegable** con TODAS las pantallas en el estilo nuevo, que el usuario ya aprobó. El usuario lo revisa visualmente y juzga viendo, no leyendo explicaciones.

Tú diseñas algunas pantallas (ver "Tu encargo" al final del mensaje del agente). Cada pantalla es un **fragmento HTML** que el ensamblador mete dentro del marco de la app.

## Archivos
- Carpeta del prototipo: `C:\Users\jahen\AppData\Local\Temp\claude\C--Users-jahen-Negocio-1\3a365190-cae8-4cb2-98e0-083b6ad503d7\scratchpad\proto\`
- `kit.css`: **léelo completo antes de empezar.** Tiene los tokens de color de los dos temas y todas las piezas: `.pant`, `.cab`, `.rejilla`, `.panel`, `.titulo`, `.cifra-*`, `.fila`, `.lista`, `.barra`, `.chip`, `.pill`, `.btn`, `.btn2`, `.btn-borde`, `.caja`, `.tabla`, `.check`, `.pasos`, `.solo-escritorio`, `.solo-movil`, y las clases de gráficas `.g-*`.
- `pantallas/inicio-deuda.html`: **fragmento de referencia.** Cópiale el formato, el nivel de detalle y la forma de usar el kit.
- Tus fragmentos van en `pantallas/<id>.html`.
- Repo de la app real (solo leer, NO modificar): `C:\Users\jahen\Negocio 1\Bolsillo\src\`. Ahí están las pantallas actuales y la lógica, en `src/logic/sistema.ts`.

## Formato de un fragmento
```html
<template data-id="mi-plan" data-titulo="Mi plan">
  <div class="pant">
    …contenido…
  </div>
</template>
```
- Un archivo puede tener más de un `<template>` si una pantalla necesita un segundo estado, por ejemplo `lista-compras-cierre`. Para ir de uno a otro, cualquier elemento con `data-ir="<id>"` navega.
- Para enlazar otras pantallas usa `data-ir`: `inicio-deuda`, `mi-plan`, `deudas`, `billetera`, `inicio-pro`, `sobres`, `mi-plata`, `herramientas`, `lista-compras`, `suscripciones`, `reportes`, `activos`, `retos`, `salud`, `anti-recaida`, `auditor`.
- **Nada de `<style>`, `<script>`, colores sueltos (#hex) ni `style="color:…"`.** Solo clases del kit, estilos en línea de layout (`--cols`, `grid-template-columns`, `gap`, `margin-top`, anchos de barra `width:%`) y la variable `--c` con un token, por ejemplo `style="--c:var(--azul)"`.
- Si de verdad falta una pieza, NO la inventes con estilos. Resuélvelo con lo que hay y anota la necesidad en tu respuesta final.

## Reglas de diseño (el usuario las exige)
1. **El mismo HTML debe verse bien en escritorio (1134 px de contenido) y en celular (347 px de contenido).** La rejilla pasa a una columna sola cuando el contenido mide menos de 720 px. Usa `.solo-escritorio` y `.solo-movil` si una pieza cambia mucho de un tamaño a otro. Nunca pongas tamaños fijos en px para textos o cifras: usa las clases `.cifra-*`.
2. **Escritorio:** que la pantalla llene el marco de 1366×768 (el contenido tiene unos 710 px de alto) sin espacios muertos grandes. Si la rejilla es el bloque principal, agrégale la clase `llena` para que ocupe el alto y reparta el sobrante. Si tiene que ser más larga, está bien, pero lo principal va arriba. Usa `.rejilla` con `--cols`, por ejemplo `style="--cols: minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)"`.
3. **Celular:** corto. Nada de ventanas larguísimas: en celular esconde lo secundario con `.solo-escritorio`.
4. **Una pregunta por pantalla y un solo botón principal** (`.btn`, naranja en oscuro, negro en claro). Todo lo demás es `.btn2`, `.btn-borde` o `.link`.
5. **Teal** (`--acento`) marca lo activo y lo libre. **Naranja** solo en la acción principal y en el chip "Ataque". **Coral** (`--alerta`) es gasto, riesgo o exceso. **Menta** (`--positivo`) son logros e ingresos. **Ámbar** son avisos de vencimientos.
6. **Nada de candados, gráficas de adorno ni "próximamente".** Cada número está en los datos de abajo. Si calculas algo nuevo, que salga de estos mismos datos y cuadre.
7. **Numeración** solo cuando el orden es real (pasos de un reclamo, orden del plan). Sin emojis.
8. **Textos:** español de Colombia, en segunda persona, concretos: "Te quedan $515.000 esta semana", no "Presupuesto semanal disponible". Pesos con punto de miles y sin espacio: `$1.240.000`.
9. **Gráficas SVG** en línea: `viewBox` con márgenes y **sin** `preserveAspectRatio="none"` si llevan texto. Colores con las clases `.g-*`. Toda etiqueta debe corresponder a un valor real.
10. **Tablas:** clase `.tabla`; las columnas secundarias llevan `class="opc"` o `class="opc2"` para esconderse cuando no caben. Nunca scroll horizontal.

## Navegación (la pone el ensamblador; tú no la dibujas)
- **Modo Deuda:** Inicio (`inicio-deuda`) · Mi plan · Deudas · Billetera.
- **Modo Pro:** Inicio (`inicio-pro`) · Sobres · Mi plata · Herramientas.
- En escritorio, el menú lateral de Pro también lista las herramientas: Lista de compras, Suscripciones, Anti-recaída, Auditor bancario, Activos y F.I.R.E., Retos, Salud financiera y Reportes.
- La barra superior ya trae "+ Gasto" y el conmutador Deuda/Pro. **No repitas "+ Gasto".**

---

## DATOS · MODO DEUDA (Marcela, domingo 13 de septiembre de 2026)

**Perfil:** ingreso $3.200.000/mes · lo básico $2.230.000 (Arriendo $900.000, Mercado $700.000, Servicios $350.000, Transporte $280.000) · **a deudas $970.000/mes**.

**Deudas** (orden del plan, bola de nieve: la de menor saldo primero):

| Deuda | Saldo | Tasa | Mínimo | Corte / pago | Cupo | Recibe este mes | Sale en |
|---|---|---|---|---|---|---|---|
| Mastercard Bancolombia (tarjeta) | $1.200.000 | 28% E.A. | $180.000 | corte 16 · paga el 3 | $5.000.000 | **$400.000** (mínimo + $220.000 de ataque) | ene 2027 |
| Tarjeta Nu (tarjeta) | $2.500.000 | 29% E.A. | $120.000 | corte 25 · paga el 10 | $3.000.000 | $120.000 (mínimo) | may 2027 (desde feb recibe $520.000) |
| Libre inversión Bancolombia (préstamo) | $6.100.000 | 19,5% E.A. | cuota $450.000 | paga el 15 | — | $450.000 (cuota) | ago 2027 (desde jun recibe $970.000) |

- Total adeudado: **$9.800.000**. Pagado hasta hoy: $0 (acaba de empezar).
- **Plan:** libre de deudas en **agosto 2027**, en 11 meses, con $822.229 de intereses.
- **Solo mínimos:** enero 2029, 28 meses, $1.484.373 de intereses. **Diferencia: 17 meses antes y $662.144 menos.**
- Saldo total mes a mes con el plan (mes 0 = hoy): 9.800.000 · 8.982.174 · 8.149.435 · 7.301.503 · 6.437.846 · 5.558.146 · 4.662.098 · 3.749.386 · 2.820.956 · 1.878.639 · 922.229 · 0
- Con solo mínimos (29 puntos, mes 0 a 28): 9.800.000 · 9.206.747 · 8.603.248 · 7.989.321 · 7.364.780 · 6.729.438 · 6.083.100 · 5.425.573 · 4.923.412 · 4.430.110 · 3.928.899 · 3.419.650 · 2.902.231 · 2.376.508 · 1.842.345 · 1.299.604 · 1.200.165 · 1.103.331 · 1.004.420 · 903.388 · 800.190 · 694.778 · 587.105 · 477.123 · 364.782 · 250.032 · 132.821 · 13.096 · 0
- **Traspaso:** cuando Mastercard llega a $0 (ene 2027), sus $400.000 pasan a Nu ($120.000 + $400.000 = $520.000). Cuando Nu llega a $0 (may 2027), pasan a la libre inversión ($450.000 + $520.000 = $970.000).
- **Pagos de este mes, en orden de vencimiento:** Libre inversión $450.000 vence el 15 sep (en 2 días) · Mastercard $400.000 vence el 3 oct · Nu $120.000 vence el 10 oct. Ninguno pagado todavía.
- **Gastar de más atrasa:** $50.000 por encima del techo semanal corren la fecha de libertad 2 días.
- **Abonar más al mes (simulador):** +$100.000/mes ($1.070.000 a deudas) → libre en **jul 2027**, 10 meses, $721.557 de intereses (1 mes antes y $100.672 menos). +$200.000/mes → **jun 2027**, 9 meses, $640.936 de intereses (2 meses antes y $181.293 menos).

**Billeteras:** Efectivo $180.000 · Nequi $310.000 · Bancolombia $450.000 · Ahorros $300.000 = **$1.240.000**.
**Techo semanal:** $515.000 (lo básico × 12 ÷ 52). Semana del lunes 7 al domingo 13 de sep: gastado $0, te quedan $515.000.

**Movimientos de septiembre** (del más nuevo al más viejo):

| Concepto | Cuenta | Categoría | Fecha | Monto |
|---|---|---|---|---|
| Transporte de la semana | Efectivo | Transporte | 6 sep | −$22.000 |
| Spotify | Bancolombia | Ocio | 5 sep | −$16.900 |
| Luz y agua | Bancolombia | Servicios | 3 sep | −$164.000 |
| Mercado | Efectivo | Comida | 2 sep | −$120.000 |
| Gimnasio Smart Fit | Bancolombia | Salud | 1 sep | −$89.900 |
| Salario quincena | Nequi | Salario | 1 sep | +$1.600.000 |

Gastado en septiembre: **$412.800 de $2.230.000 (18,5%)** · Servicios $164.000 · Comida $120.000 · Salud $89.900 · Transporte $22.000 · Ocio $16.900.
Sobres de lo básico en deuda: Arriendo $900.000 disp. · Mercado $580.000 disp. · Servicios $186.000 disp. · Transporte $258.000 disp.

---

## DATOS · MODO PRO (Marcela, sábado 13 de noviembre de 2027)

Marcela terminó su última deuda en **agosto 2027**. Lleva 3 meses en Pro (septiembre, octubre y noviembre). **No tiene deudas.**

**Perfil:** ingreso $3.200.000 · lo básico $2.230.000 (mismos 4 sobres) · **lo libre $970.000** = Fondo blindado $400.000 + Inversión $400.000 + Gustos $170.000.

**Sobres:**
- Lo básico:
  - Mercado $580.000 disp. de $700.000 (17% gastado).
  - Arriendo $900.000 disp. (se paga el 1; este mes ya se pagó).
  - Servicios $186.000 de $350.000 (47%).
  - Transporte $258.000 de $280.000 (8%).
- Fondo blindado: **$1.200.000**, guardado en **Nu**. Meta: $6.690.000 (3 meses de lo básico), va en 17,9%. Primer hito de $1.000.000 superado. Aporte de noviembre ya movido el 1 nov.
- Inversión: $400.000 sin invertir, en **Bancolombia** (aporte de noviembre). Los $800.000 de septiembre y octubre ya están en un CDT.
- Gustos: $153.100 disp. de $170.000.
- Sobres propios: ninguno.

**Billeteras (Mi plata):**
- Bancolombia $1.450.000 ($400.000 en sobre Inversión · $1.050.000 sin sobre).
- Nu $1.200.000 ($1.200.000 en sobre Fondo blindado · $0 sin sobre).
- Nequi $310.000.
- Efectivo $180.000.
- **Líquido total $3.140.000** ($1.600.000 en sobres).

**Activos:** CDT digital Bancolombia · capital $800.000 · 11,2% E.A. · 180 días · abierto el 20 oct 2027 · vence el 17 abr 2028 · rendimiento proyectado $42.998 · valor hoy $805.600.

**Patrimonio neto:** $3.140.000 + $805.600 − $0 de deudas = **$3.945.600**.

**Meta del año Pro:** blindar e invertir $9.600.000 en 12 meses ($800.000/mes). Llevas $2.400.000 (25%), mes 3 de 12.

**Salud financiera: 70/100:**
- Solvencia 40 de 40 (cero deudas).
- Liquidez 5 de 30 (el fondo cubre 0,5 meses de lo básico; lo ideal son 3 a 6).
- Ahorro e inversión 25 de 30 (el 25% del ingreso va a fondo e inversión; lo ideal es 30% o más).
- Lo que más te sube: llenar el fondo. Con 3 meses de lo básico la liquidez llega a 30 y el puntaje a 95.

**F.I.R.E. (retiro anticipado):**
- Meta de libertad: lo básico × 12 × 25 = **$669.000.000**.
- Hoy invertido: $1.200.000 ($800.000 en CDT + $400.000 en el sobre).
- Aportando $400.000 al mes al 11,2% E.A. llegas en **agosto 2053** (25 años y 9 meses).
- Un abono extra de $400.000 hoy adelanta tu retiro **30 días**.

**Gasto de noviembre (1–13):** $412.800 de $2.230.000 (18,5%), día 13 de 30, vas bien. Servicios $164.000 · Comida $120.000 · Salud $89.900 · Transporte $22.000 · Ocio $16.900.

**Movimientos recientes:**

| Concepto | Cuenta | Tipo | Fecha | Monto |
|---|---|---|---|---|
| Transporte de la semana | Efectivo | Gasto | 6 nov | −$22.000 |
| Spotify | Bancolombia | Gasto | 5 nov | −$16.900 |
| Luz y agua | Bancolombia | Gasto | 3 nov | −$164.000 |
| Mercado | Efectivo | Gasto | 2 nov | −$120.000 |
| A Fondo blindado | Bancolombia → Nu | Traslado | 1 nov | $400.000 |
| Gimnasio Smart Fit | Bancolombia | Gasto | 1 nov | −$89.900 |
| Salario quincena | Bancolombia | Ingreso | 1 nov | +$1.600.000 |

**Suscripciones (Radar):**

| Servicio | Valor | Cobra el | Paga con | Estado |
|---|---|---|---|---|
| Gimnasio Smart Fit | $89.900 | 1 | Bancolombia débito | **47 días sin uso: fuga** ($1.078.800 al año) |
| Spotify | $16.900 | 5 | Bancolombia débito | En uso |
| Netflix | $26.900 | 18 (en 5 días) | **Mastercard crédito** | En uso |
| YouTube Premium | $23.900 | 22 | Nequi | En uso |

Total $157.600 al mes ($1.891.200 al año). Si cancelas Smart Fit ahorras $89.900 al mes.

**Tarjetas en Pro** (pagadas, se usan solo a 1 cuota):
- Mastercard Bancolombia: cupo $5.000.000 · corte 16 · paga el 3 dic. Este ciclo lleva $26.900 (Netflix, a 1 cuota). Esa plata ya está apartada para pagar el 100% en el corte: $0 de intereses.
- Tarjeta Nu: cupo $3.000.000 · corte 25 · sin compras este ciclo.

**Anti-recaída (escenario de ejemplo):** Marcela quiere un celular de **$900.000**.
- **A 1 cuota:** no es deuda. Se aparta del sobre que elija y se paga completo en el corte (3 dic).
- **Diferido a 6 cuotas al 28% E.A.** (2,078% mensual): cuota de $161.099, **$66.594 de intereses**. Vuelve el modo Deuda hasta mayo 2028.
- **Opción del sistema:** pagarlo hoy con el Fondo blindado. El fondo baja de $1.200.000 a $300.000 y se repone en 3 meses con los aportes de $400.000. Intereses: $0.

**Auditor bancario:**
- Bancolombia · **Seguro de vida deudor** $18.500/mes ($222.000 al año). Sigue cobrándose aunque la libre inversión quedó en $0 en agosto 2027. Estado: carta generada, falta radicar.
- Mastercard · **Cuota de manejo** $28.000 cada trimestre ($112.000 al año). Estado: detectado.
- **Total por rescatar: $334.000 al año.** Lo rescatado se manda al sobre de Inversión.
- Pasos del reclamo: 1. Descargar el derecho de petición · 2. Radicarlo en la app o sucursal del banco · 3. El banco tiene 15 días hábiles para responder · 4. Registrar la respuesta y el reintegro.

**Retos:**
- **Reto de las 52 semanas:** semana 12 de 52. Esta semana aportas $24.000. Llevas $156.000. Meta $2.756.000. Racha de 12 semanas.
- **21 días sin domicilios:** día 9 de 21, racha de 9 días. Llevas $54.000 sin gastar ($6.000 por día). Al terminar, la app te pregunta si mandas lo ahorrado al Fondo blindado o a Inversión.

**Lista de compras** (ligada al sobre Mercado, que tiene **$580.000 disponibles**). Lista "Mercado de quincena", para el 15 nov. Ya en el carrito (tachados):

| Producto | Valor |
|---|---|
| Arroz 5 kg | $21.900 |
| Aceite 3 L | $29.500 |
| Huevos x30 | $17.900 |
| Pechuga 2 kg | $36.000 |
| Carne molida 1 kg | $24.900 |
| Leche x6 | $26.400 |
| Café 500 g | $19.800 |

Faltan: Frutas y verduras $48.000 · Detergente 3 kg $32.900 · Papel higiénico x12 $23.900 · Pan tajado $7.500 · Queso 500 g $16.900.

- En carrito: **$176.400**. Total de la lista: **$305.600**. Te quedan $274.400 después de comprar todo.
- Escudo anti-impulso: si el total pasa los $580.000, el exceso se descuenta de Gustos ($153.100 disp.) y lo avisa.
- **Finalizar compra** pagando con Bancolombia (imputación triple):
  - Bancolombia $1.450.000 → $1.144.400.
  - Sobre Mercado $580.000 → $274.400.
  - Se registra $305.600 en "Comida" en tus reportes.

**Reportes · octubre 2027 (mes cerrado):**
- Ingresos $3.200.000.
- Lo básico gastado $2.148.300 de $2.230.000 (96%).
- Fondo blindado +$400.000 · Inversión +$400.000 (fueron al CDT el 20 oct) · Gustos gastado $150.000.
- Sobró $101.700, que quedó en Bancolombia.
- **Balance general al 13 nov 2027:** Activos líquidos $3.140.000 + Inversiones $805.600 = Activos $3.945.600 · Pasivos $0 · **Patrimonio neto $3.945.600**.
- Historial:
  - Intereses ahorrados con el plan de deudas frente a pagar mínimos: $662.144.
  - Cobros bancarios por rescatar: $334.000 al año (auditor en curso).
- Botón: "Imprimir o guardar PDF".
