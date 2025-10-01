import express from "express";
import { createPool } from "mysql2";
import { config } from "dotenv";

config()
const app=express()
console.log({
    host:process.env.MYSQLDB_HOST
})

const pool=createPool({
    host:process.env.MYSQLDB_HOST,
    user:process.env.MYSQLDB_USER,
    password:process.env.MYSQLDB_PASSWORD,
    port:process.env.MYSQLDB_PORT
})
app.get('/',(req,res)=>{
    res.send("Helo22232222227")
})
console.log("hola")
app.get('/ping', async(req,res)=>{
    const [rows] = await pool.promise().query("SHOW DATABASES");
    res.json(rows);
})
app.listen(3000)
console.log('Server on port ',3000)