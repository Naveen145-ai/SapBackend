const mongoose = require('mongoose');


const connectDatabase = () => {
    mongoose.connect(process.env.DB_URL).then((con) => {
        console.log('mongoDB connected to host:'+con.connection.host)    //we get con property inside con we get connection property.
    })


};


module.exports = connectDatabase;