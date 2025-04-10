const loader = new THREE.GLTFLoader();

// Constants del joc

// Quantitat de fletxes dins la pool
const TAMANYCARCAIX = 16;
// Metres que avança la vagoneta cada pic
const AVANCVAGONETA = 150;
const GRAVETAT = 9.81;
// Forca de tensió de l'arc
const FORCAARC = 250;
const EFICIENCIAARC = 0.9;
const MASSAARC = 0.9; // Massa de l'arc en kg
const MASSAFLETXA = 0.065; // Massa de la fletxa en kg
const FACTORKE = 0.05; // La suma de l'energia cinètica (KE) de les parts mòbils de l'arc.
// Factor de tensió per multiplicar a la distancia de la corda i obtenir la força
const TENSIO = Math.sqrt((EFICIENCIAARC * FORCAARC) / (MASSAFLETXA + FACTORKE * MASSAARC));
const COLORFONSMODAL = '#323232';
const COLORBOTOPRINCIPAL = '#12FF12';
const COLORBOTOSECUNDARI = '#626262';
// Tipus d'enemics possibles
const TIPUSENEMIC = {
  enemic: "enemic",
  diana: "diana"
};
// Tipus de terres possibles (entorn joc principal o practica)
const TERRES = {
  cami: "#terraAsset",
  cami2: "#terraAsset2",
  practica: "#practicaAsset"
};
const TIPUSMODALS = {
  continuar: "continuar",
  reiniciar: "reiniciar",
  menu: "menu",
  sortirPractica: "sortir practica"
}
const LLARGARIATERRA = 150;

// Variables del joc
let vida = 10;
let punts = 0;
let numEnemicsMax = 10;  // Num d'enemics màxims simultàniament en pantalla
let delayGeneracioEnemics = 100; // Temps en ms que tarda el controlador en generar un nou enemic.
let duracioAvancVagoneta = 120000;

// Variables i constants de l'escena
const OFFSETFLETXA = new THREE.Quaternion(0.501213, 0.0, 0.0, 0.8653239);
let escena = document.getElementById('escena');
let arcEntity = document.getElementById('arc');
let controls = document.getElementById('controls');
let camera = document.getElementById('camera');
let vagoneta = document.getElementById('vagoneta');
let hud = document.getElementById('hud');
let jugant = false;
let enemicsEnPantalla = 0;
let numCaminsEndavant = 0;
let posicioCamins = 0;
let vidaEntity;
/*let cordaBone
let anchorDBone*/
let cordaEntity = document.createElement('a-entity');
//let carcaix = new Array(TAMANYCARCAIX);
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
    asset: {type: 'asset', default: '../assets/models/arc.glb'},
    width: {type: 'number', default: 0.4},
    height: {type: 'number', default: 0.6},
    depth: {type: 'number', default: 0.2},
    ma: {type: 'asset'},
    agafat: {type: 'boolean', default: false}
  },
  init: function (qualifiedName, value) {
    let data = this.data;
    let el = this.el;
    loader.load(data.asset, function (gltf) {
      el.setObject3D('mesh', gltf.scene);
      //gltf.scene.position.set(document.getElementById('maEsquerra').object3D.position)
    }), undefined, function (error) {
      console.error(error);
    };
    //document.getElementById('arc').innerHTML = '<a-entity corda grabbable></a-entity>';
    //let cordaEntity = document.createElement('a-entity');
    cordaEntity.setAttribute('id', 'corda');
    cordaEntity.setAttribute('cordamath', '');
    //cordaEntity.setAttribute('grabbable', '')
    //let poolFletxes = document.createElement('a-entity');
    //let opcions = "mixin: fletxa; size: ".concat(TAMANYCARCAIX.toString());
    escena.setAttribute('pool__fletxa', `mixin: fletxa; size: ${TAMANYCARCAIX}`);
    //escena.setAttribute('pool__enemic', `mixin: enemic; size: ${NUMENEMICS}; dynamic: true`)

    //escena.appendChild(poolFletxes)
    //crearFletxes();

    /*let transformControls = new THREE.TransformControls(escena.camera, escena.renderer.domElement);
    transformControls.size = 0.75;
    transformControls.space = 'world';
    transformControls.attach(arcBones.corda);*/
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.


    this.el.addEventListener('grab-start', (event) => {
      if (!data.agafat && event.detail.buttonEvent.type === "gripdown" || event.detail.buttonEvent.type === "triggerdown") {
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
          maCorda = document.getElementById("maDreta")
          //document.getElementById("maDreta").setAttribute('gltf-model', data.fletxa);
        } else {
          // Canviar la ma esquerra per una fletxa
          maCorda = document.getElementById("maEsquerra")
          //document.getElementById("maEsquerra").setAttribute('gltf-model', data.fletxa);
        }

        //generarCamins();
        generadorModals(TIPUSMODALS.menu);
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
  update: function (oldData) {

  },
  tick: function (time, timeDelta) {
    /*let data = this.data;
    let el = this.el;
    if (data.agafat) {
      // Solo actualizamos la posición en Z
      el.setAttribute('position', {
        x: data.posInicial[0],
        y: data.posInicial[1],
        z: data.ma.object3D.position.z
      });
    }*/
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
    asset: {type: 'asset', default: '../assets/models/fletxa.glb'},
    width: {type: 'number', default: 0.05},
    height: {type: 'number', default: 0.05},
    depth: {type: 'number', default: 0.5},
    color: {type: 'color', default: '#FFAA00'},
    ma: {type: 'asset'},
    posInicial: {type: 'array', default: [0, 0, 0]},
    posDispar: {type: 'array', default: [0, 0, 0]},
    //rotacio: {type: 'boolean', default: false},
    agafada: {type: 'boolean', default: false},
    disparada: {type: 'boolean', default: false},
    forca: {type: 'number', default: 0},
    velX: {type: 'number', default: 0},
    velY: {type: 'number', default: 0},
    distAnteriorX: {type: 'number', default: 0},
    distAnteriorY: {type: 'number', default: 0},
    altura: {type: 'number', default: 0},
    temps: {type: 'number', default: 0}
  },
  init: function () {
    let data = this.data;
    let el = this.el;
    let geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
    let material = new THREE.MeshBasicMaterial({color: data.color});
    this.mesh = new THREE.Mesh(geometry, material);
    el.setObject3D('mesh', this.mesh);

    loader.load(data.asset, function (gltf) {
      el.setObject3D('mesh', gltf.scene);
    }), undefined, function (error) {
      console.error(error);
    };
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.

    this.el.addEventListener('grab-start', (event) => {
      /*console.log("start")
      console.log(event.detail.buttonEvent)
      console.log(event.detail.buttonEvent.type)*/
      let ma = event.detail.hand;
      if (!data.agafada && ma.id === maCorda.id && event.detail.buttonEvent.type === "triggerdown") {
        data.ma = document.getElementById(ma.id);
        data.agafada = true;
        fletxaActual.removeAttribute('aabb-collider');
        fletxaActual.setAttribute('aabb-collider', 'objects: .hitbox; interval: 20');
      }
    });

    this.el.addEventListener('grab-end', (event) => {
      /*console.log("end: ")
      console.log(event.detail.buttonEvent.type)*/
      let ma = event.detail.hand;
      if (ma.id === maCorda.id && event.detail.buttonEvent.type === "triggerup") {
        data.agafada = false;
        cordaEntity.setObject3D('mesh', calcularCorda(0.0));
        // Calcular la força de dispar
        data.forca = calculateTension()
        // Agafa la rotació de l'objecte en radians comparant-la amb la rotació 0
        let rotacio = this.el.object3D.quaternion.angleTo(
          new THREE.Quaternion(0, 0, 0, 0)
        );
        console.log(rotacio)
        data.velX = data.forca * Math.cos(rotacio);
        data.velY = data.forca * Math.sin(rotacio);

        // Canvia la rotació Z a 0 per poder fer TranslateY i vagi cap abaix
        this.el.object3D.rotation.z = 0;
        // Dispara la fletxa i agafa una de nova
        data.disparada = true;
        fletxaActual = escena.components.pool__fletxa.requestEntity();
        // Resetetjar els valors de la fletxa disparada a 0
        fletxaActual.components.fletxa.data.disparada = false;
        fletxaActual.components.fletxa.data.temps = 0;
        fletxaActual.components.fletxa.data.forca = 0;
        fletxaActual.components.fletxa.data.velX = 0;
        fletxaActual.components.fletxa.data.velY = 0;
        fletxaActual.components.fletxa.data.distAnteriorX = 0;
        fletxaActual.components.fletxa.data.distAnteriorY = 0;
        fletxaActual.play()
        /*fletxaActual = (element.id + 1) % carcaix.length;
        let seguentFletxa = carcaix[fletxaActual];
        seguentFletxa.el.data.carregada = true;*/

        //fletxaEntity.setAttribute('dynamic-body', '')
        // Moure una nova fletxa a l'arc
      }
    });

    this.el.addEventListener('hitstart', (event) => {
      //let enemic = event.detail.intersectedEls[0]
      //console.log(enemic)
      //console.log(hit.getAttribute('class') === 'enemic')
      //if (hit.getAttribute('class') === 'enemic') {
      /*console.log("fletxa: ")
      console.log(this.el.object3D.position)*/
      escena.components.pool__fletxa.returnEntity(this.el);
      //}
      this.data.disparada = false;
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
      // Si el temps es major a 15 retorna la fletxa a la pool
      if (data.temps >= 15) escena.components.pool__fletxa.returnEntity(this.el);
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
  },
  remove: function () {
    let data = this.data;
    let element = this.el;

    // Remove event listener.
    if (data.event) {
      el.removeEventListener(data.event, this.eventHandlerFn);
    }
    // Remove element.
    element.remove();
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
  // x = distancia del centre del cami
  let xMin = 4;
  let xMax = 8;
  let distancia = 20; // distancia a la vagoneta
  let altura = 1;
  if (tipus === TIPUSENEMIC.diana) {
    xMin = 0;
    xMax = 4;
    distancia = 10;
    altura = 2.0;
  }
  //console.log(escena.components.pool__enemic)
  while (jugant) {
    if (enemicsEnPantalla <= numEnemicsMax) {
      const enemic = document.createElement('a-entity');
      enemic.setAttribute(tipus, '');
      enemic.setAttribute('class', 'hitbox enemic');
      //console.log(enemic)
      /*enemic.setAttribute('animation', `property: position;
      to: ${(Math.random() * (xMax - xMin + 1) + xMin) * (Math.round(Math.random()) * 2 - 1)} 1 ${vagoneta.object3D.position.z + 20};
      dur: 1; easing: linear; loop: false`);*/
      enemic.setAttribute('position', {
        x: (Math.random() * (xMax - xMin + 1) + xMin) * (Math.round(Math.random()) * 2 - 1),
        y: tipus === TIPUSENEMIC.enemic ? altura : (Math.random() * (altura - 0.5) + 0.5).toFixed(1),
        z: vagoneta.object3D.position.z + tipus === TIPUSENEMIC.enemic ? distancia : (Math.random() * (distancia - 5) + 5)
      });

      escena.appendChild(enemic);
      enemic.play();
      /*console.log("enemic: ")
      console.log(enemic.getAttribute('position'))*/
      enemicsEnPantalla++;
    }
    await delay(delayGeneracioEnemics);
  }
}

// Component enemics
AFRAME.registerComponent('enemic', {
  schema: {
    event: {type: 'string', default: ''},
    width: {type: 'number', default: 0.5},
    height: {type: 'number', default: 1.75},
    depth: {type: 'number', default: 0.5},
    color: {type: 'color', default: '#FF9A00'},
    maxDistanciaVagoneta: {type: 'number', default: 40},
    enEscena: {type: 'boolean', default: true}
  },
  init: function () {
    let data = this.data;
    let element = this.el;
    //el.object3D.lookAt(controls.object3D);
    let geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
    let material = new THREE.MeshBasicMaterial({color: data.color});
    this.mesh = new THREE.Mesh(geometry, material);
    element.setObject3D('mesh', this.mesh);
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.

    this.el.addEventListener('hitstart', (event) => {
      enemicsEnPantalla--;
      punts++;
      this.remove();
      modificarVidaPunts();
    });

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
        modificarVidaPunts();
        this.remove();
      }
      const controlsWorldPos = new THREE.Vector3();
      controls.object3D.getWorldPosition(controlsWorldPos);
      element.object3D.lookAt(controlsWorldPos);
    }
  },
  remove: function () {
    // Remove element.
    escena.removeChild(this.el);
    this.el.removeFromParent();
  }
});

/**
 * Modifica el texte que conté la vida i els punts del jugador,
 * també comprova si la vida és <= a 0, si ho és acaba la partida.
 */
function modificarVidaPunts() {
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
    asset: {type: 'asset', default: '../assets/models/terra.glb'},
    maxDistanciaVagoneta: {type: 'number', default: 299},
    enEscena: {type: 'boolean', default: true}
  },
  init: function () {
    let data = this.data;
    let el = this.el;

    loader.load(data.asset, function (gltf) {
      el.setObject3D('mesh', gltf.scene);
    }), undefined, function (error) {
      console.error(error);
    };
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
    asset: {type: 'asset', default: '../assets/models/cart.glb'},
    cor: {type: 'asset', default: '../assets/models/cor.png'},
    width: {type: 'number', default: 5},
    height: {type: 'number', default: 5}
  },
  init: function () {
    let data = this.data;
    let element = this.el

    loader.load(data.asset, function (gltf) {
      element.setObject3D('mesh', gltf.scene);
    }), undefined, function (error) {
      console.error(error);
    };
    element.setAttribute('scale', '0.5 0.5 0.5');
    element.setAttribute('position', '0 0 0');

    vidaEntity = document.createElement('a-entity');
    vidaEntity.setAttribute('text', `value: Vida: ${vida}\n\nPunts: ${punts};align: center`);
    vidaEntity.setAttribute('rotation', `-11   180 0`);
    vidaEntity.setAttribute('position', `0 1.45 0.86`);
    /*vidaEntity.setAttribute('src', data.cor);
    vidaEntity.setAttribute('repeat', vida);*/
    vagoneta.appendChild(vidaEntity);

    this.el.addEventListener("animationcomplete", async () => {
      jugant = false;
      await delay(80).then( () => {
        eliminarEnemics();
        generadorModals(TIPUSMODALS.continuar);
      });
    });
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.
  },
  tick: function (time, timeDelta) {
    /*if (controls.object3D.position.x > 1) controls.object3D.position.x = 1;
    if (controls.object3D.position.x < -1) controls.object3D.position.x = -1;
    if (controls.object3D.position.z > 1) controls.object3D.position.z = 1;
    if (controls.object3D.position.z < -1) controls.object3D.position.z = -1;*/
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
    stringTexte = "Descansa, beu aigua i continua quan estiguis llest.";
    stringBotoPrincipal = "Continuar";
  } else if (tipus === TIPUSMODALS.reiniciar) {
    stringTitol = "Joc acabat";
    stringTexte = "Has deixat passar massa enemics...\nPots tornar-ho a intentar.";
    stringBotoPrincipal = "Reiniciar";
  } else if (tipus === TIPUSMODALS.menu) {
    stringTitol = "Benvingut/da";
    stringTexte = "Utilitza l'arc i les fletxes per seleccionar els botons.\nPots començar una partida o jugar en el mode de pràctica.";
    stringBotoPrincipal = "Començar";
    stringBotoSecundari = "Pràctica";
  } else if (tipus === TIPUSMODALS.sortirPractica) {
    stringTitol = "Sortir";
    stringTexte = "Surt del mode de pràctica.";
    stringBotoPrincipal = "Sortir";
  }

  // Fons del modal
  fonsModal.setAttribute('geometry', 'primitive: box; width: 3; height: 2; depth: 0.1');
  fonsModal.setAttribute('material', `color: ${COLORFONSMODAL};opacity: 0.5`);
  fonsModal.setAttribute('position', `0 2 ${vagoneta.object3D.position.z + 3}`);

  // Texte del modal
  fonsModal.appendChild(titolModal);
  fonsModal.appendChild(texteModal);
  titolModal.setAttribute('text', `value: ${stringTitol}; align: center;`);
  titolModal.setAttribute('position', '0 0.6 -0.1');
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

  if (tipus === TIPUSMODALS.continuar) {
    // Listener de la hitbox
    generarNouTerra(TERRES.cami2);
    botoPrincipal.addEventListener('hitstart', () => {
      escena.removeChild(fonsModal);
      // carregar cami davant i eliminar anterior
      // Modificar les variables per la següent ronda
      jugant = true;
      if (numEnemicsMax < 10) numEnemicsMax += 0.5;
      if (delayGeneracioEnemics > 100) delayGeneracioEnemics -= 100;
      vagoneta.setAttribute('animation__moure', `property: position;
      to: 0 0 ${vagoneta.object3D.position.z + AVANCVAGONETA}; dur: ${duracioAvancVagoneta};
      easing: linear; loop: false`);
      vagoneta.play();
      controladorEnemics(TIPUSENEMIC.enemic).then(r => null);
    });
  } else if (tipus === TIPUSMODALS.reiniciar) {
    // Listener de la hitbox
    botoPrincipal.addEventListener('hitstart', () => {
      escena.removeChild(fonsModal);
      //vagoneta.setAttribute('position', '0 0 0');
      // carregar cami a les coordenades 0 0 0 i eliminar l'anterior
      generarNouTerra(TERRES.cami);
      eliminarEnemics();
      // Modificar les variables per la següent ronda
      vida = 10;
      numEnemicsMax = 4;
      vagoneta.setAttribute('animation__moure', `property: position;
      to: 0 0 0; dur: 1;
      easing: linear; loop: false`);
      // TODO reiniciar model de la ma
      let maAsset = "../assets/models/maEsquerra.glb"
      if (maArc.id === "maDreta") "../assets/models/maDreta.glb"
      maArc.setAttribute('gltf-model', maAsset);
      cordaEntity.remove();

      /*let arc = document.createElement('a-entity');
      arc.setAttribute('arc', 'asset: #arcAsset');
      arc.setAttribute('id', 'arc');
      arc.setAttribute('position', '0.2 1 0.8');
      arc.setAttribute('rotation', '30 180 30');
      arc.setAttribute('grabbable', '');*/

      //arcEntity = arc;
      arcEntity.removeAttribute('hidden');
      //vagoneta.appendChild(arc);
      escena.components.pool__fletxa.returnEntity(fletxaActual);

      maArc = null;
      maCorda = null;
    });
  } else if (tipus === TIPUSMODALS.menu) {
    // Mou el boto principal i afegeix el boto secundari
    botoPrincipal.setAttribute('position', `-0.6 -0.6 -0.1`);
    fonsModal.appendChild(botoSecundari);
    botoSecundari.setAttribute('class', 'hitbox');
    botoSecundari.setAttribute('geometry', 'primitive: box; width: 1; height: 0.5; depth: 0.1');
    botoSecundari.setAttribute('material', `color: ${COLORBOTOSECUNDARI}`);
    botoSecundari.setAttribute('position', '0.6 -0.6 -0.1');
    // Afegir texte mode practica
    botoSecundari.appendChild(texteSecundari);
    texteSecundari.setAttribute('text', `value: ${stringBotoSecundari}; align: center;`);
    texteSecundari.setAttribute('position', '0 0 -0.1');
    texteSecundari.setAttribute('rotation', '0 180 0');
    texteSecundari.setAttribute('scale', '3 3 1');
    // Listener de la hitbox
    botoPrincipal.addEventListener('hitstart', () => {
      // Reset de les variables de generació d'enemics
      numEnemicsMax = 10;
      delayGeneracioEnemics = 100;
      escena.removeChild(fonsModal);

      // Activa el joc (animacions i controlador) ${duracioAvancVagoneta}
      vagoneta.setAttribute('animation__moure', `property: position; to: 0 0 ${AVANCVAGONETA};
        dur: ${duracioAvancVagoneta}; easing: linear; loop: false`);
      vagoneta.play();
      controladorEnemics(TIPUSENEMIC.enemic).then(r => null);
    });
    botoSecundari.addEventListener('hitstart', () => {
      numEnemicsMax = 5;
      delayGeneracioEnemics = 1000;
      escena.removeChild(fonsModal);
      // Canvia el terra per un d'arqueria i afegeix el model 3D
      //generarNouTerra(TERRES.practica);
      generadorModals(TIPUSMODALS.sortirPractica);
      controladorEnemics(TIPUSENEMIC.diana).then(r => null);
    });
  } else if (tipus === TIPUSMODALS.sortirPractica) {
    fonsModal.setAttribute('position', `${vagoneta.object3D.position.x + 3} 2 ${vagoneta.object3D.position.z}`);
    fonsModal.setAttribute('rotation', ` 0 90 0`);
    botoPrincipal.addEventListener('hitstart', () => {
      jugant = false;
      eliminarEnemics();
      // TODO reset variables
      numEnemicsMax = 4;
      delayGeneracioEnemics = 4000;
      escena.removeChild(fonsModal);
      generadorModals(TIPUSMODALS.menu);
    });
  }

  escena.appendChild(fonsModal);
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
 * Elimina el terra actual i genera un de nou
 * @param asset ruta al gltf del model del terra a generar
 */
async function generarNouTerra(asset) {
  //let terraOld = document.getElementById('terra')
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
  terraNou.setAttribute('position', `1 0 ${comencTerra}`);
  escena.appendChild(terraNou);
  comencTerra += LLARGARIATERRA;
  console.log(terraNou)
  //terraOld.parentNode.removeChild(terraOld);
  // console.log(terraOld)
  // terraOld.remove();
  //terraNou.setAttribute('id', 'terra');
}

AFRAME.registerComponent("diana", {
  schema: {
    asset: {type: 'asset', default: '../assets/models/diana.glb'},
    color: {type: 'string', default: '#525252'}
    //position="0 0 -2" width="1" height="1"
  },
  init: function () {
    let data = this.data;
    let el = this.el;

    loader.load(data.asset, function (gltf) {
      el.setObject3D('mesh', gltf.scene);
    }), undefined, function (error) {
      console.error(error);
    };

    this.el.addEventListener('hitstart', () => {
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



AFRAME.registerComponent('corda', {
  schema: {
    width: {type: 'number', default: 0.4},
    height: {type: 'number', default: 0.2},
    depth: {type: 'number', default: 0.2},
    ma: {type: 'asset'},
    agafat: {type: 'boolean', default: false}
  },
  init: function () {
    let data = this.data;
    let el = this.el;
    cordaBone.add(new THREE.Mesh(new THREE.BoxGeometry(data.width, data.height, data.depth),
      new THREE.MeshBasicMaterial()));
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.


    // Funcionalitat d'agafar l'arc i substituir la má per l'arc
    this.el.addEventListener('grab-start', (event) => {
      let ma = event.detail.hand;
      data.ma = ma.id
      data.agafat = true;
      console.log("agafat ------")
      //el.sceneEl.removeEventListener('tick', this.updatePosition.bind(this, hand, element));
    });

    this.el.addEventListener('grab-end', (event) => {
      let ma = event.detail.hand;
      //calculateTension(ma)
      console.log("released -----------------------")
      // Aquí puedes agregar lógica para soltar el objeto si es necesario
    });
  },
  tock: function (time, timeDelta, camera) {
    let data = this.data;
    //console.log(this.el.object3D.position)
    this.el.object3D.position.x = -(Math.random() * (5 - 1) + 1);
    //if (data.agafat) this.updatePosition(document.getElementById(data.ma).object3D, this.el)
  }/*,
  updatePosition: function (hand, object) {
    // Copia la posició de la mà a la corda
    const handPosition = hand.getAttribute('position');
    object.setAttribute('position', handPosition);
    this.object3D.setAttribute('position', ma.position)
    el.setObject3D('mesh', this.object3D.mesh);
  }*/
});

/*let arcHTML = document.getElementById('arc');
let cordaHTML = document.getElementById('corda');
let arcEntity = document.createElement('a-entity');
let cordaEntity = document.createElement('a-entity');*/

AFRAME.registerComponent('arcmath', {
  schema: {
    width: {type: 'number', default: 0.05},
    height: {type: 'number', default: 0.25},
    depth: {type: 'number', default: 0.05},
    color: {type: 'color', default: '#AA2'},
    event: {type: 'string', default: ''},
    message: {type: 'string', default: '----------------------------'}
  },
  init: function () {
    let data = this.data;
    let el = this.el;
    // Closure to access fresh `this.data` from event handler context.
    let self = this;

    let geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
    let material = new THREE.MeshBasicMaterial({color: data.color});
    this.mesh = new THREE.Mesh(geometry, material);
    el.setObject3D('mesh', this.mesh);

    arcEntity.setAttribute('id', 'arcDibuixat')
    el.appendChild(arcEntity)
    // Generar la corva Catmull-Rom per dibuixar l'arc
    let curvatura = new THREE.CatmullRomCurve3([
      // per estirar modificar x ([X,Y,Z])
      new THREE.Vector3(-0.5, 1, 0),
      new THREE.Vector3(-0.05, 0.25, 0),
      new THREE.Vector3(-0.05, -0.25, 0),
      new THREE.Vector3(-0.5, -1, 0)
    ]);
    let points = curvatura.getPoints(50);
    // Line to cylinder or box
    // https://stackoverflow.com/questions/24732916/three-js-rotation-of-a-cylinder-that-represents-a-vector
    // Create geometry.
    geometry = new THREE.BufferGeometry().setFromPoints(points);
    // Create material.
    material = new THREE.LineBasicMaterial({
      color: data.color,
      linewidth: 1
    });
    arcEntity.geometry = geometry
    arcEntity.material = material
    // Create mesh.
    arcEntity.mesh = new THREE.Line(geometry, material);
    // Set mesh on entity.
    arcEntity.setObject3D('mesh', arcEntity.mesh);

    // Store a reference to the handler so we can later remove it.
    this.eventHandlerFn = function () {
      console.log(self.data.message);
    };
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.

    // If `oldData` is empty, we're in the initialization.
    if (Object.keys(oldData).length === 0) {
      return;
    }

    // Funcionalitat d'agafar l'arc i substituir la má per l'arc
    this.el.addEventListener('grab-start', (event) => {
      let ma = event.detail.hand;
      data.ma = ma.id
      data.agafat = true;
      element.object3D.attach(ma)
    });

    // Geometry-related properties
    if (data.width !== oldData.width ||
      data.height !== oldData.height ||
      data.depth !== oldData.depth) {
      el.getObject3D('mesh').geometry = new THREE.BoxGeometry(data.width, data.height,
        data.depth);
    }

    // Material-related properties changed. Update the material.
    if (data.event !== oldData.event) {
      // Remove the previous event listener, if it exists.
      if (oldData.event) {
        element.removeEventListener(oldData.event, this.eventHandlerFn);
      }
      // Add listener for new event, if it exists.
      if (data.event) {
        element.addEventListener(data.event, this.eventHandlerFn);
      }
    }

    if (!data.event) {
      console.log(data.message);
    }
  },
  tick: function (time, timeDelta) {
    let data = this.data;
    if (data.agafat) this.updatePosition(document.getElementById(data.ma), this.el)
  },
  remove: function () {
    let data = this.data;
    let element = this.el;

    // Remove event listener.
    if (data.event) {
      el.removeEventListener(data.event, this.eventHandlerFn);
    }
    // Remove element.
    element.remove();
  }
});
