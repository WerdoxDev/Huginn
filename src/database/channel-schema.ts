import { APIChannel, APIDMChannel, APIGroupDMChannel } from "@shared/api-types";
import mongoose from "mongoose";
import { channelUserSchema } from "./user-schema";

const channelSchema = new mongoose.Schema<APIChannel>({
   _id: { type: String, required: true },
   type: { type: Number, required: true },
});

const dmChannelSchema = new mongoose.Schema<APIDMChannel>({
   lastMessageId: { type: String, required: false },
   recipients: { type: [channelUserSchema], required: true },
});

const groupDmChannelSchema = new mongoose.Schema<APIGroupDMChannel>({
   name: { type: String, required: true },
   icon: { type: String, required: false },
   ownerId: { type: String, required: true },
   lastMessageId: { type: String, required: false },
   recipients: { type: [channelUserSchema], required: true },
});

export const Channel = mongoose.model<APIChannel>("Channel", channelSchema);
export const DMChannel = Channel.discriminator("DMChannel", dmChannelSchema);
export const GroupDMChannel = Channel.discriminator("GroupDMChannel", groupDmChannelSchema);
