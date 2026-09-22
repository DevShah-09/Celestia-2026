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

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
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
      subject: "Celestia 2026 | Retro Games - You're on the roster!",
      text: `CELESTIA 2026 / RETRO GAMES
Registration successful. Player squad ready!

Team Name: ${teamName}
Team ID: ${teamId}
Leader Email: ${leaderEmail}

Your team QR code is attached. Save it before the event and show it to organizers after completing each game so they can record your points. Keep your Team ID handy.

Ready, player team? Let the games begin!
This is an automated email from Celestia 2026. Please do not reply.`,
      html: `
        <div style="display:none;max-height:0;overflow:hidden;">Registration complete! Your Celestia 2026 Retro Games team pass is ready.</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#101022;font-family:Arial,Helvetica,sans-serif;">
          <tr><td align="center" style="padding:24px 12px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background-color:#1b1b35;border:3px solid #8b7aff;">
              <tr><td align="center" style="padding:32px 20px 28px;border-bottom:4px solid #ffcf56;">
                <p style="margin:0 0 16px;color:#55f2d2;font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:bold;letter-spacing:3px;">[ PLAYER SELECT COMPLETE ]</p>
                <h1 style="margin:0;color:#ffffff;font-family:'Courier New',Courier,monospace;font-size:34px;letter-spacing:2px;">CELESTIA 2026</h1>
                <p style="margin:12px 0 0;color:#ffcf56;font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:bold;letter-spacing:4px;">RETRO GAMES</p>
                <p style="margin:20px 0 0;color:#e6e4ff;font-size:16px;line-height:1.6;">Registration successful. Your squad is ready!</p>
              </td></tr>
              <tr><td style="padding:24px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#252542;border:2px solid #55f2d2;">
                  <tr><td style="padding:20px;">
                    <h2 style="margin:0 0 16px;color:#55f2d2;font-family:'Courier New',Courier,monospace;font-size:18px;">01 / YOUR TEAM</h2>
                    <p style="margin:0 0 10px;color:#ffffff;font-size:15px;line-height:1.6;overflow-wrap:anywhere;"><strong>Team Name:</strong> ${escapeHtml(teamName)}</p>
                    <p style="margin:0 0 10px;color:#ffcf56;font-size:15px;line-height:1.6;"><strong>Team ID:</strong> ${escapeHtml(teamId)}</p>
                    <p style="margin:0;color:#ffffff;font-size:15px;line-height:1.6;overflow-wrap:anywhere;"><strong>Leader Email:</strong> ${escapeHtml(leaderEmail)}</p>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td align="center" style="padding:0 20px 28px;">
                <h2 style="margin:0 0 12px;color:#ffcf56;font-family:'Courier New',Courier,monospace;font-size:18px;">02 / YOUR ARCADE PASS</h2>
                <p style="margin:0 0 20px;color:#e6e4ff;font-size:14px;line-height:1.6;">One squad. One QR code. Ready for the next level.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border:4px solid #ffcf56;"><tr><td style="padding:12px;">
                  <img src="cid:qrcode@celestia" width="240" height="240" alt="Your team QR code - also attached to this email" style="display:block;width:240px;max-width:100%;height:auto;border:0;" />
                </td></tr></table>
                <p style="margin:16px 0 0;color:#e6e4ff;font-size:14px;line-height:1.6;">Show this code to organizers after each completed game<br />so they can record your points.</p>
                <p style="margin:8px 0 0;color:#bebbdc;font-size:12px;line-height:1.6;">Your QR code is also attached as a PNG. Download it for offline access.</p>
              </td></tr>
              <tr><td style="padding:0 20px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#252542;border-left:4px solid #ff80bb;"><tr><td style="padding:20px;">
                  <h2 style="margin:0 0 14px;color:#ff80bb;font-family:'Courier New',Courier,monospace;font-size:18px;">03 / HOW TO PLAY</h2>
                  <ol style="margin:0;padding-left:22px;color:#ffffff;font-size:14px;line-height:1.9;">
                    <li>Save this email and download your attached QR code.</li>
                    <li>Complete a game, then show your QR code to an organizer.</li>
                    <li>Let the organizer scan your code and record your points.</li>
                    <li>Keep your Team ID handy throughout the event.</li>
                  </ol>
                </td></tr></table>
              </td></tr>
              <tr><td align="center" style="padding:24px 20px;background-color:#121226;border-top:2px solid #8b7aff;">
                <p style="margin:0 0 12px;color:#55f2d2;font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:bold;">READY, PLAYER TEAM?</p>
                <p style="margin:0;color:#ffffff;font-size:15px;">Let the games begin!</p>
                <p style="margin:24px 0 0;color:#bebbdc;font-size:12px;line-height:1.6;">This is an automated email from Celestia 2026.<br />Please do not reply to this email.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
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
