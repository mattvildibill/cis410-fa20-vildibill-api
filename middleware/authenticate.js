const jwt = require('jsonwebtoken')

const db = require('../dbConnectExec.js')
const config = require('../config.js')

const auth = async(req, res,next)=>{
    console.log(req.header('Authorization'))
    try{

        //1. decode token

        let myToken = req.header('Authorization').replace('Bearer ','')
        console.log(myToken)

        let decodedToken = jwt.verify(myToken, config.JWT)
        console.log(decodedToken)

        let SupplierPK = decodedToken.pk;
        console.log(SupplierPK)


        //2. compare token with db token
        let query = `SELECT SupplierPK, NameFirst, NameLast, Email
        FROM Supplier
        WHERE SupplierPK = ${SupplierPK} and Token = '${myToken}'`

        let returnedUser = await db.executeQuery(query)
        console.log("hi,",returnedUser)
        //3. save user information in request
        if(returnedUser[0]){
            req.Supplier = returnedUser[0];
            next()
        }
        else{res.status(401).send('Authentication failed.')}

    }catch(myError){
        console.log("hi ", myError)
        res.status(401).send("Authentication failed.")
    }
}

module.exports = auth