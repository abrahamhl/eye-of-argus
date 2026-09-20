# Guía de validación de campo (Eye of Argus)

Esta guía es para ti y para cualquiera que te ayude (amigos, otros grupos). Sirve
para recoger **verdad de campo** y convertirla en métricas reales de calibración.
No requiere cuenta, ni cloud, ni instalar nada: funciona **offline** y todo queda
en tu dispositivo hasta que tú exportes.

## 0 · Estado actual

**NOT_YET_CALIBRATED.** Hasta que existan datos de campo, la aplicación no hace
ninguna afirmación de precisión. Esta guía es justo lo que lo cambia.

## 1 · Qué necesitas

- Un **Chromebook** (o móvil, o portátil) con Chrome.
- La **app de campo**: `https://abrahamhl.github.io/eye-of-argus/field/`
  (es una PWA: se puede instalar y funciona sin red).
- Un reloj/cronómetro (el móvil vale) y ganas de contar 30 segundos.

Opcional, para el análisis en tu Chromebook con Linux:
`node bin/validate.mjs`, `node bin/merge-observations.mjs`.

## 2 · Regla rápida (rúbrica)

Observa **30 segundos** y asigna una banda:

| Banda | Qué ves en 30 s |
|---|---|
| **LOW** | casi vacío; pasa gente suelta |
| **MODERATE** | flujo constante; varias personas a la vez |
| **HIGH** | denso y sostenido; poco sitio para quedarse |
| **VERY HIGH** | congestión; la gente se frena |

Opcional: cuenta aproximada (`countLow`/`countHigh`). Sirve para MAE, no es un censo.

## 3 · Protocolo (importante para que valga)

1. **Solo espacio público.** Nunca datos personales: ni nombres, ni caras, ni
   matrículas, ni conversaciones. Solo agregados.
2. Observa **antes** de mirar la app del modelo (evita sesgo).
3. Registra **zona + hora + banda + observador**. La hora es el `windowStart`.
4. Si hay un evento (mercado, partido), anótalo en `notes`.
5. Si dos personas observan la **misma zona a la misma hora**, mejor: así medimos
   el **acuerdo entre observadores** (fiabilidad de la rúbrica).

## 4 · Uso de la app de campo

1. Abre la app (instálala si quieres: menú → "Instalar app").
2. **Usar mi ubicación** (o escribe lat/lon a mano).
3. Nombre del sitio, banda, rango de conteo, tus iniciales.
4. **Guardar observación**. Repite cada vez que cambie la zona.
5. Al terminar, **Exportar JSONL**. Ese fichero es tu dataset.

Cada persona exporta su propio JSONL. Luego se unen.

## 5 · Unir varios observadores (offline)

```bash
node bin/merge-observations.mjs ana.jsonl luis.jsonl --out merged.jsonl
```

Descarta duplicados por (sitio, ventana, observador) y ordena por hora.

## 6 · Convertir campo en métricas

Solo fiabilidad (con tus datos de campo):

```bash
node bin/validate.mjs --truth merged.jsonl
```

Fiabilidad + modelo (cuando tengas predicciones del modelo para las mismas
ventanas):

```bash
node bin/validate.mjs --truth merged.jsonl --predictions predictions.jsonl
```

El informe sale por pantalla y se guarda en `out/validation/`.

### Formato `truth.jsonl` (uno por línea)
```json
{"placeId":"park-sonsbeek","name":"Park Sonsbeek","lat":51.993,"lon":5.874,"windowStart":"2026-10-05T12:00:00.000Z","durationSec":30,"band":"MODERATE","countLow":10,"countHigh":25,"observer":"AB","notes":null,"source":"field","appVersion":"0.1.0"}
```

### Formato `predictions.jsonl`
```json
{"placeId":"park-sonsbeek","windowStart":"2026-10-05T12:00:00.000Z","band":"MODERATE","score":41,"rangeLow":33,"rangeHigh":49,"confidence":0.72,"confidenceState":"SUPPORTED"}
```

> Nota honesta: hoy las predicciones se generan ejecutando el pipeline del core
> (modo live/adapters) para esa zona y ventana. Que un sitio tenga predicciones
> exige que el modelo lo cubra; si no, verás `unmatchedPredictions > 0`.

## 7 · Cómo leer el informe

- **Acuerdo entre observadores** (Fleiss kappa): ¿la rúbrica es fiable?
  >0.6 sustancial, >0.8 casi perfecto.
- **Accuracy + IC 95% (Wilson)**: acierto de banda con su incertidumbre y su N.
- **False-high / false-low**: el error que más daño hace (decir "lleno" cuando
  está vacío, o al contrario).
- **MAE**: error vs punto medio del rango contado (solo si anotaste conteo).
- **Brier / ECE**: calibración de la confianza. Si ECE es alto, la confianza no
  es probabilidad (y no lo estamos afirmando).

## 8 · Ética y legal

- Aplica **AVG/GDPR**: nada identificable, solo agregados.
- No entres en propiedad privada ni observes interiores de terceros.
- No uses cámaras de reconocimiento facial ni lector de matrículas.
- Respeta a la gente; si alguien pregunta, explica que cuentas afluencia de forma
  anónima.

## 9 · Del campo al repo

Cuando tengas datos, guárdalos y ejecuta la validación. Si el resultado es real,
actualizaremos `docs/CALIBRATION.md` (y el estado deja de ser
`NOT_YET_CALIBRATED`). Nunca publicaremos números sin N, fecha y configuración
congelada.

---

### English summary

Field kit: an offline PWA at `/field/` records 30-second band observations in
public space (no personal data), stores them locally, and exports JSONL.
Multiple observers merge with `bin/merge-observations.mjs`; reliability and
model metrics come from `bin/validate.mjs` (Fleiss kappa, accuracy + Wilson CI,
confusion matrix, false-high/low, MAE, Brier, ECE). Calibration remains
`NOT_YET_CALIBRATED` until real ground truth exists.
