import mongoose, { Schema, Document } from "mongoose";

export interface IDatabaseConnection extends Document {
  name: string;
  type: "postgres" | "mongodb" | "mysql";
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  createdAt: Date;
  updatedAt: Date;
}

const DatabaseConnectionSchema: Schema = new Schema({
  name: {type: String, required: true},
  type: {type: String, enum: ["postgres", "mongodb", "mysql"], required: true},
  host: {type: String, required: true},
  port: {type: String, required: true},
  username: {type: String, required: true},
  password: {type: String, required: true},
  database: {type: String, required: true},
},
{ timestamps: true, versionKey: false, }
);

export default mongoose.model<IDatabaseConnection>(
  "DatabaseConnection",
  DatabaseConnectionSchema,
);