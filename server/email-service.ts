import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@qyuqa.com';

export interface VendorRegistrationEmailData {
  vendorName: string;
  vendorEmail: string;
  storeName: string;
  description: string;
  vendorId: number;
}

export interface VendorApprovalEmailData {
  vendorName: string;
  vendorEmail: string;
  storeName: string;
  notes?: string;
}

export interface VendorRejectionEmailData {
  vendorName: string;
  vendorEmail: string;
  storeName: string;
  notes?: string;
}

export async function sendAdminVendorRegistrationEmail(data: VendorRegistrationEmailData) {
  try {
    const { vendorName, vendorEmail, storeName, description, vendorId } = data;
    const { client } = await getResendClient();

    const emailHtml = `
      <h2>New Vendor Application</h2>
      <p>A new vendor has registered and is awaiting approval:</p>
      
      <h3>Vendor Details:</h3>
      <ul>
        <li><strong>Store Name:</strong> ${storeName}</li>
        <li><strong>Contact Email:</strong> ${vendorEmail}</li>
        <li><strong>Description:</strong> ${description}</li>
      </ul>
      
      <p>Please review and approve/reject this application in the admin dashboard.</p>
      
      <p><a href="${process.env.REPL_SLUG || 'your-app'}.replit.app/admin/dashboard">Go to Admin Dashboard</a></p>
    `;

    const result = await client.emails.send({
      from: 'admin@qyuqa.com',
      to: ADMIN_EMAIL,
      subject: `New Vendor Application: ${storeName}`,
      html: emailHtml,
    });

    console.log('Admin notification email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
}

export async function sendVendorApprovalEmail(data: VendorApprovalEmailData) {
  try {
    const { vendorName, vendorEmail, storeName, notes } = data;
    const { client } = await getResendClient();

    const emailHtml = `
      <h2>Congratulations! Your Vendor Application Has Been Approved</h2>
      
      <p>Dear ${vendorName || 'Vendor'},</p>
      
      <p>We're excited to inform you that your application for <strong>${storeName}</strong> has been approved!</p>
      
      ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
      
      <p>You can now:</p>
      <ul>
        <li>Access your vendor dashboard</li>
        <li>Add products to your store</li>
        <li>Manage your inventory</li>
        <li>Start selling on Qyuqa!</li>
      </ul>
      
      <p><a href="${process.env.REPL_SLUG || 'your-app'}.replit.app/vendor/dashboard">Go to Vendor Dashboard</a></p>
      
      <p>Welcome to the Qyuqa marketplace!</p>
      
      <p>Best regards,<br>The Qyuqa Team</p>
    `;

    const result = await client.emails.send({
      from: 'info@qyuqa.com',
      to: vendorEmail,
      subject: `Your Vendor Application Has Been Approved - ${storeName}`,
      html: emailHtml,
    });

    console.log('Vendor approval email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending vendor approval email:', error);
    throw error;
  }
}

export async function sendVendorRejectionEmail(data: VendorRejectionEmailData) {
  try {
    const { vendorName, vendorEmail, storeName, notes } = data;
    const { client } = await getResendClient();

    const emailHtml = `
      <h2>Update on Your Vendor Application</h2>
      
      <p>Dear ${vendorName || 'Vendor'},</p>
      
      <p>Thank you for your interest in joining the Qyuqa marketplace.</p>
      
      <p>Unfortunately, we are unable to approve your application for <strong>${storeName}</strong> at this time.</p>
      
      ${notes ? `<p><strong>Feedback:</strong> ${notes}</p>` : ''}
      
      <p>If you have any questions or would like to reapply in the future, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>The Qyuqa Team</p>
    `;

    const result = await client.emails.send({
      from: 'info@qyuqa.com',
      to: vendorEmail,
      subject: `Update on Your Vendor Application - ${storeName}`,
      html: emailHtml,
    });

    console.log('Vendor rejection email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending vendor rejection email:', error);
    throw error;
  }
}
