/**
 * Events del teclat
 */
// Keybord actions
let actions = {};
let keysActions = {
  "KeyW": 'accelerar',
  "KeyS": 'frenar',
  "KeyA": 'esquerra',
  "KeyD": 'dreta',
  "KeyQ": 'baixarMarxa',
  "KeyE": 'pujarMarxa',
  "KeyF": 'freMa',
  "KeyR": 'reset'
};

// Variable que evita que es canvii de marxa multiples vegades amb la mateixa polsació de tecla
let canviantMarxa = false;

window.addEventListener('keydown', keydown);
window.addEventListener('keyup', keyup);

function keyup(e) {
  if (keysActions[e.code]) {
    // Permetre tornar a canviar de marxa
    if (e.code === "KeyQ" || e.code === "KeyE") canviantMarxa = false;
    actions[keysActions[e.code]] = false;
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function keydown(e) {
  if (keysActions[e.code]) {
    // Evitar múltiples events de pujada o baixada de marxa.
    // Si es pressiona una tecla de canvi de marxa es marca com que s'està canviant de marxa
    // i es segueix el camí normal. Si és la repetició (canviantMarxa = true)
    // s'evita marcar l'acció com a true
    if (e.code === "KeyQ" || e.code === "KeyE") {
      if (canviantMarxa) {
        actions[keysActions[e.code]] = false;
        return;
      }
      canviantMarxa = true;
    }
    actions[keysActions[e.code]] = true;
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

/**
 * Events del comandament (Xbox, PS...)
 * */

window.addEventListener("gamepadconnected", function (event) {
  console.log("Gamepad connected:", event.gamepad);
  // Aquí puedes iniciar la lógica para manejar el gamepad
});

window.addEventListener("gamepaddisconnected", function (event) {
  console.log("Gamepad disconnected:", event.gamepad);
  // Aquí puedes limpiar la lógica del gamepad
});

// S'utilitza el primer comandament detectat (gamepad[0])
/** Llistat de botons
 * Eix[0] Esquerra < 0 - Dreta > 0
 * Botó 7 -> R2
 * Botó 6 -> L2
 * Botó 5 -> R1
 * Botó 0 -> A / X
 * Botó 1 -> B / ◯
 * Botó 2 -> X / □
 * Botó 3 -> Y / ⟁
 * Botó 9 -> Start
 * Botó 8 -> Select
 */
// Actualitza l'estat del comandament
let gamepad = null;
let boto = 0, eix = 0.0, potenciometre = 0.0;

function actualitzaComandament() {
  // Utilitzar el primer gamepad detectat
  gamepad = navigator.getGamepads()[0];
  boto = null;
  if (gamepad) {
    // Llegir els botons
    gamepad.buttons.forEach((button, index) => {
      if (button.pressed) {
        if (index === 7 || index === 6) potenciometre = button.value;
        else potenciometre = 0;
        boto = index;
      }
    });
    // Llegir l'eix X de l'eix esquerra
    eix = gamepad.axes[0];
  }
}
