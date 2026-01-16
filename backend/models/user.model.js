import mongoose from "mongoose";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [5, "Email must be at least 5 characters"],
    maxLength: [50, "Email must be longer than 50 characters"],
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
}

userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateJWT = function () {
  return JWT.sign(
    { email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

const User = mongoose.model("user", userSchema);
export default User;