const modalUsuari = document.getElementById("modalUsuari");
const arc = document.getElementById("arc");

function comprovarNomUsuari() {
  let nomComplet = document.getElementById("inputNom").getAttribute("value");
  let separador = ','
  // Verificar que el nom d'usuari no sigui null
  if (nomComplet) {
    console.log(nomComplet)
    if (nomComplet.indexOf(separador) === -1) nomComplet = nomComplet.concat(`${separador}0`);
    let nom = nomComplet.substring(0, nomComplet.indexOf(separador));
    let edat = nomComplet.substring(nomComplet.indexOf(separador) + 1);
    console.log(nom)
    console.log(edat)
    enviarNomUsuari(nom, edat)
  } else {
    alert("Por favor, introduce tu nombre de usuario");
  }
}

// Envia el nom i l'edat a la base de dades,
// si no existia es crea i demana les preguntes d'experiècia prèvia i sexe,
// si ja existia no demana les preguntes
// finalment guarda l'usuari en localStorage
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
      localStorage.setItem('nom', nom);
      localStorage.setItem('edat', edat);
      localStorage.setItem('existent', data.existent);
      console.log(`Sessio iniciada, usuari: ${nom} - ${edat} - ${data.existent}`)
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
  arc.setAttribute('grabbable', '');
}

/**
 * Events del teclat
 */
document.addEventListener('a-keyboard-update', updateInput);
let input = '';

function updateInput(e) {
  let code = parseInt(e.detail.code);
  switch (code) {
    case 8: // Backspace
      input = input.slice(0, -1);
      break;
    case 13: // Enter
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
