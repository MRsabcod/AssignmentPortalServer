import multer from 'multer'
import {
 GridFsStorage
} from 'multer-gridfs-storage'
import Grid from 'gridfs-stream'
import crypto from 'crypto' 
import path from 'path'
// const promise = mongoose.connect(`mongodb+srv://sabeebr97:sabeeb123@cluster001.2fq3xab.mongodb.net`, { useNewUrlParser: true });

// const conn = mongoose.connection;
// let gfs;

// conn.once('open',() => {
//   gfs = Grid(conn, mongoose.mongo);
//   gfs.collection('uploads');
// });
const storage = new GridFsStorage({
    url:'mongodb+srv://sabeebr97:sabeeb123@cluster001.2fq3xab.mongodb.net/hackathondb',
    file: (req, file) => {
        // console.log(req)
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
export const uploads = multer({ storage });
