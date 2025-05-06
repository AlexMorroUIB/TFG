const loader = new THREE.GLTFLoader();

// Constants del joc

// Quantitat de fletxes dins la pool
const TAMANYCARCAIX = 16;
// Temps de penalització quan tira moltes fletxes seguides
const DELAYPENALITZACIO = 4000;
// Metres que avança la vagoneta cada pic
const AVANCVAGONETA = 150;
const GRAVETAT = 9.81;
// Forca (Nm) de tensió de l'arc
const FORCAARC = 300;
const EFICIENCIAARC = 0.9;
const MASSAARC = 0.9; // Massa de l'arc en kg
const MASSAFLETXA = 0.065; // Massa de la fletxa en kg
const FACTORKE = 0.05; // La suma de l'energia cinètica (KE) de les parts mòbils de l'arc.
// Factor de tensió per multiplicar a la distancia de la corda i obtenir la força
const TENSIO = Math.sqrt((EFICIENCIAARC * FORCAARC) / (MASSAFLETXA + FACTORKE * MASSAARC));
const COLORFONSMODAL = '#323232';
const COLORBOTOPRINCIPAL = '#12FF12';
const COLORBOTOSECUNDARI = '#626262';
const LLARGARIATERRA = 150;
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
  gameOver: "#gameOverSo",
  fruitaMorta: "#fruitaMortaSo",
  perdreVida: "#perdreVidaSo"
}

// Variables del joc
let vida = 10;
let punts = 0;
// Num d'enemics màxims simultàniament en pantalla
let numEnemicsMax = 4;
// Màxim de vida que poden tenir els enemics en la ronda actual
let enemicsVidaMax = 1;
let delayGeneracioEnemics = 4000; // Temps en ms que tarda el controlador en generar un nou enemic.
let duracioAvancVagoneta = 120000;
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
let hud = document.getElementById('hud');
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
    /*loader.load(data.asset, function (gltf) {
      el.setObject3D('mesh', gltf.scene);
      //gltf.scene.position.set(document.getElementById('maEsquerra').object3D.position)
    }), undefined, function (error) {
      console.error(error);
    };*/
    //document.getElementById('arc').innerHTML = '<a-entity corda grabbable></a-entity>';
    //let cordaEntity = document.createElement('a-entity');
    cordaEntity.setAttribute('id', 'corda');
    cordaEntity.setAttribute('cordamath', '');
    escena.setAttribute('pool__fletxa', `mixin: fletxa; size: ${TAMANYCARCAIX}`);

    /*let transformControls = new THREE.TransformControls(escena.camera, escena.renderer.domElement);
    transformControls.size = 0.75;
    transformControls.space = 'world';
    transformControls.attach(arcBones.corda);*/
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
        for (let i = 0; i < TAMANYCARCAIX; i++) {
          carcaixTemp.push(escena.components.pool__fletxa.requestEntity());
        }
        for (let i = 0; i < TAMANYCARCAIX; i++) {
          const fletxaTemp = carcaixTemp[i];
          fletxaTemp.setAttribute('class', 'fletxa');
          escena.components.pool__fletxa.returnEntity(fletxaTemp);
        }

        // Moure una fletxa a l'arc
        fletxaActual = escena.components.pool__fletxa.requestEntity();
        fletxaActual.play();
        jugant = true;
        /*let enemic = escena.components.pool__enemic.requestEntity();
        enemic.play();*/

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
        if (localStorage.getItem("existent") === "true") {
          generadorModals(TIPUSMODALS.menu);
        } else {
          generadorModals(TIPUSMODALS.experiencia);
        }
        // generadorModals(TIPUSMODALS.menu);
      }
    });

    /*corda.el.addEventListener('grab-start', () => {
      this.updatePosition.bind(this, hand, element);
    });*/

    this.el.addEventListener('grab-end', (event) => {
      //data.agafat = false;

      //event.detail.hand.object3D.removeChild(element.object3D);
      // Aquí puedes agregar lógica para soltar el objeto si es necesario
    });
  }
});

function calculateTension() {
  // Calcular la distancia entre el punto central de la cuerda y el punto de anclaje
  const distancia = Math.min((maArc.object3D.position.distanceTo(maCorda.object3D.position) / 4), 0.2);

  // Calcular la tensión (puedes usar una fórmula más compleja si es necesario)
  //return Math.sqrt( (0.9*300*distancia) / (0.065 + 0.05*0.9));
  return TENSIO * Math.sqrt(distancia);
}

AFRAME.registerComponent('cordamath', {
  schema: {
    anclaSuperior: {type: 'number', default: 0.82},
    anclaInferior: {type: 'number', default: -0.56},
    puntIntermigSuperior: {type: 'number', default: 0.14},
    puntIntermigInferior: {type: 'number', default: 0.12},
    width: {type: 'number', default: 0.05},
    height: {type: 'number', default: 0.25},
    depth: {type: 'number', default: 0.05},
    color: {type: 'color', default: '#2D2D2D'},
    cordaRecta: {type: 'number', default: 0.0}
  },
  init: function () {
    let data = this.data;
    let el = this.el;

    // Create mesh.
    this.mesh = calcularCorda(data.cordaRecta)
    // Set mesh on entity.
    el.setObject3D('mesh', this.mesh);

  },
  remove: function () {
    // Remove element.
    this.el.removeFromParent();
    maArc.removeChild(this.el);
  }
});

/**
 * Genera una THREE.Line a partir d'una THREE.CatmullRomCurve3 simulant la corda de l'arc.
 * @param distanciaMans Distància entre les mans, si és 0.0, la corda és recta.
 * @returns {Line} La THREE.Line que simula la corda.
 */
function calcularCorda(distanciaMans) {
  let corda = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, cordaEntity.components.cordamath.data.anclaSuperior, 0),
    new THREE.Vector3(0, cordaEntity.components.cordamath.data.puntIntermigSuperior, distanciaMans),
    new THREE.Vector3(0, cordaEntity.components.cordamath.data.puntIntermigInferior, distanciaMans),
    new THREE.Vector3(0, cordaEntity.components.cordamath.data.anclaInferior, 0)
  ]);
  let pointsCorda = corda.getPoints(50);
  let geometry = new THREE.BufferGeometry().setFromPoints(pointsCorda);
  // Create material.
  let material = new THREE.LineBasicMaterial({
    color: cordaEntity.components.cordamath.data.color,
    linewidth: 1
  });
  // Create mesh.
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
    temps: {type: 'number', default: 0}
  },
  init: function () {
    let data = this.data;
    let element = this.el;
    element.setAttribute('gltf-model', data.asset);

    element.addEventListener('grab-start', (event) => {
      let ma = event.detail.hand;
      if (!data.agafada && (event.detail.buttonEvent.type === "gripdown" || event.detail.buttonEvent.type === "triggerdown")) {
        data.ma = document.getElementById(ma.id);
        data.agafada = true;
        fletxaActual.removeAttribute('aabb-collider');
        fletxaActual.setAttribute('aabb-collider', 'objects: .hitbox; interval: 20');
      }
    });

    element.addEventListener('grab-end', (event) => {
      if (event.detail.buttonEvent.type === "gripup" || event.detail.buttonEvent.type === "triggerup") {
        data.agafada = false;
        numDispars++;
        console.log("Dispars: " + numDispars);
        cordaEntity.setObject3D('mesh', calcularCorda(0.0));
        // Calcular la força de dispar
        data.forca = calculateTension()
        // Agafa la rotació de l'objecte en radians comparant-la amb la rotació 0
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
        // Si ha tirat moltes fletxes seguides hi ha un delay com a "penalització"
        if (fletxaActual === undefined) {
          delay(DELAYPENALITZACIO).then(() => {
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
      data.disparada = false;
    });
  },
  tick: function (time, timeDelta) {
    let data = this.data;
    let el = this.el;
    if (data.disparada) {
      // Aplica la fórmula de la trajectòria de projectils per moure la fletxa cap endavant i cap abaix
      let distX = data.velX * data.temps;
      let distY = data.velY * data.temps - (GRAVETAT * data.temps * data.temps * 0.5);
      el.object3D.translateZ(-(distX - data.distAnteriorX));
      el.object3D.translateY(distY - data.distAnteriorY);
      data.temps += 0.01;
      data.distAnteriorX = distX;
      data.distAnteriorY = distY;
      // Si el temps es major a 8 retorna la fletxa a la pool
      if (data.temps >= 8) escena.components.pool__fletxa.returnEntity(this.el);
    } else if (data.agafada) {
      igualaPosicioRotacio(el);
      // Es mou cap enrrere el màxim (en negatiu perque va cap enrrere) entre la distància entre les mans i 0.4 metres
      let distanciaMans = Math.min((maArc.object3D.position.distanceTo(data.ma.object3D.position) / 4), 0.2);
      //if (distanciaMans < 0.0) distanciaMans = 0.0;
      el.object3D.translateZ(-distanciaMans);
      cordaEntity.setObject3D('mesh', calcularCorda(distanciaMans * 2));
    } else {
      igualaPosicioRotacio(el);
    }
  }
});

/**
 * Iguala la rotació de la fletxa mab la rotació de l'arc
 * @param fletxa fletxa actualment a l'arc
 */
function igualaPosicioRotacio(fletxa) {
  // Mou la fletxa a la ma
  const maWorldPos = new THREE.Vector3();
  maArc.object3D.getWorldPosition(maWorldPos);
  fletxa.setAttribute('position', {
    x: maWorldPos.x,
    y: maWorldPos.y,
    z: maWorldPos.z
  });
  // iguala la rotació de la ma
  let maQuaternion = new THREE.Quaternion(
    -maArc.object3D.quaternion.x,
    maArc.object3D.quaternion.y,
    -maArc.object3D.quaternion.z,
    maArc.object3D.quaternion.w)
  fletxa.object3D.setRotationFromQuaternion(maQuaternion.multiply(OFFSETFLETXA));
}

function updatePosition() {
  // Copia la posició i rotació de la mà a l'arc
  let corda = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.92, 0),
    new THREE.Vector3(-0.5, 0.05, 0),
    new THREE.Vector3(-0.5, -0.05, 0),
    new THREE.Vector3(0, -0.92, 0)
  ]);

  cordaEntity.object3D.geometry = new THREE.BufferGeometry().setFromPoints(
    corda.getPoints(50)
  );
  //arcEntity.setAttribute('postion', ma.getAttribute('position'));
  //cordaEntity.setAttribute('postion', ma.getAttribute('position'));
  //cordaEntity.setAttribute('rotation', ma.getAttribute('rotation'));
}

window.onload = () => {

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

      enemic.setAttribute('position', {
        x: (valorAleatoriFloat(xMin, xMax) * (Math.round(Math.random()) * 2 - 1)),
        y: tipus === TIPUSENEMIC.planta ? altura : (Math.random() * (altura - 0.5) + 0.5).toFixed(1),
        z: vagoneta.object3D.position.z + valorAleatoriInt(distancia - 5, distancia + 5)
      });

      if (tipus === TIPUSENEMIC.planta) {
        // Assigna una quantitat de vida aleatòria
        enemic.setAttribute(tipus, `vida: ${valorAleatoriInt(1, enemicsVidaMax)};
                                          tamany: ${valorAleatoriFloat(0.8, 2)}`);
        enemic.setAttribute('class', 'enemic');
      } else {
        enemic.setAttribute(tipus, '');
        enemic.setAttribute('class', 'hitbox enemic');
        enemic.emit('startanimCreixer', null, false);
      }
      //console.log(enemic)
      /*enemic.setAttribute('animation', `property: position;
      to: ${(Math.random() * (xMax - xMin + 1) + xMin) * (Math.round(Math.random()) * 2 - 1)} 1 ${vagoneta.object3D.position.z + 20};
      dur: 1; easing: linear; loop: false`);*/

      escena.appendChild(enemic);
      /*console.log("enemic: ")
      console.log(enemic.getAttribute('position'))*/
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
    tamany: {type: 'number', default: 1},
    vida: {type: 'number', default: 1},
    maxDistanciaVagoneta: {type: 'number', default: 40},
    enEscena: {type: 'boolean', default: true}
  },
  init: function () {
    let data = this.data;
    let element = this.el;

    element.setAttribute('rotation', `0 ${valorAleatoriFloat(0, 360)} 0`);
    element.setAttribute('scale', `${data.tamany} ${data.tamany} ${data.tamany}`);

    // Geometria i hitbox de l'planta
    let plantaEntity = document.createElement('a-entity');
    plantaEntity.setAttribute('gltf-model', data.asset);
    plantaEntity.setAttribute('animation-mixer', 'clip: arrelCreixer; loop: once; clampWhenFinished: true;');

    // Geometria i hitbox de la fruita
    let fruitaEntity = document.createElement('a-entity');
    fruitaEntity.setAttribute('gltf-model', data.assetFruita);
    fruitaEntity.setAttribute('class', 'hitbox');
    fruitaEntity.setAttribute('visible', 'false');
    fruitaEntity.setAttribute('sound', `src: ${SONS.fruitaMorta}; autoplay: false; positional: true; volume: 10`);

    fruitaEntity.addEventListener('model-loaded', () => {
      actualitzarColor();
    });

    fruitaEntity.addEventListener('hitstart', (event) => {
      if (data.vida < 2) {
        enemicsEnPantalla--;
        punts++;
        fruitaEntity.setAttribute('animation-mixer', 'clip: *Morir; loop: once; clampWhenFinished: true;');
        plantaEntity.setAttribute('animation-mixer', 'clip: *Morir; loop: once; clampWhenFinished: true;');
        fruitaEntity.components.sound.playSound();
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
      let mesh = fruitaEntity.getObject3D('mesh')
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
        vagoneta.components.sound.playSound();
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
 * també comprova si la vida és <= a 0, si ho és acaba la partida.
 */
function actualitzarVidaPunts() {
  vidaEntity.setAttribute('text', `value: Vida: ${vida}\nPunts: ${punts};align: center`);
  if (vida <= 0) partidaAcabada();
}

/**
 * Atura el controlador d'enemics, pausa la vagoneta
 * i genera el modal d'acabament de partida
 */
function partidaAcabada() {
  jugant = false;
  vagoneta.components['animation__moure'].pause();
  generadorModals(TIPUSMODALS.reiniciar);
}

AFRAME.registerComponent('terra', {
  schema: {
    asset: {type: 'asset', default: MODELS.cami},
    maxDistanciaVagoneta: {type: 'number', default: 299},
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
    /*loader.load(data.asset, function (gltf) {
      element.setObject3D('mesh', gltf.scene);
    }), undefined, function (error) {
      console.error(error);
    };*/
    element.setAttribute('scale', '0.5 0.5 0.5');
    element.setAttribute('position', '0 0 0');
    element.setAttribute('sound', `src: ${SONS.perdreVida}; autoplay: false; positional: false;`);

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
    /*vidaEntity.setAttribute('src', data.cor);
    vidaEntity.setAttribute('repeat', vida);*/
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

  if (tipus === TIPUSMODALS.continuar) {
    stringTitol = "Punt de control";
    stringTexte = "Descansa, beu aigua i continua quan estiguis llest/a.";
    stringBotoPrincipal = "Continuar";
    stringBotoSecundari = "Sortir";
  } else if (tipus === TIPUSMODALS.reiniciar) {
    stringTitol = "Joc acabat";
    stringTexte = "Has deixat passar massa enemics...\nPots tornar-ho a intentar.";
    stringBotoPrincipal = "Reiniciar";
  } else if (tipus === TIPUSMODALS.menu) {
    stringTitol = "Benvingut/da";
    stringTexte = "Utilitza l'arc i les fletxes per seleccionar els botons.\nPots comencar una partida normal\no jugar en el mode de practica.\nEn el mode normal has de disparar a les fruites\nque surten de les branques liles.\n\nPuntuacio anterior: " + localStorage.getItem("puntuacio");
    stringBotoPrincipal = "Iniciar";
    stringBotoSecundari = "Practica";
  } else if (tipus === TIPUSMODALS.sortirPractica) {
    stringTitol = "Sortir";
    stringTexte = "Surt del mode de practica.";
    stringBotoPrincipal = "Sortir";
  } else if (tipus === TIPUSMODALS.experiencia) {
    stringTitol = "Benvingut/da";
    stringTexte = "Tens experiencia previa jugant realitat virtual?\nUtilitza l'arc i les fletxes per seleccionar els botons.";
    stringBotoPrincipal = "Si";
    stringBotoSecundari = "No";
  } else if (tipus === TIPUSMODALS.sexe) {
    stringTitol = "Benvingut/da";
    stringTexte = "Com t'identifiques?\nUtilitza l'arc i les fletxes per seleccionar els botons.";
    stringBotoPrincipal = "Home";
    stringBotoSecundari = "Dona";
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

  if (tipus === TIPUSMODALS.continuar) {
    // Generar cami davant
    generarNouTerra(MODELS.cami);
    if (punts >= localStorage.getItem("puntuacio")) {
      enviarPuntuacions().then(r => null);
    }
    // Listener de la hitbox
    botoPrincipal.addEventListener('hitstart', () => {
      escena.removeChild(fonsModal);
      // Modificar les variables per la següent ronda
      ronda++;
      jugant = true;
      if (numEnemicsMax < 10) numEnemicsMax += 0.5;
      if (delayGeneracioEnemics > 100) delayGeneracioEnemics -= 100;
      if (ronda > 6 && enemicsVidaMax < 4) enemicsVidaMax += 0.25;

      comencarRonda();
    });
    botoSecundari.addEventListener('hitstart', () => {
      location.reload();
    });
  } else if (tipus === TIPUSMODALS.reiniciar) {
    fonsModal.setAttribute('sound', `src: ${SONS.gameOver}; autoplay: true; positional: false`);
    // Envia la informació de les puntuacions si la puntuacio obtinguda és major
    console.log("Puntuacio actual: " + punts + " - anterior: " + localStorage.getItem("puntuacio"))
    if (punts >= localStorage.getItem("puntuacio")) {
      enviarPuntuacions().then(r => null);
    }
    // Listener de la hitbox
    botoPrincipal.addEventListener('hitstart', () => {
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
  } else if (tipus === TIPUSMODALS.menu) {
    // Listener de la hitbox
    botoPrincipal.addEventListener('hitstart', () => {
      // Reset de les variables de generació d'enemics
      numEnemicsMax = 4;
      enemicsVidaMax = 1;
      delayGeneracioEnemics = 4000;
      escena.removeChild(fonsModal);

      // Activa el joc (animacions i controlador)
      comencarRonda();
    });
    botoSecundari.addEventListener('hitstart', () => {
      numEnemicsMax = 5;
      delayGeneracioEnemics = 1000;
      escena.removeChild(fonsModal);
      generadorModals(TIPUSMODALS.sortirPractica);
      controladorEnemics(TIPUSENEMIC.diana).then(r => null);
    });
  } else if (tipus === TIPUSMODALS.sortirPractica) {
    fonsModal.setAttribute('position', `${vagoneta.object3D.position.x + 3} 2 ${vagoneta.object3D.position.z}`);
    fonsModal.setAttribute('rotation', ` 0 90 0`);
    botoPrincipal.addEventListener('hitstart', () => {
      jugant = false;
      eliminarEnemics();
      numEnemicsMax = 4;
      delayGeneracioEnemics = 4000;
      escena.removeChild(fonsModal);
      generadorModals(TIPUSMODALS.menu);
    });
  } else if (tipus === TIPUSMODALS.experiencia) {
    // Listener de la hitbox
    botoPrincipal.addEventListener('hitstart', () => {
      escena.removeChild(fonsModal);
      localStorage.setItem(TIPUSMODALS.experiencia, "true");
      generadorModals(TIPUSMODALS.sexe);
    });
    botoSecundari.addEventListener('hitstart', () => {
      escena.removeChild(fonsModal);
      localStorage.setItem(TIPUSMODALS.experiencia, "false");
      generadorModals(TIPUSMODALS.sexe);
    });
  } else if (tipus === TIPUSMODALS.sexe) {
    // Canvia el color del boto secundari
    botoSecundari.setAttribute('material', `color: ${COLORBOTOPRINCIPAL}`);
    // Listener de la hitbox
    botoPrincipal.addEventListener('hitstart', () => {
      escena.removeChild(fonsModal);
      localStorage.setItem(TIPUSMODALS.sexe, 'H');
      enviarPreguntes();
      generadorModals(TIPUSMODALS.menu);
    });
    botoSecundari.addEventListener('hitstart', () => {
      escena.removeChild(fonsModal);
      localStorage.setItem(TIPUSMODALS.sexe, 'D');
      enviarPreguntes();
      generadorModals(TIPUSMODALS.menu);
    });
  }

  escena.appendChild(fonsModal);
}

async function enviarPuntuacions() {
  await fetch("/updatePuntuacio", {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nom: localStorage.getItem("nom"),
      edat: localStorage.getItem("edat"),
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

async function enviarPreguntes() {
  await fetch("/preguntesUsuari", {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nom: localStorage.getItem("nom"),
      edat: localStorage.getItem("edat"),
      experiencia: localStorage.getItem(TIPUSMODALS.experiencia),
      sexe: localStorage.getItem(TIPUSMODALS.sexe)
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

AFRAME.registerComponent("diana", {
  schema: {
    asset: {type: 'asset', default: MODELS.diana},
    color: {type: 'string', default: '#525252'}
    //position="0 0 -2" width="1" height="1"
  },
  init: function () {
    let data = this.data;
    let element = this.el;

    element.setAttribute('gltf-model', data.asset);

    element.addEventListener('hitstart', () => {
      enemicsEnPantalla--;
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
 * Zona Audio
 */
document.addEventListener("sound-ended", (e) => {
  console.log("So:")
  console.log(e.name)
  console.log(e.id)
  console.log("--------------------------------")
});


/**
 * Eliminar les dades dels objectes 3D quan s'eliminen les entitats
 */
AFRAME.registerComponent("gltf-model", {
  remove: function () {
    if (!this.model) {
      return;
    }
    this.el.removeObject3D("mesh");
    // New code to remove all resources
    this.model.traverse(disposeNode);
    this.model = null;
    THREE.Cache.clear();
    // Empty renderLists to remove references to removed objects for garbage collection
    this.el.sceneEl.renderer.renderLists.dispose();
  },
});

// Explicitly dispose any textures assigned to this material
function disposeTextures(material) {
  for (const propertyName in material) {
    const texture = material[propertyName];
    if (texture instanceof THREE.Texture) {
      const image = texture.source.data;
      if (image instanceof ImageBitmap) {
        image.close && image.close();
      }
      texture.dispose();
    }
  }
}

function disposeNode(node) {
  if (node instanceof THREE.Mesh) {
    const geometry = node.geometry;
    if (geometry) {
      geometry.dispose();
    }
    const material = node.material;
    if (material) {
      if (Array.isArray(material)) {
        for (let i = 0, l = material.length; i < l; i++) {
          const m = material[i];
          disposeTextures(m);
          m.dispose();
        }
      } else {
        disposeTextures(material);
        material.dispose(); // disposes any programs associated with the material
      }
    }
  }
}
