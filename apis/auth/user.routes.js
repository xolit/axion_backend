const express = require("express");
const router = express.Router();

const Otp = require("./otp.model");
const User = require("./user.model");
const sendEmail = require("../../service/send.email.otp");

// POST /auth/account
router.post("/account", async (req, res) => {
  try {
    const { email, username, otp } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = username
      ? String(username).trim().toLowerCase()
      : undefined;

    let user = await User.findOne({ Email: normalizedEmail });

    if (!otp) {
      if (!user) {
        if (!normalizedUsername) {
          return res.status(400).json({
            success: false,
            message: "Username is required when creating a new account.",
          });
        }

        user = await User.create({
          Email: normalizedEmail,
          Username: normalizedUsername,
        });
      } else if (normalizedUsername && !user.Username) {
        user.Username = normalizedUsername;
        await user.save();
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000);

      await Otp.deleteMany({ Email: normalizedEmail });
      await Otp.create({
        Email: normalizedEmail,
        Otp: verificationCode,
      });

      await sendEmail({
        to: normalizedEmail,
        subject: "Your Axion Verification Code",
        text: `Your verification code is ${verificationCode}`,
        html: `

          <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;background:#f4f7fb;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;">
                Verify Your Email
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 30px;color:#333333;">

              <h2 style="margin-top:0;font-size:24px;">
                Hello 👋
              </h2>

              <p style="font-size:16px;line-height:1.7;color:#555555;">
                Thanks for signing up! Use the verification code below to complete your email verification.
              </p>

              <!-- OTP -->
              <div style="margin:35px 0;text-align:center;">
                <div style="
                  display:inline-block;
                  background:#f3f6ff;
                  border:2px dashed #2563eb;
                  border-radius:10px;
                  padding:18px 32px;
                  font-size:36px;
                  font-weight:bold;
                  letter-spacing:10px;
                  color:#2563eb;
                ">
                  ${verificationCode}
                </div>
              </div>

              <p style="font-size:15px;color:#666666;text-align:center;">
                This verification code will expire in
                <strong style="color:#ef4444;">2 minutes</strong>.
              </p>

              <hr style="border:none;border-top:1px solid #eeeeee;margin:35px 0;">

              <p style="font-size:14px;color:#777777;line-height:1.6;">
                If you didn't request this verification, you can safely ignore this email. No further action is required.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px;background:#f9fafb;text-align:center;color:#888888;font-size:13px;">
              © 2026 AXION. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
        `,
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully. Check your email.",
      });
    }

    const numericOtp = Number(otp);
    const storedOtp = await Otp.findOne({
      Email: normalizedEmail,
      Otp: numericOtp,
    });

    if (!storedOtp) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    await Otp.deleteMany({ Email: normalizedEmail });

    if (!user) {
      user = await User.create({
        Email: normalizedEmail,
        Username: normalizedUsername,
      });
    } else if (normalizedUsername && !user.Username) {
      user.Username = normalizedUsername;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});

// DELETE /auth/user
router.delete("/user", async (req, res) => {
  try {
    const expected = process.env.ACCESS_TOKEN;
    const token =
      req.body?.accessToken ||
      req.headers["x-access-token"] ||
      req.query.accessToken;
    const { userId } = req.body;

    if (!expected) {
      return res.status(500).json({
        success: false,
        message: "Server is not configured.",
      });
    }

    if (!token || token !== expected) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await Otp.deleteMany({ Email: user.Email });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});

module.exports = router;
