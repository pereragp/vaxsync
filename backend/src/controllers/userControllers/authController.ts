import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../../models/userModels/user";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

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
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your VaxSync account.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Reset Token:</h3>
            <p style="background-color: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px; word-break: break-all;">
              ${token}
            </p>
          </div>
          
          <p><strong>Instructions:</strong></p>
          <ol>
            <li>Open the VaxSync mobile app</li>
            <li>Go to the Reset Password page</li>
            <li>Copy and paste the token above</li>
            <li>Enter your new password</li>
          </ol>
          
          <p style="color: #dc3545;"><strong>Important:</strong> This token will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
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

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};
