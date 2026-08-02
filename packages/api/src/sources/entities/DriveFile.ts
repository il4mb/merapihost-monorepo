import { ObjectId } from "mongodb";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, ObjectIdColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export interface DriveFileMetadata {
    mimeType: string;
    size: number;
    bucket: string;
}

@Entity("drive_files")
export class DriveFile {

    @ObjectIdColumn()
    _id: ObjectId;

    @Column({ type: "char", length: 64 })
    uid: string; // user id of the owner of the file/folder

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "varchar", length: 8, default: "file" })
    type: "file" | "folder";

    // // Many files/folders belong to ONE parent folder
    // @ManyToOne(() => DriveFile, (file) => file._id, { onDelete: "CASCADE" })
    // @JoinColumn({ name: "parent_id" })
    // parent: DriveFile | null; // null means root folder

    @Column({ type: "json", nullable: true })
    metadata: DriveFileMetadata | null; // null means folder

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}