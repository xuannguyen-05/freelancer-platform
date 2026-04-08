require("dotenv").config();
const connection = require("./config/database");
const app = require('./app')


const port = process.env.PORT || 8888;
const hostname = process.env.HOST_NAME;


(async() => {
    try {
        await connection();
        
        app.listen(port, hostname, () => {
            console.log(`Server running at http://${hostname}:${port}`);
        })
    } catch (error) {
        console.log("Error connect to DB", error)
    }
})()

