import type { Request, Response } from "express";

import { COOKIE_OPTIONS } from "@/shared/constants/user.constants.js";
import { type AuthRequest } from "@/shared/middlewares/auth.middleware.js";
import { ApiResponse } from "@/shared/utils/api-response.js";

import type {
  AssignRoleDTO,
  ChangePasswordDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
} from "./dto/auth.dto.js";
import { userService } from "./user.service.js";

type VerifyEmailParams = {
  verificationToken: string;
};

type ResetPasswordParams = {
  resetToken: string;
};

type AssignRoleParams = {
  userId: string;
};

type RefreshAccessTokenBody = {
  refreshToken?: string;
};

const extractRefreshToken = (req: Request<unknown, unknown, RefreshAccessTokenBody>) => {
  const cookieToken = req.cookies["refreshToken"];

  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return typeof req.body?.refreshToken === "string" && req.body.refreshToken.length > 0
    ? req.body.refreshToken
    : undefined;
};

class UserController {
  async register(req: Request<unknown, unknown, RegisterDTO>, res: Response) {
    const { user } = await userService.register(req.body, {
      protocol: req.protocol,
      host: req.get("host") ?? "",
    });

    return ApiResponse.created(
      res,
      {
        user,
        isEmailVerificationSent: true,
      },
      "User created successfully. Please verify your email before logging in",
    );
  }

  async login(req: Request<unknown, unknown, LoginDTO>, res: Response) {
    const { user, accessToken, refreshToken } = await userService.login(req.body);

    res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return ApiResponse.success(
      res,
      {
        user,
        accessToken,
        refreshToken,
      },
      "User logged in successfully",
    );
  }

  async logout(req: AuthRequest, res: Response) {
    await userService.logout(req.user!._id.toString());

    res.clearCookie("accessToken", COOKIE_OPTIONS).clearCookie("refreshToken", COOKIE_OPTIONS);

    return ApiResponse.success(res, {}, "User logged out successfully");
  }

  async verifyEmail(req: Request<VerifyEmailParams>, res: Response) {
    const { isEmailVerified } = await userService.verifyEmail(req.params["verificationToken"]);

    return ApiResponse.success(res, { isEmailVerified }, "Email is verified");
  }

  async resendEmailVerification(req: AuthRequest, res: Response) {
    await userService.resendEmailVerification(req.user!._id.toString(), {
      protocol: req.protocol,
      host: req.get("host") ?? "",
    });

    return ApiResponse.success(
      res,
      {
        isEmailVerificationSent: true,
      },
      "Verification email sent successfully",
    );
  }

  async refreshAccessToken(req: Request<unknown, unknown, RefreshAccessTokenBody>, res: Response) {
    const { accessToken, refreshToken } = await userService.refreshAccessToken(
      extractRefreshToken(req),
    );

    res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return ApiResponse.success(
      res,
      {
        accessToken,
        refreshToken,
      },
      "Access token refreshed successfully",
    );
  }

  async forgotPassword(req: Request<unknown, unknown, ForgotPasswordDTO>, res: Response) {
    await userService.forgotPassword(req.body);

    return ApiResponse.success(res, {}, "Password reset email sent successfully");
  }

  async resetForgottenPassword(
    req: Request<ResetPasswordParams, unknown, ResetPasswordDTO>,
    res: Response,
  ) {
    await userService.resetForgottenPassword(req.params["resetToken"], req.body);

    return ApiResponse.success(res, {}, "Password reset successfully");
  }

  async changePassword(
    req: AuthRequest & Request<unknown, unknown, ChangePasswordDTO>,
    res: Response,
  ) {
    await userService.changePassword(req.user!._id.toString(), req.body);

    return ApiResponse.success(res, {}, "Password changed successfully");
  }

  getCurrentUser(req: AuthRequest, res: Response) {
    return ApiResponse.success(
      res,
      {
        user: req.user,
      },
      "Current user fetched successfully",
    );
  }

  async assignRole(
    req: AuthRequest & Request<AssignRoleParams, unknown, AssignRoleDTO>,
    res: Response,
  ) {
    await userService.assignRole(req.params["userId"], req.body);

    return ApiResponse.success(res, {}, "Role updated successfully");
  }
}

export const userController = new UserController();
