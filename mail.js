const nodemailer = require('nodemailer');

// Create a transporter with your email service credentials
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'techevan1234@gmail.com', // Replace with your Gmail email
        pass: 'Abcd@1234',   // Replace with your Gmail password
    },
});

// Assuming you have the user's email address stored in a variable, replace 'usermail' with that email
const userMail = 'kumari.prachi1710@gmail.com'; // Replace with the user's email

// Generate a random OTP (you can use a better OTP generation method)
const otp = Math.floor(10000 + Math.random() * 90000); // A 5-digit OTP

const mailOptions = {
    from: 'techevan1234@gmail.com', // Replace with your Gmail email
    to: userMail,
    subject: 'Password Reset OTP',
    text: `Your OTP is: ${otp}`,
};

// Send the OTP email
transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.error('Error sending OTP:', error);
        // Handle the error here, e.g., show an error message to the user
    } else {
        console.log('OTP sent:', info.response);
        // Assuming you have a session, you can store the OTP in the session for verification
        request.session.otp = otp;
        // You may also want to include a timestamp to check the OTP's validity later
        request.session.otpTimestamp = Date.now();
        // Redirect the user to the OTP verification page
        response.redirect('/forget'); // Replace with your OTP verification route
    }
});

module.exports = transporter;
