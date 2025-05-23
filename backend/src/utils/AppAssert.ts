import assert from "node:assert";
import AppErrorCode from "../constants/AppErrorCode";
import { HttpStatusCode } from "../constants/http";
import ApiError from "./AppError";

type AppAssert = (
  condition: any,
  httpsStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode
) => asserts condition;
const appAsert: AppAssert = (
  condition,
  httpsStatusCode,
  message,
  appErrorCode
) => assert(condition, new ApiError(httpsStatusCode, message, appErrorCode));

export default appAsert;
