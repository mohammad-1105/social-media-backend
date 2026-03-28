import crypto from "node:crypto";

import { compare } from "bcryptjs";

import { UserLoginEnum, UserRolesEnum } from "@/shared/constants/user.constants.js";
import { ApiError } from "@/shared/utils/api-error.js";
import {
  getUserIdFromRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
} from "@/shared/utils/generate-tokens.js";

import type {
  AssignRoleDTO,
  ChangePasswordDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
} from "./dto/auth.dto.js";
import {
  sendEmailVerification,
  sendForgotPasswordEmail,
  type UserRequestMeta,
} from "./user.mailer.js";
import { type IUser } from "./user.model.js";
import { userRepository } from "./user.repository.js";

class UserService {
  private buildInvalidCredentialsError() {
    return ApiError.unauthorized("Invalid email or password");
  }

  private decodeRefreshToken(token: string) {
    try {
      return getUserIdFromRefreshToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }
  }

  private async generateAccessAndRefreshTokens(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw ApiError.internal("User not found during token generation");
    }

    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ _id: user._id.toString() });

    await userRepository.updateRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  private async assignEmailVerificationToken(
    user: IUser,
    requestMeta: UserRequestMeta,
    options?: {
      deleteUserOnFailure?: boolean;
    },
  ) {
    const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmailVerification(user, requestMeta, unHashedToken);
    } catch (error) {
      if (options?.deleteUserOnFailure) {
        await user.deleteOne();
      }

      throw error;
    }
  }

  async register(data: RegisterDTO, requestMeta: UserRequestMeta) {
    const existing = await userRepository.findByEmailOrUsername(data.email, data.username);

    if (existing) throw ApiError.conflict("User with email or username already exists");

    const user = await userRepository.create({
      username: data.username,
      email: data.email,
      password: data.password,
      loginType: UserLoginEnum.EMAIL_PASSWORD,
      role: UserRolesEnum.USER,
      isEmailVerified: false,
    });

    await this.assignEmailVerificationToken(user, requestMeta, {
      deleteUserOnFailure: true,
    });

    const createdUser = await userRepository.findByIdSafe(user._id.toString());

    if (!createdUser) {
      throw ApiError.internal("Something went wrong while creating the user");
    }

    return {
      user: createdUser,
    };
  }

  async login(data: LoginDTO) {
    const user = await userRepository.findByEmailOrUsername(data.email, data.username);

    if (!user) {
      throw this.buildInvalidCredentialsError();
    }

    if (user.loginType !== UserLoginEnum.EMAIL_PASSWORD) {
      throw ApiError.badRequest(
        `You have previously registered using ${user.loginType.toLowerCase()}. Please use the ${user.loginType.toLowerCase()} login option.`,
      );
    }

    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid) {
      throw this.buildInvalidCredentialsError();
    }

    if (!user.isEmailVerified) {
      throw ApiError.forbidden("Please verify your email before logging in");
    }

    const { accessToken, refreshToken } = await this.generateAccessAndRefreshTokens(
      user._id.toString(),
    );

    const loggedInUser = await userRepository.findByIdSafe(user._id.toString());

    if (!loggedInUser) {
      throw ApiError.internal("Something went wrong while logging in the user");
    }

    return {
      user: loggedInUser,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await userRepository.updateRefreshToken(userId, "");
  }

  async verifyEmail(emailVerificationToken: string) {
    const hashedToken = crypto.createHash("sha256").update(emailVerificationToken).digest("hex");

    const user = await userRepository.findByEmailVerificationToken(hashedToken);

    if (!user) {
      throw ApiError.badRequest("Token is Invalid or Expired");
    }

    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return {
      isEmailVerified: true,
    };
  }

  async resendEmailVerification(userId: string, requestMeta: UserRequestMeta) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw ApiError.notFound("User does not exist");
    }

    if (user.isEmailVerified) {
      throw ApiError.conflict("Email is already verified");
    }

    await this.assignEmailVerificationToken(user, requestMeta);
  }

  async refreshAccessToken(incomingRefreshToken?: string) {
    if (!incomingRefreshToken) {
      throw ApiError.unauthorized("Refresh token is required");
    }

    const userId = this.decodeRefreshToken(incomingRefreshToken);
    const user = await userRepository.findByIdWithRefreshToken(userId);

    if (!user || !user.refreshToken) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw ApiError.unauthorized("Refresh token is expired or already used");
    }

    return this.generateAccessAndRefreshTokens(userId);
  }

  async forgotPassword(data: ForgotPasswordDTO) {
    const user = await userRepository.findByEmail(data.email);

    if (!user) {
      throw ApiError.notFound("User does not exist");
    }

    const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordTokenExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    try {
      await sendForgotPasswordEmail(user, unHashedToken);
    } catch (error) {
      user.forgotPasswordToken = null;
      user.forgotPasswordTokenExpiry = null;
      await user.save({ validateBeforeSave: false });

      throw error;
    }
  }

  async resetForgottenPassword(resetToken: string, data: ResetPasswordDTO) {
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await userRepository.findByForgotPasswordToken(hashedToken);

    if (!user) {
      throw ApiError.badRequest("Token is invalid or expired");
    }

    user.forgotPasswordToken = null;
    user.forgotPasswordTokenExpiry = null;
    user.password = data.newPassword;
    await user.save({ validateBeforeSave: false });
  }

  async changePassword(userId: string, data: ChangePasswordDTO) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw ApiError.notFound("User does not exist");
    }

    const isCurrentPasswordValid = await compare(data.oldPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest("Invalid old password");
    }

    user.password = data.newPassword;
    await user.save({ validateBeforeSave: false });
  }

  async assignRole(userId: string, data: AssignRoleDTO) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw ApiError.notFound("User does not exist");
    }

    await userRepository.updateRole(userId, data.role);
  }
}

export const userService = new UserService();
