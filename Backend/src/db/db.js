const mongoose=require('mongoose');
const dns=require('dns');
dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
])
async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database is connected successfully");
    }catch(error){
        console.log('Database connection error:',error);
    }
}

module.exports=connectDB;