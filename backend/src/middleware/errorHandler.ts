import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import { z } from "zod";
import AppError from "../utils/AppError";
import { clearAuthCokkies } from "../utils/cookies";

const handleZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));
  return res.status(BAD_REQUEST).json({
    errors,
    message: error.message,
  });
};
const handleAppError = (res: Response, error: AppError) => {
  return res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
  });
};
const REFRESH_PATH = "/auth/refresh";
const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH ${req.path}`, error);

  if (req.path === REFRESH_PATH) {
    clearAuthCokkies(res);
  }
  if (error instanceof z.ZodError) {
    handleZodError(res, error);
    return;
  }
  if (error instanceof AppError) {
    handleAppError(res, error);
    return;
  }
  res.status(INTERNAL_SERVER_ERROR).send("Internal server error");
};

export default errorHandler;
