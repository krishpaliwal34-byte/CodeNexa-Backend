import express, {
  Request,
  Response,
} from "express";

import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

import adminRoutes from "./routes/adminRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import technologyRoutes from "./routes/technologyRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import trustedByRoutes from "./routes/trustedByRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import statRoutes from "./routes/statRoutes.js";
import careerRoutes from "./routes/careerroutes.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;

/* CORS*/

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://code-nexa-pi.vercel.app",
    ],
    credentials: true,
  })
);

/* BODY PARSER */

app.use(
  express.json({
    limit: "25mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "25mb",
  })
);

app.use(cookieParser());


let dbPromise: Promise<void> | null = null;

const connectDatabase = async () => {
  if (!dbPromise) {
    dbPromise = connectDB();
  }

  await dbPromise;
};


app.use(
  async (
    req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    try {
      await connectDatabase();
      next();
    } catch (error) {
      console.error(
        "Database Connection Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }
  }
);


app.use("/api/admin", adminRoutes);

app.use("/api/contact", contactRoutes);

app.use("/api/blogs", blogRoutes);

app.use("/api/projects", projectRoutes);

app.use(
  "/api/technologies",
  technologyRoutes
);

app.use(
  "/api/services",
  serviceRoutes
);

app.use(
  "/api/trusted-by",
  trustedByRoutes
);

app.use(
  "/api/upload",
  uploadRoutes
);

app.use(
  "/api/faqs",
  faqRoutes
);

app.use(
  "/api/stats",
  statRoutes
);

app.use(
  "/api/careers",
  careerRoutes
);


app.get(
  "/",
  (
    req: Request,
    res: Response
  ) => {
    return res.status(200).json({
      success: true,
      message:
        "CodeNexa Backend Running",
    });
  }
);


app.use(
  (
    req: Request,
    res: Response
  ) => {
    return res.status(404).json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
    });
  }
);


app.use(
  (
    error: any,
    req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    console.error(
      "Server Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Internal server error",
    });
  }
);


if (process.env.VERCEL !== "1") {
  const startServer = async () => {
    try {
      console.log(
        "Connecting to MongoDB..."
      );

      await connectDatabase();

      console.log(
        "MongoDB Connected Successfully"
      );

      app.listen(
        PORT,
        "0.0.0.0",
        () => {
          console.log(
            `Server running on http://localhost:${PORT}`
          );
        }
      );
    } catch (error) {
      console.error(
        "Server startup failed:",
        error
      );

      process.exit(1);
    }
  };

  startServer();
}


export default app;