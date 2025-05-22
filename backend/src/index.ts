import "dotenv/config";
import express, { Request, Response } from "express";
import { PORT, NODE_ENV, APP_ORIGIN } from "./constants/env";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import conntToDataBase from "./config/db";
import authRoutes from "./routes/auth.routes";
import { OK } from "./constants/http";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());

// health check
app.get("/", (req: Request, res: Response) => {
  req.body;
  res.status(OK).json({
    status: "healthy",
  });
});

// auth routes
app.use("/auth", authRoutes);

app.use(errorHandler);
app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT} in ${NODE_ENV} environment`);
  await conntToDataBase();
});
