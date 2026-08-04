import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";

const whatsappSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    wabaId: { type: String, required: true },
    whatsappAccessToken: { type: String, required: true },
}, {
    timestamps: true
});

whatsappSchema.plugin(CacheClearPlugin);

export type IUser = InferSchemaType<typeof whatsappSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const UserModel = primaryDb.model<IUser>("User", whatsappSchema);

export default UserModel;