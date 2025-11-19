import nodemailer from 'nodemailer';

// @desc    Send contact form message via email
// @route   POST /api/contact
// @access  Public
export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Create transporter
    // Use port 465 with SSL for better cloud platform compatibility (Render, etc.)
    const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
    const useSecure = smtpPort === 465;
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: useSecure, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        // Don't fail on invalid certificates
        rejectUnauthorized: false
      },
      // Increase timeout for cloud platforms
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    // Verify transporter configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Missing SMTP credentials');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact the administrator.'
      });
    }

    // Verify SMTP connection before sending
    try {
      console.log('Verifying SMTP connection...');
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError.message);
      return res.status(500).json({
        success: false,
        message: `Email service connection failed: ${verifyError.message}. Please check your SMTP settings.`
      });
    }

    // Email content for the business/admin
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || 'houssein.ibrahim.3@gmail.com', // Where to receive contact messages
      replyTo: email, // Allow replying directly to the sender
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">New Contact Form Message</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Message:</h3>
            <p style="color: #4b5563; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
      text: `
New Contact Form Message

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `
    };

    // Send email
    console.log(`Attempting to send email to: ${mailOptions.to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    // Optional: Send confirmation email to the user
    if (process.env.SEND_CONFIRMATION_EMAIL === 'true') {
      const confirmationMailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: `Thank you for contacting us - ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Thank you for contacting us!</h2>
            <p>Dear ${name},</p>
            <p>We have received your message and will get back to you as soon as possible.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Your message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <p>Best regards,<br>Our Ecommerce Team</p>
          </div>
        `,
        text: `
Thank you for contacting us!

Dear ${name},

We have received your message and will get back to you as soon as possible.

Your message:
${message}

Best regards,
Our Ecommerce Team
        `
      };

      console.log(`Sending confirmation email to: ${email}`);
      await transporter.sendMail(confirmationMailOptions);
      console.log('Confirmation email sent successfully');
    }

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message. Please try again later.'
    });
  }
};

