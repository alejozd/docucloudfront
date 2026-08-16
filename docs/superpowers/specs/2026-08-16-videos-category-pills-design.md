# Modernizar selector de categorías en VideosPage

## Contexto

`VideosPage.js` agrupa los videos por carpeta (`video.carpeta`, tomada del nombre de directorio en `/var/www/videos` del backend) y muestra las categorías como `Chip` de PrimeReact en una fila horizontal con scroll. El diseño actual es funcional pero visualmente plano (texto simple, sin jerarquía). Además, la categoría "Meditaciones" —la que usa la esposa del usuario con más frecuencia— aparece en el orden en que el backend devuelve las carpetas, sin garantía de ir primero.

Categorías reales existentes en el servidor (`/var/www/videos`): `Automan`, `Meditaciones`, `Peliculas`, `Viajeros en el tiempo`.

## Objetivo

1. Modernizar visualmente el selector de categorías (icono + nombre + contador, estado activo destacado).
2. Garantizar que la categoría de meditación aparezca siempre primero en la lista.
3. Mantener el comportamiento responsive actual (scroll horizontal en móvil).

## Diseño

### 1. Componente `CategoryPill`

Nuevo componente interno en `VideosPage.js` (no requiere archivo aparte, sigue el patrón ya usado por `VideoThumbnail` en el mismo archivo):

```jsx
const CategoryPill = ({ label, icon, count, active, onClick }) => (
  <button
    type="button"
    className={`category-pill ${active ? "category-pill-active" : ""}`}
    onClick={onClick}
  >
    <i className={`pi ${icon}`} />
    <span className="category-pill-label">{label}</span>
    <span className="category-pill-count">{count}</span>
  </button>
);
```

Reemplaza el uso actual de `Chip` dentro del `ScrollPanel` (mismo contenedor, mismo comportamiento de scroll horizontal — no se toca esa parte).

### 2. Mapeo de icono por categoría

Función pura `getCategoryIcon(name)`:

1. Normaliza el nombre (minúsculas, sin acentos vía `normalize("NFD").replace(/[̀-ͯ]/g, "")`).
2. Mapa de coincidencia por substring, en este orden:
   - contiene `"medita"` → `pi-moon`
   - contiene `"pelicula"` → `pi-video`
   - contiene `"tiempo"` → `pi-clock`
   - contiene `"auto"` → `pi-android`
3. Si ninguna coincide → fallback `pi-folder`.

Este enfoque cubre las 4 carpetas reales actuales y degrada con gracia ante carpetas nuevas sin romper nada.

### 3. Orden de categorías: meditación primero

`folderNames` (hoy `Object.keys(groupedVideos)`) se deriva con una función `sortCategories`:

```js
const sortCategories = (names) =>
  [...names].sort((a, b) => {
    const aIsMedita = normalize(a).includes("medita");
    const bIsMedita = normalize(b).includes("medita");
    if (aIsMedita && !bIsMedita) return -1;
    if (!aIsMedita && bIsMedita) return 1;
    return 0; // conserva el orden relativo original entre las demás (sort estable)
  });
```

`selectedCategory` por defecto sigue siendo la primera del arreglo ya ordenado (hoy toma `Object.keys(...)[0]`), así que el efecto colateral es que arranca en Meditaciones sin tocar esa lógica.

### 4. Contador de videos por categoría

`groupedVideos[folderName].length`, ya disponible sin cambios de datos.

### 5. Estilos (`VideosPage.css`)

- `.category-pill`: `display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: 999px; min-height: 40px;` (asegura área táctil cómoda en móvil), fondo translúcido (`var(--surface-100)` o similar ya usado en el tema oscuro existente), transición suave (`transition: all 0.2s ease-in-out`, mismo patrón que `.p-chip` actual).
- `.category-pill-active`: gradiente sutil (reutilizando paleta ya presente en `.video-item-card-content`, ej. `linear-gradient(135deg, var(--primary-color), var(--primary-600))`), texto en negrita, sombra ligera (`box-shadow: var(--shadow-2)`).
- `.category-pill-count`: badge pequeño (fondo semi-transparente, `border-radius: 999px`, `font-size: 0.75rem`) para diferenciar visualmente del label.
- Media query `@media (max-width: 767px)` ya existente: reducir `padding` y `font-size` de `.category-pill` (mismo patrón que ya aplica a `.category-selection-container h2` y `.p-dataview-content .p-grid` en esa misma media query), sin cambiar el `ScrollPanel` que ya maneja el overflow horizontal.
- Pulido menor de `.video-item-card-content`: `transition: transform 0.2s ease, box-shadow 0.2s ease;` y un `:hover` con `transform: translateY(-2px); box-shadow: var(--shadow-4);` (sutil, no rompe el layout de grid/list de `DataView`).

### Fuera de alcance

- No se toca `VideoPlayer`, `VideoThumbnail`, ni la lógica de carga/fetch de videos.
- No se toca el backend (los nombres de carpeta siguen viniendo tal cual del filesystem).
- No se agregan íconos por categoría configurables desde UI — el mapeo es fijo en código, ajustable a futuro si aparecen categorías nuevas relevantes.

## Testing

Cambio puramente visual/de orden en un componente sin tests existentes en el repo para esta página. Verificación manual: `npm start` local, confirmar que Meditaciones aparece primero, iconos correctos por categoría, contador correcto, hover/estado activo visibles, y que en viewport móvil (≤767px) los pills siguen siendo desplazables horizontalmente sin desbordar la pantalla.
