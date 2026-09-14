# Prototipo de referencia

Diseño aprobado de todas las pantallas de Bolsillo (modo Deuda y Pro), en computador y celular y en tema oscuro y claro.

- `bolsillo-prototipo.html`: prototipo navegable. Ábrelo en el navegador; arriba se elige pantalla, modo y tema.
- `pantallas/<id>.html`: el HTML exacto de cada pantalla. **Es la especificación visual**: al construir una pantalla, se replica su estructura y sus clases.
- `kit.css`: piezas y tokens del prototipo, con el marco.
- `kit-app.css`: las mismas piezas listas para la app, sin el marco y con los tokens de `src/index.css`. Se copia tal cual a `src/styles/kit.css`.
- `DATOS-Y-REGLAS.md`: reglas de diseño y los datos de ejemplo usados. En la app los números salen de la lógica real (`src/logic/`), nunca escritos a mano.

Reglas que no se rompen al pasar una pantalla del prototipo a React:
1. Misma estructura y mismas clases del kit. Nada de reinventar el diseño con otras clases de Tailwind.
2. Los números salen de `src/logic/` y del estado de la app, no de los datos de ejemplo.
3. Responsive con las mismas reglas del kit (container queries). Probar a 1280×720, 1366×768, 1536×730, 1920×960 y en celular a 375×812 y 360×740.
4. Un solo botón principal (`.btn`) por pantalla.
