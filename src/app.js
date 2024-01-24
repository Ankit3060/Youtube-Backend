import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))

// Accepting the data from other source such as url,json upto 16kb
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))

app.use(express.static("public"))

// Setting the cookie
app.use(cookieParser())


//Routes importing
import userRouter from './routes/user.routes.js'
import videoRouter from "./routes/video.routes.js"

//route declaration
//eg. https://localhost:8000/api/v1/users/register
app.use("/api/v1/users",userRouter)
app.use("/api/v1/video",videoRouter)

export {app}
// export default app;