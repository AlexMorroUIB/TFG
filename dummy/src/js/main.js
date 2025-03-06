const loader = new THREE.GLTFLoader();

// Constants del joc
const TAMANYCARCAIX = 16
//const NUMENEMICS = 3
// Escena
let escena = document.getElementById('escena');
let arcEntity = document.getElementById('arc');
let controls = document.getElementById('controls');
let vagoneta = document.getElementById('vagoneta');
let jugant = false;
let enemicsEnPantalla = 0;
/*let cordaBone
let anchorDBone*/
let cordaEntity = document.createElement('a-entity');
//let carcaix = new Array(TAMANYCARCAIX);
let fletxaActual;
const arcBones = {};
let maArc;
let maCorda;

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
    escena.setAttribute('pool__fletxa', `mixin: fletxa; size: ${TAMANYCARCAIX}`)
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
      if (!data.agafat) {
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
      }
      vagoneta.setAttribute('animation__moure', 'property: position; to: 0 0.9 10; dur: 20000; easing: linear; loop: false');
      vagoneta.play();
      controladorEnemics();
    });

    /*corda.el.addEventListener('grab-start', () => {
      this.updatePosition.bind(this, hand, element);
    });*/

    this.el.addEventListener('grab-end', (event) => {
      //data.agafat = false;

      //event.detail.hand.object3D.removeChild(element.object3D);
      // Aquí puedes agregar lógica para soltar el objeto si es necesario
    });
  },
  tick: function (time, timeDelta) {
    let data = this.data;
    //ikSolver?.update();
    //if (data.agafat) arcEntity.object3D.position.copy(document.getElementById(data.ma).object3D.position.clone());
    //if (data.agafat) updatePosition(document.getElementById(data.ma), this.el)
  }
});

function crearFletxes() {
  for (let i = 0; i < carcaix.length; i++) {
    const fletxa = document.createElement('a-entity');
    fletxa.setAttribute('id', i.toString());
    fletxa.setAttribute('class', 'fletxa');
    fletxa.setAttribute('fletxa', '');
    fletxa.setAttribute('grabbable', '');
    escena.components.pool__fletxa.returnEntity(fletxa);
  }
}

function calculateTension() {
  // Calcular la distancia entre el punto central de la cuerda y el punto de anclaje
  const distance = Math.abs(maArc.object3D.position.distanceTo(maCorda.object3D.position));
  // Definir un factor de tensión (puedes ajustar este valor según sea necesario)
  const tensionFactor = 1//2; // Ajusta este valor según la escala de tu modelo

  // Calcular la tensión (puedes usar una fórmula más compleja si es necesario)
  return distance * tensionFactor;
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
    event: {type: 'string', default: ''},
    ma: {type: 'asset'},
    posInicial: {type: 'array', default: [0, 0, 0.3]}
  },
  init: function () {
    let data = this.data;
    let el = this.el;
    // Closure to access fresh `this.data` from event handler context.
    let self = this;

    /*let geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
    let material = new THREE.MeshBasicMaterial({color: data.color});
    this.mesh = new THREE.Mesh(geometry, material);
    el.setObject3D('mesh', this.mesh);*/

    /*let cordaDibuixada = document.createElement('a-entity')
    cordaDibuixada.setAttribute('id', 'cordaDibuixada')
    el.appendChild(cordaDibuixada)*/
    // Generar la corva de la corda de l'arc
    /*let corda = new THREE.CatmullRomCurve3([
     new THREE.Vector3(0, data.anclaSuperior, 0),
     new THREE.Vector3(0, data.puntIntermigSuperior, 0.3),
     new THREE.Vector3(0, data.puntIntermigInferior, 0.3),
     new THREE.Vector3(0, data.anclaInferior, 0)
   ]);
   let pointsCorda = corda.getPoints(50);
   let geometry = new THREE.BufferGeometry().setFromPoints(pointsCorda);
   // Create material.
   let material = new THREE.LineBasicMaterial({
     color: data.color,
     linewidth: 1
   });*/
    // Create mesh.
    this.mesh = calcularCorda(0.0)//new THREE.Line(geometry, material);
    // Set mesh on entity.
    el.setObject3D('mesh', this.mesh);

    // Store a reference to the handler so we can later remove it.
    this.eventHandlerFn = function () {
      console.log(self.data.message);
    };
  },
  update: function (oldData) {
    /*let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.

    this.el.addEventListener('grab-start', (event) => {
      let ma = event.detail.hand;
      data.ma = document.getElementById(ma.id);
      data.agafat = true;
    });
    this.el.addEventListener('grab-end', (event) => {
      data.agafat = false;
      el.setAttribute('position', data.posInicial.toString())
    });*/

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
    asset: {type: 'asset', default: '../assets/models/fletxatest.glb'},
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
      if (ma.id === maCorda.id && event.detail.buttonEvent.type === "triggerdown") {
        data.ma = document.getElementById(ma.id);
        data.agafada = true;
        data.posInicial[0] = element.getAttribute('position').x;
        data.posInicial[1] = element.getAttribute('position').y;
        data.posInicial[2] = element.getAttribute('position').z;
        fletxaActual.removeAttribute('aabb-collider');
        fletxaActual.setAttribute('aabb-collider', 'objects: .enemic; interval: 20');
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

        /*let worldDirection = element.object3D.getWorldDirection(new THREE.Vector3())
        data.posDispar[0] = worldDirection.x;
        data.posDispar[1] = worldDirection.y;
        data.posDispar[2] = worldDirection.z;*/
        data.disparada = true;
        fletxaActual = escena.components.pool__fletxa.requestEntity();
        // Resetetjar els valors de la fletxa disparada a 0
        fletxaActual.components.fletxa.data.disparada = false;
        fletxaActual.components.fletxa.data.temps = 0;
        fletxaActual.components.fletxa.data.forca = 0;
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
      enemicsEnPantalla--;
      //}
      element.data.disparada = false;
    });
  },
  tick: function (time, timeDelta) {
    let data = this.data;
    let el = this.el;
    if (data.disparada) {
      /*el.setAttribute('position', {
        x: el.getAttribute('position').x + data.temps * data.forca,
        y: el.getAttribute('position').y - data.temps * 0.1,
        z: el.getAttribute('position').z + data.temps * data.forca
      });*/
      el.object3D.translateZ(data.temps * data.forca);
      data.temps += 0.01;
      if (data.temps >= 10) escena.components.pool__fletxa.returnEntity(this.el);
    } else if (data.agafada) {
      // Solo actualizamos la posición en Z
      /*el.setAttribute('position', {
        x: controls.object3D.position.x - (maArc.object3D.position.x + data.ma.object3D.position.x) / 2,
        y: maArc.object3D.position.y,
        z: controls.object3D.position.z - (maArc.object3D.position.z + data.ma.object3D.position.z) / 2
      });*/
      /*el.setAttribute('position', {
        x: controls.object3D.position.x - maArc.object3D.position.x,
        y: maArc.object3D.position.y,
        z: controls.object3D.position.z - maArc.object3D.position.z
      });*/
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
  //console.log(vagoneta.object3D.position)- controls.object3D.position.x - controls.object3D.position.z
  const maWorldPos = new THREE.Vector3();
  maArc.object3D.getWorldPosition(maWorldPos);
  fletxa.setAttribute('position', {
    x: maWorldPos.x,
    y: maWorldPos.y,
    z: maWorldPos.z
  });
  //let offset = Math.cos(20)+Math.sin(20)*(0.0 + 1.0 + 0.0)
  let offset = new THREE.Quaternion(0.501213, 0.0, 0.0, 0.8653239)
  let maQuaternion = new THREE.Quaternion(-maArc.object3D.quaternion.x,
    maArc.object3D.quaternion.y, -maArc.object3D.quaternion.z, maArc.object3D.quaternion.w)
  fletxa.object3D.setRotationFromQuaternion(maQuaternion.multiply(offset));
  /*console.log(offset)
  console.log(offset.invert())
  console.log(maQuaternion)*/
  /*fletxa.object3D.quaternion.x = -maArc.object3D.quaternion.x;
  fletxa.object3D.quaternion.y = maArc.object3D.quaternion.y;
  fletxa.object3D.quaternion.z = -maArc.object3D.quaternion.z;
  fletxa.object3D.quaternion.w = +maArc.object3D.quaternion.w;*/
  //fletxa.object3D.rotation.x += 0.5
  //console.log(fletxa.object3D.quaternion)
}

function updatePosition() {
  // Copia la posició i rotació de la mà a l'arc
  let corda = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.92, 0),
    new THREE.Vector3(-0.5, 0.05, 0),
    new THREE.Vector3(-0.5, -0.05, 0),
    new THREE.Vector3(0, -0.92, 0)
  ]);
  /*function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}*/
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

async function controladorEnemics() {
  const xMin = 4;
  const xMax = 8;
  //console.log(escena.components.pool__enemic)
  while (jugant) {
    if (enemicsEnPantalla < 5) {
      const enemic = document.createElement('a-entity');
      enemic.setAttribute('enemic', '');
      enemic.setAttribute('class', 'enemic');
      //console.log(enemic)
      /*enemic.setAttribute('animation', `property: position;
      to: ${(Math.random() * (xMax - xMin + 1) + xMin) * (Math.round(Math.random()) * 2 - 1)} 1 ${vagoneta.object3D.position.z + 20};
      dur: 1; easing: linear; loop: false`);*/
      enemic.setAttribute('position', {
        x: (Math.random() * (xMax - xMin + 1) + xMin) * (Math.round(Math.random()) * 2 - 1),
        y: 1,
        z: vagoneta.object3D.position.z + 20
      });
      //enemic.setAttribute('aabb-collider', 'objects: .fletxa; interval: 20');
      /*enemic.object3D.position.x = (Math.random() * (xMax - xMin + 1) + xMin) * (Math.round(Math.random()) * 2 - 1);
      enemic.object3D.position.y = 1;
      enemic.object3D.position.z = (vagoneta.object3D.position.z + 20);*/
      /*enemic.setAttribute('position',
        `${}
       1 ${vagoneta.object3D.position.z + 20}`)*/
      escena.appendChild(enemic);
      enemic.play();
      /*console.log("enemic: ")
      console.log(enemic.getAttribute('position'))*/
      enemicsEnPantalla++;
    }
    await delay(5000);
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
    message: {type: 'string', default: 'enemic'}
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
      console.log("enemic hit")
      this.remove();
    });

  },
  tick: function (time, timeDelta) {
    let data = this.data;
    let element = this.el
    const controlsWorldPos = new THREE.Vector3();
    controls.object3D.getWorldPosition(controlsWorldPos);
    element.object3D.lookAt(controlsWorldPos);
  },
  remove: function () {
    // Remove element.
    escena.removeChild(this.el);
    this.el.removeFromParent();
  }
});
// vagoneta
/*AFRAME.registerComponent('vagoneta', {
  schema: {
    width: {type: 'number', default: 5},
    height: {type: 'number', default: 5},
    material: {type: 'asset', default: '/textures/ferro.png'},
    culor: {type: 'color', default: 'red'},
    message: {type: 'string'}
  },
  init: function () {
    let data = this.data
    console.log(data.message);
    this.geometry = new THREE.PlaneGeometry(data.width, data.height);
    // Create material.
    this.material = new THREE.MeshStandardMaterial({color: data.culor, side: THREE.DoubleSide});
    // Create mesh.
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }
});*/


// Follow component
/*AFRAME.registerComponent('follow', {
  schema: {
    target: {type: 'selector'},
    speed: {type: 'number'}
  }
});*/

// use pool for enemies https://aframe.io/docs/1.6.0/components/pool.html


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
