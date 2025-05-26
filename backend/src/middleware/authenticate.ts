import { RequestHandler } from "express";
import appAsert from "../utils/AppAssert";
import { UNAUTHORIZED } from "../constants/http";
import AppErrorCode from "../constants/AppErrorCode";
import { verifyToken } from "../utils/jwt";

const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  appAsert(
    accessToken,
    UNAUTHORIZED,
    " NOt authorized",
    AppErrorCode.InvalidAccessToken
  );

  const { error, payload } = verifyToken(accessToken);
  appAsert(
    payload,
    UNAUTHORIZED,
    error === "jwt expired " ? "token Expied" : "Ivalid token",
    AppErrorCode.InvalidAccessToken
  );
  //@ts-ignore
  req.userId = payload.userId;
  // @ts-ignore
  req.sessionId = payload.sessionId;
};
export default authenticate;