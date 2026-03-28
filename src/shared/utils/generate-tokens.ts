import crypto from "node:crypto";

import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "@/config/env.js";

import { USER_TEMPORARY_TOKEN_EXPIRY } from "../constants/user.constants.js";

type AccessTokenPayload = {
  _id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
};
type RefreshTokenPayload = {
  _id: string;
};

type TokenExpiry = Exclude<SignOptions["expiresIn"], undefined>;

const signToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
  secret: string,
  expiresIn: TokenExpiry,
) => {
  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

export const generateAccessToken = ({ _id, email, username, role }: AccessTokenPayload) => {
  return signToken(
    { _id, email, username, role },
    env.ACCESS_TOKEN_SECRET,
    env.ACCESS_TOKEN_EXPIRY as TokenExpiry,
  );
};

export const generateRefreshToken = ({ _id }: RefreshTokenPayload) => {
  return signToken({ _id }, env.REFRESH_TOKEN_SECRET, env.REFRESH_TOKEN_EXPIRY as TokenExpiry);
};

export const generateTemporaryToken = () => {
  // 256-bit secure random token
  const unHashedToken = crypto.randomBytes(32).toString("base64url");

  // deterministic hash for DB lookup
  const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");

  // expiry timestamp
  const tokenExpiry = Date.now() + USER_TEMPORARY_TOKEN_EXPIRY;

  return { unHashedToken, hashedToken, tokenExpiry };
};
