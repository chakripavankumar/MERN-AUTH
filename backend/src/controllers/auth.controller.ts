
import { CREATED } from "../constants/http";
import { createAccount } from "../services/auth.service";
import catchErrors from "../utils/catchErrors";
import { setAuthCokkies } from "../utils/cookies";
import { registerSchema } from "./auth.schema";


export const registerHandler =  catchErrors( async (req ,res) =>{
    // validate request
    const request = registerSchema.parse({
        ...req.body,
        userAgent:req.headers["user-agent"]
    })
    // call service 
    const {user , accessToken ,refreshToken} = await createAccount(request);

    // return responce
  return setAuthCokkies({res, accessToken,refreshToken})
   .status(CREATED).json(user)
})