import { APP_ORIGIN } from "../constants/env";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
} from "../constants/http";
import verificationCodeType from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verification.model";
import appAsert from "../utils/AppAssert";
import {
  fiveMinutesAgo,
  ONE_DAY_MS,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailTemplate";
import {
  refreshTokenOptions,
  RefreshTokenPlayload,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { sendMail } from "../utils/sendMail";

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
  await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });
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
export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPlayload>(refreshToken, {
    secret: refreshTokenOptions.secret,
  });
  appAsert(payload, UNAUTHORIZED, "invalid refresh token");
  const now = Date.now();
  const session = await SessionModel.findById(payload.sessionId);
  appAsert(
    session && session.expiresAt.getTime() > now,
    UNAUTHORIZED,
    "session expired"
  );
  // refrsh the session if it expires in the next 24 hours
  const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }
  const newRefreshToken = sessionNeedsRefresh
    ? signToken(
        {
          sessionId: session._id,
        },
        refreshTokenOptions
      )
    : undefined;
  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });
  return {
    accessToken,
    newRefreshToken,
  };
};
export const verifyEmail = async (code: string) => {
  // get the verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: verificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });
  appAsert(validCode, NOT_FOUND, "Invalid or expired verification code");
  // get user by Id
  // update user  to verified true
  const updateUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { new: true }
  );
  appAsert(updateUser, INTERNAL_SERVER_ERROR, "Failed to verify email");
  // delete verification code
  await validCode.deleteOne();
  // return user
  return {
    user: updateUser.omitPassword(),
  };
};
export const sendPasswordResetEmail = async (email: string) => {
  // get the user by Emial
  const user = await UserModel.findOne({ email });
  appAsert(user, NOT_FOUND, "user not gound");
  //check email rate limit
  const fiveminsago = fiveMinutesAgo();
  const count = await VerificationCodeModel.countDocuments({
    userId: user._id,
    type: verificationCodeType.PasswordReset,
    createdAt: { $gt: fiveMinutesAgo() },
  });
  appAsert(count <= 2, UNAUTHORIZED, "Too many requests");
  //create verification code
  const expiresAt = oneHourFromNow();
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: verificationCodeType.PasswordReset,
    expiresAt,
  });
  //send verification email
  const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;
  const { data, error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });
  appAsert(
    data?.id,
    INTERNAL_SERVER_ERROR,
    `${error?.name} -  ${error?.message}`
  );
  // returtn success
  return {
    url,
    emailId: data.id,
  };
};
