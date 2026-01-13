import { Schema, model, Document } from "mongoose";

export interface IMessage extends Document {
  from: any;
  to: any;
  content: string;
  encryptedKey?: string;
  iv?: string;
  createdAt: Date;
  read: boolean;
}

const messageSchema = new Schema<IMessage>({
  from: { type: Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  encryptedKey: { type: String },
  iv: { type: String },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

// Add index for faster queries between two users
messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, from: 1, createdAt: -1 });

export default model<IMessage>("Message", messageSchema);
