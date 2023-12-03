import * as mongoose from "mongoose";
import { APIUser } from "@shared/api-types";

const userSchema = new mongoose.Schema<APIUser>({
   _id: { type: String, required: true },
   username: { type: String, required: true },
   displayName: { type: String, required: true },
   email: { type: String, required: true },
   password: { type: String, required: true },
   avatar: { type: String, required: true },
   flags: { type: Number, required: true },
   system: { type: Boolean, required: true },
});

export const User = mongoose.model<APIUser>("User", userSchema);
