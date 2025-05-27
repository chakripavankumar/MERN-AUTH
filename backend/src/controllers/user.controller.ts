import { NOT_FOUND, OK } from "../constants/http";
import UserModel from "../models/user.model";
import appAsert from "../utils/AppAssert";
import catchErrors from "../utils/catchErrors";

export const getUserHandler = catchErrors(async (req , res) => {
  const user = await UserModel.findById(req.userId);
  appAsert(user, NOT_FOUND, "User not found");
  return res.status(OK).json(user.omitPassword());
});