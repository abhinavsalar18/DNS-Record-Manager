import dotenv from "dotenv"
import connectDB from "./db/mongoDBConnection.js"
import app from "./app.js"

connectDB()
.then(() =>{
    app.listen(process.env.PORT || 8000, () => {
        console.log("Server connected at port: ", process.env.PORT);
    });
    
    app.on("error", (error) => {
        console.log("Server unable to communicate!!", error);
    });
})
.catch((error) => {
    console.log("MongoDB Connection Failed!!", error);
});

