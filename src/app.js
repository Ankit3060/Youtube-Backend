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
import tweetRouter from "./routes/tweet.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import healthCheckRouter from "./routes/healthCheck.routes.js"
import dashboardRouter  from "./routes/dashboard.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"

//route declaration
//eg. https://localhost:8000/api/v1/users/register
app.use("/api/v1/users",userRouter)
app.use("/api/v1/video",videoRouter)
app.use("/api/v1/tweet",tweetRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/health",healthCheckRouter)
app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/subscription",subscriptionRouter)

export {app}
// export default app;