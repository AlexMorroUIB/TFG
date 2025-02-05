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
  // - Global variables -
  let DISABLE_DEACTIVATION = 4;
  let TRANSFORM_AUX = new Ammo.btTransform();
  let ZERO_QUATERNION = new three.Quaternion(0, 0, 0, 1);

  // Graphics variables
  let container, stats, speedometer;
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
  let vehiclePosicioOrigen = new three.Vector3(0, 2, -20);
  let chassisMesh;

  // - Functions -

  function initGraphics() {

    container = document.getElementById('container');
    speedometer = document.getElementById('speedometer');
    document.getElementById("botoCamera").onclick = canvia13persona;

    // Crea la escena 3D
    scene = new three.Scene();

    camera = new three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
    //controls = new OrbitControls( camera );

    renderer = new three.WebGLRenderer({antialias: true});
    renderer.setClearColor(0xb8dafc);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Afegir compatibilitat amb VR
    cameraHolder = new three.Group(); // Entitat que conté la camera per poder mourer-la
    renderer.setAnimationLoop(tick);
    document.body.appendChild(VRButton.createButton(renderer));
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType( 'local' );

    // Quan comença la sessió VR afegeix la càmera al cotxe
    renderer.xr.addEventListener('sessionstart', () => {
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
    materialStatic = new three.MeshPhongMaterial({color: 0x999999});
    materialInteractive = new three.MeshBasicMaterial({color: 0xFFFFFF});
    materialInteractive.alphaMap = 0x000000;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);
  }

  /**
   * Inicialització de la reproducció d'audio
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
    audioLoader.load('src/assets/audio/start-engine.mp3', function (buffer) {
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

    if (!mass) mass = 0;
    if (!friction) friction = 1;

    let mesh = new three.Mesh(shape, material);
    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
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
    mesh.material.colorWrite = false;
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
    camera.position.z += 0.3;
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
    let ratiosMarxes = [3.2, 3.6, 2.2, 1.5, 1.2, 1, 0.76];
    let diferencial = 4.1;

    let wheelAxisPositionBack = -(chassisLength / 3);
    let wheelHalfTrackBack = chassisWidth / 1.8;
    let wheelRadiusBack = .4;
    let wheelWidthBack = .2;
    let wheelAxisHeightBack = .3;

    let wheelAxisFrontPosition = chassisLength / 2.8;
    let wheelHalfTrackFront = chassisWidth / 1.8;
    let wheelRadiusFront = .4;
    let wheelWidthFront = .2;
    let wheelAxisHeightFront = .3;

    let friction = 1000;
    let suspensionStiffness = 28.0;
    let suspensionDamping = 3.2;
    let suspensionCompression = 4.4;
    let suspensionRestLength = 0.6;
    let rollInfluence = 0.01;

    let steeringIncrement = .04;
    let steeringClamp = .5;
    let maxEngineForce = 200;
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

      /*if ((actions.baixarMarxa || boto === 2) && (marxa > 1 || (marxa === 1 && speed < 1))) marxa--;
      if ((actions.pujarMarxa || boto === 2) && (marxa < 6 || (marxa === 0 && speed > -1))) marxa++;*/
      if (actions.accelerar || boto === 7) {
        if (embragatge) {
          if (speed > -0.12) {
            engineForce = maxEngineForce * ratiosMarxes[marxa] * diferencial * potenciometre;
            vehicle.applyEngineForce(engineForce, BACK_LEFT);
            vehicle.applyEngineForce(engineForce, BACK_RIGHT);
            rpm += 10 * potenciometre;
            canviarMarxa(speed);
          } else if (marxa === 0) {
            engineForce = -(maxEngineForce * ratiosMarxes[marxa] * diferencial * potenciometre);
            vehicle.applyEngineForce(engineForce, BACK_LEFT);
            vehicle.applyEngineForce(engineForce, BACK_RIGHT);
            rpm += 10 * potenciometre;
          }
        } else {
          if (marxa === 0) rpm = 850;
          embragatge = true
        }
      }
      if (actions.frenar || boto === 6) {
        if (embragatge && speed < 1) {
          // Posar marxa enrere
          marxa = 0;
        }
        breakingForce = maxBreakingForce * potenciometre;
        vehicle.setBrake(breakingForce, FRONT_LEFT);
        vehicle.setBrake(breakingForce, FRONT_RIGHT);
        vehicle.setBrake(breakingForce * 0.85, BACK_LEFT);
        vehicle.setBrake(breakingForce * 0.85, BACK_RIGHT);
        if (speed > 1 && rpm >= 850) {
          rpm -= 10 * potenciometre;
        } else {
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

      // Si està en tercera persona rota la càmera un poc cap al costat
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
      let mostraMarxa = 'N';
      if (marxa === 0) mostraMarxa = 'R'
      speedometer.innerHTML = rpm + ' rpm<br>' + Math.abs(speed).toFixed(1) + ' km/h - ' + (speed < 0.1 ? mostraMarxa : marxa);
    }

    syncList.push(sync);
  }

  function createObjects() {

    createBox(new three.Vector3(0, -0.5, 0), ZERO_QUATERNION, 200, 1, 200, 0, 2);

    let quaternion = new three.Quaternion(0, 0, 0, 1);
    quaternion.setFromAxisAngle(new three.Vector3(1, 0, 0), -Math.PI / 18);
    createBox(new three.Vector3(0, -1.5, 0), quaternion, 8, 4, 10, 0);

    let size = .75;
    let nw = 8;
    let nh = 6;
    for (let j = 0; j < nw; j++)
      for (let i = 0; i < nh; i++)
        createBox(new three.Vector3(size * j - (size * (nw - 1)) / 2, size * i, 10), ZERO_QUATERNION, size, size, size, 10);

    createVehicle(vehiclePosicioOrigen, ZERO_QUATERNION);
  }

  // - Init -
  initGraphics();
  initAudio();
  initPhysics();
  createObjects();
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
      // Si és tercera persona canvia a primera
      camera.position.x = 0.32;
      camera.position.y = 0.6;
      camera.position.z = -0.4;
      camera.rotation.x = 1;
      camera.rotation.y = Math.PI;
      tercera = false;
    } else {
      camera.position.x = 0;
      camera.position.y = 2;
      camera.position.z = -5;
      camera.rotation.x = 0;
      camera.rotation.y = Math.PI;
      tercera = true;
    }
  }

});

function canviarMarxa(velocitat) {
  let marxaOrg = marxa;
  if (marxa === 1 && velocitat > 36) marxa += 1;
  else if (marxa === 2 && velocitat > 75) marxa += 1;
  else if (marxa === 3 && velocitat > 98) marxa += 1;
  else if (marxa === 4 && velocitat > 158) marxa += 1;
  else if (marxa === 5 && velocitat > 194) marxa += 1;
  else if (marxa === 2 && velocitat < 22) marxa -= 1;
  else if (marxa === 3 && velocitat < 70) marxa -= 1;
  else if (marxa === 4 && velocitat < 94) marxa -= 1;
  else if (marxa === 5 && velocitat < 150) marxa -= 1;
  else if (marxa === 6 && velocitat < 184) marxa -= 1;
  else if (marxa === 0 && velocitat > 0) marxa = 1;
  if (marxaOrg !== marxa) embragatge = false;
}
