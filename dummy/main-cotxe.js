import * as three from "three";
import Stats from "three/examples/jsm/libs/stats.module.js"
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {VRButton} from 'three/addons/webxr/VRButton.js';

const loader = new GLTFLoader();
let marxa = 1;
let embragatge = false;
let rpm = 850;

// Control de camera
let tercera = true

Ammo().then(function (Ammo) {
  // Constants


  const container = document.getElementById('container');
  const speedometer = document.getElementById('velocitat');
  const iluminacioRpm = document.getElementById('iluminacio-rpm');
  const indicadorMarxa = document.getElementById('indicador-marxa');
  const cercleMarxa = document.getElementById('cercle-marxa');
  const svgContainer = document.getElementById('svgContainer');
  const svgRpm = document.getElementById('svgRpm');

  // - Global variables -
  let DISABLE_DEACTIVATION = 4;
  let TRANSFORM_AUX = new Ammo.btTransform();
  let ZERO_QUATERNION = new three.Quaternion(0, 0, 0, 1);

  // Graphics variables
  let stats;
  let camera, scene, renderer, cameraHolder//, controls;
  let clock = new three.Clock();
  let materialDynamic, materialStatic, materialInteractive;

  // Physics variables
  let collisionConfiguration;
  let dispatcher;
  let broadphase;
  let solver;
  let physicsWorld;

  // Variables d'audio
  let listener; // interfície d'audio per la càmera
  let motorEngegar; // Emisor d'audio global
  let motorRalenti; // Emisor d'audio global

  let syncList = [];
  let time = 0;

  // Dades del vehicle
  let vehiclePosicioOrigen = new three.Vector3(0, 1.5, 0);
  let chassisMesh;

  // - Functions -

  function initGraphics() {
    document.getElementById("botoCamera").onclick = canvia13persona;

    // Crea la escena 3D
    scene = new three.Scene();

    camera = new three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    //controls = new OrbitControls( camera );

    renderer = new three.WebGLRenderer({antialias: true});
    renderer.setClearColor(0xb8dafc);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Afegir compatibilitat amb VR
    cameraHolder = new three.Group(); // Entitat que conté la camera per poder mourer-la
    document.body.appendChild(VRButton.createButton(renderer));
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

    // Quan comença la sessió VR afegeix la càmera al cotxe
    renderer.xr.addEventListener('sessionstart', () => {
      renderer.setAnimationLoop(tick);
      // Afegeix i mou l'entitat que contindrà la càmera al cotxe
      chassisMesh.add(cameraHolder);
      cameraHolder.position.x = 0.32;
      cameraHolder.position.y = 0.6;
      cameraHolder.position.z = -0.4;
      cameraHolder.rotation.y = Math.PI;
      cameraHolder.add(camera);
    });
    // Quan surt de la sessió VR lleva la càmera VR del cotxe
    renderer.xr.addEventListener('sessionend', function () {
      scene.remove(cameraHolder);
      cameraHolder.remove(camera);
    });

    let ambientLight = new three.AmbientLight(0xffffff);
    scene.add(ambientLight);

    let dirLight = new three.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 10, 5);
    scene.add(dirLight);

    materialDynamic = new three.MeshPhongMaterial({color: 0xfca400});
    materialStatic = new three.MeshPhongMaterial({color: 0xa5956b}); // 0xbcc1a2
    materialInteractive = new three.MeshBasicMaterial({color: 0xFFFFFF});

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0%';
    container.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);
  }

  /**
   * Inicialització de la reproducció d'àudio
   */
  function initAudio() {
    // Crea l'interície de so per la càmera
    listener = new three.AudioListener();
    camera.add(listener);

    motorEngegar = new three.Audio(listener);
    motorRalenti = new three.Audio(listener);

    // Càrrega de sons ------
    const audioLoader = new three.AudioLoader();
    // Engegar motor, quan acaba d'engegar-se s'inicia automàticament el so de motorRalenti
    audioLoader.load('src/assets/audio/start-engine.ogg', function (buffer) {
      motorEngegar.setBuffer(buffer);
      motorEngegar.setLoop(false);
      motorEngegar.setVolume(0.1);
      motorEngegar.onEnded = () => motorRalenti.play();
    });
    audioLoader.load('src/assets/audio/idle.mp3', function (buffer) {
      motorRalenti.setBuffer(buffer);
      motorRalenti.setLoop(true);
      motorRalenti.setVolume(0.1);
    });
  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  }

  function initPhysics() {

    // Physics configuration
    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
  }

  function tick() {
    requestAnimationFrame(tick);
    let dt = clock.getDelta();
    actualitzaComandament()
    for (let i = 0; i < syncList.length; i++)
      syncList[i](dt);
    physicsWorld.stepSimulation(dt, 10);
    //controls.update( dt ); // orbit transform controls
    renderer.render(scene, camera);
    time += dt;
    stats.update();
  }

  function createBox(pos, quat, w, l, h, mass, friction) {
    let material = mass > 0 ? materialDynamic : materialStatic;
    let shape = new three.BoxGeometry(w, l, h, 1, 1, 1);
    let geometry = new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));

    //if (!mass) mass = 0;
    //if (!friction) friction = 1;

    let mesh = new three.Mesh(shape, materialStatic);
    loader.load('./src/assets/models/circuit.glb', (gltf) => {
      /*let circuit;
      console.log(gltf.scene.children[2])
      circuit = gltf.scene.children[1]
      //circuit.scale.set(scale,scale,scale)
      circuit.position.set(0, 0, 0)
      circuit.castShadow = false

      scene.add(circuit)

      //physics

      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

      const shape = new Ammo.btConvexHullShape();

      //new ammo triangles
      let triangle_mesh = new Ammo.btTriangleMesh;

      //declare triangles position vectors
      let vectA = new Ammo.btVector3(0, 0, 0);
      let vectB = new Ammo.btVector3(0, 0, 0);
      let vectC = new Ammo.btVector3(0, 0, 0);

      //retrieve vertices positions from object
      let verticesPos = circuit.geometry.getAttribute('position').array;
      console.log(verticesPos)
      let triangles = [];
      for (let i = 0; i < verticesPos.length; i += 3) {
        triangles.push({
          x: verticesPos[i],
          y: verticesPos[i + 1],
          z: verticesPos[i + 2]
        })
      }

      //use triangles data to draw ammo shape
      for (let i = 0; i < triangles.length - 3; i += 3) {

        vectA.setX(triangles[i].x);
        vectA.setY(triangles[i].y);
        vectA.setZ(triangles[i].z);
        shape.addPoint(vectA, true);

        vectB.setX(triangles[i + 1].x);
        vectB.setY(triangles[i + 1].y);
        vectB.setZ(triangles[i + 1].z);
        shape.addPoint(vectB, true);

        vectC.setX(triangles[i + 2].x);
        vectC.setY(triangles[i + 2].y);
        vectC.setZ(triangles[i + 2].z);
        shape.addPoint(vectC, true);

        triangle_mesh.addTriangle(vectA, vectB, vectC, true);
      }

      Ammo.destroy(vectA);
      Ammo.destroy(vectB);
      Ammo.destroy(vectC);

      shape.setMargin(0.05);
      const motionState = new Ammo.btDefaultMotionState(transform);

      const localInertia = new Ammo.btVector3(0, 0, 0);
      shape.calculateLocalInertia(mass, localInertia);

      const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);

      const rBody = new Ammo.btRigidBody(rbInfo);
      rBody.setFriction(friction);
      physicsWorld.addRigidBody(rBody)
      circuit.userData.physicsBody = rBody*/

      gltf.scene.position.y = 0.51;
      //gltf.scene.quaternion.y = Math.PI/2;
      //geometry = gltf.geometry;
      //shape = new three.BoxGeometry(gltf.scene.getObjectByName("Plane").scale.x, gltf.scene.getObjectByName("Plane").scale.y, gltf.scene.getObjectByName("Plane").scale.z);
      //mesh.attach(gltf.scene)
      scene.add(gltf.scene)
    });
    mesh.position.copy(pos);
    // mesh.quaternion.copy(quat);
    //mesh.layers.set(3);
    scene.add(mesh);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    geometry.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(friction);
    //body.setRestitution(.9);
    //body.setDamping(0.2, 0.2);

    physicsWorld.addRigidBody(body);

    if (mass > 0) {
      body.setActivationState(DISABLE_DEACTIVATION);

      // Sync physics and graphics
      function sync(dt) {
        let ms = body.getMotionState();
        if (ms) {
          ms.getWorldTransform(TRANSFORM_AUX);
          let p = TRANSFORM_AUX.getOrigin();
          let q = TRANSFORM_AUX.getRotation();
          mesh.position.set(p.x(), p.y(), p.z());
          mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
      }

      syncList.push(sync);
    }
  }

  function createWheelMesh(radius, width, costat) {
    let mesh
    let cylinderGeometry = new three.CylinderGeometry(radius, radius, width, 23, 1);
    cylinderGeometry.rotateZ(Math.PI / 2);
    mesh = new three.Mesh(cylinderGeometry, materialInteractive);
    mesh.layers.set(3);
    loader.load('./src/assets/models/rx-7-roda.glb', (gltf) => {
      gltf.scene.position.copy(mesh.position)
      // Posiciona correctament la roda al chassi
      if (costat) {
        // Si és el costat dret rota la roda 180º
        gltf.scene.rotation.y = Math.PI;
        gltf.scene.position.x += 0.75;
        gltf.scene.position.z += 1.226;
      } else {
        gltf.scene.position.x -= 0.75;
        gltf.scene.position.z -= 1.226;
      }
      gltf.scene.position.y -= 0.305;
      mesh.attach(gltf.scene)
    })
    scene.add(mesh);
    return mesh;
  }

  function createChassisMesh(w, h, d) {
    let shape = new three.BoxGeometry(w, h, d, 1, 1, 1);
    let mesh = new three.Mesh(shape, materialInteractive);
    mesh.layers.set(3); // layer 0 els 2 ulls - layer 1 ull esquerra - layer 2 ull dret
    loader.load('./src/assets/models/bmw-sense-rodes.glb', (gltf) => {
      //gltf.scene.add(camera)
      gltf.scene.position.copy(mesh.position)
      gltf.scene.position.y -= 0.5;
      mesh.attach(gltf.scene);
    })
    mesh.add(camera)
    // moure la càmera a la posicio de conducció
    camera.position.y += 1.2;
    camera.position.x -= 4.5//0.3;
    camera.position.z -= 1;
    camera.rotation.y = Math.PI + 1.2; // la camera mira a l'eix -z per defecte, es rota 180º perque miri cap envant
    scene.add(mesh);
    return mesh;
  }

  function createVehicle(pos, quat) {

    // Vehicle contants

    let chassisWidth = 1.2;
    let chassisHeight = 0.2;
    let chassisLength = 4.1;
    let massVehicle = 1200;
    // Ratios [R, 1, 2, 3, 4, 5, 6]
    let ratiosMarxes = [3.44, 3.63, 2.19, 1.54, 1.21, 1.0, 0.77];
    let diferencial = 4.1;

    let wheelAxisPositionBack = -(chassisLength / 3);
    let wheelHalfTrackBack = chassisWidth / 1.8;
    let wheelRadiusBack = .339;
    let wheelWidthBack = .225;
    let wheelAxisHeightBack = .3;

    let wheelAxisFrontPosition = chassisLength / 2.8;
    let wheelHalfTrackFront = chassisWidth / 1.8;
    let wheelRadiusFront = .339;
    let wheelWidthFront = .225;
    let wheelAxisHeightFront = .3;

    let friction = 1000;
    let suspensionStiffness = 28.0;
    let suspensionDamping = 3.2;
    let suspensionCompression = 4.4;
    let suspensionRestLength = 0.6;
    let rollInfluence = 0.01;

    let steeringIncrement = .04;
    let steeringClamp = .5;
    let maxEngineForce = 250;
    let maxBreakingForce = 75;

    // Chassis
    let geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);
    let localInertia = new Ammo.btVector3(0, 0, 0);
    geometry.calculateLocalInertia(massVehicle, localInertia);
    let body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
    body.setActivationState(DISABLE_DEACTIVATION);
    physicsWorld.addRigidBody(body);
    chassisMesh = createChassisMesh(chassisWidth, chassisHeight, chassisLength);


    // Raycast Vehicle
    let engineForce = 0;
    let vehicleSteering = 0;
    let breakingForce = 0;
    let tuning = new Ammo.btVehicleTuning();
    let rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
    let vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
    vehicle.setCoordinateSystem(0, 1, 2);
    physicsWorld.addAction(vehicle);

    // Wheels
    let FRONT_LEFT = 0;
    let FRONT_RIGHT = 1;
    let BACK_LEFT = 2;
    let BACK_RIGHT = 3;
    let wheelMeshes = [];
    let wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
    let wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

    function addWheel(isFront, pos, radius, width, index) {

      let wheelInfo = vehicle.addWheel(
        pos,
        wheelDirectionCS0,
        wheelAxleCS,
        suspensionRestLength,
        radius,
        tuning,
        isFront);

      wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
      wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
      wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
      wheelInfo.set_m_frictionSlip(friction);
      wheelInfo.set_m_rollInfluence(rollInfluence);

      // si el nombre és parell la roda és del costat dret
      wheelMeshes[index] = createWheelMesh(radius, width, index % 2);
    }

    addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
    addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
    addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
    addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);

    // Sync keybord actions and physics and graphics
    function sync(dt) {
      let speed = vehicle.getCurrentSpeedKmHour();

      engineForce = 0;
      breakingForce = 0;
      vehicle.applyEngineForce(engineForce, BACK_LEFT);
      vehicle.applyEngineForce(engineForce, BACK_RIGHT);
      vehicle.setBrake(breakingForce, FRONT_LEFT);
      vehicle.setBrake(breakingForce, FRONT_RIGHT);
      vehicle.setBrake(breakingForce * 0.85, BACK_LEFT);
      vehicle.setBrake(breakingForce * 0.85, BACK_RIGHT);
      // si s'está utilitzant el teclat, el potenciòmetre és el máxim
      if (potenciometre === 0.0) potenciometre = 1.0
      if (!gamepad && eix > -0.1 && eix < 0.1) eix = 1.0

      if ((actions.baixarMarxa || boto === 2) && (marxa > 1 || (marxa === 1 && speed < 1))) {
        marxa--;
        actions.baixarMarxa = false;
      }
      if ((actions.pujarMarxa || boto === 2) && (marxa < 6 || (marxa === 0 && speed > -1))) {
        marxa++;
        actions.pujarMarxa = false;
      }
      if (actions.accelerar || boto === 7) {
        if (rpm <= 8000) {
          if (marxa === 0) {
            engineForce = -(maxEngineForce * ratiosMarxes[marxa] * diferencial * potenciometre);
            vehicle.applyEngineForce(engineForce, BACK_LEFT);
            vehicle.applyEngineForce(engineForce, BACK_RIGHT);
          } else {
            engineForce = maxEngineForce * ratiosMarxes[marxa] * diferencial * potenciometre;
            vehicle.applyEngineForce(engineForce, BACK_LEFT);
            vehicle.applyEngineForce(engineForce, BACK_RIGHT);
            //canviarMarxa(speed);
          }
        } else {
          rpm = 7100
        }
      }
      if (actions.frenar || boto === 6) {
        breakingForce = maxBreakingForce * potenciometre;
        vehicle.setBrake(breakingForce, FRONT_LEFT);
        vehicle.setBrake(breakingForce, FRONT_RIGHT);
        vehicle.setBrake(breakingForce * 0.85, BACK_LEFT);
        vehicle.setBrake(breakingForce * 0.85, BACK_RIGHT);
        if (rpm >= 1000 && (speed < 0.5 || speed > -0.5)) {
          embragatge = true;
        }
      }
      if (actions.freMa || boto === 5) {
        breakingForce = maxBreakingForce
        vehicle.setBrake(breakingForce * 0.85, BACK_LEFT);
        vehicle.setBrake(breakingForce * 0.85, BACK_RIGHT);
      }
      if (actions.reset || boto === 3) {
        // TODO Teletransporta el cotxe a la posició d'origen
        aturarSons();
        motorEngegar.play();
      }
      if (actions.esquerra || gamepad && eix < -0.1) {
        if (vehicleSteering < steeringClamp) {
          vehicleSteering += steeringIncrement * (Math.abs(eix) / 2);
        }
      } else {
        if (actions.dreta || gamepad && eix > 0.1) {
          if (vehicleSteering > -steeringClamp)
            vehicleSteering -= steeringIncrement * (eix / 2);
        } else {
          // Retornar a la posició central
          if (vehicleSteering < -steeringIncrement)
            vehicleSteering += steeringIncrement;
          else {
            if (vehicleSteering > steeringIncrement)
              vehicleSteering -= steeringIncrement;
            else {
              vehicleSteering = 0;
            }
          }
        }
      }

      // Si està en tercera persona rota la càmera un poc cap al costat quan es gira
      /*if (tercera) {
        // Opcio 1 ----------
        camera.position.x = vehicleSteering;
        camera.rotation.y = Math.PI + (vehicleSteering * 0.3);
        // Opcio 2 ----------
        /!*camera.position.x = -vehicleSteering;
        camera.rotation.y = Math.PI + (vehicleSteering * 0.3);*!/
      }*/
      vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
      vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);

      //rpm = 3.6*Math.PI*wheelRadiusBack/speed*30*ratiosMarxes[marxa]*diferencial;
      rpm = Math.abs(32.02 * speed * ratiosMarxes[marxa]).toFixed(0);
      if (rpm < 1000) rpm = 1000;

      motorRalenti.setPlaybackRate(rpm / 1000);

      let rodesTransform, rodesOrigin, rodesRotacio, idx;
      let numRodes = vehicle.getNumWheels();
      for (idx = 0; idx < numRodes; idx++) {
        vehicle.updateWheelTransform(idx, true);
        rodesTransform = vehicle.getWheelTransformWS(idx);
        rodesOrigin = rodesTransform.getOrigin();
        rodesRotacio = rodesTransform.getRotation();
        wheelMeshes[idx].position.set(rodesOrigin.x(), rodesOrigin.y(), rodesOrigin.z());
        wheelMeshes[idx].quaternion.set(rodesRotacio.x(), rodesRotacio.y(), rodesRotacio.z(), rodesRotacio.w());
      }

      rodesTransform = vehicle.getChassisWorldTransform();
      rodesOrigin = rodesTransform.getOrigin();
      rodesRotacio = rodesTransform.getRotation();
      //console.log(chassisMesh)
      chassisMesh.position.set(rodesOrigin.x(), rodesOrigin.y(), rodesOrigin.z());
      chassisMesh.quaternion.set(rodesRotacio.x(), rodesRotacio.y(), rodesRotacio.z(), rodesRotacio.w());


      // Actualitza l'HTML amb la velocitat, rpm i marxa actuals
      /*let mostraMarxa = 'N';
      if (marxa === 0) mostraMarxa = 'R'
      indicadorMarxa.innerHTML = speed < 0.1 ? mostraMarxa : marxa;*/
      indicadorMarxa.innerHTML = marxa === 0 ? 'R' : marxa;
      speedometer.innerHTML = Math.abs(speed).toFixed(0);// + ' km/h' + rpm + ' rpm<br>';
      iluminacioRpm.style.setProperty("stroke-dashoffset", Number(-0.02633 * rpm + 606.376).toString());
      cercleMarxa.style.setProperty("stroke-opacity", "0.15");
      if (rpm > 7000) {
        iluminacioRpm.style.setProperty("stroke", "#FF0000");
        cercleMarxa.style.setProperty("stroke-opacity", "1");
      } else if (rpm > 6000) iluminacioRpm.style.setProperty("stroke", "#FFFF00");
      else iluminacioRpm.style.setProperty("stroke", "#FFFFFF");
    }

    syncList.push(sync);
  }

  function crearCircuit() {
    /*let pos = new three.Vector3(0, -0.5, 0);
    let mass = 0;
    let friction = 2;
    let quat = ZERO_QUATERNION;

    let shape = new three.BoxGeometry(500, 0.2, 300);
    let geometry = new Ammo.btBoxShape(new Ammo.btVector3(500, 300, 0.5));
    let mesh = new three.Mesh(shape, materialStatic);
    /!*loader.load('./src/assets/models/circuit.glb', (gltf) => {
      mesh.attach(gltf.scene);
    })*!/
    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
    scene.add(mesh)
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    geometry.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(friction);
    physicsWorld.addRigidBody(body);*/
    createBox(new three.Vector3(0, -0.5, 0), ZERO_QUATERNION, 700, 2, 300, 0, 0.9);

    // Rampa
    /*let quaternion = new three.Quaternion(0, 0, 0, 1);
    quaternion.setFromAxisAngle(new three.Vector3(1, 0, 0), -Math.PI / 18);
    createBox(new three.Vector3(0, -1.5, 0), quaternion, 8, 4, 10, 0);*/

    /*let size = .75;
    let nw = 8;
    let nh = 6;
    for (let j = 0; j < nw; j++)
      for (let i = 0; i < nh; i++)
        createBox(new three.Vector3(size * j - (size * (nw - 1)) / 2, size * i, 10), ZERO_QUATERNION, size, size, size, 10);*/

    createVehicle(vehiclePosicioOrigen, ZERO_QUATERNION);
  }

  // - Init -
  initGraphics();
  initAudio();
  initPhysics();
  crearCircuit();
  //test();
  tick();

  /**
   * Funcio per aturar tots els sons, per quan es reinicia l'escena
   */
  function aturarSons() {
    motorEngegar.stop();
    motorRalenti.stop();
  }

  /**
   * Canvia la càmera de primera a tercera persona i viceversa.
   * @param tercera
   */
  function canvia13persona() {
    if (tercera) {
      // Primera persona
      camera.position.x = 0.32;
      camera.position.y = 0.6;
      camera.position.z = -0.4;
      camera.rotation.y = Math.PI;
      svgContainer.style.top = "62%";
      svgContainer.style.left = "43%";
      svgRpm.style.width = "22em";
      svgRpm.style.height = "22em";
      tercera = false;
    } else {
      // Tercera persona
      camera.position.x = 0;
      camera.position.y = 1.8;
      camera.position.z = -6;
      camera.rotation.y = Math.PI;
      svgContainer.style.top = "65%";
      svgContainer.style.left = "80%";
      svgRpm.style.width = "35em";
      svgRpm.style.height = "35em";
      tercera = true;
    }
  }

});

function canviarMarxa(velocitat) {
  let marxaOrg = marxa;
  if (marxa === 1 && velocitat > 59) marxa += 1;
  else if (marxa === 2 && velocitat > 99) marxa += 1;
  else if (marxa === 3 && velocitat > 140) marxa += 1;
  else if (marxa === 4 && velocitat > 178) marxa += 1;
  else if (marxa === 5 && velocitat > 216) marxa += 1;
  else if (marxa === 2 && velocitat < 35) marxa -= 1;
  else if (marxa === 3 && velocitat < 80) marxa -= 1;
  else if (marxa === 4 && velocitat < 130) marxa -= 1;
  else if (marxa === 5 && velocitat < 160) marxa -= 1;
  else if (marxa === 6 && velocitat < 200) marxa -= 1;
  else if (marxa === 0 && velocitat > -1) marxa = 1;
  if (marxaOrg !== marxa) embragatge = false;
}
