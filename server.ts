import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending real emails via Gmail SMTP
  app.post("/api/send-email", async (req, res) => {
    const { toEmail, subject, body, html } = req.body;

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      console.warn("Gmail SMTP credentials not configured. GMAIL_USER or GMAIL_APP_PASSWORD is missing.");
      return res.status(400).json({
        success: false,
        error: "credentials_missing",
        message: "من فضلك قم بضبط المتغيرات GMAIL_USER و GMAIL_APP_PASSWORD لإرسال بريد حقيقي."
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });

      const mailOptions = {
        from: `"منصة ساس اللوجستية" <${gmailUser}>`,
        to: toEmail,
        subject: subject,
        text: body,
        html: html || undefined
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);

      return res.json({
        success: true,
        messageId: info.messageId,
        message: "تم إرسال البريد الحقيقي بنجاح!"
      });
    } catch (error: any) {
      console.error("Nodemailer Error:", error);
      return res.status(500).json({
        success: false,
        error: "smtp_error",
        message: "فشل إرسال البريد عبر Gmail SMTP. تأكد من صحة البريد ومفتاح مرور التطبيق.",
        details: error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
