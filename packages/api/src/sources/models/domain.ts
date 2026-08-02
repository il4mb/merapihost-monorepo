import { InferSchemaType, Schema } from "mongoose";
import { primaryDb } from "@/sources";
import { isValidDomain } from "@/utils/tools";

const linkedSchema = new Schema({
    type: { type: String, enum: ["website", "email"], required: true },
    refId: { type: String, required: true } // Reference to the linked resource
});

const domainSchema = new Schema({
    userId: { type: String, required: true }, // Reference to the user who owns this domain
    name: { type: String, required: true, unique: true },
    verificationToken: { type: String, required: true },
    status: { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
    type: { type: String, enum: ["internal", "external"], default: "external" },
    expirationDate: { type: Date, default: null },
    linked: { type: [linkedSchema], default: [] } // Array of linked resources (e.g., websites, servers)
}, {
    timestamps: true
});

domainSchema.index({ userId: 1, name: 1 }, { unique: true }); // Ensure a user cannot have duplicate domain names
domainSchema.pre("save", async function () {
    if (this.isModified("name")) {
        const isValid = isValidDomain(this.name);
        if (!isValid) {
            throw new Error("Invalid domain name.");
        }
    }
});

export type IDomain = InferSchemaType<typeof domainSchema>;
const DomainModel = primaryDb.model<IDomain>("Domain", domainSchema);


export default DomainModel;

