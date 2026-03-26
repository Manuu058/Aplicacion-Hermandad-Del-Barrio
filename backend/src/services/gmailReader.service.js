const { google } = require("googleapis");

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN
} = process.env;

function getGmailClient() {
    const auth = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
        refresh_token: GOOGLE_REFRESH_TOKEN
    });

    return google.gmail({ version: "v1", auth });
}

function decodeBase64Url(data) {
    if (!data) return "";
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
}

function extraerCabecera(headers, name) {
    const item = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return item ? item.value : "";
}

function extraerTexto(payload) {
    if (!payload) return "";

    if (payload.mimeType === "text/plain" && payload.body?.data) {
        return decodeBase64Url(payload.body.data);
    }

    if (payload.parts?.length) {
        for (const part of payload.parts) {
            const texto = extraerTexto(part);
            if (texto) return texto;
        }
    }

    return "";
}

async function listarMensajes({ q = "", maxResults = 10, labelIds = [] } = {}) {
    const gmail = getGmailClient();

    const res = await gmail.users.messages.list({
        userId: "me",
        q,
        maxResults,
        labelIds
    });

    return res.data.messages || [];
}

async function leerMensaje(messageId) {
    const gmail = getGmailClient();

    const res = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full"
    });

    const msg = res.data;
    const headers = msg.payload?.headers || [];

    return {
        id: msg.id,
        threadId: msg.threadId,
        labelIds: msg.labelIds || [],
        snippet: msg.snippet || "",
        from: extraerCabecera(headers, "From"),
        to: extraerCabecera(headers, "To"),
        subject: extraerCabecera(headers, "Subject"),
        date: extraerCabecera(headers, "Date"),
        body: extraerTexto(msg.payload)
    };
}

async function listarMensajesDetallados({ q = "", maxResults = 10, labelIds = [] } = {}) {
    const mensajes = await listarMensajes({ q, maxResults, labelIds });
    const detalles = await Promise.all(mensajes.map(m => leerMensaje(m.id)));
    return detalles;
}

module.exports = {
    listarMensajes,
    leerMensaje,
    listarMensajesDetallados
};