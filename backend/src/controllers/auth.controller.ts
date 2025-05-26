import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import SessionModel from "../models/session.model";
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  resetPaasword,
  sendPasswordResetEmail,
  verifyEmail,
} from "../services/auth.service";
import appAsert from "../utils/AppAssert";
import catchErrors from "../utils/catchErrors";
import {
  clearAuthCokkies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCokkies,
} from "../utils/cookies";
import { verifyToken } from "../utils/jwt";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./auth.schema";

export const registerHandler = catchErrors(async (req, res) => {
  // validate request
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });
  // call service
  const { user, accessToken, refreshToken } = await createAccount(request);
  // return responce
  return setAuthCokkies({ res, accessToken, refreshToken })
    .status(CREATED)
    .json(user);
});
export const loginHandler = catchErrors(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });
  const { accessToken, refreshToken } = await loginUser(request);
  return setAuthCokkies({ res, accessToken, refreshToken }).status(OK).json({
    message: "Login Successful",
  });
});

export const logoutHandler = catchErrors(async (req, res) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  const { payload, error } = verifyToken(accessToken || "");
  if (payload) {
    await SessionModel.findByIdAndDelete(payload.sessionId);
  }
  return clearAuthCokkies(res).status(OK).json({
    message: "laogout successful",
  });
});

export const refreshHandler = catchErrors(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAsert(refreshToken, UNAUTHORIZED, "Missing refresh token");

  const { accessToken, newRefreshToken } =
    await refreshUserAccessToken(refreshToken);

  if (newRefreshToken) {
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
  }

  return res
    .status(OK)
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions()) // Fixed: removed space in cookie name
    .json({ message: "Access token refreshed" });
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);
  await verifyEmail(verificationCode);
  return res.status(OK).json({ message: "Email was successfully verified" });
});

export const sendForgotEmailHandler = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email);
  // call service
  await sendPasswordResetEmail(email);
  return res.status(OK).json({
    message: "password reset mail sent",
  });
});
export const resetPasswordHandler =  catchErrors( async ( req,res) => {
  const request =  resetPasswordSchema.parse(req.body);
  await resetPaasword(request);
  return clearAuthCokkies(res).status(OK).json({
    message : "Password reset successful"
  })
})