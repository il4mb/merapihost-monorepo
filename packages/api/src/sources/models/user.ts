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

userSchema.options.toJSON = {
    transform: function (doc, ret) {
        // @ts-ignore
        delete ret.password; // Remove the password field from the JSON representation
        // @ts-ignore
        delete ret.__v; // Remove the Mongoose version key
        return ret;
    }
};




export type IUser = InferSchemaType<typeof userSchema> & {
    _id: Types.ObjectId;
}

const UserModel = primaryDb.model<IUser>("User", userSchema);

export default UserModel;