// Constants del joc

// Quantitat de fletxes dins la pool
const MIDACARCAIX = 16;
// Temps de penalització quan tira moltes fletxes seguides
const DELAYPENALITZACIO = 8000;
// Metres que avança la vagoneta cada pic
const AVANCVAGONETA = 150;
const GRAVETAT = 9.81;
// Forca (N) de tensió de l'arc
const FORCAARC = 330;
const EFICIENCIAARC = 0.9;
const MASSAARC = 0.9; // Massa de l'arc en kg
const MASSAFLETXA = 0.044; // Massa de la fletxa en kg
const FACTORKE = 0.05; // La suma de l'energia cinètica (KE) de les parts mòbils de l'arc.
// Factor de tensió per multiplicar a la distancia de la corda i obtenir la força
const TENSIO = Math.sqrt((EFICIENCIAARC * FORCAARC) / (MASSAFLETXA + FACTORKE * MASSAARC));
const CORDAESTIRARMAX = 0.25;
const COLORFONSMODAL = '#323232';
const COLORBOTOPRINCIPAL = '#12FF12';
const COLORBOTOSECUNDARI = '#626262';
const LLARGARIATERRA = 150;
const PLANTAMIDAMIN = 0.8;
const PLANTAMIDAMAX = 2;
const PROBABILITATPUNTSEXTRA = 20;
// Tipus d'enemics possibles
const TIPUSENEMIC = {
  planta: "planta",
  diana: "diana"
};
const VIDACOLORFRUITA = {
  1: "#FCAC00",
  2: "#FF0000",
  3: "#00FCF4",
  4: "#F400FC"
};
// Tipus d'assets disponibles
const MODELS = {
  arc: "#arcAsset",
  fletxa: "#fletxaAsset",
  planta: "#plantaAsset",
  fruita: "#fruitaAsset",
  diana: "#dianaAsset",
  vagoneta: "#vagonetaAsset",
  cami: "#camiAsset",
  camiInicial: "#camiInicialAsset"
};
const TIPUSMODALS = {
  continuar: "continuar",
  reiniciar: "reiniciar",
  menu: "menu",
  sortirPractica: "sortir practica",
  experiencia: "experiencia",
  sexe: "sexe"
}
const SONS = {
  gameOver: "../assets/audio/GameOver",
  fruitaMorta: "../assets/audio/FruitaMorta.mp3",
  perdreVida: "../assets/audio/PerdreVida.mp3",
  botoPressionat: "../assets/audio/BotoPressionat.mp3",
  fletxaDisparada: "../assets/audio/FletxaDisparada.mp3",
  colisioDiana: "../assets/audio/ColisioDiana.mp3",
  menuFons: "../assets/audio/MenuFons.mp3",
  jocFons: "../assets/audio/JocFons.mp3"
}

// Variables del joc
let vida = 10;
let punts = 0;
// Num d'enemics màxims simultàniament en pantalla
let numEnemicsMax = 4;
// Màxim de vida que poden tenir els enemics en la ronda actual
let enemicsVidaMax = 1;
let delayGeneracioEnemics = 3700; // Temps en ms que tarda el controlador en generar un nou enemic.
let duracioAvancVagoneta = 90000;
let ronda = 1;

// Estadistiques
let numDispars = 0;
let numEncerts = 0;

// Variables i constants de l'escena
const modalUsuari = document.getElementById("modalUsuari");
const OFFSETFLETXA = new THREE.Quaternion(0.501213, 0.0, 0.0, 0.8653239);
let escena = document.getElementById('escena');
let arcEntity = document.getElementById('arc');
let controls = document.getElementById('controls');
let camera = document.getElementById('camera');
let vagoneta = document.getElementById('vagoneta');
let taulaPuntuacions = document.getElementById('puntuacions');
let jugant = false;
let enemicsEnPantalla = 0;
let vidaEntity;
let cordaEntity = document.createElement('a-entity');
// entitat HTML de la fletxa que està actualment a l'arc i no s'ha disparat
let fletxaActual;
// entitat HTML de la ma que ha agafat l'arc
let maArc;
// entitat HTML de la ma que ha d'agafar les fletxes
let maCorda;
// Punt a on ha de començar el nou terra a generar
let comencTerra = 300;


// Arc
AFRAME.registerComponent('arc', {
  schema: {
    asset: {type: 'asset', default: MODELS.arc},
    width: {type: 'number', default: 0.4},
    height: {type: 'number', default: 0.6},
    depth: {type: 'number', default: 0.2},
    ma: {type: 'asset'},
    agafat: {type: 'boolean', default: false}
  },
  init: function (qualifiedName, value) {
    let data = this.data;
    let el = this.el;

    el.setAttribute('gltf-model', data.asset);

    cordaEntity.setAttribute('id', 'corda');
    cordaEntity.setAttribute('cordamath', '');
    escena.setAttribute('pool__fletxa', `mixin: fletxa; size: ${MIDACARCAIX}`);
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.


    this.el.addEventListener('grab-start', (event) => {
      if (!data.agafat && (event.detail.buttonEvent.type === "gripdown" || event.detail.buttonEvent.type === "triggerdown")) {
        let ma = event.detail.hand;
        data.ma = ma.id
        // Funcionalitat d'agafar l'arc i substituir la má per l'arc
        maArc = document.getElementById(ma.id);
        data.agafat = true;
        ma.setAttribute('gltf-model', data.asset);
        // Eliminar l'arc de l'escena
        element.parentNode.removeChild(element)

        // Afegir la corda a la posició de la mà amb l'offset corresponent
        ma.appendChild(cordaEntity);
        cordaEntity.setAttribute('position', '0 0.12 0.22');
        cordaEntity.setAttribute('rotation', '-60 0 0');

        // Afegir la classe fletxa a totes les entitats de la pool de fletxes
        // perque l'sphere-collider de les mans les detecti
        let carcaixTemp = [];
        for (let i = 0; i < MIDACARCAIX; i++) {
          carcaixTemp.push(escena.components.pool__fletxa.requestEntity());
        }
        for (let i = 0; i < MIDACARCAIX; i++) {
          const fletxaTemp = carcaixTemp[i];
          fletxaTemp.setAttribute('class', 'fletxa');
          escena.components.pool__fletxa.returnEntity(fletxaTemp);
        }

        // Moure una fletxa a l'arc
        fletxaActual = escena.components.pool__fletxa.requestEntity();
        fletxaActual.play();
        jugant = true;

        if (ma.id === "maEsquerra") {
          // Canviar la ma dreta per una fletxa
          maCorda = document.getElementById("maDreta");
          //document.getElementById("maDreta").setAttribute('gltf-model', data.fletxa);
        } else {
          // Canviar la ma esquerra per una fletxa
          maCorda = document.getElementById("maEsquerra");
          //document.getElementById("maEsquerra").setAttribute('gltf-model', data.fletxa);
        }
        maCorda.setAttribute('sphere-collider', 'objects: .fletxa;');

        // Elimina el laser control i el modal d'inici de sesió
        escena.removeChild(modalUsuari);
        let madreta = document.getElementById("maDreta");
        madreta.removeAttribute('laser-controls');
        madreta.setAttribute('cursor', 'visible: false;');
        madreta.setAttribute('raycaster', 'enabled: false; far: 0;');


        // Si l'usuari ja existia genera el menu del joc directament,
        // si no existia genera les preguntes d'experiècia prèvia i sexe,
        if (sessionStorage.getItem("existent") === "true") {
          generadorModals(TIPUSMODALS.menu);
        } else {
          generadorModals(TIPUSMODALS.experiencia);
        }
      }
    });

    /*this.el.addEventListener('grab-end', (event) => {
      //data.agafat = false;
    });*/
  }
});

function calcularTensio() {
  // Calcular la distancia entre les mans
  const distancia = Math.min((maArc.object3D.position.distanceTo(maCorda.object3D.position) / 4), CORDAESTIRARMAX);

  // Calcular la velocitat inicial
  //return Math.sqrt( (0.9*300*distancia) / (0.065 + 0.05*0.9));
  return TENSIO * Math.sqrt(distancia);
}

AFRAME.registerComponent('cordamath', {
  schema: {
    ancoraSuperior: {type: 'number', default: 0.82},
    ancoraInferior: {type: 'number', default: -0.56},
    puntIntermigSuperior: {type: 'number', default: 0.14},
    puntIntermigInferior: {type: 'number', default: 0.12},
    color: {type: 'color', default: '#2D2D2D'},
    cordaRecta: {type: 'number', default: 0.0}
  },
  init: function () {
    let data = this.data;
    let el = this.el;

    // Crear la corva de la corda.
    this.mesh = calcularCorda(data.cordaRecta)
    // Aplicar la mesh de la corva.
    el.setObject3D('mesh', this.mesh);

  }
});

/**
 * Genera una THREE.Line a partir d'una THREE.CatmullRomCurve3 simulant la corda de l'arc.
 * @param distanciaMans Distància entre les mans, si és 0.0, la corda és recta.
 * @returns {Line} La THREE.Line que simula la corda.
 */
function calcularCorda(distanciaMans) {
  // Crear la corba a partir dels punts proporcionats i la distància de les mans
  let corda = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, cordaEntity.components.cordamath.data.ancoraSuperior, 0),
    new THREE.Vector3(0, cordaEntity.components.cordamath.data.puntIntermigSuperior, distanciaMans),
    new THREE.Vector3(0, cordaEntity.components.cordamath.data.puntIntermigInferior, distanciaMans),
    new THREE.Vector3(0, cordaEntity.components.cordamath.data.ancoraInferior, 0)
  ]);
  let pointsCorda = corda.getPoints(50);
  // Crear l'objecte 3D a partir dels punts de la corba
  let geometry = new THREE.BufferGeometry().setFromPoints(pointsCorda);
  // Assignar el color
  let material = new THREE.LineBasicMaterial({
    color: cordaEntity.components.cordamath.data.color,
    linewidth: 1
  });
  // Generar la corba junt amb el color
  return new THREE.Line(geometry, material);
}

AFRAME.registerComponent('fletxa', {
  schema: {
    asset: {type: 'asset', default: MODELS.fletxa},
    ma: {type: 'asset'},
    posInicial: {type: 'array', default: [0, 0, 0]},
    posDispar: {type: 'array', default: [0, 0, 0]},
    agafada: {type: 'boolean', default: false},
    disparada: {type: 'boolean', default: false},
    forca: {type: 'number', default: 0},
    velX: {type: 'number', default: 0},
    velY: {type: 'number', default: 0},
    distAnteriorX: {type: 'number', default: 0},
    distAnteriorY: {type: 'number', default: 0},
    temps: {type: 'number', default: 0},
    gravetat: {type: 'number', default: GRAVETAT*0.5}
  },
  init: function () {
    let data = this.data;
    let element = this.el;
    element.setAttribute('gltf-model', data.asset);

    data.ma = maCorda;

    element.addEventListener('grab-start', (event) => {
      if (!data.agafada && event.detail.buttonEvent.type === "triggerdown" && (maArc.object3D.position.distanceTo(maCorda.object3D.position) < 0.3)) {
        data.agafada = true;
        fletxaActual.removeAttribute('aabb-collider');
        fletxaActual.setAttribute('aabb-collider', 'objects: .hitbox; interval: 20');
      } else {
        element.removeAttribute('grabbed');
      }
    });

    element.addEventListener('grab-end', async (event) => {
      if (data.agafada && event.detail.buttonEvent.type === "triggerup") {
        new Audio(SONS.fletxaDisparada).play().then(r => null);
        data.agafada = false;
        numDispars++;
        cordaEntity.setObject3D('mesh', calcularCorda(0.0));
        // Calcular la força de dispar
        data.forca = calcularTensio();
        // Agafa la rotació de l'objecte en radians comparant-la amb la rotació neutra 0
        let rotacio = this.el.object3D.quaternion.angleTo(
          new THREE.Quaternion(0, 0, 0, 0)
        );
        data.velX = data.forca * Math.cos(rotacio);
        data.velY = data.forca * Math.sin(rotacio);

        // Canvia la rotació Z a 0 per poder fer TranslateY i vagi cap abaix
        this.el.object3D.rotation.z = 0;
        // Dispara la fletxa amollada
        data.disparada = true;
        // Agafa una fletxa nova
        fletxaActual = escena.components.pool__fletxa.requestEntity();
        console.log(fletxaActual);
        // Si ha tirat moltes fletxes seguides hi ha un delay com a "penalització"
        if (fletxaActual === undefined) {
          await delay(DELAYPENALITZACIO)
            .then(r => {
              fletxaActual = escena.components.pool__fletxa.requestEntity();
            });
        }
        // Resetetjar els valors de la fletxa nova a 0
        fletxaActual.components.fletxa.data.disparada = false;
        fletxaActual.components.fletxa.data.temps = 0;
        fletxaActual.components.fletxa.data.forca = 0;
        fletxaActual.components.fletxa.data.velX = 0;
        fletxaActual.components.fletxa.data.velY = 0;
        fletxaActual.components.fletxa.data.distAnteriorX = 0;
        fletxaActual.components.fletxa.data.distAnteriorY = 0;
        fletxaActual.play()
      }
    });

    element.addEventListener('hitstart', (event) => {
      numEncerts++;
      if (this.data.disparada) {
        escena.components.pool__fletxa.returnEntity(this.el);
      }
      this.data.disparada = false;
    });
  },
  tick: function (time, timeDelta) {
    let data = this.data;
    let el = this.el;
    if (data.disparada) {
      // Aplica la fórmula de la trajectòria de projectils per moure la fletxa cap endavant i cap abaix
      let distX = data.velX * data.temps;
      let distY = data.velY * data.temps - (data.gravetat * data.temps * data.temps);
      el.object3D.translateZ(-(distX - data.distAnteriorX));
      el.object3D.translateY(distY - data.distAnteriorY);
      data.temps += 0.01;
      data.distAnteriorX = distX;
      data.distAnteriorY = distY;
      // Si l'altura de la fletxa és menor a 0 o el temps es major a 8 retorna la fletxa a la pool
      if (this.el.object3D.position.y < 0 || data.temps > 8) escena.components.pool__fletxa.returnEntity(this.el);
    } else if (data.agafada) {
      igualaPosicioRotacio(el, maArc);
      // Es mou cap enrrere el màxim (en negatiu perque va cap enrrere) entre la distància entre les mans i 0.25 metres
      let distanciaMans = Math.min((maArc.object3D.position.distanceTo(maCorda.object3D.position) / 4), CORDAESTIRARMAX);
      el.object3D.translateZ(-distanciaMans);
      cordaEntity.setObject3D('mesh', calcularCorda(distanciaMans * 2));
    } else {
      igualaPosicioRotacio(el, maCorda);
    }
  }
});

/**
 * Iguala la rotació de la fletxa mab la rotació de l'arc
 * @param fletxa fletxa actualment a l'arc
 * @param maFletxa La ma a la qual està adherida la fletxa,
 *        o la ma de la corda o la ma de l'arc per disparar
 */
function igualaPosicioRotacio(fletxa, maFletxa) {
  // Mou la fletxa a la ma
  const maWorldPos = new THREE.Vector3();
  maFletxa.object3D.getWorldPosition(maWorldPos);
  fletxa.setAttribute('position', {
    x: maWorldPos.x,
    y: maWorldPos.y,
    z: maWorldPos.z
  });
  // iguala la rotació de la ma
  let maQuaternion = new THREE.Quaternion(
    -maFletxa.object3D.quaternion.x,
    maFletxa.object3D.quaternion.y,
    -maFletxa.object3D.quaternion.z,
    maFletxa.object3D.quaternion.w)
  fletxa.object3D.setRotationFromQuaternion(maQuaternion.multiply(OFFSETFLETXA));
}

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Controlador que va generant els enemics fins a un màxim d'enemics simultanis en pantalla
 * @param tipus Tipus d'enemic a generar TIPUSENEMIC
 */
async function controladorEnemics(tipus) {
  jugant = true;
  // x = distancia al centre del cami
  let xMin = 4;
  let xMax = 8;
  let distancia = 25; // distancia a la vagoneta
  let altura = 0;
  if (tipus === TIPUSENEMIC.diana) {
    xMin = 0;
    xMax = 4;
    distancia = 10;
    altura = 1.5;
  }
  //console.log(escena.components.pool__enemic)
  while (jugant) {
    if (enemicsEnPantalla <= numEnemicsMax) {
      const enemic = document.createElement('a-entity');
      if (tipus === TIPUSENEMIC.planta) {
        // Si el valor aleatori és menor a la probabilitat resukta en un punt extra i es crea un enemic diana
        if (valorAleatoriInt(0,100) < PROBABILITATPUNTSEXTRA) {
          const enemicExtra = document.createElement('a-entity');
          enemicExtra.setAttribute(TIPUSENEMIC.diana, '');
          enemicExtra.setAttribute('class', 'hitbox enemic');
          enemicExtra.setAttribute('position', {
            x: (valorAleatoriFloat(xMin, xMax) * (Math.round(Math.random()) * 2 - 1)),
            y: (Math.random() * (altura - 0.5) + 0.5).toFixed(1),
            z: vagoneta.object3D.position.z + valorAleatoriInt(distancia - 5, distancia + 5)
          });
          enemicsEnPantalla++;
          escena.appendChild(enemicExtra);
        }
        // Assigna una quantitat de vida aleatòria
        enemic.setAttribute(tipus, `vida: ${valorAleatoriInt(1, enemicsVidaMax)};
                                          mida: ${valorAleatoriFloat(PLANTAMIDAMIN, PLANTAMIDAMAX)}`);
        enemic.setAttribute('class', 'enemic');
      } else {
        // Si és una diana
        enemic.setAttribute(tipus, '');
        enemic.setAttribute('class', 'hitbox enemic');
      }
      enemic.setAttribute('position', {
        x: (valorAleatoriFloat(xMin, xMax) * (Math.round(Math.random()) * 2 - 1)),
        y: tipus === TIPUSENEMIC.planta ? altura : (Math.random() * (altura - 0.5) + 0.5).toFixed(1),
        z: vagoneta.object3D.position.z + valorAleatoriInt(distancia - 5, distancia + 5)
      });

      escena.appendChild(enemic);
      enemicsEnPantalla++;
    }
    await delay(delayGeneracioEnemics);
  }
}

function valorAleatoriFloat(valorMinim, valorMaxim) {
  return (Math.random() * (valorMaxim - valorMinim) + valorMinim).toFixed(2);
}

function valorAleatoriInt(valorMinim, valorMaxim) {
  return Math.floor(Math.random() * (valorMaxim - valorMinim + 1)) + valorMinim;
}

// Component enemics
AFRAME.registerComponent('planta', {
  schema: {
    asset: {type: 'asset', default: MODELS.planta},
    assetFruita: {type: 'asset', default: MODELS.fruita},
    mida: {type: 'number', default: 1},
    vida: {type: 'number', default: 1},
    maxDistanciaVagoneta: {type: 'number', default: 40},
    enEscena: {type: 'boolean', default: true}
  },
  init: function () {
    let data = this.data;
    let element = this.el;

    element.setAttribute('rotation', `0 ${valorAleatoriFloat(0, 360)} 0`);
    element.setAttribute('scale', `${data.mida} ${data.mida} ${data.mida}`);

    // Geometria i hitbox de l'planta
    let plantaEntity = document.createElement('a-entity');
    plantaEntity.setAttribute('gltf-model', data.asset);
    plantaEntity.setAttribute('animation-mixer', 'clip: arrelCreixer; loop: once; clampWhenFinished: true;');

    // Geometria i hitbox de la fruita
    let fruitaEntity = document.createElement('a-entity');
    fruitaEntity.setAttribute('gltf-model', data.assetFruita);
    fruitaEntity.setAttribute('class', 'hitbox');
    fruitaEntity.setAttribute('visible', 'false');
    // fruitaEntity.setAttribute('sound', `src: ${SONS.fruitaMorta}; autoplay: false; positional: true; volume: 10`);

    fruitaEntity.addEventListener('model-loaded', () => {
      actualitzarColor();
    });

    fruitaEntity.addEventListener('hitstart', (event) => {
      if (data.vida < 2) {
        enemicsEnPantalla--;
        punts++;
        fruitaEntity.setAttribute('animation-mixer', 'clip: *Morir; loop: once; clampWhenFinished: true;');
        plantaEntity.setAttribute('animation-mixer', 'clip: *Morir; loop: once; clampWhenFinished: true;');
        // fruitaEntity.components.sound.playSound();
        new Audio(SONS.fruitaMorta).play().then(r => null);
        actualitzarVidaPunts();
      } else {
        data.vida--;
        actualitzarColor();
      }
    });

    /**
     * Actualitza el color del material de l'objecte de fruita
     */
    function actualitzarColor() {
      let mesh = fruitaEntity.getObject3D('mesh');
      mesh.traverse(function (child) {
        if (child.isMesh) {
          child.material = new THREE.MeshLambertMaterial({color: VIDACOLORFRUITA[data.vida]});
        }
      });
    }

    // Listener de l'animacio de morir per eliminar l'objecte
    this.el.addEventListener("animation-finished", (e) => {
      if (e.detail.action._clip.name === 'arrelMorir') {
        this.remove();
      } else if (e.detail.action._clip.name === 'arrelCreixer') {
        fruitaEntity.setAttribute('visible', 'true');
      }
    });

    element.appendChild(fruitaEntity);
    element.appendChild(plantaEntity);
  },
  tick: function (time, timeDelta) {
    let data = this.data;
    let element = this.el;
    if (data.enEscena) {
      let distanciaVagoneta = element.object3D.position.z + data.maxDistanciaVagoneta;
      if (distanciaVagoneta < vagoneta.object3D.position.z) {
        // Boolean per controlar que no entri més d'un tick a eliminar l'element
        data.enEscena = false;
        enemicsEnPantalla--;
        vida--;
        // vagoneta.components.sound.playSound();
        new Audio(SONS.perdreVida).play().then(r => null);
        actualitzarVidaPunts();
        element.remove()
      }
    }
  },
  remove: function () {
    // Remove element.
    escena.removeChild(this.el);
    // this.el.removeFromParent();
  }
});

/**
 * Modifica el texte que conté la vida i els punts del jugador,
 * també comprova si la vida és < a 1, si ho és acaba la partida.
 */
function actualitzarVidaPunts() {
  vidaEntity.setAttribute('text', `value: Vida: ${vida}\nPunts: ${punts};align: center`);
  if (vida < 1) partidaAcabada();
}

/**
 * Atura el controlador d'enemics, pausa la vagoneta
 * i genera el modal d'acabament de partida
 */
function partidaAcabada() {
  jugant = false;
  vagoneta.components['animation__moure'].pause();
  vagoneta.removeAttribute('sound');
  generadorModals(TIPUSMODALS.reiniciar);
}

AFRAME.registerComponent('terra', {
  schema: {
    asset: {type: 'asset', default: MODELS.cami},
    maxDistanciaVagoneta: {type: 'number', default: 301},
    enEscena: {type: 'boolean', default: true}
  },
  init: function () {
    let data = this.data;
    let el = this.el;

    el.setAttribute('gltf-model', data.asset);
  },
  comprovarDistancia: function () {
    let element = this.el;
    let data = this.data;
    let distanciaVagoneta = element.object3D.position.z + data.maxDistanciaVagoneta;
    if (distanciaVagoneta < vagoneta.object3D.position.z) {
      this.remove();
    }
  },
  remove: function () {
    // Remove element.
    escena.removeChild(this.el);
    this.el.removeFromParent();
  }
});


// vagoneta
AFRAME.registerComponent('vagoneta', {
  schema: {
    asset: {type: 'asset', default: MODELS.vagoneta},
    width: {type: 'number', default: 5},
    height: {type: 'number', default: 5}
  },
  init: function () {
    let data = this.data;
    let element = this.el

    element.setAttribute('gltf-model', data.asset);

    element.setAttribute('scale', '0.5 0.5 0.5');
    element.setAttribute('position', '0 0 0');

    // Animacio reiniciar
    vagoneta.setAttribute('animation__reiniciar', {
      'property': 'position',
      'to': {x: 0, y: 0, z: 0},
      'dur': 1,
      'easing': 'linear',
      'loop': false,
      'startEvents': 'startanimReiniciar'
    });

    vidaEntity = document.createElement('a-entity');
    vidaEntity.setAttribute('text', `value: Vida: ${vida}\n\nPunts: ${punts};align: center`);
    vidaEntity.setAttribute('rotation', `-11 180 0`);
    vidaEntity.setAttribute('position', `0 1.45 0.86`);
    vagoneta.appendChild(vidaEntity);

    this.el.addEventListener("animationcomplete__moure", async () => {
      jugant = false;
      await delay(80).then(() => {
        eliminarEnemics();
        generadorModals(TIPUSMODALS.continuar);
      });
    });
    this.el.addEventListener("animationcomplete__reiniciar", async () => {
      eliminarTerres();
      generarNouTerra(MODELS.camiInicial);
      actualitzarVidaPunts();
      await delay(80).then(() => {
        generadorModals(TIPUSMODALS.menu);
      });
    });
    this.el.addEventListener("sound-ended", () => {
      vagoneta.removeAttribute('sound');
    });
  }
});

AFRAME.registerComponent("diana", {
  schema: {
    asset: {type: 'asset', default: MODELS.diana}
  },
  init: function () {
    let data = this.data;
    let element = this.el;

    element.setAttribute('gltf-model', data.asset);

    element.addEventListener('hitstart', () => {
      enemicsEnPantalla--;
      punts++;
      actualitzarVidaPunts();
      new Audio(SONS.colisioDiana).play().then(r => null);
      this.remove();
    });
  },
  remove: function () {
    //this.el.parentNode.removeChild(this.el);
    escena.removeChild(this.el);
    this.el.removeFromParent();
  }
});


/**
 * Funcions AJAX amb la base de dades
 */
// Envia la puntuació actual a la BBDD
async function enviarPuntuacions() {
  await fetch("/updatePuntuacio", {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nom: sessionStorage.getItem("nom"),
      edat: sessionStorage.getItem("edat"),
      dispars: numDispars,
      encerts: numEncerts,
      puntuacio: punts,
      ronda: ronda
    })
  }).then((res) => {
    if (res.status !== 200) console.log("Error insertant les respostes de les preguntes a la BBDD.")
  });
  console.log("Puntuacio enviada: ");
}

// Envia la resposta a les preguntes d'experiència prèvia i sexe
async function enviarPreguntes() {
  await fetch("/preguntesUsuari", {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nom: sessionStorage.getItem("nom"),
      edat: sessionStorage.getItem("edat"),
      experiencia: sessionStorage.getItem(TIPUSMODALS.experiencia),
      sexe: sessionStorage.getItem(TIPUSMODALS.sexe)
    })
  }).then((res) => {
    if (res.status !== 200) console.log("Error insertant les respostes de les preguntes a la BBDD.")
  });
}

/**
 * Elimina tots els enemics actualment en pantalla
 */
function eliminarEnemics() {
  let enemics = document.querySelectorAll('.enemic');
  for (let i = 0; i < enemics.length; i++) {
    escena.removeChild(enemics[i]);
    enemics[i].removeFromParent();
  }
  enemicsEnPantalla = 0;
}

/**
 * Activa l'animacio de la vagoneta i el controlador d'enemics,
 * ja sigui per avancar de ronda o per començar la primera
 */
function comencarRonda() {
  vagoneta.removeAttribute('animation__moure');
  vagoneta.setAttribute('animation__moure', {
    'property': 'position',
    'to': {x: 0, y: 0, z: vagoneta.object3D.position.z + AVANCVAGONETA},
    'dur': duracioAvancVagoneta,
    'easing': 'linear',
    'loop': false,
    'startEvents': 'startanimMoure'
  });
  vagoneta.emit('startanimMoure', null, false);
  controladorEnemics(TIPUSENEMIC.planta).then(r => null);
}

/**
 * Elimina el terra actual i genera un de nou
 * @param asset ruta al gltf del model del terra a generar
 */
function generarNouTerra(asset) {
  // Comprova la distància de les terres ja existents a la vagoneta
  let terres = document.querySelectorAll('.terra');
  for (let i = 0; i < terres.length; i++) {
    terres[i].components.terra.comprovarDistancia();
  }

  // Afegeix un nou terra davant
  let terraNou = document.createElement('a-entity');
  terraNou.setAttribute('terra', `asset: ${asset};`);
  terraNou.setAttribute('class', 'terra');
  // 610 Llargària total
  terraNou.setAttribute('position', `0 0 ${comencTerra}`);
  comencTerra += LLARGARIATERRA;
  escena.appendChild(terraNou);
}

/**
 * Elimina totes les terres generades (útil per reiniciar el joc).
 */
function eliminarTerres() {
  let terres = document.querySelectorAll('.terra');
  for (let i = 0; i < terres.length; i++) {
    terres[i].components.terra.remove();
  }
}

/**
 * Zona Audio
 */
function audioBoto() {
  new Audio(SONS.botoPressionat).play().then(r => null);
}

/**
 *  Generació de modals
 */
/**
 * Funcio que genera els modals amb texte i 1 o 2 botons.
 * Segons el tipus, el texte i els botons mostren i/o fan una funció o una altra.
 * @param tipus El tipus de modal que ha de generar (continuar, reiniciar, menu, sortir practica)
 */
function generadorModals(tipus) {
  let fonsModal = document.createElement('a-entity');
  let titolModal = document.createElement('a-entity');
  let texteModal = document.createElement('a-entity');
  let botoPrincipal = document.createElement('a-entity');
  let botoSecundari = document.createElement('a-entity');
  let textePrincipal = document.createElement('a-entity');
  let texteSecundari = document.createElement('a-entity');
  let stringTitol;
  let stringTexte;
  let stringBotoPrincipal;
  let stringBotoSecundari;

  switch (tipus) {
    case TIPUSMODALS.continuar: {
      stringTitol = "Punt de control";
      stringTexte = "Descansa, beu aigua i continua quan estiguis llest/a.";
      stringBotoPrincipal = "Continuar";
      stringBotoSecundari = "Sortir";
      break;
    }
    case TIPUSMODALS.reiniciar: {
      stringTitol = "Joc acabat";
      stringTexte = "Has deixat passar massa enemics...\nPots tornar-ho a intentar.";
      stringBotoPrincipal = "Reiniciar";
      break;
    }
    case TIPUSMODALS.menu: {
      stringTitol = "Benvingut/da";
      stringTexte = "Utilitza l'arc i les fletxes per seleccionar els botons.\nPots comencar una partida normal\no jugar en el mode de practica.\nEn el mode normal has de disparar a les fruites\nque surten de les branques liles.\n\nPuntuacio anterior: " + sessionStorage.getItem("puntuacio");
      stringBotoPrincipal = "Iniciar";
      stringBotoSecundari = "Practica";
      break;
    }
    case TIPUSMODALS.sortirPractica: {
      stringTitol = "Sortir";
      stringTexte = "Surt del mode de practica.";
      stringBotoPrincipal = "Sortir";
      break;
    }
    case TIPUSMODALS.experiencia: {
      stringTitol = "Benvingut/da";
      stringTexte = "Tens experiencia previa jugant realitat virtual?\nUtilitza l'arc i les fletxes per seleccionar els botons.";
      stringBotoPrincipal = "Si";
      stringBotoSecundari = "No";
      break;
    }
    case TIPUSMODALS.sexe: {
      stringTitol = "Benvingut/da";
      stringTexte = "Com t'identifiques?\nUtilitza l'arc i les fletxes per seleccionar els botons.";
      stringBotoPrincipal = "Home";
      stringBotoSecundari = "Dona";
      break;
    }
  }

  // Fons del modal
  fonsModal.setAttribute('geometry', 'primitive: box; width: 3; height: 2; depth: 0.1');
  fonsModal.setAttribute('material', `color: ${COLORFONSMODAL};opacity: 0.95`);
  fonsModal.setAttribute('position', `0 1.6 ${vagoneta.object3D.position.z + 2}`);

  // Texte del modal
  fonsModal.appendChild(titolModal);
  fonsModal.appendChild(texteModal);
  titolModal.setAttribute('text', `value: ${stringTitol}; align: center;`);
  titolModal.setAttribute('position', '0 0.7 -0.1');
  titolModal.setAttribute('rotation', '0 180 0');
  titolModal.setAttribute('scale', '4 4 1');
  texteModal.setAttribute('text', `value: ${stringTexte}; align: center; width: 0.75`);
  texteModal.setAttribute('position', '0 0.2 -0.1');
  texteModal.setAttribute('rotation', '0 180 0');
  texteModal.setAttribute('scale', '3 3 1');

  // Boto Continuar
  fonsModal.appendChild(botoPrincipal);
  botoPrincipal.setAttribute('class', 'hitbox');
  botoPrincipal.setAttribute('geometry', 'primitive: box; width: 1; height: 0.5; depth: 0.1');
  botoPrincipal.setAttribute('material', `color: ${COLORBOTOPRINCIPAL}`);
  botoPrincipal.setAttribute('position', '0 -0.6 -0.1');
  // Afegir texte continuar
  botoPrincipal.appendChild(textePrincipal);
  textePrincipal.setAttribute('text', `value: ${stringBotoPrincipal}; align: center;`);
  textePrincipal.setAttribute('position', '0 0 -0.1');
  textePrincipal.setAttribute('rotation', '0 180 0');
  textePrincipal.setAttribute('scale', '3 3 1');

  if (stringBotoSecundari) {
    // Mou el boto principal i afegeix el boto secundari
    botoPrincipal.setAttribute('position', `-0.6 -0.6 -0.1`);
    fonsModal.appendChild(botoSecundari);
    botoSecundari.setAttribute('class', 'hitbox');
    botoSecundari.setAttribute('geometry', 'primitive: box; width: 1; height: 0.5; depth: 0.1');
    botoSecundari.setAttribute('material', `color: ${COLORBOTOSECUNDARI}`);
    botoSecundari.setAttribute('position', '0.6 -0.6 -0.1');
    // Afegir texte boto secundari
    botoSecundari.appendChild(texteSecundari);
    texteSecundari.setAttribute('text', `value: ${stringBotoSecundari}; align: center;`);
    texteSecundari.setAttribute('position', '0 0 -0.1');
    texteSecundari.setAttribute('rotation', '0 180 0');
    texteSecundari.setAttribute('scale', '3 3 1');
  }

  switch (tipus) {
    case TIPUSMODALS.continuar: {
      // Generar cami davant
      if (ronda % 2 === 1) generarNouTerra(MODELS.cami);
      if (punts > sessionStorage.getItem("puntuacio")) {
        enviarPuntuacions().then(r => null);
      }
      // Botó per continuar a la següent ronda
      botoPrincipal.addEventListener('hitstart', () => {
        audioBoto();
        escena.removeChild(fonsModal);
        // Modificar les variables per la següent ronda
        ronda++;
        jugant = true;
        if (numEnemicsMax < 10) numEnemicsMax += 0.5;
        if (delayGeneracioEnemics > 100) delayGeneracioEnemics -= 100;
        if (ronda > 6 && enemicsVidaMax < 4) enemicsVidaMax += 0.25;

        comencarRonda();
      });

      // Botó per reiniciar el joc
      botoSecundari.addEventListener('hitstart', () => {
        new Audio(SONS.botoPressionat).play().then(r => location.reload());
      });
      break;
    }
    case TIPUSMODALS.reiniciar: {
      fonsModal.setAttribute('sound', `src: ${SONS.gameOver}; autoplay: true; positional: false`);
      // Envia la informació de les puntuacions si la puntuacio obtinguda és major
      console.log("Puntuacio actual: " + punts + " - anterior: " + sessionStorage.getItem("puntuacio"))
      if (punts > sessionStorage.getItem("puntuacio")) {
        enviarPuntuacions().then(r => null);
      }
      // Listener de la hitbox
      botoPrincipal.addEventListener('hitstart', () => {
        audioBoto();
        eliminarEnemics();
        escena.removeChild(fonsModal);
        //vagoneta.setAttribute('position', '0 0 0');
        // carregar cami a les coordenades 0 0 0 i eliminar l'anterior
        comencTerra = 0;
        eliminarTerres();
        // Modificar les variables per la següent ronda
        numDispars = 0;
        numEncerts = 0;
        punts = 0;
        ronda = 1;
        vida = 10;
        numEnemicsMax = 4;

        vagoneta.emit('startanimReiniciar', null, false);
      });
      break;
    }
    case TIPUSMODALS.menu: {
      crearTaulaPuntuacions();
      fonsModal.setAttribute('sound', `src: ${SONS.menuFons}; autoplay: true; positional: false; loop: true; volume: 0.2;`);
      // new Audio().play().then(r => null);
      // Listener de la hitbox
      botoPrincipal.addEventListener('hitstart', () => {
        audioBoto();
        // Reset de les variables de generació d'enemics
        numEnemicsMax = 4;
        enemicsVidaMax = 1;
        delayGeneracioEnemics = 3700;
        escena.removeChild(fonsModal);
        escena.removeChild(taulaPuntuacions);
        vagoneta.setAttribute('sound', `src:${SONS.jocFons}; autoplay: true; positional: false; loop: true; volume: 0.2;`);

        // Activa el joc (animacions i controlador)
        comencarRonda();
      });
      botoSecundari.addEventListener('hitstart', () => {
        audioBoto();
        numEnemicsMax = 5;
        delayGeneracioEnemics = 1000;
        escena.removeChild(fonsModal);
        escena.removeChild(taulaPuntuacions);
        generadorModals(TIPUSMODALS.sortirPractica);
        controladorEnemics(TIPUSENEMIC.diana).then(r => null);
      });
      break;
    }
    case TIPUSMODALS.sortirPractica: {
      fonsModal.setAttribute('position', `${vagoneta.object3D.position.x + 3} 2 ${vagoneta.object3D.position.z}`);
      fonsModal.setAttribute('rotation', ` 0 90 0`);
      botoPrincipal.addEventListener('hitstart', () => {
        audioBoto();
        jugant = false;
        eliminarEnemics();
        escena.removeChild(fonsModal);
        generadorModals(TIPUSMODALS.menu);
      });
      break;
    }
    case TIPUSMODALS.experiencia: {
      // Listener de la hitbox
      botoPrincipal.addEventListener('hitstart', () => {
        audioBoto();
        escena.removeChild(fonsModal);
        sessionStorage.setItem(TIPUSMODALS.experiencia, "true");
        generadorModals(TIPUSMODALS.sexe);
      });
      botoSecundari.addEventListener('hitstart', () => {
        audioBoto();
        escena.removeChild(fonsModal);
        sessionStorage.setItem(TIPUSMODALS.experiencia, "false");
        generadorModals(TIPUSMODALS.sexe);
      });
      break;
    }
    case TIPUSMODALS.sexe: {
      // Canvia el color del boto secundari
      botoSecundari.setAttribute('material', `color: ${COLORBOTOPRINCIPAL}`);
      // Listener de la hitbox
      botoPrincipal.addEventListener('hitstart', () => {
        audioBoto();
        escena.removeChild(fonsModal);
        sessionStorage.setItem(TIPUSMODALS.sexe, 'H');
        enviarPreguntes();
        generadorModals(TIPUSMODALS.menu);
      });
      botoSecundari.addEventListener('hitstart', () => {
        audioBoto();
        escena.removeChild(fonsModal);
        sessionStorage.setItem(TIPUSMODALS.sexe, 'D');
        enviarPreguntes();
        generadorModals(TIPUSMODALS.menu);
      });
      break;
    }
  }

  escena.appendChild(fonsModal);
}

async function crearTaulaPuntuacions() {
  taulaPuntuacions = document.createElement('a-plane');
  taulaPuntuacions.setAttribute('color', COLORFONSMODAL);
  taulaPuntuacions.setAttribute('opacity', '0.95');
  taulaPuntuacions.setAttribute('position', '-3 1.5 0');
  taulaPuntuacions.setAttribute('height', '3');
  taulaPuntuacions.setAttribute('width', '3');
  taulaPuntuacions.setAttribute('rotation', '0 90 0');
  taulaPuntuacions.innerHTML = "<a-text color=\"#FFF\" value=\"Puntuacions\" align=\"center\" scale=\"0.7 0.7 0.7\" position=\"0 1.3 0\"></a-text>\n" +
    "    <a-text color=\"#FFF\" value=\"#\" align=\"center\" anchor=\"right\" scale=\"0.5 0.5 0.5\" position=\"0 1.1 0\"></a-text>\n" +
    "    <a-text color=\"#FFF\" value=\"Nom\\tPuntuacio\" align=\"center\" scale=\"0.5 0.5 0.5\" position=\"0 1.1 0\"></a-text>\n" +
    "    <a-text color=\"#FFF\" value=\"Ronda\" align=\"center\" anchor=\"left\" scale=\"0.5 0.5 0.5\" position=\"0 1.1 0\"></a-text>\n";

  let colors = ["#323232", "#464646"];
  await fetch("/getTopPuntuacions")
    .then(res => res.json().then(
      data => {
        for (let i = 0; i < data.length; i++) {
          let puntuacio = document.createElement('a-plane');
          puntuacio.setAttribute('height', '0.2');
          puntuacio.setAttribute('width', '2.9');
          puntuacio.setAttribute('position', `0 ${0.9 - (i * 0.22)} 0.01`);
          puntuacio.setAttribute('color', colors[i % 2]);
          let texteNum = document.createElement('a-text');
          texteNum.setAttribute('text', `value: ${i + 1}; align: center; anchor: right;`);
          texteNum.setAttribute('scale', '0.5 0.5 0.5');
          let texte = document.createElement('a-text');
          texte.setAttribute('text', `value: ${data[i].nom}\t${data[i].puntuacio}; align: center;`);
          texte.setAttribute('scale', '0.5 0.5 0.5');
          let texteRonda = document.createElement('a-text');
          texteRonda.setAttribute('text', `value: ${data[i].ronda}; align: center; anchor: left;`);
          texteRonda.setAttribute('scale', '0.5 0.5 0.5');
          puntuacio.appendChild(texteNum);
          puntuacio.appendChild(texte);
          puntuacio.appendChild(texteRonda);
          taulaPuntuacions.appendChild(puntuacio);
        }
      })
    );
  escena.appendChild(taulaPuntuacions);
}
