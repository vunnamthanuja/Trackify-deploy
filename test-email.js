const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vunnamthanuja_cse2023@ksit.edu.in',
    pass: 'bqonholgpzcfsduj'
  }
});

const mailOptions = {
  from: 'vunnamthanuja_cse2023@ksit.edu.in',
  to: 'vunnamthanuja20@gmail.com',
  subject: 'SMTP Test',
  text: 'This is a test email from Nodemailer!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
