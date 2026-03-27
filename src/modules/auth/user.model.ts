import { hash } from "bcryptjs";
import mongoose, { Schema, type Document } from "mongoose";

import {
  AvailableRolesEnum,
  UserRolesEnum,
  type UserRolesEnumType,
  UserLoginEnum,
  AvailableLoginsEnum,
  type UserLoginEnumType,
} from "@/shared/constants/user.constants.js";

interface IAvatar {
  // canonical source (CDN / external storage)
  url: string;
  // used only for local/dev environments
  localPath?: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  avatar: IAvatar;
  role: UserRolesEnumType;
  password: string;
  loginType: UserLoginEnumType;
  isEmailVerified: boolean;

  refreshToken?: string;

  forgotPasswordToken?: string;
  forgotPasswordTokenExpiry?: Date;

  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// avatar sub-schema (no _id to avoid nested object overhead)
const avatarSchema = new Schema<IAvatar>(
  {
    url: {
      type: String,
      required: true,
      match: [/^https?:\/\/.+/, "Invalid avatar URL"],
    },
    localPath: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    avatar: {
      type: avatarSchema,
      default: {
        url: "https://via.placeholder.com/200x200.png",
        localPath: "",
      },
    },

    role: {
      type: String,
      enum: AvailableRolesEnum,
      required: true,
      default: UserRolesEnum.USER,
    },

    password: {
      type: String,
      trim: true,
      minlength: 6,
      maxlength: 50,
      required: function () {
        return this.loginType === "EMAIL_PASSWORD";
      },
    },

    loginType: {
      type: String,
      enum: AvailableLoginsEnum,
      default: UserLoginEnum.EMAIL_PASSWORD,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    forgotPasswordToken: {
      type: String,
      select: false,
    },
    forgotPasswordTokenExpiry: Date,

    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationTokenExpiry: Date,
  },
  { timestamps: true },
);

// explicit unique indexes (do not rely solely on `unique: true`)
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

// hash password only when modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hash(this.password, 10);
});

export const User = mongoose.model<IUser>("User", userSchema);
