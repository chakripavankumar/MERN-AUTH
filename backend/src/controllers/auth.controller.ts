import { CREATED, OK } from "../constants/http";
import SessionModel from "../models/session.model";
import { createAccount, loginUser } from "../services/auth.service";
import catchErrors from "../utils/catchErrors";
import { clearAuthCokkies, setAuthCokkies } from "../utils/cookies";
import { verifyToken } from "../utils/jwt";
import { loginSchema, registerSchema } from "./auth.schema";

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

export const logoutHandler = catchErrors( async (req , res) => {
  const accessToken = req.cookies.accessToken;
  const {payload , error} =  verifyToken(accessToken)
  if(payload){
    await SessionModel.findByIdAndDelete(payload.sessionId)
  }
  return clearAuthCokkies(res).status(OK).json({
    message : "laogout successful"
  })
})