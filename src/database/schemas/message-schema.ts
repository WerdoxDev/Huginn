import { APIDefaultMessage, APIMessage } from "@shared/api-types";
import mongoose from "mongoose";
import { messageUserSchema } from "./user-schema";

const messageSchema = new mongoose.Schema<APIMessage>({
   _id: { type: String, required: true },
   type: { type: Number, required: true },
   author: { type: messageUserSchema, required: true },
   channelId: { type: String, required: true },
   content: { type: String, required: true },
   createdAt: { type: String, required: true },
   editedAt: { type: String, required: false },
   mentions: { type: [messageUserSchema], required: true },
});

const defaultMessageSchema = new mongoose.Schema<APIDefaultMessage>({
   attachments: { type: String, required: false },
   pinned: { type: Boolean, required: true },
   flags: { type: Number, required: false },
   reactions: { type: String, required: false },
   nonce: { type: Number, required: false },
});

export const Message = mongoose.model<APIMessage>("Message", messageSchema);
export const DefaultMessage = Message.discriminator<APIDefaultMessage>("DefaultMessage", defaultMessageSchema);
