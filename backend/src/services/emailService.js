import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend lazily to ensure environment variables are loaded
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }
  return new Resend(apiKey);
};

// Generate email verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  try {
    const resend = getResend();
    // Ensure FRONTEND_URL doesn't end with a slash
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    
    console.log('📧 Preparing verification email...');
    console.log('To:', user.email);
    console.log('Verification URL:', verificationUrl);
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi <strong>${user.name}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Thank you for registering! Please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #10b981; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
            ${verificationUrl}
          </p>
          
          <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Cedar Phoenix. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
Verify Your Email

Hi ${user.name},

Thank you for registering! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account, please ignore this email.

© ${new Date().getFullYear()} Cedar Phoenix. All rights reserved.
    `;

    // Use verified domain email - REQUIRED for sending to any recipient
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    
    if (!fromEmail) {
      throw new Error('RESEND_FROM_EMAIL environment variable is required. Set it to an email from your verified domain (e.g., noreply@yourdomain.com)');
    }
    
    console.log('Sending email from:', fromEmail);
    
    const data = await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: 'Verify Your Email Address - Cedar Phoenix',
      html: emailHtml,
      text: emailText
    });

    console.log('✅ Verification email sent successfully');
    console.log('Resend response:', JSON.stringify(data, null, 2));
    console.log('Email ID:', data?.id || data?.data?.id || 'No ID returned');
    
    if (data?.error) {
      console.error('❌ Resend API error:', data.error);
      throw new Error(data.error.message || 'Failed to send email');
    }
    
    return { success: true, messageId: data?.id || data?.data?.id };
  } catch (error) {
    console.error('❌ Failed to send verification email:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

// Helper function to send email
const sendEmail = async (to, subject, html, text) => {
  const resend = getResend();
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL environment variable is required');
  }
  
  const data = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text
  });
  
  if (data?.error) {
    throw new Error(data.error.message || 'Failed to send email');
  }
  
  return { success: true, messageId: data?.id || data?.data?.id };
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const customerEmail = order.shippingInfo?.email;
    if (!customerEmail) {
      console.log('⚠️ No email found for order confirmation');
      return;
    }

    const customerName = order.shippingInfo?.name || order.shippingInfo?.firstName || 'Customer';
    const orderId = order._id.toString().slice(-8).toUpperCase();
    
    const itemsList = order.orderItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.name}</strong>
          ${item.selectedSize ? `<br><small>Size: ${item.selectedSize}</small>` : ''}
          ${item.selectedColor ? `<br><small>Color: ${item.selectedColor}</small>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi <strong>${customerName}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Thank you for your order! We've received your order and will process it shortly.
          </p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Order Number</p>
            <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold;">#${orderId}</p>
          </div>
          
          <h3 style="color: #374151; margin: 30px 0 15px 0;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #e5e7eb;">Subtotal:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #e5e7eb;">$${order.itemsPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Delivery:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold;">$${order.deliveryPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #10b981;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #10b981;">$${order.totalPrice.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              We'll send you another email when your order is being processed. If you have any questions, please contact us.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Cedar Phoenix. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
Order Confirmed!

Hi ${customerName},

Thank you for your order! We've received your order and will process it shortly.

Order Number: #${orderId}

Order Details:
${order.orderItems.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Subtotal: $${order.itemsPrice.toFixed(2)}
Delivery: $${order.deliveryPrice.toFixed(2)}
Total: $${order.totalPrice.toFixed(2)}

We'll send you another email when your order is being processed.

© ${new Date().getFullYear()} Cedar Phoenix. All rights reserved.
    `;

    await sendEmail(customerEmail, `Order Confirmation #${orderId} - Cedar Phoenix`, emailHtml, emailText);
    console.log('✅ Order confirmation email sent to:', customerEmail);
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    // Don't throw - order was created successfully
  }
};

// Send order status update email
export const sendOrderStatusEmail = async (order, oldStatus) => {
  try {
    const customerEmail = order.shippingInfo?.email;
    if (!customerEmail) {
      console.log('⚠️ No email found for order status update');
      return;
    }

    const customerName = order.shippingInfo?.name || order.shippingInfo?.firstName || 'Customer';
    const orderId = order._id.toString().slice(-8).toUpperCase();
    const newStatus = order.orderStatus;
    
    let statusColor = '#10b981';
    let statusMessage = '';
    let statusTitle = '';
    
    switch (newStatus) {
      case 'processing':
        statusColor = '#3b82f6';
        statusTitle = 'Your Order is Being Processed';
        statusMessage = 'Great news! Your order is now being processed and will be prepared for delivery soon.';
        break;
      case 'delivered':
        statusColor = '#10b981';
        statusTitle = 'Your Order Has Been Delivered!';
        statusMessage = 'Your order has been successfully delivered. We hope you enjoy your purchase!';
        break;
      case 'cancelled':
        statusColor = '#ef4444';
        statusTitle = 'Order Cancelled';
        statusMessage = 'Your order has been cancelled. If you have any questions, please contact us.';
        break;
      default:
        return; // Don't send email for other statuses
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${statusTitle}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi <strong>${customerName}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            ${statusMessage}
          </p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Order Number</p>
            <p style="margin: 0; color: ${statusColor}; font-size: 24px; font-weight: bold;">#${orderId}</p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">Status: <strong style="color: ${statusColor};">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</strong></p>
          </div>
          
          ${newStatus === 'delivered' ? `
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              <strong>Thank you for shopping with us!</strong> We hope you're happy with your purchase. If you have any questions or concerns, please don't hesitate to contact us.
            </p>
          </div>
          ` : ''}
          
          ${newStatus === 'cancelled' ? `
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              If you believe this cancellation was made in error, or if you have any questions, please contact our support team.
            </p>
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Cedar Phoenix. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
${statusTitle}

Hi ${customerName},

${statusMessage}

Order Number: #${orderId}
Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}

${newStatus === 'delivered' ? 'Thank you for shopping with us! We hope you enjoy your purchase.' : ''}
${newStatus === 'cancelled' ? 'If you have any questions, please contact our support team.' : ''}

© ${new Date().getFullYear()} Cedar Phoenix. All rights reserved.
    `;

    await sendEmail(customerEmail, `${statusTitle} - Order #${orderId}`, emailHtml, emailText);
    console.log(`✅ Order ${newStatus} email sent to:`, customerEmail);
  } catch (error) {
    console.error(`❌ Failed to send order ${order.orderStatus} email:`, error);
    // Don't throw - order status was updated successfully
  }
};

// Send order notification email to all admins
export const sendAdminOrderNotification = async (order) => {
  try {
    // Import User model dynamically to avoid circular dependencies
    const User = (await import('../model/User.js')).default;
    
    // Find all admin users
    const admins = await User.find({ role: 'admin' }).select('email name');
    
    if (!admins || admins.length === 0) {
      console.log('⚠️ No admin users found to notify');
      return;
    }

    const orderId = order._id.toString().slice(-8).toUpperCase();
    const customerName = order.shippingInfo?.name || order.shippingInfo?.firstName || 'Guest Customer';
    const customerEmail = order.shippingInfo?.email || 'No email provided';
    const customerPhone = order.shippingInfo?.phone || order.shippingInfo?.mobile || 'No phone provided';
    
    // Format shipping address
    const shippingAddress = [
      order.shippingInfo?.address,
      order.shippingInfo?.city,
      order.shippingInfo?.state,
      order.shippingInfo?.zipCode,
      order.shippingInfo?.country
    ].filter(Boolean).join(', ') || 'No address provided';
    
    // Format order items
    const itemsList = order.orderItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.name}</strong>
          ${item.selectedSize ? `<br><small style="color: #6b7280;">Size: ${item.selectedSize}</small>` : ''}
          ${item.selectedColor ? `<br><small style="color: #6b7280;">Color: ${item.selectedColor}</small>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛒 New Order Received!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: bold;">
              A new order has been placed and requires your attention.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Order Number</p>
            <p style="margin: 0; color: #f59e0b; font-size: 28px; font-weight: bold;">#${orderId}</p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
              Date: ${new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          
          <h3 style="color: #374151; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Customer Information</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: bold;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px;">${customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px;">${customerPhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Address:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px;">${shippingAddress}</td>
              </tr>
            </table>
          </div>
          
          <h3 style="color: #374151; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #ffffff;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151;">Item</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #e5e7eb; color: #374151;">Subtotal:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #e5e7eb; color: #374151;">$${order.itemsPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Delivery:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">$${order.deliveryPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #f59e0b;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #f59e0b;">$${order.totalPrice.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <h3 style="color: #374151; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Payment Information</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 150px;">Payment Method:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: bold; text-transform: capitalize;">${order.paymentInfo?.method || 'Cash'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: bold; text-transform: capitalize;">${order.paymentInfo?.status || 'Pending'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Status:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: bold; text-transform: capitalize;">${order.orderStatus || 'Pending'}</td>
              </tr>
            </table>
          </div>
          
          ${order.totalProfit !== undefined ? `
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              <strong>Profit:</strong> $${order.totalProfit.toFixed(2)} | 
              <strong>Cost:</strong> $${(order.totalCost || 0).toFixed(2)}
            </p>
          </div>
          ` : ''}
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-top: 30px; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Action Required:</strong> Please review this order and update its status in the admin dashboard.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Cedar Phoenix. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
🛒 New Order Received!

A new order has been placed and requires your attention.

Order Number: #${orderId}
Date: ${new Date(order.createdAt).toLocaleString()}

Customer Information:
Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}
Address: ${shippingAddress}

Order Items:
${order.orderItems.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}${item.selectedSize ? ` [Size: ${item.selectedSize}]` : ''}${item.selectedColor ? ` [Color: ${item.selectedColor}]` : ''}`).join('\n')}

Subtotal: $${order.itemsPrice.toFixed(2)}
Delivery: $${order.deliveryPrice.toFixed(2)}
Total: $${order.totalPrice.toFixed(2)}

Payment Information:
Payment Method: ${order.paymentInfo?.method || 'Cash'}
Payment Status: ${order.paymentInfo?.status || 'Pending'}
Order Status: ${order.orderStatus || 'Pending'}

${order.totalProfit !== undefined ? `Profit: $${order.totalProfit.toFixed(2)} | Cost: $${(order.totalCost || 0).toFixed(2)}\n` : ''}

Action Required: Please review this order and update its status in the admin dashboard.

© ${new Date().getFullYear()} Cedar Phoenix. All rights reserved.
    `;

    // Send email to all admins
    const adminEmails = admins.map(admin => admin.email);
    const adminNames = admins.map(admin => admin.name || admin.email).join(', ');
    
    console.log(`📧 Sending order notification to ${admins.length} admin(s): ${adminNames}`);
    
    // Send to all admins (Resend supports multiple recipients)
    await sendEmail(adminEmails, `🛒 New Order #${orderId} - ${customerName}`, emailHtml, emailText);
    
    console.log(`✅ Admin order notification sent successfully to ${admins.length} admin(s)`);
  } catch (error) {
    console.error('❌ Failed to send admin order notification:', error);
    // Don't throw - order was created successfully, email failure shouldn't block it
  }
};

