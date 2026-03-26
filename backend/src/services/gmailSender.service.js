const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const {
    GMAIL_USER,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN
} = process.env;

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
});

async function getTransporter() {
    const accessToken = await oauth2Client.getAccessToken();

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: GMAIL_USER,
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            refreshToken: GOOGLE_REFRESH_TOKEN,
            accessToken: accessToken.token
        }
    });
}

async function enviarCorreoGmail({ para, asunto, texto, html }) {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
        from: `"Hermandad del Barrio" <${GMAIL_USER}>`,
        to: para,
        subject: asunto,
        text: texto,
        html
    });

    return info;
}

module.exports = { enviarCorreoGmail };