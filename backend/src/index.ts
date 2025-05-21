import "dotenv/config";
import express from "express";
import { PORT, NODE_ENV, APP_ORIGIN } from "./constants/env";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import catchErrors from "./utils/catchErrors";
import conntToDataBase from "./config/db";

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

app.get(
  "/",
  catchErrors(async (req, res, next) => {
    throw new Error("this is a test error");
    return res.status(200).json({ status: "healthy" });
  })
);

app.use(errorHandler);
app.listen(PORT,  async() => {
  console.log(`Server listening on port ${PORT} in ${NODE_ENV} environment`)
  await conntToDataBase()
});
