import mongoose from 'mongoose'
import Grid from 'gridfs-stream'
 let gfs;

const connectDB = async () => {
    try {
       
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/hackathondb`)
        
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        
    //    const dbNamesArray= await connectionInstance.connection.db.collection('uploads.chunks').find().toArray()
    // //     //  dbNamesArray.map((el) => {
    // //         //   });
    //       dbNamesArray.map((doc)=>{
    //         console.log(doc)
    //       })
        
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}
var conn =  mongoose.connection;

conn?.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads"
  });
}); 

export  {connectDB,gfs}