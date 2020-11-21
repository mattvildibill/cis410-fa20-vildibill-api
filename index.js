const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const db = require('./dbConnectExec.js')
const config = require('./config.js')
const auth = require('./middleware/authenticate')

//const { response } = require('express');

const app = express();
app.use(express.json())
app.use(cors())


// app.post('/supplier/logout', auth, (rep, res) => {
//     var query = `UPDATE supplier
//     SET token = NULL
//     WHERE supplierPK = ${rep.supplier.supplierPK}`

//     db.executeQuery(query).then(()=> {res.status(200).send()})
//     .catch((error)=>{console.log("error in POST /supplier/logout", error)
//     res.status(500).send()
// })

// })


app.get("/", (req,res)=> {
    res.send("hello world")
})

app.get('/cars', (req, res)=> {
    var query = `SELECT * FROM Car
    LEFT JOIN Type
    ON Type.TypePK = Car.TypeFK`
    db.executeQuery(query)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err) => {
        console.log(err)
        res.status(500).send()
    })

})

app.get("/cars/:pk", (req, res)=> {
    var pk = req.params.pk
    var query = `SELECT * FROM Car
    LEFT JOIN Type
    ON Type.TypePK = Car.TypeFK
    WHERE CarPK = ${pk}`
    db.executeQuery(query)
    .then((result)=>{
        if(result[0]){
            res.status(200).send(result[0])
        }else{
            res.status(404).send('bad request')
        }
    })
    .catch((err) => {
        console.log(err)
        res.status(500).send()
    })


})

app.post("/supplier", async (req,res)=>{

    var FirstName = req.body.FirstName;
    var LastName = req.body.LastName;
    var Email = req.body.Email;
    var Password = req.body.Password;

    if(!FirstName || !LastName || !Email || !Password){
        //console.log(FirstName , LastName , Email , Password)
        return res.status(400).send("bad request")
    }

    FirstName = FirstName.replace("'","''")
    LastName = LastName.replace("'","''")

    var emailCheckQuery = `SELECT Email
    FROM Supplier
    WHERE Email = '${Email}'`

    var existingUser = await db.executeQuery(emailCheckQuery)

    // console.log("existing user", existingUser)
    if(existingUser[0]){
        
        return res.status(409).send('Enter a different Email.')
    }

    var hashedPassword = bcrypt.hashSync(Password)

    var insertQuery = `INSERT INTO Supplier (NameFirst,NameLast,Email,Password)
    VALUES('${FirstName}','${LastName}','${Email}','${hashedPassword}')`

    db.executeQuery(insertQuery)
        .then(()=>{res.status(201).send()})
        .catch((err)=>{
            
            res.status(500).send()
        })
})




app.post("/supplier/login", async (req,res)=>{
    

    var email = req.body.Email;
    var password = req.body.Password;

    if(!email || !password){
        return res.status(400).send('bad request')
    }

    
    var query = `SELECT *
    FROM Supplier
    WHERE Email = '${email}'`

    
    let result;

    try{
        result = await db.executeQuery(query);
    }catch(myError){
        
        return res.status(500).send()
    }

    

    if(!result[0]){return res.status(400).send('Invalid user credentials')}

        

        let user = result[0]
        
    
        if(!bcrypt.compareSync(password,user.Password)){
            console.log("invalid password");
            return res.status(400).send("Invalid user crendentials")
        }
    
       
    
        let token = jwt.sign({pk: user.SupplierPK}, config.JWT, {expiresIn: '60 minutes'} )
    
        
        let setTokenQuery = `UPDATE Supplier
        SET Token = '${token}'
        WHERE SupplierPK = ${user.SupplierPK}`
    
        try{
            await db.executeQuery(setTokenQuery)
    
            res.status(200).send({
                token: token,
                user: {
                    FirstName: user.NameFirst,
                    LastName: user.NameLast,
                    Email: user.Email,
                    SupplierPK: user.SupplierPK
                }
            })
        }
        catch(myError){
            
            res.status(500).send()
        }
    
    })




    app.post('/supplier/logout', auth, (req,res)=>{
        var query = `UPDATE Supplier
        SET Token = NULL
        WHERE SupplierPK = ${req.Supplier.SupplierPK}`
    
        db.executeQuery(query)
            .then(()=>{res.status(200).send()})
            .catch((error)=>{
                console.log("error in POST /contacts/logout", error)
                res.status(500).send()
        })
    })




    app.post("/review", auth, async (req,res)=>{

        try{ 
            var rating = req.body.Rating;
            var summary = req.body.Summary;
            var carFK = req.body.CarFK;
            
        
            if(!rating || !summary || !carFK){res.status(400).send("bad request")}
            // let countQuery = `SELECT COUNT(*) FROM Review`
            // let reviewPK = await db.executeQuery(countQuery)
            // console.log(reviewPK)
            let insertQuery = `INSERT INTO Review(Rating, Summary, CarFK, SupplierFK)
            OUTPUT inserted.ReviewPK, inserted.Rating, inserted.Summary, inserted.CarFK, inserted.SupplierFK
            VALUES('${rating}', '${summary}', ${carFK}, ${req.Supplier.SupplierPK})`
            console.log(insertQuery)
            let insertedReview = await db.executeQuery(insertQuery)
    
            // console.log(insertedReview)
            res.status(201).send(insertedReview[0])
        }
        catch(error){
            console.log(error)
            res.status(500).send()
        }
    })



    app.get("/review/me", auth, (req,res)=> {

       
    
        var query = `SELECT * 
        FROM [Review]
        WHERE SupplierFK = ${req.Supplier.SupplierPK}`
    
        db.executeQuery(query)
        .then((result) => {
            res.status(200).send(result)
        }).catch((error)=>{
            res.status(500)
        })
    
    
    })
    
// app.post("/review", auth, async, (req, res)=>{
//     try{
//         var reviewFK = req.body.reviewFK
//         var rating = req.body.rating
//         var summary = req.body.summary

//         if(!reviewFK || !rating || !summary){res.status(400).send("bad request")}

//         let insertQuery = `INSERT INTO Review((rating, summary, reviewFK))
//         OUTPUT inserted.reviewID, inserted.reviewFK, inserted.rating, inserted.summary
//         VALUES('${reviewFK}', '${rating}', '${summary}')`

//         //let insertedSub = await db.executeQuery(insertQuery)

//         res.send(201).send(insertedSub[0])
//     }catch(error){
//         res.status(500).send()
//     }
// })

// app.get("/movies", (req,res)=> {
//     //get data from database
//     db.executeQuery(`SELECT *
//     FROM movie
//     LEFT JOIN genre
//     ON genre.GenrePK = movie.GenreFK`)
//     .then((result)=>{
//         res.status(200).send(result)
//     })
//     .catch((err)=>{
//         console.log(err);
//         res.status(500).send()
//     })
// })

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {console.log(`app is running on port ${PORT}`)})