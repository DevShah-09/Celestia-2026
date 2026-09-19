import nodemailer from "nodemailer";
import QRCode from "qrcode";
import dotenv from "dotenv";
dotenv.config();

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("⚠️  EMAIL_USER and EMAIL_PASS must be set in .env file");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const generateQRCode = async (teamId) => {
  try {
    const qrCodeData = JSON.stringify({ teamId });
    // Generate with better quality and error correction
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
      width: 500,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
    return qrCodeUrl;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
};

export const sendRegistrationEmail = async (
  leaderEmail,
  teamName,
  teamId,
  qrCode
) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) throw new Error('Email delivery is not configured');
  try {
    // Extract base64 data from data URL
    const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");

    const mailOptions = {
      from: {
        name: "Celestia 2026",
        address: process.env.EMAIL_USER,
      },
      to: leaderEmail,
      subject: "Celestia 2026 - Team Registration Successful! 🌟",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="color: #764ba2; margin-bottom: 20px;">🌙 Welcome to Celestia 2026! 🌙</h1>
                        
                        <h2 style="color: #333; margin-bottom: 30px;">Registration Successful!</h2>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                            <h3 style="color: #764ba2; margin-bottom: 15px;">Team Details:</h3>
                            <p><strong>Team Name:</strong> ${teamName}</p>
                            <p><strong>Team ID:</strong> ${teamId}</p>
                            <p><strong>Leader Email:</strong> ${leaderEmail}</p>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: #764ba2; margin-bottom: 15px;">Your Team QR Code:</h3>
                            <img src="cid:qrcode@celestia" alt="Team QR Code" style="max-width: 300px; border: 3px solid #764ba2; border-radius: 12px; padding: 10px; background: white;"/>
                            <p style="color: #666; margin-top: 10px; font-size: 14px;">
                                Present this QR code to event organizers to receive points for completed games!
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 5px;">
                                (QR Code is also attached as a separate file below)
                            </p>
                        </div>
                        
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #1976d2; margin-bottom: 10px;">Important Instructions:</h4>
                            <ul style="text-align: left; color: #333; line-height: 1.6;">
                                <li>Save this email and QR code for the event</li>
                                <li>Show the QR code to organizers after completing each game</li>
                                <li>Points will be assigned automatically upon QR code scan</li>
                                <li>Keep your Team ID safe for reference</li>
                                <li><strong>Download the attached QR code image for backup</strong></li>
                            </ul>
                        </div>
                        
                        <p style="color: #764ba2; font-weight: bold; font-size: 18px;">
                            May the stars guide your journey! ✨
                        </p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #764ba2;">
                            <p style="color: #666; font-size: 12px;">
                                This is an automated email from Celestia 2026. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `,
      attachments: [
        {
          filename: `${teamId}_QRCode.png`,
          content: base64Data,
          encoding: "base64",
          cid: "qrcode@celestia", // Referenced in img src as cid:qrcode@celestia
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    console.log("📧 Email sent to:", leaderEmail);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Failed to send registration email: " + error.message);
  }
};
