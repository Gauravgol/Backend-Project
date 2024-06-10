// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_Name } from "./constants.js";
import express from "express";
import connectDB from "./db/db.js";

const app = express()

dotenv.config({
    path: './env'
})
connectDB()





// connection other way
// ; (async () => {
//     try {
//         await mongoose.connect(process.env.Mongo_Uri / DB_Name)
//         app.on("error", (error) => {
//             console.log("Error", error)
//         })

//         app.listen(process.env.port, () => {
//             console.log("Connect to Db")
//         })

//     } catch (error) {
//         console.log("Error: ", error)
//     }
// })