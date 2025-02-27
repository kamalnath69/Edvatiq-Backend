const express = require("express");
const ejs = require("ejs");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cors = require("cors"); // Import CORS
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Load email templates
const internalTemplate = fs.readFileSync("internalEmailTemplate.ejs", "utf-8"); // For internal email
const welcomeTemplate = fs.readFileSync("welcomeEmailTemplate.html", "utf-8"); // For welcome email

// Create transporter for internal email using the first email
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.GMAIL_USER, // Your internal email
        pass: process.env.GMAIL_PASS, // Your internal email app password
    },
});

// Create transporter for sending welcome email using the second email account
const welcomeTransporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL, 
        pass: process.env.EMAIL_PASS, 
    },
});

app.post("/send-email", async (req, res) => {
    const { fullname, phone, email, institution, message } = req.body;

    // Compile Internal Email with EJS
    const internalEmailHtml = ejs.render(internalTemplate, {
        fullname,
        phone,
        email,
        institution,
        message,
    });

    // Mail options for internal email
    const internalMailOptions = {
        from: email,
        to: process.env.EMAIL, // Internal email address
        subject: `Message from ${fullname}`,
        html: internalEmailHtml,
    };

    // Mail options for welcome email
    const welcomeMailOptions = {
        from: process.env.WELCOME_EMAIL, // Welcome email account
        to: email, // User's email
        subject: "Thanks for Reaching Out to Edvatiq!",
        html: welcomeTemplate.replace("FULLNAME", fullname),
    };

    try {
        // Step 1: Send Internal Email
        const internalResult = await transporter.sendMail(internalMailOptions);
        console.log("Internal email sent successfully:", internalResult.response);

        // Step 2: Send Welcome Email ONLY if Step 1 is successful
        const welcomeResult = await welcomeTransporter.sendMail(welcomeMailOptions);
        console.log("Welcome email sent successfully:", welcomeResult.response);

        // Send response back to the user
        res.status(200).send("Internal email and Welcome email sent successfully!");
    } catch (err) {
        console.error("Error during email sending:", err);
        res.status(500).send("Error sending emails");
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
