require('dotenv').config(); // Load environment variables

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Send WhatsApp message using Twilio
const sendTwilioMessage = async (phoneNumber, message) => {
    await client.messages.create({
        body: message,
        from: 'whatsapp:' + process.env.PHONE_NUMBER, // WhatsApp-enabled Twilio number
        to: 'whatsapp:' + phoneNumber // Recipient's WhatsApp number
    });
};

app.post("/send-email", async (req, res) => {
    const { fullname, phone, email, institution, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    const mailOptions = {
        from: email,
        to: process.env.EMAIL,
        subject: `Mail from ${fullname}`,
        text: `
            My name is ${fullname}.
            My phone number is ${phone}.
            My email address is ${email}.
            My institution: ${institution || "none"}.
            Here is my message: ${message}.
        `,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error sending email");
        } else {
            console.log("Email sent: " + info.response);

            const messageBody = `My name is ${fullname}. My phone number is ${phone}. My email address is ${email}. Subject: ${institution}. Here is my message: ${message}.`;

            try {
                await sendTwilioMessage('+919787867648', messageBody); // replace with the recipient's phone number
                res.status(200).send("Email and WhatsApp message sent successfully");
            } catch (error) {
                console.error("Error sending WhatsApp message:", error);
                res.status(500).send("Error sending email and WhatsApp message");
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
