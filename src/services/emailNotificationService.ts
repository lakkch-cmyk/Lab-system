import { LoanRequest } from '../types';
import { broadcastRealtimeChange } from './realtimeSync';

export type EmailRecipientRole = 'user' | 'admin';

export type EmailEventType = 
  | 'LOAN_SUBMITTED' 
  | 'LOAN_APPROVED' 
  | 'LOAN_REJECTED' 
  | 'LOAN_RETURNED' 
  | 'LOAN_CANCELLED'
  | 'TEST_EMAIL';

export interface EmailNotificationLog {
  id: string;
  loanId?: string;
  eventType: EmailEventType;
  recipientRole: EmailRecipientRole;
  toEmail: string;
  toName: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  sentAt: string;
  status: 'sent' | 'delivered';
  equipmentName?: string;
  equipmentCode?: string;
  borrowDate?: string;
  returnDate?: string;
  reasonOrNotes?: string;
}

export interface EmailConfigSettings {
  enabled: boolean;
  notifyUserOnSubmit: boolean;
  notifyAdminOnSubmit: boolean;
  notifyUserOnApproval: boolean;
  notifyAdminOnApproval: boolean;
  notifyUserOnReject: boolean;
  notifyUserOnReturn: boolean;
  notifyAdminOnReturn: boolean;
  notifyAdminOnCancel: boolean;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
}

const DEFAULT_EMAIL_CONFIG: EmailConfigSettings = {
  enabled: true,
  notifyUserOnSubmit: true,
  notifyAdminOnSubmit: true,
  notifyUserOnApproval: true,
  notifyAdminOnApproval: true,
  notifyUserOnReject: true,
  notifyUserOnReturn: true,
  notifyAdminOnReturn: true,
  notifyAdminOnCancel: true,
  senderName: 'ระบบบริการเครื่องมือห้องปฏิบัติการ คณะสัตวแพทยศาสตร์ มข.',
  senderEmail: 'vetlab-notification@kku.ac.th',
  replyToEmail: 'vetlab@kku.ac.th'
};

const STORAGE_KEY_LOGS = 'vet_email_logs';
const STORAGE_KEY_CONFIG = 'vet_email_config';

/**
 * Get stored email notification settings
 */
export function getEmailConfig(): EmailConfigSettings {
  if (typeof window === 'undefined') return DEFAULT_EMAIL_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error parsing email config', e);
  }
  return DEFAULT_EMAIL_CONFIG;
}

/**
 * Save email notification settings
 */
export function saveEmailConfig(config: EmailConfigSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  broadcastRealtimeChange('FULL_SYNC', { type: 'EMAIL_CONFIG_UPDATED', config });
}

/**
 * Get all stored email logs
 */
export function getEmailLogs(): EmailNotificationLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing email logs', e);
  }
  return [];
}

/**
 * Save email logs and broadcast
 */
export function saveEmailLogs(logs: EmailNotificationLog[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  broadcastRealtimeChange('FULL_SYNC', { type: 'EMAIL_LOGS_UPDATED', count: logs.length });
}

/**
 * Add new email logs to history
 */
export function addEmailLogs(newLogs: EmailNotificationLog[]): EmailNotificationLog[] {
  const current = getEmailLogs();
  const updated = [...newLogs, ...current].slice(0, 200); // keep last 200 logs
  saveEmailLogs(updated);
  return updated;
}

/**
 * Clear all email logs
 */
export function clearEmailLogs(): void {
  saveEmailLogs([]);
}

/**
 * Helper: Format Thai Date String
 */
function formatThaiDisplayDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Template Builder: Generate Official KKU Vet Lab Email HTML & PlainText
 */
function generateEmailContent(
  loan: LoanRequest,
  eventType: EmailEventType,
  recipientRole: EmailRecipientRole,
  recipientEmail: string,
  recipientName: string,
  extra?: { reason?: string; notes?: string; condition?: string; approverName?: string }
): { subject: string; htmlBody: string; plainTextBody: string } {
  const config = getEmailConfig();
  const formattedBorrowDate = formatThaiDisplayDate(loan.borrowDate);
  const formattedReturnDate = formatThaiDisplayDate(loan.returnDate);
  const periodText = loan.timePeriod ? ` (${loan.timePeriod})` : '';

  let subject = '';
  let headline = '';
  let statusBadge = '';
  let statusBadgeColor = '';
  let actionMessage = '';
  let nextStepsHtml = '';
  let nextStepsText = '';

  switch (eventType) {
    case 'LOAN_SUBMITTED':
      if (recipientRole === 'user') {
        subject = `[ยืนยันคำขอ] ยื่นคำขอจองใช้เครื่องมือ ${loan.equipmentName} (${loan.id})`;
        headline = `เรียน คุณ ${recipientName}`;
        statusBadge = 'รอการอนุมัติ (Pending Approval)';
        statusBadgeColor = '#d97706';
        actionMessage = `ระบบได้รับคำขอจองใช้งานเครื่องมือวิทยาศาสตร์ของท่านเรียบร้อยแล้ว ขณะนี้อยู่ระหว่างการตรวจสอบและพิจารณาอนุมัติโดยเจ้าหน้าที่ดูแลห้องปฏิบัติการ`;
        nextStepsHtml = `
          <ul style="margin: 8px 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
            <li>เจ้าหน้าที่จะตรวจสอบความพร้อมของเครื่องมือและตารางเวลาการใช้งาน</li>
            <li>ท่านจะได้รับอีเมลแจ้งเตือนผลการอนุมัติทันทีเมื่อเจ้าหน้าที่ดำเนินการเสร็จสิ้น</li>
            <li>ท่านสามารถติดตามสถานะคำขอได้ตลอดเวลาผ่านระบบออนไลน์</li>
          </ul>`;
        nextStepsText = `1. เจ้าหน้าที่จะตรวจสอบความพร้อมของเครื่องมือและช่วงเวลาการใช้งาน\n2. ท่านจะได้รับอีเมลแจ้งเตือนผลการอนุมัติทันที\n3. ติดตามสถานะผ่านระบบออนไลน์`;
      } else {
        subject = `[แจ้งเตือนผู้อนุมัติ] มีคำขอใช้งานเครื่องมือใหม่ ${loan.equipmentName} จาก ${loan.borrowerName} (${loan.id})`;
        headline = `เรียน ผู้ดูแลระบบและเจ้าหน้าที่ห้องปฏิบัติการ`;
        statusBadge = 'คำขอใหม่รอการพิจารณา (New Request)';
        statusBadgeColor = '#2563eb';
        actionMessage = `มีคำขอจองใช้งานเครื่องมือวิทยาศาสตร์ใหม่ส่งเข้ามาในระบบ โดย <strong>${loan.borrowerName}</strong> (${loan.borrowerDept}) โปรดเข้าสู่ระบบเพื่อตรวจสอบและดำเนินการอนุมัติหรือปฏิเสธคำขอ`;
        nextStepsHtml = `
          <ul style="margin: 8px 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
            <li>โปรดเข้าสู่ระบบในแท็บบัญชี <strong>"ผู้ดูแลระบบ (Admin)"</strong></li>
            <li>ตรวจสอบคุณสมบัติ วัตถุประสงค์ และช่วงเวลาที่ขอใช้งาน</li>
            <li>กดปุ่ม <strong>"อนุมัติคำขอ"</strong> หรือ <strong>"ปฏิเสธ"</strong> พร้อมระบุเหตุผล</li>
          </ul>`;
        nextStepsText = `1. เข้าสู่ระบบในแท็บบัญชีผู้ดูแลระบบ (Admin)\n2. ตรวจสอบรายละเอียดและช่วงเวลา\n3. พิจารณาอนุมัติหรือปฏิเสธคำขอ`;
      }
      break;

    case 'LOAN_APPROVED':
      if (recipientRole === 'user') {
        subject = `[อนุมัติแล้ว] คำขอใช้งานเครื่องมือ ${loan.equipmentName} ได้รับการอนุมัติแล้ว (${loan.id})`;
        headline = `เรียน คุณ ${recipientName}`;
        statusBadge = 'อนุมัติเรียบร้อย (Approved)';
        statusBadgeColor = '#059669';
        actionMessage = `ยินดีด้วย คำขอจองใช้งานเครื่องมือวิทยาศาสตร์ของท่าน <strong>ได้รับการอนุมัติเรียบร้อยแล้ว</strong> ท่านสามารถเข้ารับอุปกรณ์หรือเข้าใช้ห้องปฏิบัติการตามกำหนดเวลาที่ได้ระบุไว้`;
        nextStepsHtml = `
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; border-radius: 6px; margin: 12px 0;">
            <p style="margin: 0; font-weight: bold; color: #065f46; font-size: 13px;">คำแนะนำและข้อปฏิบัติในการรับเครื่องมือ:</p>
            <ul style="margin: 6px 0 0 0; padding-left: 20px; color: #047857; font-size: 12px; line-height: 1.6;">
              <li>กรุณาติดต่อรับเครื่องมือ ณ ห้องปฏิบัติการตามวันและเวลาที่ได้รับการอนุมัติ</li>
              <li>สวมใส่อุปกรณ์ป้องกันส่วนบุคคล (PPE) และปฏิบัติตามมาตรฐานความปลอดภัยของห้องปฏิบัติการอย่างเคร่งครัด</li>
              <li>หากมีข้อขัดข้องในการใช้งาน กรุณาแจ้งเจ้าหน้าที่ผู้ควบคุมเครื่องทันที</li>
            </ul>
          </div>`;
        nextStepsText = `คำแนะนำและข้อปฏิบัติในการรับเครื่องมือ:\n- ติดต่อรับเครื่องมือ ณ ห้องปฏิบัติการตามวันเวลาที่อนุมัติ\n- ปฏิบัติตามมาตรฐานความปลอดภัยของห้องปฏิบัติการ\n- ตรวจสอบความสมบูรณ์ก่อนและหลังใช้งาน`;
      } else {
        subject = `[บันทึกการอนุมัติ] อนุมัติคำขอ ${loan.equipmentName} (${loan.id}) เรียบร้อยแล้ว`;
        headline = `เรียน ผู้ดูแลระบบ`;
        statusBadge = 'บันทึกการอนุมัติสำเร็จ';
        statusBadgeColor = '#059669';
        actionMessage = `ระบบได้บันทึกการอนุมัติคำขอใช้งานเครื่องมือ <strong>${loan.equipmentName}</strong> ของ <strong>${loan.borrowerName}</strong> เรียบร้อยแล้ว สถานะอุปกรณ์ถูกปรับเป็น "กำลังใช้งาน"`;
        nextStepsHtml = `<p style="color: #475569; font-size: 13px;">บันทึกเข้าระบบตาราง Master Schedule เรียบร้อยแล้ว</p>`;
        nextStepsText = `บันทึกเข้าระบบตาราง Master Schedule เรียบร้อยแล้ว`;
      }
      break;

    case 'LOAN_REJECTED':
      if (recipientRole === 'user') {
        subject = `[แจ้งผลไม่อนุมัติ] คำขอใช้งานเครื่องมือ ${loan.equipmentName} ไม่ผ่านการอนุมัติ (${loan.id})`;
        headline = `เรียน คุณ ${recipientName}`;
        statusBadge = 'ไม่อนุมัติ (Rejected)';
        statusBadgeColor = '#dc2626';
        const rejectReasonText = extra?.reason || loan.rejectReason || 'อุปกรณ์ไม่พร้อมใช้งานในช่วงเวลาดังกล่าวหรือตามระเบียบห้องปฏิบัติการ';
        actionMessage = `ขออภัย คำขอใช้งานเครื่องมือวิทยาศาสตร์ของท่าน <strong>ไม่ผ่านการอนุมัติ</strong><br><br>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; margin: 10px 0;">
            <strong style="color: #991b1b; font-size: 13px;">เหตุผลจากเจ้าหน้าที่ผู้พิจารณา:</strong>
            <p style="margin: 4px 0 0 0; color: #b91c1c; font-size: 13px;">${rejectReasonText}</p>
          </div>`;
        nextStepsHtml = `
          <ul style="margin: 8px 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
            <li>ท่านสามารถยื่นคำขอใหม่โดยเลือกช่วงวันเวลาอื่น หรือเลือกเครื่องมืออื่นที่พร้อมใช้งาน</li>
            <li>หากมีข้อสงสัยเพิ่มเติม สามารถติดต่อเจ้าหน้าที่ห้องปฏิบัติการได้โดยตรง</li>
          </ul>`;
        nextStepsText = `เหตุผล: ${rejectReasonText}\nท่านสามารถยื่นคำขอใหม่โดยเลือกวันเวลาอื่น`;
      } else {
        subject = `[บันทึกการปฏิเสธ] ปฏิเสธคำขอ ${loan.equipmentName} (${loan.id})`;
        headline = `เรียน ผู้ดูแลระบบ`;
        statusBadge = 'ปฏิเสธคำขอเรียบร้อย';
        statusBadgeColor = '#dc2626';
        actionMessage = `ได้ทำการปฏิเสธคำขอใช้งานของ <strong>${loan.borrowerName}</strong> เหตุผล: ${extra?.reason || loan.rejectReason || '-'}`;
        nextStepsHtml = ``;
        nextStepsText = ``;
      }
      break;

    case 'LOAN_RETURNED':
      const returnCond = extra?.condition || loan.conditionAfterReturn || 'ปกติพร้อมใช้งาน';
      if (recipientRole === 'user') {
        subject = `[ใบรับคืนเครื่องมือ] ยืนยันการส่งคืนเครื่องมือ ${loan.equipmentName} (${loan.id})`;
        headline = `เรียน คุณ ${recipientName}`;
        statusBadge = 'ส่งคืนเรียบร้อย (Returned)';
        statusBadgeColor = '#0284c7';
        actionMessage = `เจ้าหน้าที่ห้องปฏิบัติการได้ตรวจสอบและ <strong>บันทึกรับคืนเครื่องมือวิทยาศาสตร์เรียบร้อยแล้ว</strong><br>
          <span style="font-size: 13px; color: #334155;">สภาพเครื่องมือเมื่อตรวจสอบ: <strong>${returnCond}</strong></span>`;
        nextStepsHtml = `
          <div style="background-color: #f0f9ff; border: 1px dashed #0284c7; padding: 14px; border-radius: 8px; margin: 14px 0; text-align: center;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #0369a1; font-size: 13px;">🌟 ร่วมประเมินความพึงพอใจการให้บริการ</p>
            <p style="margin: 0; color: #0284c7; font-size: 12px;">ความคิดเห็นของท่านช่วยพัฒนาประสิทธิภาพการให้บริการห้องปฏิบัติการคณะสัตวแพทยศาสตร์ให้ดียิ่งขึ้น</p>
          </div>`;
        nextStepsText = `สภาพเครื่องมือเมื่อตรวจสอบ: ${returnCond}\nขอขอบคุณที่ใช้บริการห้องปฏิบัติการ คณะสัตวแพทยศาสตร์ มข.`;
      } else {
        subject = `[บันทึกรับคืน] บันทึกรับคืนเครื่องมือ ${loan.equipmentName} (${loan.id})`;
        headline = `เรียน ผู้ดูแลระบบ`;
        statusBadge = 'รับคืนเรียบร้อย';
        statusBadgeColor = '#0284c7';
        actionMessage = `บันทึกรับคืนเครื่องมือของ <strong>${loan.borrowerName}</strong> เรียบร้อยแล้ว (สภาพ: ${returnCond}) สถานะเครื่องมือถูกปรับปรุงอัตโนมัติ`;
        nextStepsHtml = ``;
        nextStepsText = ``;
      }
      break;

    case 'LOAN_CANCELLED':
      if (recipientRole === 'user') {
        subject = `[ยืนยันการยกเลิก] ยกเลิกคำขอจองเครื่องมือ ${loan.equipmentName} (${loan.id})`;
        headline = `เรียน คุณ ${recipientName}`;
        statusBadge = 'ยกเลิกคำขอแล้ว (Cancelled)';
        statusBadgeColor = '#64748b';
        actionMessage = `ท่านได้ทำการยกเลิกคำขอใช้งานเครื่องมือ <strong>${loan.equipmentName}</strong> เรียบร้อยแล้ว`;
        nextStepsHtml = `<p style="color: #64748b; font-size: 13px;">หากต้องการใช้งานในอนาคต ท่านสามารถสร้างคำขอใหม่ได้ตลอดเวลา</p>`;
        nextStepsText = `ท่านได้ทำการยกเลิกคำขอใช้งานเรียบร้อยแล้ว`;
      } else {
        subject = `[แจ้งยกเลิกคำขอ] ผู้ขอได้ยกเลิกคำขอ ${loan.equipmentName} (${loan.id})`;
        headline = `เรียน ผู้ดูแลระบบ`;
        statusBadge = 'ผู้ขอยกเลิกคำขอ';
        statusBadgeColor = '#64748b';
        actionMessage = `ผู้ขอ <strong>${loan.borrowerName}</strong> ได้ทำการยกเลิกคำขอใช้งานเครื่องมือ ${loan.equipmentName} (${loan.id})`;
        nextStepsHtml = ``;
        nextStepsText = ``;
      }
      break;

    default:
      subject = `[แจ้งเตือนระบบ] ข้อมูลคำขอเครื่องมือ ${loan.equipmentName} (${loan.id})`;
      headline = `เรียน คุณ ${recipientName}`;
      statusBadge = 'แจ้งเตือนระบบ';
      statusBadgeColor = '#2563eb';
      actionMessage = `ข้อมูลการใช้งานเครื่องมือ ${loan.equipmentName}`;
  }

  // Build Full Official HTML Template
  const htmlBody = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Institutional Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0369a1 100%); padding: 24px 28px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #93c5fd; text-transform: uppercase; margin-bottom: 4px;">
                      FACULTY OF VETERINARY MEDICINE • KHON KAEN UNIVERSITY
                    </div>
                    <div style="font-size: 18px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                      ระบบบริการและจองเครื่องมือวิทยาศาสตร์ห้องปฏิบัติการ
                    </div>
                    <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">
                      คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Indicator Ribbon -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 12px 28px; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="font-size: 12px; color: #64748b; font-weight: 600;">
                    รหัสอ้างอิง: <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${loan.id}</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; color: #ffffff; background-color: ${statusBadgeColor};">
                      ${statusBadge}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
                ${headline}
              </h2>
              <p style="font-size: 14px; color: #334155; margin: 0 0 18px 0; line-height: 1.6;">
                ${actionMessage}
              </p>

              <!-- Equipment & Request Details Table Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px;">
                    <div style="font-size: 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      📋 รายละเอียดคำขอใช้เครื่องมือ (Request Details)
                    </div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px;">
                      <tr>
                        <td width="35%" style="color: #64748b; font-weight: 600; padding: 4px 0;">เครื่องมือวิทยาศาสตร์:</td>
                        <td width="65%" style="color: #0f172a; font-weight: 700; padding: 4px 0;">${loan.equipmentName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; padding: 4px 0;">รหัสเครื่องมือ:</td>
                        <td style="color: #0f172a; font-family: monospace; font-weight: 600; padding: 4px 0;">${loan.equipmentCode || '-'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; padding: 4px 0;">ชื่อผู้ขอใช้งาน:</td>
                        <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${loan.borrowerName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; padding: 4px 0;">สังกัด/สาขาวิชา:</td>
                        <td style="color: #334155; padding: 4px 0;">${loan.borrowerDept || '-'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; padding: 4px 0;">เบอร์โทรศัพท์ติดต่อ:</td>
                        <td style="color: #334155; padding: 4px 0;">${loan.borrowerPhone || '-'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; padding: 4px 0;">อีเมลผู้ขอ:</td>
                        <td style="color: #2563eb; padding: 4px 0;">${loan.borrowerEmail || '-'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; padding: 4px 0;">ช่วงวันที่ขอใช้งาน:</td>
                        <td style="color: #0f172a; font-weight: 700; padding: 4px 0;">${formattedBorrowDate} ถึง ${formattedReturnDate} ${periodText}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600; padding: 4px 0; vertical-align: top;">วัตถุประสงค์:</td>
                        <td style="color: #334155; padding: 4px 0;">${loan.purpose || '-'}</td>
                      </tr>
                      ${extra?.notes ? `
                      <tr>
                        <td style="color: #64748b; font-weight: 600; padding: 4px 0; vertical-align: top;">หมายเหตุเพิ่มเติม:</td>
                        <td style="color: #0f172a; padding: 4px 0;">${extra.notes}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps / Actions -->
              ${nextStepsHtml}

              <!-- Notification meta info -->
              <p style="font-size: 11px; color: #94a3b8; margin: 20px 0 0 0; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ (Automated Notification) จากระบบบริหารจัดการเครื่องมือวิทยาศาสตร์
              </p>
            </td>
          </tr>

          <!-- Footer Signature -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
              <div style="font-size: 12px; font-weight: bold; color: #334155;">
                ฝ่ายห้องปฏิบัติการกลางและวิจัย คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                123 ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40002 • โทรศัพท์: 043-009700 ต่อ 46001
              </div>
              <div style="font-size: 11px; color: #2563eb; margin-top: 2px;">
                อีเมลติดต่อ: <a href="mailto:vetlab@kku.ac.th" style="color: #2563eb; text-decoration: none;">vetlab@kku.ac.th</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain Text Version
  const plainTextBody = `
[คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น]
ระบบบริการและจองเครื่องมือวิทยาศาสตร์ห้องปฏิบัติการ
--------------------------------------------------
${subject}
รหัสอ้างอิง: ${loan.id}
สถานะ: ${statusBadge}
วันที่ส่ง: ${new Date().toLocaleString('th-TH')}

${headline}

${actionMessage.replace(/<[^>]*>?/gm, '')}

รายละเอียดคำขอ:
- เครื่องมือ: ${loan.equipmentName} (${loan.equipmentCode || '-'})
- ผู้ขอใช้งาน: ${loan.borrowerName} (${loan.borrowerDept || '-'})
- โทรศัพท์: ${loan.borrowerPhone || '-'}
- อีเมล: ${loan.borrowerEmail || '-'}
- วันที่ยืม-คืน: ${formattedBorrowDate} ถึง ${formattedReturnDate} ${periodText}
- วัตถุประสงค์: ${loan.purpose || '-'}
${extra?.notes ? `- หมายเหตุ: ${extra.notes}\n` : ''}${extra?.reason ? `- เหตุผล: ${extra.reason}\n` : ''}
${nextStepsText ? `\nข้อปฏิบัติ/ขั้นตอนต่อไป:\n${nextStepsText}\n` : ''}
--------------------------------------------------
ฝ่ายห้องปฏิบัติการกลาง คณะสัตวแพทยศาสตร์ มหาวิทยาลัยขอนแก่น
โทรศัพท์ 043-009700 ต่อ 46001 | อีเมล: vetlab@kku.ac.th
`.trim();

  return { subject, htmlBody, plainTextBody };
}

/**
 * Main Dispatcher: Send email notifications to User & Approvers automatically
 */
export function sendLoanEmailNotifications(
  loan: LoanRequest,
  eventType: EmailEventType,
  options: {
    adminEmails?: string[];
    reason?: string;
    notes?: string;
    condition?: string;
    approverName?: string;
  }
): EmailNotificationLog[] {
  const config = getEmailConfig();
  if (!config.enabled) {
    return [];
  }

  const newLogs: EmailNotificationLog[] = [];
  const adminEmails = options.adminEmails && options.adminEmails.length > 0 
    ? options.adminEmails 
    : ['lakkch@kku.ac.th', 'vetlab-admin@kku.ac.th'];

  const nowIso = new Date().toISOString();

  // 1. Check & Generate Email for User (Borrower)
  let shouldSendToUser = false;
  if (eventType === 'LOAN_SUBMITTED' && config.notifyUserOnSubmit) shouldSendToUser = true;
  if (eventType === 'LOAN_APPROVED' && config.notifyUserOnApproval) shouldSendToUser = true;
  if (eventType === 'LOAN_REJECTED' && config.notifyUserOnReject) shouldSendToUser = true;
  if (eventType === 'LOAN_RETURNED' && config.notifyUserOnReturn) shouldSendToUser = true;
  if (eventType === 'LOAN_CANCELLED') shouldSendToUser = true;

  if (shouldSendToUser && loan.borrowerEmail) {
    const userContent = generateEmailContent(
      loan,
      eventType,
      'user',
      loan.borrowerEmail,
      loan.borrowerName || 'ผู้ขอใช้งาน',
      options
    );

    newLogs.push({
      id: `email-usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      loanId: loan.id,
      eventType,
      recipientRole: 'user',
      toEmail: loan.borrowerEmail,
      toName: loan.borrowerName || 'ผู้ขอใช้งาน',
      fromEmail: config.senderEmail,
      fromName: config.senderName,
      subject: userContent.subject,
      htmlBody: userContent.htmlBody,
      plainTextBody: userContent.plainTextBody,
      sentAt: nowIso,
      status: 'delivered',
      equipmentName: loan.equipmentName,
      equipmentCode: loan.equipmentCode,
      borrowDate: loan.borrowDate,
      returnDate: loan.returnDate,
      reasonOrNotes: options.reason || options.notes
    });
  }

  // 2. Check & Generate Email for Approvers (Admins)
  let shouldSendToAdmin = false;
  if (eventType === 'LOAN_SUBMITTED' && config.notifyAdminOnSubmit) shouldSendToAdmin = true;
  if (eventType === 'LOAN_APPROVED' && config.notifyAdminOnApproval) shouldSendToAdmin = true;
  if (eventType === 'LOAN_REJECTED') shouldSendToAdmin = true;
  if (eventType === 'LOAN_RETURNED' && config.notifyAdminOnReturn) shouldSendToAdmin = true;
  if (eventType === 'LOAN_CANCELLED' && config.notifyAdminOnCancel) shouldSendToAdmin = true;

  if (shouldSendToAdmin) {
    // Send to each admin email or aggregate
    adminEmails.forEach((adminEmail, index) => {
      const adminName = adminEmail.toLowerCase().includes('lakkch') 
        ? 'อ.ดร. ลักษณ์ชนก บุญญานุวัตร (ผู้อนุมัติ)' 
        : `ผู้ดูแลระบบแล็บ (${adminEmail.split('@')[0]})`;

      const adminContent = generateEmailContent(
        loan,
        eventType,
        'admin',
        adminEmail,
        adminName,
        options
      );

      newLogs.push({
        id: `email-adm-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
        loanId: loan.id,
        eventType,
        recipientRole: 'admin',
        toEmail: adminEmail,
        toName: adminName,
        fromEmail: config.senderEmail,
        fromName: config.senderName,
        subject: adminContent.subject,
        htmlBody: adminContent.htmlBody,
        plainTextBody: adminContent.plainTextBody,
        sentAt: nowIso,
        status: 'delivered',
        equipmentName: loan.equipmentName,
        equipmentCode: loan.equipmentCode,
        borrowDate: loan.borrowDate,
        returnDate: loan.returnDate,
        reasonOrNotes: options.reason || options.notes
      });
    });
  }

  // Persist to email logs
  if (newLogs.length > 0) {
    addEmailLogs(newLogs);
  }

  return newLogs;
}

/**
 * Generate a mailto: link to open user's default desktop/mobile email client
 */
export function createMailtoUrl(to: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
}
