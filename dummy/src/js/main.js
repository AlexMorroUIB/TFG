const loader = new THREE.GLTFLoader();

// Escena
let escena = document.getElementById('escena');
let arcEntity = document.getElementById('arc');
let controls = document.getElementById('controls');
let cordaBone
let anchorDBone
let cordaEntity = document.createElement('a-entity');
let fletxaEntity = document.createElement('a-entity');
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
      gltf.scene.traverse(n => {
        if (n.name === 'Armature') arcBones.armature = n;
        if (n.name === 'String') arcBones.corda = n;
        if (n.name === 'IKD') arcBones.IKD = n;
        if (n.name === 'IKI') arcBones.IKI = n;
        if (n.name === 'BoneD') arcBones.boneD = n;
        if (n.name === 'Bone013') arcBones.lastBoneD = n;
        if (n.name === 'BoneI') arcBones.boneI = n;
      });
      //console.log(gltf.scene)
      cordaBone = gltf.scene.getObjectByName('String');
      anchorDBone = gltf.scene.getObjectByName('IKD');
      el.setObject3D('mesh', gltf.scene);

      //document.getElementById('arc').innerHTML = '<a-entity corda grabbable></a-entity>';
      //let cordaEntity = document.createElement('a-entity');
      cordaEntity.setAttribute('id', 'corda');
      cordaEntity.setAttribute('cordamath', '');
      //cordaEntity.setAttribute('grabbable', '')
      fletxaEntity.setAttribute('class', 'fletxa');
      fletxaEntity.setAttribute('fletxa', '');
      fletxaEntity.setAttribute('grabbable', '');
      //gltf.scene.position.set(document.getElementById('maEsquerra').object3D.position)
    }), undefined, function (error) {
      console.error(error);
    };
    /*let transformControls = new THREE.TransformControls(escena.camera, escena.renderer.domElement);
    transformControls.size = 0.75;
    transformControls.space = 'world';
    transformControls.attach(arcBones.corda);*/
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.

    // Funcionalitat d'agafar l'arc i substituir la má per l'arc
    this.el.addEventListener('grab-start', (event) => {
      if (!data.agafat) {
        let ma = event.detail.hand;
        data.ma = ma.id
        maArc = document.getElementById(ma.id);
        data.agafat = true;
        ma.setAttribute('gltf-model', data.asset);
        element.parentNode.removeChild(element)
        //ma.appendChild(element)
        //element.setAttribute('position', '0 0 0')
        ma.appendChild(cordaEntity);
        //ma.appendChild(fletxaEntity);
        cordaEntity.setAttribute('position', '0 0 0.28');
        cordaEntity.setAttribute('rotation', '-30 0 0');
        // Moure una fletxa a l'arc
        fletxaEntity.setAttribute('position',
          `${controls.object3D.position.x - ma.object3D.position.x}
         ${ma.object3D.position.y}
          ${controls.object3D.position.z - ma.object3D.position.z}`);
        escena.appendChild(fletxaEntity);
        //fletxaEntity.setAttribute('rotation', '-32 0 0');
        /*htmlMa.Object3D.attach(cordaBone);
        cordaBone.setWorldTransform(htmlMa.object3D.worldMatrix);*/
        //this.parentNode.removeChild(this);
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
    });

    /*corda.el.addEventListener('grab-start', () => {
      this.updatePosition.bind(this, hand, element);
    });*/

    this.el.addEventListener('grab-end', (event) => {
      data.agafat = false;

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

function calculateTension(maFletxa) {
  let maArc
  if (maFletxa.getAttribute(id) === "maDreta") {
    maArc = document.getElementById("maEsquerra");
  } else {
    maArc = document.getElementById("maDreta");
  }
  // Calcular la distancia entre el punto central de la cuerda y el punto de anclaje
  const distance = Math.abs(maArc.position.distanceTo(maFletxa.position));
  console.log(distance)
  // Definir un factor de tensión (puedes ajustar este valor según sea necesario)
  const tensionFactor = 0.5; // Ajusta este valor según la escala de tu modelo

  // Calcular la tensión (puedes usar una fórmula más compleja si es necesario)
  return distance * tensionFactor;
}

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
AFRAME.registerComponent('cordamath', {
  schema: {
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

    let geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
    let material = new THREE.MeshBasicMaterial({color: data.color});
    this.mesh = new THREE.Mesh(geometry, material);
    el.setObject3D('mesh', this.mesh);

    let cordaDibuixada = document.createElement('a-entity')
    cordaDibuixada.setAttribute('id', 'cordaDibuixada')
    el.appendChild(cordaDibuixada)
    // Generar la corva de la corda de l'arc
    let corda = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.86, 0),
      new THREE.Vector3(0, 0.25, 0.3),
      new THREE.Vector3(0, 0.15, 0.3),
      new THREE.Vector3(0, -0.58, 0)
    ]);
    let pointsCorda = corda.getPoints(50);
    geometry = new THREE.BufferGeometry().setFromPoints(pointsCorda);
    // Create material.
    material = new THREE.LineBasicMaterial({
      color: data.color,
      linewidth: 1
    });
    // Create mesh.
    cordaDibuixada.mesh = new THREE.Line(geometry, material);
    // Set mesh on entity.
    cordaDibuixada.setObject3D('mesh', cordaDibuixada.mesh);

    // Store a reference to the handler so we can later remove it.
    this.eventHandlerFn = function () {
      console.log(self.data.message);
    };
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.

    this.el.addEventListener('grab-start', (event) => {
      let ma = event.detail.hand;
      data.ma = document.getElementById(ma.id);
      data.agafat = true;
    });
    this.el.addEventListener('grab-end', (event) => {
      data.agafat = false;
      el.setAttribute('position', data.posInicial.toString())
    });

  },
  tick: function (time, timeDelta) {
    let data = this.data;
    let el = this.el;
    /*if (data.agafat) {
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

AFRAME.registerComponent('fletxa', {
  schema: {
    width: {type: 'number', default: 0.05},
    height: {type: 'number', default: 0.05},
    depth: {type: 'number', default: 0.5},
    color: {type: 'color', default: '#FFAA00'},
    event: {type: 'string', default: ''},
    ma: {type: 'asset'},
    posInicial: {type: 'array', default: [0, 0, 0]}
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
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.

    this.el.addEventListener('grab-start', (event) => {
      let ma = event.detail.hand;
      if (ma.id !== maArc.id) {
        data.ma = document.getElementById(ma.id);
        data.agafat = true;
        console.log("Fletxa: ")
        console.log(fletxaEntity.getAttribute('position'));
        console.log("ma: ")
        console.log(ma.object3D.position);
        console.log("maArc: ")
        console.log(maArc.object3D.position);
        console.log("escena: ")
        console.log(controls.object3D.position);
        data.posInicial[0] = fletxaEntity.getAttribute('position').x;
        data.posInicial[1] = fletxaEntity.getAttribute('position').y;
        data.posInicial[2] = fletxaEntity.getAttribute('position').z;
      }
    });

    this.el.addEventListener('grab-end', (event) => {
      let ma = event.detail.hand;
      if (ma.id !== maArc.id) {
        data.agafat = false;
        fletxaEntity.setAttribute('position',
          `${controls.object3D.position.x - maArc.object3D.position.x}
         ${maArc.object3D.position.y}
          ${controls.object3D.position.z - maArc.object3D.position.z}`);
        console.log("dispar");
      }
    });

  },
  tick: function (time, timeDelta) {
    let data = this.data;
    let el = this.el;
    if (data.agafat) {
      // Solo actualizamos la posición en Z
      el.setAttribute('position', {
        x: controls.object3D.position.x - maArc.object3D.position.x,
        y: maArc.object3D.position.y,
        z: controls.object3D.position.z - (maArc.object3D.position.z + data.ma.object3D.position.z)/2
      });
    } else {
      // Moure una fletxa a l'arc
      fletxaEntity.setAttribute('position',
        `${controls.object3D.position.x - maArc.object3D.position.x}
         ${maArc.object3D.position.y}
          ${controls.object3D.position.z - maArc.object3D.position.z}`);
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
  /*let arcEl = document.querySelector('#arc');
  console.log(arcEl)
  arcEl.setAttribute('arc', {event: 'event2', message: 'event2'});
  console.log(arcEl)
  arcEl.emit('event2');*/
}

// Component enemics
AFRAME.registerComponent('enemic', {
  schema: {
    event: {type: 'string', default: ''},
    message: {type: 'string', default: 'enemic'}
  },
  init: function () {
    // Closure to access fresh `this.data` from event handler context.
    let self = this;

    // Store a reference to the handler so we can later remove it.
    this.eventHandlerFn = function () {
      console.log(self.data.message);
    };
  },
  update: function (oldData) {
    let data = this.data;  // Component property values.
    let element = this.el;  // Reference to the component's entity.

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
  remove: function () {
    // Remove element.
    this.el.remove();
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
