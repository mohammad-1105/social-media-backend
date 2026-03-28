import Mailgen from "mailgen";
import nodemailer, {
  type SendMailOptions,
  type SentMessageInfo,
  type Transporter,
} from "nodemailer";

import { env } from "@/config/env.js";

import { logger } from "../logger/winston.logger.js";

type MailContent = Mailgen.Content;

type SendEmailProps = {
  email: string;
  subject: string;
  content: MailContent;
};

type MailDeliveryResult =
  | {
      ok: true;
      messageId: string;
    }
  | {
      ok: false;
      error: Error;
    };

type ActionEmailContentProps = {
  username: string;
  intro: string;
  instructions: string;
  buttonText: string;
  buttonLink: string;
};

type ForgotPasswordMailContentProps = {
  username: string;
  resetToken: string;
  passwordResetUrl?: string;
};

const MAIL_PRODUCT_CONFIG = {
  name: "Modular Auth API",
  link: "https://mohammadaman.vercel.app",
} as const;

const buildFromAddress = () => {
  return `"${MAIL_PRODUCT_CONFIG.name}" <${env.SMTP_USER}>`;
};

const createMailGenerator = () => {
  return new Mailgen({
    theme: "default",
    product: MAIL_PRODUCT_CONFIG,
  });
};

const createMailTransporter = (): Transporter<SentMessageInfo> => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

const mailGenerator = createMailGenerator();
const mailTransporter = createMailTransporter();

const buildMail = ({ email, subject, content }: SendEmailProps): SendMailOptions => {
  return {
    from: buildFromAddress(),
    to: email,
    subject,
    text: mailGenerator.generatePlaintext(content),
    html: mailGenerator.generate(content),
  };
};

const normalizeMailError = (error: unknown) => {
  return error instanceof Error ? error : new Error("Unknown mail transport error");
};

const createActionEmailContent = ({
  username,
  intro,
  instructions,
  buttonText,
  buttonLink,
}: ActionEmailContentProps): MailContent => {
  return {
    body: {
      name: username,
      intro,
      action: {
        instructions,
        button: {
          color: "#22BC66",
          text: buttonText,
          link: buttonLink,
        },
      },
      outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const sendEmail = async ({ email, subject, content }: SendEmailProps) => {
  const mail = buildMail({ email, subject, content });

  try {
    const info = await mailTransporter.sendMail(mail);

    logger.info("Email sent successfully", {
      to: email,
      subject,
      messageId: info.messageId,
    });

    return {
      ok: true,
      messageId: info.messageId,
    } satisfies MailDeliveryResult;
  } catch (error) {
    const normalizedError = normalizeMailError(error);

    logger.error({
      message: "Email delivery failed",
      to: email,
      subject,
      error: normalizedError.message,
      stack: normalizedError.stack,
    });

    return {
      ok: false,
      error: normalizedError,
    } satisfies MailDeliveryResult;
  }
};

const emailVerificationMailgenContent = (
  username: string,
  verificationUrl: string,
): MailContent => {
  return createActionEmailContent({
    username,
    intro: "Welcome to the Modular Auth API! We're very excited to have you on board.",
    instructions: "To verify your email, please click on the following button:",
    buttonText: "Verify your email",
    buttonLink: verificationUrl,
  });
};

const forgotPasswordMailgenContent = ({
  username,
  resetToken,
  passwordResetUrl,
}: ForgotPasswordMailContentProps): MailContent => {
  if (passwordResetUrl) {
    return createActionEmailContent({
      username,
      intro: "We received a request to reset your account password.",
      instructions: "To reset your password, click on the following button or link:",
      buttonText: "Reset password",
      buttonLink: passwordResetUrl,
    });
  }

  return {
    body: {
      name: username,
      intro: [
        "We received a request to reset your account password.",
        `Use this reset token in your client or API request: ${resetToken}`,
      ],
      outro: [
        "This reset token will expire in 20 minutes.",
        "If you did not request this change, you can safely ignore this email.",
      ],
    },
  };
};

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  type MailContent,
  type MailDeliveryResult,
  type SendEmailProps,
};
