import type { Request, Response } from "express";

import { COOKIE_OPTIONS } from "@/shared/constants/user.constants.js";
import { ApiResponse } from "@/shared/utils/api-response.js";

import type { RegisterDTO } from "./dto/auth.dto.js";
import { userService } from "./user.service.js";

class UserController {
  async register(req: Request<unknown, unknown, RegisterDTO>, res: Response) {
    const { user, accessToken, refreshToken } = await userService.register(req.body);

    // set access and refresh token to the cookie
    res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return ApiResponse.created(
      res,
      { user, accessToken, refreshToken }, // send access and refresh token in response if client decides to save them by themselves
      "User created successfully",
    );
  }
}

export const userController = new UserController();
