# Sistema Solar — Práctica S7 IG

Demo interactiva con Three.js que muestra un Sol y varios planetas con texturas, controles de cámara y una pequeña UI para crear/borrar planetas en tiempo real.

Este README ampliado explica en detalle los controles y que funciones se pueden usar usando el panel UI.

## Estructura del proyecto (archivos clave)
- `src/index.html` — HTML que carga el módulo `solarsistem.js`.
- `src/solarsistem.js` — todo el motor: inicialización, cámaras, controles, luces, creación de planetas/lunas y loop de animación.
- `src/planets_texture/` — texturas (jpg/png) usadas por los planetas y el Sol.
- `package.json` — scripts y dependencias (usa **Parcel** para bundling y servidor de desarrollo).

---

## Ejecución del Proyecto en Local

Para poder ver y modificar esta práctica, necesitas tener **Node.js** y **npm** instalados. El proyecto utiliza **Parcel** como bundler y servidor de desarrollo local.

### Prerrequisitos

* **Node.js y npm:** Asegúrate de tenerlos instalados en tu sistema.

### Pasos

1.  **Clonar o Descargar el Proyecto:**
    * Si tienes el repositorio, clónalo: `git clone <URL_DEL_REPOSITORIO>`
    * Si tienes solo la carpeta, navega hasta ella en tu terminal.

2.  **Instalar Dependencias:**
    * Abre la terminal en la carpeta raíz del proyecto y ejecuta:
        ```bash
        npm install
        ```
    * Esto descargará las librerías necesarias, incluyendo Three.js, FlyControls, OrbitControls, y Parcel, tal como están definidas en el archivo `package.json`.

3.  **Iniciar el Servidor de Desarrollo:**
    * Una vez instaladas las dependencias, usa el script definido para iniciar el servidor de Parcel:
        ```bash
        npm run start
        ```
    * Parcel compilará los archivos e iniciará un servidor local.
    * **Automáticamente se abrirá tu navegador** en la dirección (generalmente) `http://localhost:1234`.

4.  **Desarrollo:**
    * El servidor de Parcel incluye **Live Reloading**. Cualquier cambio que guardes en archivos como `src/solarsistem.js` o `src/index.html` se reflejará automáticamente en el navegador.

---

## Controles de la escena — descripción detallada
El proyecto tiene dos modos de cámara y varias formas de interacción:

- Cámara Fly (modo vuelo):
    - Controlador: `FlyControls` (importado desde three/examples).
    - Teclas: **W** = adelante, **S** = atrás, **A** = izquierda, **D** = derecha.
    - Ratón: mantener clic y arrastrar (`dragToLook = true`) para rotar la cámara.
    - Uso: buena para explorar libremente el sistema.
  <img width="1901" height="896" alt="Captura de pantalla 2025-10-30 123547" src="https://github.com/user-attachments/assets/aa1475d6-83cd-4a95-a482-d08d182cdd47" />


- Cámara Orbit (modo orbital):
    - Controlador: `OrbitControls`.
    - Ratón: botón izquierdo arrastra/rota alrededor del objetivo, rueda hace zoom, botón derecho/shift+arrastrar para pan (configurable).
  <img width="1901" height="892" alt="Captura de pantalla 2025-10-30 123730" src="https://github.com/user-attachments/assets/d6adf64c-4970-4e9a-b0c6-c44eb97714ec" />


- Alternancia de cámaras:
    - Tecla `e`: alterna entre **Fly** y **Orbit** (el código evita alternar si el foco está en un input/textarea o si el elemento es `contentEditable`).
    - Hay un botón en la UI (arriba a la derecha del canvas) para alternar manualmente. Cuando se cambia a Orbit, la cámara orbital se posiciona en un punto fijo (20,10,20) y su *target* se fija al centro.
   <img width="224" height="83" alt="Captura de pantalla 2025-10-30 123830" src="https://github.com/user-attachments/assets/7d669a32-0842-4613-83a6-aa3213f152ad" />


- Click sobre el canvas (cuando la cámara activa es Orbit):
    - Actúa como *toggle* para `orbitControls.enabled` (permite desactivar el control para interactuar con UI o elementos HTML superpuestos).

---

## Panel UI de planetas (qué puedes hacer)
En la esquina derecha hay un panel "Crear Planeta" con campos:
- **Nombre:** texto (opcional). Se usa para identificar el planeta en la lista.
- **Radio:** número (ej. 0.5) — define el tamaño del planeta.
- **Distancia:** número (ej. 15) — semieje mayor de la órbita (en unidades arbitrarias usadas en la escena).
- **Velocidad:** número (ej. 0.3) — velocidad angular de la órbita.

Botones:
- **Crear Planeta:** crea un planeta con los parámetros indicados y lo añade a la escena.
- **Lista desplegable "Sistema Solar":** muestra los planetas actuales (nombre y distancia). Selecciona uno para eliminarlo.
- **Borrar Planeta:** borra el planeta seleccionado y sus lunas asociadas.
<img width="224" height="303" alt="Captura de pantalla 2025-10-30 124036" src="https://github.com/user-attachments/assets/99f5d7c7-826e-4ab4-91ce-2b2c66cbda17" />


Internamente, los planetas creados por la UI usan la función `Planeta(...)` que añade un `Mesh` y una `Line` (órbita) y guarda metadatos en `mesh.userData`.

---

## Referencias
Todas las texturas, mapas de rugosidad, mapas de transparencia y el mapa de reflexión especular de la Tierra han sido sacados de [aquí](https://planetpixelemporium.com/planets.html).

Link del codigo en Codesandbox: https://codesandbox.io/p/sandbox/ig2526-s7-esteban-235x8f
