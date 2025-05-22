import { APP_ORIGIN, JWT_REFRESH_SECRET } from "../constants/env";
import verificationCodeType from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verification.model";
import { oneYearFromNow } from "../utils/date";
import jwt from "jsonwebtoken";

export type createAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};
export const createAccount = async (date: createAccountParams) => {
  // verify exsiting user doe'nt exsit
  const existingUser = await UserModel.exists({
    email: date.email,
  });
  if (existingUser) {
    throw new Error("User already exsits");
  }
  //  create the user
  const user = await UserModel.create({
    email: date.email,
    password: date.password,
  });
  // create the vrification code
  const userId = user._id;
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: verificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });
  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;
  // send verification mail
  // create session
  const session = await SessionModel.create({
    userId,
    userAgent: date.userAgent,
  });
  // sign access token and refresh token
  const refreshToken = jwt.sign(
    { sessionId: session._id },
    JWT_REFRESH_SECRET,
    {
      audience: ["user"],
      expiresIn: "30d",
    }
  );
  const accessToken = jwt.sign(
    { userId: user._id, sessionId: session._id },
    JWT_REFRESH_SECRET,
    {
      audience: ["user"],
      expiresIn: "15m",
    }
  );
  // return user and tokens
  return { user, accessToken, refreshToken };
};
