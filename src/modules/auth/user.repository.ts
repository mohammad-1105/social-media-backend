import {
  type UserLoginEnumType,
  type UserRolesEnumType,
} from "@/shared/constants/user.constants.js";
// oxlint-disable no-negated-condition
// oxlint-disable require-await
import { ApiError } from "@/shared/utils/api-error.js";

import { type RegisterDTO } from "./dto/auth.dto.js";
import { User, type IUser } from "./user.model.js";

// sensitive fields we never sent to leak
const SENSITIVE_FIELDS = `-password -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry`;

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
    return User.findOne({ email });
  }

  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  async findByIdSafe(userId: string): Promise<IUser | null> {
    return User.findById(userId).select(SENSITIVE_FIELDS);
  }

  async findByEmailVerificationToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    });
  }

  async findByForgotPasswordToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    });
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

  async updateRole(userId: string, role: string): Promise<void> {
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
    ).select(SENSITIVE_FIELDS);
  }
}

export const userRepository = new UserRepository();
