import {
  type UserLoginEnumType,
  type UserRolesEnumType,
} from "@/shared/constants/user.constants.js";
// oxlint-disable no-negated-condition
// oxlint-disable require-await
import { ApiError } from "@/shared/utils/api-error.js";

import { type RegisterDTO } from "./dto/auth.dto.js";
import { User, type IUser } from "./user.model.js";

const PUBLIC_USER_FIELDS = [
  "-password",
  "-refreshToken",
  "-forgotPasswordToken",
  "-forgotPasswordTokenExpiry",
  "-emailVerificationToken",
  "-emailVerificationTokenExpiry",
].join(" ");

type CreateUserInput = RegisterDTO & {
  loginType: UserLoginEnumType;
  isEmailVerified: boolean;
  role: UserRolesEnumType;
};

class UserRepository {
  async findByEmailOrUsername(email?: string, username?: string): Promise<IUser | null> {
    const conditions = [];

    if (email) conditions.push({ email: email.trim().toLowerCase() });
    if (username) conditions.push({ username: username.trim().toLowerCase() });

    if (conditions.length === 0) {
      throw ApiError.badRequest("At least email or username must be provided");
    }

    return User.findOne({ $or: conditions });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.trim().toLowerCase() });
  }

  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  async findByIdSafe(userId: string): Promise<IUser | null> {
    return User.findById(userId).select(PUBLIC_USER_FIELDS);
  }

  async findByIdWithRefreshToken(userId: string): Promise<IUser | null> {
    return User.findById(userId).select("+refreshToken");
  }

  async findByEmailVerificationToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationTokenExpiry");
  }

  async findByForgotPasswordToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    }).select("+forgotPasswordToken +forgotPasswordTokenExpiry");
  }

  async create(data: CreateUserInput): Promise<IUser> {
    const { password, ...rest } = data;

    return User.create({
      ...rest,
      ...(password !== undefined ? { password } : {}),
    });
  }

  async updateRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: {
        refreshToken: token,
      },
    });
  }

  async updateRole(userId: string, role: UserRolesEnumType): Promise<void> {
    await User.findByIdAndUpdate(userId, { role }, { new: true });
  }

  async updateAvatar(
    userId: string,
    avatar: {
      url: string;
      localPath: string;
    },
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      {
        $set: {
          avatar,
        },
      },
      { new: true },
    ).select(PUBLIC_USER_FIELDS);
  }
}

export const userRepository = new UserRepository();
