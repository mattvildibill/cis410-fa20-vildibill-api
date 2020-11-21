const sql = require('mssql')
const mattvConfig = require('./config.js')


const config = {
    user: mattvConfig.DB.user,
    password: mattvConfig.DB.password,
    server: mattvConfig.DB.server,
    database: mattvConfig.DB.database,
}


async function executeQuery(aQuery){
    var connection = await sql.connect(config)
    var result = await connection.query(aQuery)

    return result.recordset
}

module.exports = {executeQuery: executeQuery}
// executeQuery(`SELECT *
// FROM movie
// LEFT JOIN genre
// ON genre.GenrePK = movie.GenreFK`)