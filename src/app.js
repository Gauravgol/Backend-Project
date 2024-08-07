import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()

app.use(cors({
    origin: process.env.CORS_URL
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.route.js';
import commentRouter from './routes/comment.route.js'

app.use('/api/v1/user', userRouter);
app.use('/api/v1/video', videoRouter)
app.use('/api/v1/comment', commentRouter)


export { app }