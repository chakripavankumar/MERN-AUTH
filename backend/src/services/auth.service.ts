import { APP_ORIGIN } from "../constants/env";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import verificationCodeType from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verification.model";
import appAsert from "../utils/AppAssert";
import { oneYearFromNow } from "../utils/date";
import { refreshTokenOptions, signToken } from "../utils/jwt";

type createAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};
export const createAccount = async (date: createAccountParams) => {
  // verify exsiting user doe'nt exsit
  const existingUser = await UserModel.exists({
    email: date.email,
  });
  appAsert(!existingUser, CONFLICT, "Email already in use");
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
  const refreshToken = signToken(
    { sessionId: session._id },
    refreshTokenOptions
  );
  const accessToken = signToken({ userId: user._id, sessionId: session._id });
  // return user and tokens
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};
type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};
export const loginUser = async ({
  email,
  password,
  userAgent,
}: LoginParams) => {
  // get the user by email
  const user = await UserModel.findOne({ email });
  appAsert(user, UNAUTHORIZED, "Invalid emial or password");
  // validate password from the request
  const isvalid = await user.comparePassword(password);
  appAsert(isvalid, UNAUTHORIZED, "Invalid emial or password");
  // create a session
  const userId = user._id;
  const session = await SessionModel.create({
    userId,
    userAgent,
  });
  const sessionInfo = { sessionId: session._id };
  // sign access and refresh token
  const refreshToken = signToken(sessionInfo, refreshTokenOptions);

  const accessToken = signToken({
    ...sessionInfo,
    userId: user._id,
  });
  // return user and tokens
  return { user: user.omitPassword(), accessToken, refreshToken };
};
