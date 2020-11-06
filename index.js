const express = require('express');
const { response } = require('express');

const app = express();


app.get("/hi", (req,res)=> {
    res.send("hello world")
})

app.listen(5000, () => {console.log("app is running on port 5000")})