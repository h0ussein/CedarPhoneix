import nodemailer from 'nodemailer';

// @desc    Send contact form message via email
// @route   POST /api/contact
// @access  Public
export const sendContactMessage = async (req, res) => {
  console.log('=== Contact Form Submission Started ===');
  console.log('Request body:', { name, email: email ? `${email.substring(0, 3)}***` : 'missing', subject, messageLength: message?.length });
  
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed - invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    console.log('Form validation passed');

    // Verify transporter configuration first
    console.log('Checking SMTP environment variables...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'not set (will use default)');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 'not set (will use default)');
    console.log('SMTP_USER:', process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'NOT SET');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
    console.log('CONTACT_EMAIL:', process.env.CONTACT_EMAIL || 'not set (will use default)');
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ Missing SMTP credentials - SMTP_USER or SMTP_PASS not set');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact the administrator.'
      });
    }
    console.log('✅ SMTP credentials found');

    // Ensure SMTP_HOST is set correctly (not an email address)
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    console.log('Using SMTP host:', smtpHost);
    
    if (smtpHost.includes('@')) {
      console.error('❌ SMTP_HOST error: contains @ symbol - should be hostname, not email');
      return res.status(500).json({
        success: false,
        message: 'SMTP configuration error: SMTP_HOST must be a hostname, not an email address.'
      });
    }
    console.log('✅ SMTP_HOST validation passed');

    // Create transporter
    // Use port 465 with SSL for better cloud platform compatibility (Render, etc.)
    const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
    const useSecure = smtpPort === 465;
    
    console.log('📧 Creating SMTP transporter...');
    console.log('SMTP Configuration:', {
      host: smtpHost,
      port: smtpPort,
      secure: useSecure,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASS,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    });
    
    const transporter = nodemailer.createTransport({
      host: smtpHost,
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
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,
      socketTimeout: 30000,
      // Additional options for better cloud compatibility
      requireTLS: true,
      debug: false
    });

    // Skip verification - sometimes it times out on cloud platforms but sending still works
    // We'll try sending directly and catch errors if they occur
    console.log('⏭️  Skipping SMTP verification (will attempt direct send)');

    // Email content for the business/admin
    const recipientEmail = process.env.CONTACT_EMAIL || 'houssein.ibrahim.3@gmail.com';
    console.log('📨 Preparing email...');
    console.log('Email details:', {
      from: process.env.SMTP_USER,
      to: recipientEmail,
      replyTo: email,
      subject: `Contact Form: ${subject}`
    });
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipientEmail, // Where to receive contact messages
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
    console.log('🚀 Attempting to send email...');
    console.log(`   To: ${mailOptions.to}`);
    console.log(`   From: ${mailOptions.from}`);
    console.log(`   Subject: ${mailOptions.subject}`);
    const startTime = Date.now();
    
    try {
      const info = await transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;
      console.log('✅ Email sent successfully!');
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
      console.log(`   Duration: ${duration}ms`);
    } catch (sendError) {
      const duration = Date.now() - startTime;
      console.error('❌ Email send failed after', duration, 'ms');
      console.error('   Error:', sendError.message);
      console.error('   Error code:', sendError.code);
      console.error('   Error command:', sendError.command);
      throw sendError; // Re-throw to be caught by outer catch
    }

    // Optional: Send confirmation email to the user
    if (process.env.SEND_CONFIRMATION_EMAIL === 'true') {
      console.log('📧 Sending confirmation email to user...');
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

      try {
        const confStartTime = Date.now();
        await transporter.sendMail(confirmationMailOptions);
        const confDuration = Date.now() - confStartTime;
        console.log('✅ Confirmation email sent successfully');
        console.log(`   Duration: ${confDuration}ms`);
      } catch (confError) {
        console.error('⚠️  Confirmation email failed (main email was sent):', confError.message);
        // Don't throw - main email was sent successfully
      }
    }

    console.log('✅ Contact form processed successfully');
    console.log('=== Contact Form Submission Completed ===');
    
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!'
    });

  } catch (error) {
    console.error('❌ === Contact Form Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    console.error('=== End Error ===');
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message. Please try again later.'
    });
  }
};

