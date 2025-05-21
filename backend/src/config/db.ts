import mongoose from "mongoose";
import { MONGO_URI } from "../constants/env";

const conntToDataBase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("successfully conneted to database");
  } catch (error) {
    console.log("could not connect to database");
    process.exit(1);
  }
};
export default conntToDataBase;
