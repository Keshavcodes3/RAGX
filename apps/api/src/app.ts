import 'dotenv/config'
import cookieParser from "cookie-parser"
import express from "express"
import helmet from "helmet"

import authRoutes from "@/Modules/Auth/Routes/auth.routes"
import projectRoutes from "@/Modules/Projects/Routes/project.routes"

const app = express()

app.use(helmet())
app.use(express.json())
app.use(cookieParser())

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "OK" })
})

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/projects", projectRoutes)

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

export default app
