const modalUsuari = document.getElementById("modalUsuari");
const arc = document.getElementById("arc");

function comprovarNomUsuari() {
  let nomComplet = document.getElementById("inputNom").getAttribute("value");
  let separador = ','
  // Verificar que el nom d'usuari no sigui null
  if (nomComplet) {
    if (nomComplet.indexOf(separador) === -1) nomComplet = nomComplet.concat(`${separador}0`);
    let nom = nomComplet.substring(0, nomComplet.indexOf(separador));
    let edat = nomComplet.substring(nomComplet.indexOf(separador) + 1);
    document.removeEventListener('a-keyboard-update', updateInput);
    document.getElementById('keyboard').removeAttribute('a-keyboard');
    // Poder agafar l'arc abans de que es faci la petició al servidor per una millor experiècia
    // arc.setAttribute('grabbable', '');
    enviarNomUsuari(nom, edat).then(r => null);
  } else {
    modalUsuari.innerHTML += `<a-text color="#F00"
            value="Per favor, introdueix el teu nom."
            align="center" scale="0.5 0.5 0.5" position="0 0.4 0"></a-text>`
  }
}

// Envia el nom i l'edat a la base de dades,
// si no existia es crea i demana les preguntes d'experiècia prèvia i sexe,
// si ja existia no demana les preguntes
// finalment guarda l'usuari en sessionStorage
async function enviarNomUsuari(nom, edat) {
  await fetch("/getUsuari", {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({nom: nom, edat: edat})
  }).then(res => res.json().then(
    data => {
      sessionStorage.setItem('nom', nom);
      sessionStorage.setItem('edat', edat);
      sessionStorage.setItem('existent', data.existent);
      sessionStorage.setItem('puntuacio', data.puntuacio);
      console.log(`Sessio iniciada, usuari: ${nom} - ${edat} - ${data.existent} - ${data.puntuacio}`)
      texteAgafaArc();
    })
  );
}

/**
 * Modifica el modal d'inici de sessió
 */
function texteAgafaArc() {
  modalUsuari.innerHTML = null;
  let agafaText = document.createElement('a-text');
  agafaText.setAttribute('color', '#FFF');
  agafaText.setAttribute('value', "Agafa l'arc per iniciar.");
  agafaText.setAttribute('align', 'center');
  agafaText.setAttribute('scale', '0.5 0.5 0.5');
  agafaText.setAttribute('position', '0 0 0');

  modalUsuari.appendChild(agafaText);
}

/**
 * Events del teclat
 */
document.addEventListener('a-keyboard-update', updateInput);
let input = '';

function updateInput(e) {
  let code = parseInt(e.detail.code);
  switch (code) {
    case 24: // Cancel
      input = '';
      break;
    case 8: // Backspace
      input = input.slice(0, -1);
      break;
    case 13: // Enter
    case 6:  // Submit
      let inputField = document.getElementById('inputNom');
      inputField.setAttribute('value', input);
      input = ''; // Reset input value
      comprovarNomUsuari();
      return;
    default:
      input += e.detail.value;
      break;
  }
  document.getElementById('inputNom').setAttribute('value', input + '_');
}
