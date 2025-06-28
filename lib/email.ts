import { Resend } from 'resend';
import { prisma } from './db';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'lamyajarrari6@gmail.com',
      to: data.to,
      subject: data.subject,
      html: data.html,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get technician emails from database
const getTechnicianEmails = async (): Promise<string[]> => {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: 'technician',
      },
      select: {
        email: true,
      },
    });
    
    return technicians.map(tech => tech.email);
  } catch (error) {
    console.error('Error fetching technician emails:', error);
    return [];
  }
};

// Send alert email
export const sendAlertEmail = async (alertData: {
  message: string;
  messageRole: string;
  type: string;
  requiredAction: string;
  priority: string;
  machineId: string;
  machineName?: string;
  department?: string;
}) => {
  try {
    const technicianEmails = await getTechnicianEmails();
    
    if (technicianEmails.length === 0) {
      console.warn('No technician emails found for alert notification');
      return { success: false, error: 'No technician emails found' };
    }

    const priorityEmoji = {
      low: '🟢',
      medium: '🟡', 
      high: '🟠',
      critical: '🔴'
    };

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin: 0 0 20px 0;">
            ${priorityEmoji[alertData.priority as keyof typeof priorityEmoji] || '🚨'} 
            DiaCare Alert Notification
          </h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Alert Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Message:</td>
                <td style="padding: 8px 0; color: #333;">${alertData.message}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Role:</td>
                <td style="padding: 8px 0; color: #333;">${alertData.messageRole}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Type:</td>
                <td style="padding: 8px 0; color: #333;">${alertData.type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Required Action:</td>
                <td style="padding: 8px 0; color: #333;">${alertData.requiredAction}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Priority:</td>
                <td style="padding: 8px 0; color: #333;">
                  <span style="
                    background-color: ${
                      alertData.priority === 'critical' ? '#dc3545' :
                      alertData.priority === 'high' ? '#fd7e14' :
                      alertData.priority === 'medium' ? '#ffc107' : '#28a745'
                    };
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    text-transform: uppercase;
                  ">
                    ${alertData.priority}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Machine ID:</td>
                <td style="padding: 8px 0; color: #333;">${alertData.machineId}</td>
              </tr>
              ${alertData.machineName ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Machine Name:</td>
                <td style="padding: 8px 0; color: #333;">${alertData.machineName}</td>
              </tr>
              ` : ''}
              ${alertData.department ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Department:</td>
                <td style="padding: 8px 0; color: #333;">${alertData.department}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Timestamp:</td>
                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
            <p style="margin: 0; color: #495057; font-size: 14px;">
              <strong>Action Required:</strong> Please review this alert and take appropriate action as soon as possible.
            </p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">
              This is an automated alert from the DiaCare system. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'lamyajarrari6@gmail.com',
      to: technicianEmails,
      subject: `🚨 DiaCare Alert: ${alertData.priority.toUpperCase()} - ${alertData.type}`,
      html: emailContent,
    });

    console.log('Alert email sent successfully:', result.data?.id);
    
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending alert email:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

// Send test email
export const sendTestEmail = async (toEmail: string) => {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745; margin: 0 0 20px 0;">✅ DiaCare Email Test</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #333; font-size: 16px;">
              This is a test email from the DiaCare system to verify that email notifications are working correctly.
            </p>
          </div>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #495057; font-size: 14px;">
              <strong>Test Status:</strong> ✅ Email system is working properly!
            </p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'lamyajarrari6@gmail.com',
      to: toEmail,
      subject: 'DiaCare Email Test',
      html: emailContent,
    });

    console.log('Test email sent successfully:', result.data?.id);
    
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

// Send maintenance email
export const sendMaintenanceEmail = async (data: {
  technician: { name: string; email: string };
  controls: Array<{
    id: number;
    machine: { name: string; inventoryNumber: string; department: string };
    controlType: string;
    nextControlDate: Date;
    isOverdue: boolean;
  }>;
}) => {
  try {
    const overdueControls = data.controls.filter(control => control.isOverdue);
    const upcomingControls = data.controls.filter(control => !control.isOverdue);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #007bff; margin: 0 0 20px 0;">🔧 DiaCare Maintenance Control Notification</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
              Hello <strong>${data.technician.name}</strong>,
            </p>
            <p style="margin: 0 0 20px 0; color: #333; font-size: 14px;">
              This is a notification about maintenance controls for your assigned machines.
            </p>
          </div>

          ${overdueControls.length > 0 ? `
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin: 0 0 15px 0;">⚠️ Overdue Controls</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px;">
              ${overdueControls.map(control => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                  <h4 style="margin: 0 0 8px 0; color: #dc3545;">${control.machine.name}</h4>
                  <table style="width: 100%; font-size: 13px;">
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; color: #666;">Inventory Number:</td>
                      <td style="padding: 4px 0; color: #333;">${control.machine.inventoryNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; color: #666;">Department:</td>
                      <td style="padding: 4px 0; color: #333;">${control.machine.department}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; color: #666;">Control Type:</td>
                      <td style="padding: 4px 0; color: #333;">${control.controlType.replace('_', ' ')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; color: #666;">Due Date:</td>
                      <td style="padding: 4px 0; color: #dc3545; font-weight: bold;">${control.nextControlDate.toLocaleDateString()}</td>
                    </tr>
                  </table>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${upcomingControls.length > 0 ? `
          <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8;">
            <h3 style="color: #0c5460; margin: 0 0 15px 0;">📅 Upcoming Controls</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px;">
              ${upcomingControls.map(control => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                  <h4 style="margin: 0 0 8px 0; color: #17a2b8;">${control.machine.name}</h4>
                  <table style="width: 100%; font-size: 13px;">
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; color: #666;">Inventory Number:</td>
                      <td style="padding: 4px 0; color: #333;">${control.machine.inventoryNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; color: #666;">Department:</td>
                      <td style="padding: 4px 0; color: #333;">${control.machine.department}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; color: #666;">Control Type:</td>
                      <td style="padding: 4px 0; color: #333;">${control.controlType.replace('_', ' ')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; color: #666;">Due Date:</td>
                      <td style="padding: 4px 0; color: #28a745; font-weight: bold;">${control.nextControlDate.toLocaleDateString()}</td>
                    </tr>
                  </table>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
            <p style="margin: 0; color: #495057; font-size: 14px;">
              <strong>Action Required:</strong> Please schedule and perform the necessary maintenance controls for the machines listed above.
            </p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">
              This is an automated notification from the DiaCare system. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'lamyajarrari6@gmail.com',
      to: data.technician.email,
      subject: '🔧 DiaCare Maintenance Control Notification',
      html: emailContent,
    });

    console.log('Maintenance email sent successfully:', result.data?.id);
    
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending maintenance email:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}; 