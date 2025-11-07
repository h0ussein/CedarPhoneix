import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const mongo_url = process.env.MONGO_URI

const conn = () =>{
return mongoose.connect(mongo_url).then(() => {
    console.log("mongoose connected")
}).catch((err) => {
    console.log("mongoose not connected", err)
})
}

export default conn;