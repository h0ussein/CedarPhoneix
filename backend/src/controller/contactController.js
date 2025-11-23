import { Resend } from 'resend';

// @desc    Send contact form message via email
// @route   POST /api/contact
// @access  Public
export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    console.log('=== Contact Form Submission Started ===');
    console.log('Request body:', { 
      name: name || 'missing', 
      email: email ? `${email.substring(0, 3)}***` : 'missing', 
      subject: subject || 'missing', 
      messageLength: message?.length || 0 
    });

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

    // Check Resend API key
    console.log('Checking Resend configuration...');
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.error('❌ Missing RESEND_API_KEY environment variable');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact the administrator.'
      });
    }
    console.log('✅ Resend API key found');

    // Initialize Resend
    const resend = new Resend(resendApiKey);
    const recipientEmail = process.env.CONTACT_EMAIL || 'houssein.ibrahim.3@gmail.com';
    
    console.log('📧 Initializing Resend client...');
    console.log('Email configuration:', {
      from: 'onboarding@resend.dev', // Resend requires verified domain, but onboarding@resend.dev works for testing
      to: recipientEmail,
      replyTo: email,
      subject: `Contact Form: ${subject}`
    });

    // Prepare email content
    const emailHtml = `
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
    `;

    const emailText = `
New Contact Form Message

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `;

    // Get from email from environment variable (must be from verified domain)
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    
    if (!fromEmail) {
      throw new Error('RESEND_FROM_EMAIL environment variable is required. Set it to an email from your verified domain (e.g., noreply@yourdomain.com)');
    }
    
    // Send email using Resend
    console.log('🚀 Attempting to send email via Resend...');
    console.log(`   To: ${recipientEmail}`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Subject: Contact Form: ${subject}`);
    const startTime = Date.now();
    
    try {
      const data = await resend.emails.send({
        from: fromEmail,
        to: recipientEmail,
        replyTo: email,
        subject: `Contact Form: ${subject}`,
        html: emailHtml,
        text: emailText
      });
      
      const duration = Date.now() - startTime;
      console.log('✅ Email sent successfully via Resend!');
      console.log('   Email ID:', data.id);
      console.log(`   Duration: ${duration}ms`);
    } catch (sendError) {
      const duration = Date.now() - startTime;
      console.error('❌ Email send failed after', duration, 'ms');
      console.error('   Error:', sendError.message);
      console.error('   Error details:', sendError);
      throw sendError; // Re-throw to be caught by outer catch
    }

    // Optional: Send confirmation email to the user
    if (process.env.SEND_CONFIRMATION_EMAIL === 'true') {
      console.log('📧 Sending confirmation email to user...');
      
      const confirmationHtml = `
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
      `;

      const confirmationText = `
Thank you for contacting us!

Dear ${name},

We have received your message and will get back to you as soon as possible.

Your message:
${message}

Best regards,
Our Ecommerce Team
      `;

      try {
        const confStartTime = Date.now();
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `Thank you for contacting us - ${subject}`,
          html: confirmationHtml,
          text: confirmationText
        });
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
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    console.error('=== End Error ===');
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message. Please try again later.'
    });
  }
};
