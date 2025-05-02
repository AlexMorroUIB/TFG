const mariadb = require('mariadb');
const serverPool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD, //connectionLimit: 10,
  database: process.env.DB_NAME, //Default database to use when establishing the connection
  //port: 3306, //it uses the port 3306 by default
  timezone: 'Z', //UTC timezone
  resetAfterUse: true,
  idleTimeout: 20,
  connectionLimit: 10,
});

module.exports = {
  // Availability Query https://{host}/{GYGVERSION}/get-availabilities/
  GetUser(req, res) {
    let reqData = req.body;
    let resposta = {"existent": false}
    serverPool.getConnection().then(async conn => {
      try {
        let sqlQuery = `SELECT puntuacio FROM puntuacions WHERE nom = '${reqData.nom}' AND edat = ${reqData.edat} `;

        // Get SELECT rows and end connection
        let rows = await conn.query(sqlQuery);
        console.log(rows);
        if (rows.length < 1) {
          try {
            let sqlQuery = `INSERT INTO puntuacions (nom, edat, puntuacio) VALUES ('${reqData.nom}', ${reqData.edat}, 0)`;
            // Get SELECT rows and end connection
            let rows = await conn.query(sqlQuery);

          } catch (err) {
            console.log("Error intentant insertar l'usuari nou: ");
            console.log(err);
          } finally {
            // Close Connection
            if (conn) await conn.end();
          }
        }

        if (conn) await conn.end();
        // Si no existia envia false, si existeix envia true
        res.status(200).send({existent: (rows.length > 0), puntuacio: (rows.length > 0) ? rows[0].puntuacio : 0});
      } catch (err) {
        console.log("Error fent select de l'usuari: ");
        console.log(err);
      } finally {
        // Close Connection
        if (conn) await conn.end();
      }
    });
  },
  InsertPreguntes(req, res) {
    let reqData = req.body;
    let experiencia = 0;
    if (reqData.experiencia === "true") experiencia = 1;

    console.log(reqData.nom);
    console.log(reqData.edat);
    console.log(reqData.experiencia);
    console.log(experiencia);
    console.log(reqData.sexe);

    serverPool.getConnection().then(async conn => {
      try {
        let sqlQuery = `UPDATE puntuacions
                        SET experiencia = ${experiencia},
                            sexe = '${reqData.sexe}'
                        WHERE nom = '${reqData.nom}'
                          AND edat = ${reqData.edat}`;

        let rows = await conn.query(sqlQuery);
        await conn.end()
        console.log(rows);

        res.status(200);
      } catch (err) {
        console.log("Error insertant les respostes de les preguntes: ");
        console.log(err);
      } finally {
        // Close Connection
        if (conn) await conn.end();
      }
    });
  },
  UpdatePuntuacio(req, res) {
    let reqData = req.body;
    let experiencia = false;
    if (reqData.experiencia === "true") experiencia = true;
    console.log(reqData);

    serverPool.getConnection().then(async conn => {
      try {
        let sqlQuery = `UPDATE puntuacions
                        SET dispars = ${reqData.dispars},
                            encerts = ${reqData.encerts},
                            puntuacio = ${reqData.puntuacio},
                            ronda = ${reqData.ronda}
                        WHERE nom = '${reqData.nom}'
                          AND edat = ${reqData.edat}`;

        let rows = await conn.query(sqlQuery);
        await conn.end()
        console.log(rows);
        res.status(200);
      } catch (err) {
        console.log("Error actualitzant la puntuacio de l'usuari: ");
        console.log(err);
      } finally {
        // Close Connection
        if (conn) await conn.end();
      }
    });
  }
}
