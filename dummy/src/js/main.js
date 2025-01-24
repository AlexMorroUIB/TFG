// Escena
let escena = document.querySelector('a-scene');
// Arc
AFRAME.registerComponent('arc', {
  schema: {
    width: {type: 'number', default: 0.25},
    height: {type: 'number', default: 1},
    depth: {type: 'number', default: 0.1},
    color: {type: 'color', default: '#00F'},
    event: {type: 'string', default: ''},
    message: {type: 'string', default: '----------------------------'}
  },
  init: function () {
    let data = this.data;
    let el = this.el;
    // Closure to access fresh `this.data` from event handler context.
    let self = this;

    // Generar la corva Catmull-Rom per dibuixar l'arc
    let curve = new THREE.CatmullRomCurve3([
      // per estirar modificar x ([X,Y,Z])
        new THREE.Vector3(0.75, 1, 0),
        new THREE.Vector3(0.15, 0.25, 0),
        new THREE.Vector3(0.15, -0.25, 0),
        new THREE.Vector3(0.75, -1, 0)
      ]);
    let points = curve.getPoints(50);
    let arcGeometry =  new THREE.BufferGeometry().setFromPoints(points);
    arcGeometry.computeBoundingBox();
    arcGeometry.computeVertexNormals();
    // Generar la corva de la corda de l'arc
    let corda = new THREE.CatmullRomCurve3( [
      new THREE.Vector3( 0.72, 0.96, 0 ),
      new THREE.Vector3( 1.5, 0.05, 0 ),
      new THREE.Vector3( 1.5, -0.05, 0 ),
      new THREE.Vector3( 0.72, -0.96, 0 )
    ] );
    let pointsCorda = corda.getPoints(50);
    let cordaGeometry = new THREE.BufferGeometry().setFromPoints(pointsCorda);
    cordaGeometry.computeBoundingBox();
    cordaGeometry.computeVertexNormals();
    // Line to cylinder or box
    // https://stackoverflow.com/questions/24732916/three-js-rotation-of-a-cylinder-that-represents-a-vector
    // Create geometry.
    this.geometry = new THREE.BufferGeometryUtils.mergeBufferGeometries([arcGeometry, cordaGeometry]);
    // Create material.
    this.material = new THREE.LineBasicMaterial({color: data.color});
    // Create mesh.
    this.mesh = new THREE.Line(this.geometry, this.material);
    // Set mesh on entity.
    el.setObject3D('mesh', this.mesh);

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

    // Geometry-related properties
    if (data.width !== oldData.width ||
      data.height !== oldData.height ||
      data.depth !== oldData.depth) {
      el.getObject3D('mesh').geometry = new THREE.BoxGeometry(data.width, data.height,
        data.depth);
    }

    // Material-related properties changed. Update the material.
    if (data.color !== oldData.color) {
      el.getObject3D('mesh').material.color = new THREE.Color(data.color);
    }
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
window.onload = () => {
  let arcEl = document.querySelector('#arcID');
  console.log(arcEl)
  arcEl.setAttribute('arc', {event: 'event2', message: 'event2'});
  console.log(arcEl)
  arcEl.emit('event2');
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
