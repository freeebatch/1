import mongoose from 'mongoose'
import dotenv from 'dotenv';
dotenv.config();

; (async () => {
  await mongoose.connect(`${process.env.MONGODB_URL}`)
    .then(() => { console.log('MongoDB Connected'); })
    .catch((err) => { console.log('MongoDB Connection FAILED ', err); });
})();

// ; (async () => {
//   await mongoose.connect(`${process.env.MONGODB_URL}`)
//     .then(() => { console.log('MongoDB Connected'); })
//     .catch((err) => { console.log('MongoDB Connection FAILED ', err); });
// })();