import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";

const userSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    provider: [{ type: String, enum: ["google", "email"], required: true }],
    isVerified: { type: Boolean, default: false },
}, {
    timestamps: true
});

userSchema.plugin(CacheClearPlugin);

export type IUser = InferSchemaType<typeof userSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const UserModel = primaryDb.model<IUser>("User", userSchema);

export default UserModel;