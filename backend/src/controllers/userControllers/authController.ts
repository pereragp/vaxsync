import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../../models/userModels/user";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5000";

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    // Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset - VaxSync",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af; margin-bottom: 20px;">🔐 Password Reset Request</h2>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            You requested a password reset for your VaxSync account.
          </p>
          
          <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
            <h3 style="color: white; margin: 0 0 16px 0;">Your Reset Token</h3>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 16px 0;">
              <p style="color: #1e40af; font-size: 24px; font-weight: bold; margin: 0; font-family: monospace; word-break: break-all;">
                ${token}
              </p>
            </div>
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">
              Copy this token and paste it in the VaxSync app
            </p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h4 style="color: #1e40af; margin: 0 0 12px 0;">📱 Instructions:</h4>
            <ol style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
              <li>Open the VaxSync mobile app</li>
              <li>Tap "Forgot Password?" on the login screen</li>
              <li>Enter your email and tap "Send Reset Token"</li>
              <li>Copy the token above and paste it in the app</li>
              <li>Enter your new password</li>
            </ol>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              ⏰ <strong>This link will expire in 1 hour.</strong>
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
              🔒 If you didn't request this reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Sent by VaxSync - Your Vaccination Management App
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${user.email}`);

    return res.json({ message: "Password reset email sent." });
  } catch (error) {
    console.error("Email sending failed:", error);
    return res
      .status(500)
      .json({ message: "Failed to send reset email. Please try again." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hashing new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};
