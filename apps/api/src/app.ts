import 'dotenv/config'
import cookieParser from "cookie-parser"
import express from "express"
import helmet from "helmet"
import cors from "cors"

import { envConfig } from "@/config/envConfig"
import { errorMiddleware, notFoundMiddleware } from "@/Middlewares/error.middleware"
import authRoutes from "@/Modules/Auth/Routes/auth.routes"
import documentRoutes from "@/Modules/Documents/Routes/document.routes"
import projectRoutes from "@/Modules/Projects/Routes/project.routes"

const app = express()

app.use(helmet())
app.use(cors({
  origin: envConfig.WEB_APP_URL,
  credentials: true,
}))
// NOTE: 15mb matches the ingestion MAX_DOCUMENT_BYTES guard so oversized
// base64 uploads fail once, at the service layer, with a domain error.
app.use(express.json({ limit: "15mb" }))
app.use(cookieParser())

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "OK" })
})

// NOTE: route ownership — `/api/v1/auth` (sessions), `/api/v1/projects`
// (dashboard session auth, project-scoped), `/api/v1` (SDK key auth:
// documents/search/ask). Document endpoints intentionally live in two
// routers because the auth mechanism differs, not the domain logic;
// both delegate to the same DocumentController + DocumentService.
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/projects", projectRoutes)
app.use("/api/v1", documentRoutes)

// WHY: controllers translate known errors inline for per-endpoint shape
// control; this backstop catches anything that escapes (async throws,
// middleware errors) and guarantees the same `{ success, message }`
// envelope instead of Express's default HTML error page.
app.use(notFoundMiddleware)
app.use(errorMiddleware)

export default app
