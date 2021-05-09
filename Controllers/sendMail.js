const nodemailer = require('nodemailer')
const { google } = require('googleapis')
const { OAuth2 } = google.auth;

const {
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  SENDER_EMAIL_ADDRESS,
  MAILING_SERVICE_REFRESH_TOKEN,
  REDIRECT_URI,
  PASSWORD_EMAIL
} = process.env

const oauth2Client = new OAuth2(
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  MAILING_SERVICE_REFRESH_TOKEN,
  REDIRECT_URI
);
const sendEmail = (to, url, txt) => {

  oauth2Client.setCredentials({ refresh_token: MAILING_SERVICE_REFRESH_TOKEN });
  const accessToken = oauth2Client.getAccessToken();
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: SENDER_EMAIL_ADDRESS,
      name: 'TRAN HUU PHUOC',
      pass: PASSWORD_EMAIL,
      clientId: MAILING_SERVICE_CLIENT_ID,
      clientSecret: MAILING_SERVICE_CLIENT_SECRET,
      refreshToken: MAILING_SERVICE_REFRESH_TOKEN,
      accessToken: accessToken
    }
  });
  const mailOptions = {
    from: SENDER_EMAIL_ADDRESS,
    to: to,
    subject: "Xác minh địa chỉ email của bạn",
    html: `
            <div style="max-width: 700px; margin:40px auto; border: 1px solid #ddd; padding: 50px 20px; font-size: 110%; border-radius: 10px;">
            <h2 style="text-align: center; text-transform: uppercase;color: teal;">CHÀO MỪNG BẠN ĐẾN VỚI KAITO SHOP</h2>
            <p>Xin chúc mừng! Bạn sắp bắt đầu sử dụng Kaito Shop. Chỉ cần nhấp vào nút bên dưới để xác thực địa chỉ email của bạn.</p>
            <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px auto; display: block; border-radius: 20px; width: 260px; text-align: center;">${txt}</a>
            </div>
        `
  };

  transport.sendMail(mailOptions, (err, inFor) => {
    if (err) return err;
    return inFor
  });

};
module.exports = sendEmail;
