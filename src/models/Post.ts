import mongoose from 'mongoose';
import aws from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const s3 = new aws.S3();

const PostSchema = new mongoose.Schema({
    name: String,
    size: Number,
    key: String,
    url: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

PostSchema.pre("save", function () {
    if (!this.url) {
        this.url = `${process.env.APP_URL}/files/${this.key}`;
    }
});

PostSchema.pre("remove", async function () {
    if (process.env.STORAGE_TYPE === "s3") {
        return s3
            .deleteObject({
                Bucket: process.env.BUCKET_NAME || '',
                Key: this.key,
            }, (cb) => ({}) )
            .promise()
            .then((response) => {
                console.log(response.$response);
            })
            .catch((response) => {
                console.log(response.status);
            });
    } else {
        return promisify(fs.unlink)(
            path.resolve(__dirname, "..", "..", "tmp", "uploads", this.key)
        );
    }
});

export default mongoose.model("Post", PostSchema);