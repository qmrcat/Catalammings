# Catalemmings

Un joc web inspirat en *Lemmings*: guia la colla de catalemmings des de casa fins a l'estelada fent servir un nombre limitat d'habilitats — ponts, castells, calçots, cassolades… Pel camí hi ha barrancs, antiavalots, polítics que dicten lleis, tribunals i un rei assegut a la trona.

Aquí ningú no s'hi fa mal: qui cau de massa alt, l'atrapen o el condemnen, se'n torna a casa enfadat (o a l'hospital) i ja no compta. Quan arriben a l'estelada els catalemmings que calen, la bandera espanyola del teulat de casa cau a terra.

## Com jugar-hi

No cal instal·lar res. Obre `index.html` al navegador i ja està.

També es pot publicar tal com és a GitHub Pages (*Settings → Pages → Deploy from a branch → `main` / root*).

### Controls

| Tecla | Acció |
|---|---|
| <kbd>1</kbd>–<kbd>9</kbd>, <kbd>0</kbd> | Tria una habilitat |
| Clic | Dona l'habilitat triada al catalemming |
| <kbd>P</kbd> o espai | Pausa |
| <kbd>F</kbd> | Ràpid ×3 |
| <kbd>R</kbd> | Reinicia el nivell |
| <kbd>−</kbd> / <kbd>+</kbd> | Ritme de sortida |

### Habilitats

| | Habilitat | Què fa |
|---|---|---|
| 1 | Calçots | Baixa planant de qualsevol alçada |
| 2 | Saltar | Salt llarg endavant |
| 3 | Blocar | Es planta i la colla es gira (torna-hi a clicar per deixar-lo anar) |
| 4 | Fer pont | Dotze maons en rampa |
| 5 | Mur de pedra | Marge de pedra seca que atura les pilotes de goma |
| 6 | Castell | Quatre pisos per on s'enfila la resta |
| 7 | Picar | Túnel endavant |
| 8 | Cavar | Forat cap avall |
| 9 | Cassolada | Fa fugir antiavalots i polítics |
| 0 | Pastís de nata | Directe a la cara del rei |

### Obstacles

- **Barrancs**: una caiguda de més de 56 px fa enfadar; caure al buit, adeu.
- **Antiavalots**: patrullen i detenen qui els toca. Una cassolada els fa fugir.
- **Polítics de lleis**: aixequen barreres. Una cassolada els fa fugir.
- **Tribunals**: la maça cau cada pocs segons. El marbre no es pot foradar.
- **«Torneu a casa!»**: qui hi xoca se'n torna. Una cassolada el fa fugir.
- **«Estructures d'estat!»**: fa girar la colla. Un catalemming amb calçots el fa fugir.
- **Escopeta**: pilotes de goma que envien a l'hospital. Un mur de pedra les atura.
- **Rei a la trona**: el pedestal fa de paret. Un pastís de nata el fa caure.

## Editor de nivells

El botó **Editor** obre un editor complet: pinta terreny (terra, marbre, mur, pedra seca), col·loca la casa, l'estelada i els obstacles, ajusta les habilitats i prova el nivell. Els nivells es desen al navegador i es poden compartir amb un codi (`CATLEM1…`) amb **Exporta codi** / **Importa codi**.

- **Desa com a còpia** guarda els canvis com un nivell nou i deixa l'original com estava.
- **Els meus nivells** permet jugar, editar i esborrar els nivells desats. També surten al menú principal, sota els nivells del joc.
- **Organitza**, al menú, canvia l'ordre dels nivells del joc i amaga els que no vulguis. Es desa al navegador; `levels.js` no canvia.

Per afegir un nivell propi al joc, fes servir **Codi per a levels.js**: copia el bloc i enganxa'l al final de la llista `LEVELS` de `levels.js`.

## Estructura

| Fitxer | Contingut |
|---|---|
| `index.html` | Pàgina |
| `style.css` | Estils |
| `engine.js` | Motor del joc (física, habilitats, obstacles). No toca el DOM: funciona també a Node |
| `levels.js` | Els nivells |
| `game.js` | Dibuix en *pixel art*, interfície i so sintetitzat |
| `editor.js` | Editor de nivells |
| `test_levels.js` | Comprova que cada nivell té solució |

Sense frameworks ni dependències; només les fonts de Google Fonts.

## Proves

Amb [Node.js](https://nodejs.org/):

```sh
node test_levels.js
```

Per a cada nivell comprova que sense fer res es perd i que amb una estratègia es guanya.

## Llicència

[MIT](LICENSE)
