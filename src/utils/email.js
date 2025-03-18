const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const { convert } = require('html-to-text');
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use another email provider like Mailgun, SendGrid, etc.
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Render Pug template into HTML
  const templatePath = path.join(
    __dirname,
    '../views/emails',
    `${options.template}.pug`
  );
  console.log(options.data);
  const html = pug.renderFile(templatePath, options.data);

  const mailOptions = {
    from: `"University Admin" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    html, // Send the compiled HTML
    text: convert(html),
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
