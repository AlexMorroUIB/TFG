# Bellver Defense
Aquest treball de fi de grau té com a objectiu el desenvolupament d’un joc en
realitat virtual. L’objectiu és crear una experiència immersiva on els jugadors
utilitzen un arc per a disparar a diversos enemics mentre segueixen un camí.

Aquest enfocament combina la precisió i l’habilitat del tir amb arc amb l’emoció
d’enfrontar-se a enemics en un entorn virtual. A mesura que els jugadors avancen
pel camí, es troben amb diferents tipus d’enemics, cadascun amb les seves pròpies
característiques i nivells de dificultat, la qual cosa afegeix varietat i desafiament al
joc.

La utilització de diferents enemics assegura que els jugadors es mantinguin en
moviment constant, la qual cosa augmenta la intensitat i la dinàmica del joc. La
combinació de la tecnologia de realitat virtual amb el tir amb arc ofereix una
experiència única i atractiva, que pot atreure tant als entusiastes dels videojocs
com a aquells interessats en l’esport del tir amb arc.

El joc permet als jugadors interactuar amb un arc i unes fletxes per practicar el tir
amb arc i entretenir-se disparant diferents enemics utilitzant les oportunitats que
ofereix la realitat virtual.

El desenvolupament del projecte s’ha basat en una metodologia iterativa. La
implementació del joc ha implicat l’ús de tecnologies com HTML, JavaScript,
MariaDB i Node.js, així com la implementació de models 3D i entorns interactius
amb A-Frame.

El projecte s’ha realitzat amb èxit, a més a més, s’ha presentat de manera
accessible als assistents de la fira “Ciència per a tothom” de la UIB a on els va
agradar molt als participants i es va poder obtenir retroalimentació per millorar el
projecte.

## Instal·lació
Es requereix tenir instal·lat el següent software, entre parèntesi la versió
recomanada:
- Node.js (20.x)
- MariaDB (18.x)

A més a més de tenir descarregat el projecte.
Un cop es tenen instal·lats falta instal·lar les dependències de Node.js, com el
framework d’express.js i la funcionalitat amb MariaDB. Per això, des d’una
terminal s’ha d’executar la següent comanda des de dins la carpeta del joc.
```
# npm install
```
Seguidament, s’ha d’importar dins el MariaDB el fitxer `bellver.sql` (localitzat a l'arrel del repositori), el qual crearà la base de dades necessària.

Per iniciar el servior s'ha d'executar:
```
# npm run start
```
