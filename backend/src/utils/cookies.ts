import { CookieOptions, response, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";
const REFRESH_PATH = "/auth/refresh";
const secure = process.env.NODE_ENV !== "development";
const defaults: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
  secure,
};

const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: fifteenMinutesFromNow(),
  path: "/auth/refresh",
});
const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: thirtyDaysFromNow(),
  path: REFRESH_PATH,
});
type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};
export const setAuthCokkies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthCokkies = (res: Response) =>
  response
    .clearCookie("accessToken")
    .clearCookie("refreshToken", { path: REFRESH_PATH });
