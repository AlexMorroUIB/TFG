const mariadb = require('mariadb');
const serverPool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME, // Default database to use when establishing the connection
  //port: 3306, //it uses the port 3306 by default
  timezone: 'Z', //UTC timezone
  resetAfterUse: true,
  idleTimeout: 20,
  connectionLimit: 10,
});

module.exports = {
  //
  GetUser(req, res) {
    let reqData = req.body;
    let resposta = {"existent": false}
    serverPool.getConnection().then(async conn => {
      try {
        let sqlQuery = `SELECT puntuacio
                        FROM puntuacions
                        WHERE nom = '${reqData.nom}'
                          AND edat = ${reqData.edat} `;

        // Get SELECT rows
        let rows = await conn.query(sqlQuery);
        console.log(rows);
        if (rows.length < 1) {
          try {
            let sqlQuery = `INSERT INTO puntuacions (nom, edat, puntuacio)
                            VALUES ('${reqData.nom}', ${reqData.edat}, 0)`;
            // Get SELECT rows
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
        // Si no existia envia false, si existeix envia true junt amb la puntuacio
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

    serverPool.getConnection().then(async conn => {
      try {
        let sqlQuery = `UPDATE puntuacions
                        SET experiencia = ${experiencia},
                            sexe        = '${reqData.sexe}'
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
  // Actualitza la puntuació de l'usuari que es rep per paràmetre
  UpdatePuntuacio(req, res) {
    let reqData = req.body;
    let experiencia = false;
    if (reqData.experiencia === "true") experiencia = true;
    console.log(reqData);

    serverPool.getConnection().then(async conn => {
      try {
        let sqlQuery = `UPDATE puntuacions
                        SET dispars   = ${reqData.dispars},
                            encerts   = ${reqData.encerts},
                            puntuacio = ${reqData.puntuacio},
                            ronda     = ${reqData.ronda}
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
  },
  GetTopPuntuacions(req, res) {
    serverPool.getConnection().then(async conn => {
      try {
        let sqlQuery = `SELECT nom, puntuacio, ronda
                        FROM puntuacions
                        ORDER BY puntuacio DESC LIMIT 10;`;

        let rows = await conn.query(sqlQuery);
        await conn.end()
        // console.log(rows);
        res.status(200).send(rows);
      } catch (err) {
        console.log("Error demanant el top 10 de puntuacions: ");
        console.log(err);
      } finally {
        // Close Connection
        if (conn) await conn.end();
      }
    });
  }
}
