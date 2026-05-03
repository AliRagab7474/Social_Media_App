import { connect } from "mongoose"
import { DB_URI } from "../config/config"

const connectionDB = async()=>{
    try {
        await connect(DB_URI,{serverSelectionTimeoutMS:30000})
        console.log(`Database connected successfully`);
        
    } catch (error) {
        console.log(`failed to connect to DB`);
    }
}
export default connectionDB