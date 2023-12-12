import * as mongoose from "mongoose";
import { APIChannelUser, APIUser } from "@shared/api-types";

export const userSchema = new mongoose.Schema<APIUser>({
   _id: { type: String, required: true },
   username: { type: String, required: true },
   displayName: { type: String, required: true },
   email: { type: String, required: true },
   password: { type: String, required: true },
   avatar: { type: String, required: true },
   flags: { type: Number, required: true },
   system: { type: Boolean, required: true },
});

export const channelUserSchema = new mongoose.Schema<APIChannelUser>({
   _id: { type: String, required: true },
   username: { type: String, required: true },
   avatar: { type: String, required: true },
});

export const User = mongoose.model<APIUser>("User", userSchema);
export const ChannelUser = User.discriminator<APIChannelUser>("ChannelUser", channelUserSchema);
