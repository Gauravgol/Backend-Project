import mongoose from "mongoose";
import { DB_Name } from "../constants.js";





const connectDB = async () => {
    try {

        const connectionINS = await mongoose.connect(`${process.env.Mongo_Uri}/${DB_Name}`)
        console.log(`Connected to DB ${connectionINS.connection.host}`)
    } catch (error) {
        console.log("DB Connection Error", error)
        process.exit(1)
    }
}
export default connectDB;