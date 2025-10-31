import * as THREE from "three";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer;
let camera;
let info;
let grid;
let estrella,
  Planetas = [],
  Lunas = [];
let t0 = new Date();
let accglobal = 0.0002; // Reducida la velocidad global
let timestamp;
let flyControls;
let clock;
let camera2, activeCamera, orbitControls;
let container, switchBtn;

init();
animationLoop();

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.width = "100%";
  info.style.textAlign = "center";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.innerHTML = "three.js - sol y planetas";
  document.body.appendChild(info);

  //Defino cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Posición inicial más alejada y en diagonal
  camera.position.set(10, -15, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Colocamos el canvas dentro de un contenedor para poder añadir una UI sobre él
  container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "100%";
  container.appendChild(renderer.domElement);
  document.body.appendChild(container);

  flyControls = new FlyControls(camera, renderer.domElement);
  flyControls.dragToLook = true;
  flyControls.movementSpeed = 1.1;
  flyControls.rollSpeed = 1.1;

  // Clock necesario para pasar delta a los controles (flyControls.update)
  clock = new THREE.Clock();

  // Segunda cámara: orbit camera ubicada en un punto y mirando al centro
  camera2 = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera2.position.set(20, 10, 20);
  camera2.lookAt(0, 0, 0);

  // OrbitControls para la segunda cámara (rotar/zoom/pan con ratón)
  orbitControls = new OrbitControls(camera2, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.enablePan = true;
  orbitControls.enableZoom = true;

  // Cámara activa al inicio: la fly existente
  activeCamera = camera;
  flyControls.enabled = true;
  orbitControls.enabled = false;

  // Panel de control de cámara
  const cameraPanel = document.createElement("div");
  cameraPanel.style.position = "absolute";
  cameraPanel.style.right = "10px";
  cameraPanel.style.top = "10px";
  cameraPanel.style.padding = "10px";
  cameraPanel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  cameraPanel.style.color = "#fff";
  cameraPanel.style.fontFamily = "Monospace";
  cameraPanel.style.borderRadius = "5px";
  cameraPanel.style.zIndex = "2";
  cameraPanel.style.width = "200px";

  const btnInfo = document.createElement("h3");
  btnInfo.style.margin = "0 0 10px 0";
  btnInfo.innerHTML = "Cambio de Cámara: (e)";
  cameraPanel.appendChild(btnInfo);

  // Botón para cambiar de cámara
  switchBtn = document.createElement("button");
  switchBtn.style.width = "100%";
  switchBtn.style.padding = "5px";
  switchBtn.style.marginBottom = "10px";
  switchBtn.style.fontFamily = "Monospace";
  switchBtn.innerText = "Cámara: Fly (WASD)";

  // Función reusable para alternar cámaras (usada por el botón y por la tecla 'e')
  function toggleCamera() {
    if (activeCamera === camera) {
      // Cambiar a cámara orbital en posición fija (no copiar la posición de la fly)
      // Posición fija de la cámara orbital
      camera2.position.set(20, 10, 20);
      camera2.lookAt(0, 0, 0);
      // Aseguramos target de OrbitControls en el centro
      orbitControls.target.set(0, 0, 0);
      // Actualizamos controles para reflejar el nuevo target/posición
      orbitControls.update();

      // Reiniciamos la cámara fly a su posición inicial para que no "recuerde"
      // donde quedó antes del cambio
      camera.position.set(10, -15, 10);
      camera.lookAt(0, 0, 0);

      activeCamera = camera2;
      flyControls.enabled = false;
      orbitControls.enabled = true;
      switchBtn.innerText = "Cámara: Orbit";
    } else {
      // Cambiar a cámara fly: usamos la fly en su estado reiniciado (no copiamos
      // la posición/orientación desde la orbital)
      activeCamera = camera;
      flyControls.enabled = true;
      orbitControls.enabled = false;
      switchBtn.innerText = "Cámara: Fly (WASD)";
    }
  }

  // Evento click del botón usa la función reusable
  switchBtn.addEventListener("click", toggleCamera);

  // Listener global de teclado: tecla 'e' para alternar cámara
  // Ignoramos si el foco está en un input o textarea para no interferir al escribir
  window.addEventListener("keydown", (event) => {
    try {
      if (event.key && event.key.toLowerCase() === "e") {
        const activeTag =
          document.activeElement && document.activeElement.tagName;
        if (
          activeTag === "INPUT" ||
          activeTag === "TEXTAREA" ||
          document.activeElement.isContentEditable
        ) {
          return; // no toggle mientras se escribe
        }
        toggleCamera();
      }
    } catch (err) {
      // proteger contra errores si document.activeElement es null
    }
  });
  cameraPanel.appendChild(switchBtn);
  container.appendChild(cameraPanel);

  // Click sobre el canvas: cuando la cámara orbital está activa, un clic
  // alterna si los OrbitControls están activos o no. Esto permite al usuario
  // desactivar los controles para usar el ratón con normalidad y volver a
  // activarlos con otro clic.
  renderer.domElement.addEventListener("click", (event) => {
    try {
      // Solo actúa cuando la cámara activa es la orbital
      if (activeCamera !== camera2) return;
      // Sólo si el click fue en el canvas (evitar UI superpuesta)
      if (event.target !== renderer.domElement) return;
      // No interferir si el foco está en un input/textarea o contentEditable
      const activeTag =
        document.activeElement && document.activeElement.tagName;
      if (
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        document.activeElement.isContentEditable
      )
        return;

      // Toggle de los controles de orbit
      orbitControls.enabled = !orbitControls.enabled;
      // Ajustar cursor para dar feedback visual
      renderer.domElement.style.cursor = orbitControls.enabled
        ? "grab"
        : "default";
    } catch (err) {
      // proteger contra posibles errores
    }
  });

  //Texturas
  //Texturas de la tierra
  const tx1 = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/earthmap1k.jpg", import.meta.url)
  );
  const txb1 = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/earthbump1k.jpg", import.meta.url)
  );
  const txspec1 = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/earthspec1k.jpg", import.meta.url)
  );
  //Capa de nubes
  const tx2 = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/earthcloudmap.jpg", import.meta.url)
  );
  const txalpha2 = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/earthcloudmaptrans_invert.jpg", import.meta.url)
  );

  //Texturas del sol
  const sunmap = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/sunmap.jpg", import.meta.url)
  );
  //Texturas de Mercurio
  const mercurymap = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/mercurymap.jpg", import.meta.url)
  );
  const mercurybump = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/mercurybump.jpg", import.meta.url)
  );
  //Texturas de Venus
  const venusmap = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/venusmap.jpg", import.meta.url)
  );
  const venusbump = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/venusbump.jpg", import.meta.url)
  );
  //Texturas de Marte
  const marsmap = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/marsmap1k.jpg", import.meta.url)
  );
  const marsbump = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/marsbump1k.jpg", import.meta.url)
  );
  //Texturas de Jupiter
  const jupitermap = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/jupitermap.jpg", import.meta.url)
  );
  //Texturas de Saturno
  const saturnmap = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/saturnmap.jpg", import.meta.url)
  );
  //Texturas de Urano
  const uranusmap = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/uranusmap.jpg", import.meta.url)
  );
  //Texturas de Neptuno
  const neptunemap = new THREE.TextureLoader().load(
    new URL("/src/planets_texture/neptunemap.jpg", import.meta.url)
  );

  //Rejilla de referencia indicando tamaño y divisiones
  grid = new THREE.GridHelper(20, 40);
  //Mostrarla en vertical
  grid.geometry.rotateX(Math.PI / 2);
  grid.position.set(0, 0, 0.05);
  //scene.add(grid);

  // Panel de control de planetas
  const planetPanel = document.createElement("div");
  planetPanel.style.position = "absolute";
  planetPanel.style.right = "10px";
  planetPanel.style.top = "85px";
  planetPanel.style.padding = "10px";
  planetPanel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  planetPanel.style.color = "#fff";
  planetPanel.style.fontFamily = "Monospace";
  planetPanel.style.borderRadius = "5px";
  planetPanel.style.zIndex = "2";
  planetPanel.style.width = "200px";

  // Panel para crear nuevos planetas
  const createPlanetDiv = document.createElement("div");
  createPlanetDiv.innerHTML =
    '<h3 style="margin: 0 0 10px 0">Crear Planeta</h3>';

  // Campos de entrada para los parámetros
  const inputs = [
    {
      label: "Nombre:",
      id: "nombrePlaneta",
      type: "text",
      value: "",
      placeholder: "Nombre del planeta",
    },
    {
      label: "Radio:",
      id: "radioPlaneta",
      type: "number",
      value: "0.5",
      step: "0.1",
      min: "0.1",
      max: "2.0",
    },
    {
      label: "Distancia:",
      id: "distPlaneta",
      type: "number",
      value: "15",
      step: "1",
      min: "5",
      max: "40",
    },
    {
      label: "Velocidad:",
      id: "velPlaneta",
      type: "number",
      value: "0.3",
      step: "0.05",
      min: "0.1",
      max: "1.0",
    },
  ];

  inputs.forEach((input) => {
    const div = document.createElement("div");
    div.style.marginBottom = "5px";
    div.innerHTML = `
      <label style="display: inline-block; width: 70px">${input.label}</label>
      <input type="${input.type}" 
             id="${input.id}" 
             value="${input.value}"
             ${input.step ? `step="${input.step}"` : ""}
             ${input.min ? `min="${input.min}"` : ""}
             ${input.max ? `max="${input.max}"` : ""}
             placeholder="${input.placeholder || ""}"
             style="width: 100px; padding: 2px 5px">
    `;
    createPlanetDiv.appendChild(div);
  });

  // Botón para crear planeta
  const createBtn = document.createElement("button");
  createBtn.innerText = "Crear Planeta";
  createBtn.style.width = "100%";
  createBtn.style.padding = "5px";
  createBtn.style.marginBottom = "20px";
  createBtn.style.fontFamily = "Monospace";

  createBtn.addEventListener("click", () => {
    const nombre = document.getElementById("nombrePlaneta").value;
    const radio = parseFloat(document.getElementById("radioPlaneta").value);
    const dist = parseFloat(document.getElementById("distPlaneta").value);
    const vel = parseFloat(document.getElementById("velPlaneta").value);

    // Generar un color aleatorio
    const color = Math.random() * 0xffffff;

    // Crear el nuevo planeta
    Planeta(radio, dist, vel, color, 1, 1, nombre);
    updatePlanetList();

    // Limpiar el campo de nombre
    document.getElementById("nombrePlaneta").value = "";
  });

  createPlanetDiv.appendChild(createBtn);
  planetPanel.appendChild(createPlanetDiv);

  // Lista de planetas y botón de borrar
  const planetList = document.createElement("div");
  const planetTitle = document.createElement("h3");
  planetTitle.style.margin = "0 0 10px 0";
  planetTitle.innerHTML = "Sistema Solar";
  planetList.appendChild(planetTitle);

  const planetSelect = document.createElement("select");
  planetSelect.style.width = "100%";
  planetSelect.style.marginBottom = "10px";
  planetSelect.style.padding = "5px";
  planetSelect.style.fontFamily = "Monospace";

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "Borrar Planeta";
  deleteBtn.style.width = "100%";
  deleteBtn.style.padding = "5px";
  deleteBtn.style.marginBottom = "10px";

  planetList.appendChild(planetSelect);
  planetList.appendChild(deleteBtn);
  planetPanel.appendChild(planetList);

  // Event listener para borrar planeta
  deleteBtn.addEventListener("click", () => {
    const index = parseInt(planetSelect.value);
    if (index >= 0 && index < Planetas.length) {
      // Remover planeta y su órbita
      scene.remove(Planetas[index]);
      scene.remove(Planetas[index].userData.orbita);
      // Remover lunas asociadas si las hay
      const lunasABorrar = Lunas.filter(
        (luna) => luna.parent.parent === Planetas[index]
      );
      lunasABorrar.forEach((luna) => {
        scene.remove(luna.parent);
        Lunas.splice(Lunas.indexOf(luna), 1);
      });
      Planetas.splice(index, 1);
      updatePlanetList();
    }
  });

  // Función para actualizar la lista de planetas
  function updatePlanetList() {
    planetSelect.innerHTML = "";
    Planetas.forEach((planeta, index) => {
      const option = document.createElement("option");
      option.value = index;
      const nombre = planeta.userData.nombre || `Planeta ${index + 1}`;
      option.text = `${nombre} (Dist: ${planeta.userData.dist})`;
      planetSelect.appendChild(option);
    });
  }

  container.appendChild(planetPanel);

  //Objetos
  Estrella(3.0, 0xffff00); // Sol más grande

  // Crear planetas iniciales del sistema solar
  const planetasIniciales = [
    {
      radio: 0.4,
      dist: 6.0,
      vel: 0.3,
      color: 0xffffff,
      nombre: "Mercurio",
      tx1: mercurymap,
      txb1: mercurybump,
    },
    {
      radio: 0.6,
      dist: 9.0,
      vel: 0.18,
      color: 0xffffff,
      nombre: "Venus",
      tx1: venusmap,
      txb1: venusbump,
    },
    {
      radio: 0.7,
      dist: 12.0,
      vel: 0.46,
      color: 0xffffff,
      nombre: "Tierra",
      tx1,
      txb1,
      txspec1,
      tx2,
      txalpha2,
    },
    {
      radio: 0.5,
      dist: 15.0,
      vel: 0.24,
      color: 0xffffff,
      nombre: "Marte",
      tx1: marsmap,
      txb1: marsbump,
    },
    {
      radio: 1.2,
      dist: 19.0,
      vel: 0.62,
      color: 0xffffff,
      nombre: "Júpiter",
      tx1: jupitermap,
    },
    {
      radio: 1.0,
      dist: 24.0,
      vel: 0.5,
      color: 0xffffff,
      nombre: "Saturno",
      tx1: saturnmap,
    },
    {
      radio: 0.8,
      dist: 29.0,
      vel: 0.25,
      color: 0xffffff,
      nombre: "Urano",
      tx1: uranusmap,
    },
    {
      radio: 0.8,
      dist: 34.0,
      vel: 0.26,
      color: 0xffffff,
      nombre: "Neptuno",
      tx1: neptunemap,
    },
  ];

  // Crear los planetas iniciales
  planetasIniciales.forEach((p) => {
    // Pasamos las texturas (si existen) a la función Planeta
    Planeta(
      p.radio,
      p.dist,
      p.vel,
      p.color,
      1,
      1,
      p.nombre,
      p.tx1,
      p.txb1,
      p.txspec1,
      p.tx2,
      p.txalpha2
    );
  });

  // Añadir lunas iniciales
  Luna(Planetas[2], 0.15, 1.5, -3.5, 0xfff4ff, 1);
  Luna(Planetas[4], 0.2, 1.8, -3.0, 0xbcafb2, 1);
  Luna(Planetas[4], 0.25, 2.5, -3.5, 0xbcafb2, 6);

  // Actualizar la lista inicial de planetas
  updatePlanetList();

  //Inicio tiempo
  t0 = Date.now();
  //EsferaChild(objetos[0],3.0,0,0,0.8,10,10, 0x00ff00);

  // Resize handler para mantener proporciones y tamaño
  window.addEventListener("resize", function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    camera2.aspect = window.innerWidth / window.innerHeight;
    camera2.updateProjectionMatrix();
  });
}

function Estrella(rad, col) {
  // Crear el sol

  let geometry = new THREE.SphereGeometry(rad, 20, 20);
  // Usar la textura del sol si está cargada
  let sunTexture;
  try {
    sunTexture = new THREE.TextureLoader().load(
      new URL("/src/planets_texture/sunmap.jpg", import.meta.url)
    );
  } catch (e) {
    sunTexture = null;
  }
  let material;
  if (sunTexture) {
    material = new THREE.MeshBasicMaterial({ map: sunTexture });
  } else {
    material = new THREE.MeshBasicMaterial({ color: col });
  }
  estrella = new THREE.Mesh(geometry, material);

  // Añadir luz puntual en el centro del sol
  const luzSolar = new THREE.PointLight(0xffffff, 1.5, 100);
  luzSolar.position.set(0, 0, 0);
  estrella.add(luzSolar); // Añadimos la luz como hijo del sol

  // Añadir luz ambiente tenue para iluminación general
  const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(luzAmbiente);

  scene.add(estrella);
}

function Planeta(
  radio,
  dist,
  vel,
  col,
  f1,
  f2,
  nombre = "",
  texture = undefined,
  texbump = undefined,
  texspec = undefined,
  texcloud = undefined,
  texalpha = undefined,
  sombra = false
) {
  let geom = new THREE.SphereGeometry(radio, 32, 32); // Aumentamos la resolución
  // Creamos un único material que podrá recibir mapa y bump
  let material = new THREE.MeshPhongMaterial({
    color: col,
    shininess: 30, // Brillo de la superficie
    specular: 0x444444, // Color del reflejo especular
  });

  // Aplicar mapas si vienen como parámetros
  if (texture !== undefined) {
    material.map = texture;
    try {
      texture.encoding = THREE.sRGBEncoding;
    } catch (e) {}
    texture.needsUpdate = true;
    console.log(`Aplicando textura al planeta '${nombre}':`, texture);
  }
  if (texbump !== undefined) {
    material.bumpMap = texbump;
    material.bumpScale = 0.1;
    texbump.needsUpdate = true;
  }
  if (texspec !== undefined) {
    material.specularMap = texspec;
    texspec.needsUpdate = true;
  }

  // Marcar actualización del material y crear el mesh
  material.needsUpdate = true;
  let planeta = new THREE.Mesh(geom, material);
  planeta.userData.dist = dist;
  planeta.userData.speed = vel;
  planeta.userData.f1 = f1;
  planeta.userData.f2 = f2;
  planeta.userData.nombre = nombre;
  planeta.userData.startOffset = Math.random() * Math.PI * 2; // Offset inicial aleatorio

  // Si hay textura de nubes, crear una esfera de nubes como hijo
  if (texcloud !== undefined) {
    let cloudGeom = new THREE.SphereGeometry(radio * 1.01, 32, 32);
    let cloudMat = new THREE.MeshPhongMaterial({
      map: texcloud,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    if (texalpha !== undefined) {
      cloudMat.alphaMap = texalpha;
      cloudMat.alphaTest = 0.1;
      texalpha.needsUpdate = true;
    }
    texcloud.needsUpdate = true;
    let cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    cloudMesh.name = "CloudLayer";
    planeta.add(cloudMesh);
  }

  //Dibuja trayectoria
  let curve = new THREE.EllipseCurve(
    0,
    0, // centro
    dist * f1,
    dist * f2 // radios elipse
  );
  //Crea geometría
  let points = curve.getPoints(50);
  let geome = new THREE.BufferGeometry().setFromPoints(points);
  let mate = new THREE.LineBasicMaterial({ color: 0xffffff });
  // Objeto
  let orbita = new THREE.Line(geome, mate);

  // Guardar referencia a la órbita en el planeta
  planeta.userData.orbita = orbita;

  Planetas.push(planeta);
  scene.add(planeta);
  scene.add(orbita);
}

function Luna(planeta, radio, dist, vel, col, angle) {
  var pivote = new THREE.Object3D();
  pivote.rotation.x = angle;
  planeta.add(pivote);
  var geom = new THREE.SphereGeometry(radio, 32, 32);
  var mat = new THREE.MeshPhongMaterial({
    color: col,
    shininess: 30,
    specular: 0x444444,
  });
  var luna = new THREE.Mesh(geom, mat);
  luna.userData.dist = dist;
  luna.userData.speed = vel;
  luna.userData.startOffset = Math.random() * Math.PI * 2; // Offset aleatorio para lunas

  Lunas.push(luna);
  pivote.add(luna);
}

//Bucle de animación
function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;

  requestAnimationFrame(animationLoop);

  //Modifica rotación de todos los objetos

  for (let object of Planetas) {
    const angle =
      timestamp * object.userData.speed + object.userData.startOffset;
    object.position.x =
      Math.cos(angle) * object.userData.f1 * object.userData.dist;
    object.position.y =
      Math.sin(angle) * object.userData.f2 * object.userData.dist;

    // Rotación sobre su propio eje (rotación diurna)
    object.rotation.z += 0.01;

    // Si es la Tierra (por nombre), rota la capa de nubes en sentido contrario
    if (object.userData.nombre === "Tierra") {
      const cloudLayer = object.children.find(
        (child) => child.name === "CloudLayer"
      );
      if (cloudLayer) {
        // Rota la capa de nubes en sentido contrario
        cloudLayer.rotation.z = -angle * 1.2; // 1.2 para que sea un poco más rápido
      }
    }
  }

  for (let object of Lunas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) * object.userData.dist;
    object.position.y =
      Math.sin(timestamp * object.userData.speed) * object.userData.dist;
  }

  // Actualiza controles según cámara activa
  if (activeCamera === camera) {
    // FlyControls necesita delta en segundos
    const delta = clock.getDelta();
    if (flyControls && flyControls.enabled) flyControls.update(delta);
  } else {
    // OrbitControls utiliza damping y se actualiza cada frame
    if (orbitControls && orbitControls.enabled) orbitControls.update();
  }

  renderer.render(scene, activeCamera);
}
