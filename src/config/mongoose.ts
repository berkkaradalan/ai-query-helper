// import mongoose from "mongoose";

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

// export async function connectMongoDB() {
//     try {
//       await mongoose.connect(uri);
//       console.log("✅ MongoDB connected via Mongoose");
//     } catch (err) {
//       console.error("❌ MongoDB connection error:", err);
//       process.exit(1);
//     }
//   }

import mongoose from "mongoose";

const uri =
  process.env.NODE_ENV === "development"
    ? `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`
    : `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

export async function connectMongoDB() {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected via Mongoose");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
