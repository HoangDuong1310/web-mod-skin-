import nodemailer from 'nodemailer'
import { getSettings } from './settings'

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

// ===== Email template helper =====
function emailLayout(content: string, footerText?: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">WebModSkin</h1>
  </td></tr>
  <tr><td style="padding:32px;">${content}</td></tr>
  <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
    <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
      ${footerText || '© WebModSkin — Email tự động, vui lòng không trả lời trực tiếp.'}
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function btn(href: string, label: string, color = '#6366f1'): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="background:${color};color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;font-size:15px;">${label}</a>
  </div>`
}

function infoBox(content: string, borderColor = '#6366f1', bgColor = '#f0f9ff'): string {
  return `<div style="background:${bgColor};padding:20px;border-radius:8px;border-left:4px solid ${borderColor};margin:20px 0;">${content}</div>`
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private settings: any = null

  resetTransporter() {
    this.transporter = null
    this.settings = null
  }

  async initializeTransporter() {
    try {
      this.settings = await getSettings('email')
      
      if (!this.settings.smtpEnabled) {
        console.log('📧 SMTP is disabled, skipping email sending')
        return false
      }

      const transportConfig: any = {
        host: this.settings.smtpHost,
        port: this.settings.smtpPort || 587,
        secure: this.settings.smtpSecure || false,
        auth: {
          user: this.settings.smtpUsername,
          pass: this.settings.smtpPassword,
        },
      }

      const port = this.settings.smtpPort || 587
      
      if (port === 465) {
        transportConfig.secure = true
        transportConfig.tls = { rejectUnauthorized: false }
      } else if (port === 25) {
        transportConfig.secure = false
        transportConfig.ignoreTLS = true
      } else {
        // Port 587 or others — use STARTTLS
        transportConfig.secure = false
        transportConfig.tls = { rejectUnauthorized: false }
      }

      this.transporter = nodemailer.createTransport(transportConfig)

      if (this.transporter) {
        await this.transporter.verify()
      }
      console.log('📧 SMTP connection verified successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error)
      this.transporter = null
      return false
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        const initialized = await this.initializeTransporter()
        if (!initialized) {
          throw new Error('Email service not initialized')
        }
      }

      const mailOptions = {
        from: options.from || `${this.settings.fromName} <${this.settings.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || this.settings.replyToEmail,
      }

      const result = await this.transporter!.sendMail(mailOptions)
      console.log('📧 Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      return false
    }
  }

  // ─── Test Email ───
  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    try {
      // Always reinitialize to pick up latest settings
      this.resetTransporter()
      const initialized = await this.initializeTransporter()
      if (!initialized) {
        throw new Error('Failed to initialize email settings')
      }

      return this.sendEmail({
        to: recipientEmail,
        subject: '🧪 Test Email - WebModSkin',
        html: emailLayout(`
          <h2 style="color:#333;margin-top:0;">🧪 Test Email</h2>
          <p>Email SMTP đã được cấu hình thành công!</p>
          ${infoBox(`
            <h3 style="margin-top:0;">Cấu hình hiện tại:</h3>
            <ul style="margin:0;">
              <li><strong>SMTP Host:</strong> ${this.settings?.smtpHost || 'N/A'}</li>
              <li><strong>SMTP Port:</strong> ${this.settings?.smtpPort || 'N/A'}</li>
              <li><strong>Secure:</strong> ${this.settings?.smtpSecure ? 'Có' : 'Không'}</li>
              <li><strong>From:</strong> ${this.settings?.fromName || 'N/A'}</li>
            </ul>
          `, '#10b981', '#f0fdf4')}
          <p style="color:#666;font-size:13px;">Gửi lúc: ${new Date().toLocaleString('vi-VN')}</p>
        `),
      })
    } catch (error) {
      console.error('❌ Error in sendTestEmail:', error)
      return false
    }
  }

  // ─── Welcome Email ───
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const settings = await getSettings('email')
    if (!settings.welcomeEmailEnabled) return false

    return this.sendEmail({
      to: userEmail,
      subject: '🎉 Chào mừng bạn đến với WebModSkin!',
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">Xin chào ${userName}! 🎉</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>WebModSkin</strong>. Chúng tôi rất vui được chào đón bạn!</p>
        ${infoBox(`
          <p style="margin-top:0;"><strong>Bạn có thể làm gì tiếp theo?</strong></p>
          <ul style="margin-bottom:0;">
            <li>🎨 Khám phá kho skin đa dạng</li>
            <li>📦 Tải về và cài đặt skin yêu thích</li>
            <li>⭐ Đánh giá và chia sẻ trải nghiệm</li>
            <li>🔑 Mua license key để trải nghiệm đầy đủ</li>
          </ul>
        `)}
        ${btn('/', 'Khám Phá Ngay')}
        <p>Nếu có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ đội ngũ hỗ trợ của chúng tôi.</p>
        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── Password Reset Email ───
  async sendPasswordResetEmail(userEmail: string, resetToken: string, baseUrl: string): Promise<boolean> {
    const settings = await getSettings('email')
    if (!settings.passwordResetEnabled) return false

    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

    return this.sendEmail({
      to: userEmail,
      subject: '🔐 Yêu cầu đặt lại mật khẩu - WebModSkin',
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">🔐 Đặt lại mật khẩu</h2>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tiếp tục:</p>
        ${btn(resetUrl, 'Đặt Lại Mật Khẩu')}
        <p>Nếu nút không hoạt động, sao chép link sau vào trình duyệt:</p>
        <p style="background:#f5f5f5;padding:10px;border-radius:4px;word-break:break-all;font-size:13px;">${resetUrl}</p>
        ${infoBox(`
          <p style="margin-top:0;"><strong>⚠️ Lưu ý bảo mật:</strong></p>
          <ul style="margin-bottom:0;">
            <li>Link này sẽ hết hạn sau <strong>1 giờ</strong></li>
            <li>Nếu bạn không yêu cầu đặt lại, hãy bỏ qua email này</li>
            <li>Không chia sẻ link này với bất kỳ ai</li>
          </ul>
        `, '#f59e0b', '#fef3cd')}
        <p>Trân trọng,<br><strong>Đội ngũ Bảo mật WebModSkin</strong></p>
      `),
    })
  }

  // ─── Order Confirmation Email ───
  async sendOrderConfirmationEmail(
    userEmail: string,
    userName: string,
    orderNumber: string,
    planName: string,
    amount: number,
    currency: string,
    qrUrl?: string
  ): Promise<boolean> {
    const settings = await getSettings('email')
    if (settings.orderConfirmationEnabled === false) return false

    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount)

    return this.sendEmail({
      to: userEmail,
      subject: `📦 Xác nhận đơn hàng #${orderNumber} - WebModSkin`,
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">📦 Xác nhận đơn hàng</h2>
        <p>Xin chào <strong>${userName}</strong>, đơn hàng của bạn đã được tạo thành công!</p>
        
        ${infoBox(`
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Mã đơn:</td><td style="padding:6px 0;font-weight:600;">#${orderNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Gói dịch vụ:</td><td style="padding:6px 0;font-weight:600;">${planName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Số tiền:</td><td style="padding:6px 0;font-weight:600;color:#6366f1;">${formattedAmount} ${currency}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Trạng thái:</td><td style="padding:6px 0;"><span style="background:#fef3cd;color:#92400e;padding:2px 10px;border-radius:12px;font-size:13px;">Chờ thanh toán</span></td></tr>
          </table>
        `)}

        ${qrUrl ? `
          <div style="text-align:center;margin:24px 0;">
            <p style="font-weight:600;margin-bottom:12px;">Quét mã QR để thanh toán:</p>
            <img src="${qrUrl}" alt="QR thanh toán" style="max-width:280px;border-radius:8px;border:1px solid #e4e4e7;" />
          </div>
        ` : ''}

        ${infoBox(`
          <p style="margin:0;"><strong>⏰ Lưu ý:</strong> Đơn hàng sẽ tự động hủy sau <strong>30 phút</strong> nếu chưa thanh toán. Vui lòng ghi đúng nội dung chuyển khoản: <strong>${orderNumber}</strong></p>
        `, '#f59e0b', '#fef3cd')}

        <p>Sau khi thanh toán thành công, bạn sẽ nhận được license key qua email.</p>
        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── Payment Success + License Key Email ───
  async sendPaymentSuccessEmail(
    userEmail: string,
    userName: string,
    orderNumber: string,
    planName: string,
    amount: number,
    currency: string,
    licenseKey: string,
    expiresAt?: Date | null
  ): Promise<boolean> {
    const settings = await getSettings('email')
    if (settings.paymentSuccessEnabled === false) return false

    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount)
    const expiresStr = expiresAt
      ? new Date(expiresAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Vĩnh viễn'

    return this.sendEmail({
      to: userEmail,
      subject: `✅ Thanh toán thành công #${orderNumber} - WebModSkin`,
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">✅ Thanh toán thành công!</h2>
        <p>Xin chào <strong>${userName}</strong>, thanh toán của bạn đã được xác nhận.</p>
        
        ${infoBox(`
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Mã đơn:</td><td style="padding:6px 0;font-weight:600;">#${orderNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Gói dịch vụ:</td><td style="padding:6px 0;font-weight:600;">${planName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Số tiền:</td><td style="padding:6px 0;font-weight:600;color:#10b981;">${formattedAmount} ${currency}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Trạng thái:</td><td style="padding:6px 0;"><span style="background:#dcfce7;color:#166534;padding:2px 10px;border-radius:12px;font-size:13px;">Đã thanh toán</span></td></tr>
          </table>
        `, '#10b981', '#f0fdf4')}

        <div style="background:#1e1b4b;padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
          <p style="color:#a5b4fc;margin:0 0 8px 0;font-size:13px;">LICENSE KEY CỦA BẠN</p>
          <p style="color:#fff;font-size:20px;font-weight:700;margin:0;letter-spacing:2px;font-family:monospace;">${licenseKey}</p>
          <p style="color:#a5b4fc;margin:8px 0 0 0;font-size:12px;">Hết hạn: ${expiresStr}</p>
        </div>

        ${infoBox(`
          <p style="margin-top:0;"><strong>📋 Hướng dẫn sử dụng:</strong></p>
          <ol style="margin-bottom:0;padding-left:20px;">
            <li>Tải phần mềm Mod Skin từ website</li>
            <li>Mở phần mềm và chọn "Nhập Key"</li>
            <li>Dán license key ở trên vào ô nhập</li>
            <li>Nhấn "Kích hoạt" và bắt đầu sử dụng!</li>
          </ol>
        `, '#6366f1', '#eef2ff')}

        <p style="color:#666;font-size:13px;">⚠️ Mỗi key chỉ dùng trên số thiết bị giới hạn theo gói. Không chia sẻ key cho người khác.</p>
        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── Review Reply Notification ───
  async sendReviewReplyNotification(
    reviewerEmail: string,
    reviewerName: string,
    replierName: string,
    replierRole: string,
    replyContent: string,
    productName?: string
  ): Promise<boolean> {
    const settings = await getSettings('email')
    if (!settings.reviewNotificationEnabled) return false

    const roleBadge = replierRole === 'ADMIN'
      ? '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;">Admin</span>'
      : replierRole === 'STAFF'
        ? '<span style="background:#3b82f6;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;">Staff</span>'
        : ''

    return this.sendEmail({
      to: reviewerEmail,
      subject: `💬 ${replierName} đã trả lời đánh giá của bạn - WebModSkin`,
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">💬 Có phản hồi mới cho đánh giá của bạn</h2>
        <p>Xin chào <strong>${reviewerName}</strong>,</p>
        <p><strong>${replierName}</strong> ${roleBadge} đã trả lời đánh giá của bạn${productName ? ` về <strong>${productName}</strong>` : ''}:</p>
        
        ${infoBox(`
          <p style="margin:0;font-style:italic;color:#374151;">"${replyContent}"</p>
        `, '#8b5cf6', '#f5f3ff')}

        ${btn('/', 'Xem Đánh Giá')}
        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── Review Status Notification ───
  async sendReviewNotification(userEmail: string, productName: string, status: 'approved' | 'rejected', feedback?: string): Promise<boolean> {
    const settings = await getSettings('email')
    if (!settings.reviewNotificationEnabled) return false

    const isApproved = status === 'approved'
    const statusColor = isApproved ? '#10b981' : '#ef4444'
    const statusIcon = isApproved ? '✅' : '❌'
    const statusText = isApproved ? 'Đã duyệt' : 'Bị từ chối'

    return this.sendEmail({
      to: userEmail,
      subject: `${statusIcon} Đánh giá của bạn đã ${statusText.toLowerCase()} - WebModSkin`,
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">${statusIcon} Đánh giá ${statusText}</h2>
        <p>Đánh giá của bạn cho <strong>${productName}</strong> đã được ${statusText.toLowerCase()}.</p>
        
        ${infoBox(`
          <h3 style="margin-top:0;">Trạng thái: ${statusText}</h3>
          ${feedback ? `<p><strong>Phản hồi:</strong> ${feedback}</p>` : ''}
        `, statusColor, isApproved ? '#f0fdf4' : '#fef2f2')}
        
        ${isApproved 
          ? '<p>Đánh giá của bạn hiện đã hiển thị công khai. Cảm ơn bạn đã đóng góp!</p>'
          : '<p>Bạn có thể chỉnh sửa và gửi lại đánh giá nếu muốn.</p>'
        }
        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── Contact Form Email (to admin) ───
  async sendContactFormEmail(
    senderName: string,
    senderEmail: string,
    subject: string,
    type: string,
    message: string
  ): Promise<boolean> {
    const settings = await getSettings('email')
    if (settings.contactFormEnabled === false) return false

    const adminEmail = settings.adminEmail || settings.fromEmail

    if (!adminEmail) {
      console.error('❌ No admin email configured for contact form')
      return false
    }

    const typeLabels: Record<string, string> = {
      support: '🛟 Hỗ trợ',
      bug: '🐛 Báo lỗi',
      feature: '💡 Đề xuất tính năng',
      business: '💼 Hợp tác kinh doanh',
    }

    return this.sendEmail({
      to: adminEmail,
      replyTo: senderEmail,
      subject: `[Contact] ${typeLabels[type] || type} - ${subject}`,
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">📩 Tin nhắn mới từ Contact Form</h2>
        
        ${infoBox(`
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;width:100px;">Người gửi:</td><td style="padding:6px 0;font-weight:600;">${senderName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Email:</td><td style="padding:6px 0;"><a href="mailto:${senderEmail}" style="color:#6366f1;">${senderEmail}</a></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Loại:</td><td style="padding:6px 0;">${typeLabels[type] || type}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Tiêu đề:</td><td style="padding:6px 0;font-weight:600;">${subject}</td></tr>
          </table>
        `)}

        <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
          <h3 style="margin-top:0;color:#374151;">Nội dung:</h3>
          <p style="margin-bottom:0;white-space:pre-wrap;color:#4b5563;">${message}</p>
        </div>

        <p style="color:#666;font-size:13px;">Trả lời email này sẽ gửi trực tiếp đến <strong>${senderEmail}</strong></p>
      `),
    })
  }

  // ─── Contact Auto-Reply Email ───
  async sendContactAutoReply(senderEmail: string, senderName: string, subject: string): Promise<boolean> {
    const settings = await getSettings('email')
    if (settings.contactFormEnabled === false) return false

    return this.sendEmail({
      to: senderEmail,
      subject: `📩 Chúng tôi đã nhận tin nhắn của bạn - WebModSkin`,
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">Cảm ơn bạn đã liên hệ!</h2>
        <p>Xin chào <strong>${senderName}</strong>,</p>
        <p>Chúng tôi đã nhận được tin nhắn của bạn với tiêu đề "<strong>${subject}</strong>" và sẽ phản hồi trong thời gian sớm nhất (thường trong vòng 24 giờ).</p>
        
        ${infoBox(`
          <p style="margin:0;">Trong lúc chờ đợi, bạn có thể:</p>
          <ul style="margin-bottom:0;">
            <li>Xem <a href="/blog" style="color:#6366f1;">blog hướng dẫn</a> của chúng tôi</li>
            <li>Tham gia cộng đồng trên Discord</li>
          </ul>
        `, '#10b981', '#f0fdf4')}

        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── Admin Notification (new order, contact, etc.) ───
  async sendAdminNotification(subject: string, content: string): Promise<boolean> {
    const settings = await getSettings('email')
    if (!settings.adminNotificationEnabled) return false

    const adminEmail = settings.adminEmail || settings.fromEmail
    if (!adminEmail) return false

    return this.sendEmail({
      to: adminEmail,
      subject: `[Admin] ${subject}`,
      html: emailLayout(content),
    })
  }

  // ─── Order Cancellation / Refund Email ───
  async sendOrderCancellationEmail(
    userEmail: string,
    userName: string,
    orderNumber: string,
    planName: string,
    reason: 'CANCELLED' | 'REFUNDED'
  ): Promise<boolean> {
    const settings = await getSettings('email')
    if (settings.orderCancellationEnabled === false) return false

    const isRefund = reason === 'REFUNDED'
    const icon = isRefund ? '💰' : '❌'
    const title = isRefund ? 'Hoàn tiền đơn hàng' : 'Hủy đơn hàng'
    const statusBadge = isRefund
      ? '<span style="background:#dbeafe;color:#1e40af;padding:2px 10px;border-radius:12px;font-size:13px;">Đã hoàn tiền</span>'
      : '<span style="background:#fef2f2;color:#991b1b;padding:2px 10px;border-radius:12px;font-size:13px;">Đã hủy</span>'

    return this.sendEmail({
      to: userEmail,
      subject: `${icon} ${title} #${orderNumber} - WebModSkin`,
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">${icon} ${title}</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Đơn hàng <strong>#${orderNumber}</strong> (${planName}) đã được ${isRefund ? 'hoàn tiền' : 'hủy'}.</p>

        ${infoBox(`
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Mã đơn:</td><td style="padding:6px 0;font-weight:600;">#${orderNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Gói:</td><td style="padding:6px 0;">${planName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Trạng thái:</td><td style="padding:6px 0;">${statusBadge}</td></tr>
          </table>
        `, isRefund ? '#3b82f6' : '#ef4444', isRefund ? '#eff6ff' : '#fef2f2')}

        ${isRefund
          ? '<p>License key liên quan đã bị thu hồi. Nếu bạn đã nhận hoàn tiền, xin kiểm tra tài khoản ngân hàng.</p>'
          : '<p>License key liên quan (nếu có) đã bị thu hồi.</p>'
        }
        <p>Nếu đây là nhầm lẫn, vui lòng liên hệ đội ngũ hỗ trợ.</p>
        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── License Status Change Email ───
  async sendLicenseStatusEmail(
    userEmail: string,
    userName: string,
    licenseKey: string,
    action: 'suspend' | 'activate' | 'revoke' | 'ban' | 'extend' | 'reset_hwid',
    details?: string
  ): Promise<boolean> {
    const settings = await getSettings('email')
    if (settings.licenseNotificationEnabled === false) return false

    const actionInfo: Record<string, { icon: string; title: string; color: string; bg: string; desc: string }> = {
      suspend: { icon: '⏸️', title: 'License bị tạm khóa', color: '#f59e0b', bg: '#fef3cd', desc: 'License key của bạn đã bị tạm khóa. Bạn sẽ không thể sử dụng cho đến khi được kích hoạt lại.' },
      activate: { icon: '✅', title: 'License đã kích hoạt', color: '#10b981', bg: '#f0fdf4', desc: 'License key của bạn đã được kích hoạt trở lại. Bạn có thể sử dụng bình thường.' },
      revoke: { icon: '🚫', title: 'License bị thu hồi', color: '#ef4444', bg: '#fef2f2', desc: 'License key của bạn đã bị thu hồi. Liên hệ hỗ trợ nếu bạn cần giúp đỡ.' },
      ban: { icon: '⛔', title: 'License bị cấm', color: '#991b1b', bg: '#fef2f2', desc: 'License key của bạn đã bị cấm vĩnh viễn do vi phạm điều khoản sử dụng.' },
      extend: { icon: '⏳', title: 'License đã gia hạn', color: '#6366f1', bg: '#eef2ff', desc: `License key của bạn đã được gia hạn thêm. ${details || ''}` },
      reset_hwid: { icon: '🔄', title: 'HWID đã được reset', color: '#3b82f6', bg: '#eff6ff', desc: 'HWID của license key đã được reset. Bạn có thể kích hoạt lại trên thiết bị mới.' },
    }

    const info = actionInfo[action]
    if (!info) return false

    const maskedKey = licenseKey.length > 8
      ? licenseKey.substring(0, 4) + '****' + licenseKey.substring(licenseKey.length - 4)
      : '****'

    return this.sendEmail({
      to: userEmail,
      subject: `${info.icon} ${info.title} - WebModSkin`,
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">${info.icon} ${info.title}</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>${info.desc}</p>

        ${infoBox(`
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">License Key:</td><td style="padding:6px 0;font-family:monospace;font-weight:600;">${maskedKey}</td></tr>
            ${details ? `<tr><td style="padding:6px 0;color:#666;">Chi tiết:</td><td style="padding:6px 0;">${details}</td></tr>` : ''}
          </table>
        `, info.color, info.bg)}

        <p>Nếu bạn có thắc mắc, vui lòng liên hệ đội ngũ hỗ trợ.</p>
        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── Password Changed Confirmation ───
  async sendPasswordChangedEmail(userEmail: string, userName: string, changedByAdmin = false): Promise<boolean> {
    const settings = await getSettings('email')
    if (settings.passwordChangedEnabled === false) return false

    return this.sendEmail({
      to: userEmail,
      subject: '🔒 Mật khẩu đã được thay đổi - WebModSkin',
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">🔒 Mật khẩu đã thay đổi</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Mật khẩu tài khoản của bạn đã được ${changedByAdmin ? 'thay đổi bởi quản trị viên' : 'đặt lại thành công'}.</p>

        ${infoBox(`
          <p style="margin:0;"><strong>⚠️ Bảo mật:</strong></p>
          <ul style="margin-bottom:0;">
            <li>Nếu bạn ${changedByAdmin ? 'không yêu cầu' : 'không thực hiện'} thay đổi này, hãy liên hệ hỗ trợ ngay</li>
            <li>Thời gian: ${new Date().toLocaleString('vi-VN')}</li>
          </ul>
        `, '#f59e0b', '#fef3cd')}

        <p>Trân trọng,<br><strong>Đội ngũ Bảo mật WebModSkin</strong></p>
      `),
    })
  }

  // ─── License Key Created (Admin assign) ───
  async sendLicenseKeyCreatedEmail(
    userEmail: string,
    userName: string,
    licenseKey: string,
    planName: string,
    expiresAt?: Date | null
  ): Promise<boolean> {
    const settings = await getSettings('email')
    if (settings.licenseNotificationEnabled === false) return false

    const expiresStr = expiresAt
      ? new Date(expiresAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Vĩnh viễn'

    return this.sendEmail({
      to: userEmail,
      subject: '🔑 Bạn đã nhận được License Key mới - WebModSkin',
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">🔑 License Key mới cho bạn!</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Quản trị viên đã cấp cho bạn một license key mới.</p>

        <div style="background:#1e1b4b;padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
          <p style="color:#a5b4fc;margin:0 0 8px 0;font-size:13px;">LICENSE KEY CỦA BẠN</p>
          <p style="color:#fff;font-size:20px;font-weight:700;margin:0;letter-spacing:2px;font-family:monospace;">${licenseKey}</p>
          <p style="color:#a5b4fc;margin:8px 0 0 0;font-size:12px;">Gói: ${planName} | Hết hạn: ${expiresStr}</p>
        </div>

        ${infoBox(`
          <p style="margin-top:0;"><strong>📋 Hướng dẫn:</strong></p>
          <ol style="margin-bottom:0;padding-left:20px;">
            <li>Tải phần mềm Mod Skin từ website</li>
            <li>Mở phần mềm và chọn "Nhập Key"</li>
            <li>Dán license key ở trên</li>
            <li>Nhấn "Kích hoạt" và sử dụng!</li>
          </ol>
        `, '#6366f1', '#eef2ff')}

        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }

  // ─── Email Verification ───
  async sendVerificationEmail(userEmail: string, userName: string, verifyToken: string, baseUrl: string): Promise<boolean> {
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${verifyToken}`

    return this.sendEmail({
      to: userEmail,
      subject: '✉️ Xác minh email của bạn - WebModSkin',
      html: emailLayout(`
        <h2 style="color:#333;margin-top:0;">✉️ Xác minh email</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>WebModSkin</strong>. Vui lòng nhấn nút bên dưới để xác minh email:</p>
        ${btn(verifyUrl, 'Xác Minh Email', '#10b981')}
        <p>Nếu nút không hoạt động, sao chép link sau vào trình duyệt:</p>
        <p style="background:#f5f5f5;padding:10px;border-radius:4px;word-break:break-all;font-size:13px;">${verifyUrl}</p>
        ${infoBox(`
          <p style="margin-top:0;"><strong>⚠️ Lưu ý:</strong></p>
          <ul style="margin-bottom:0;">
            <li>Link xác minh sẽ hết hạn sau <strong>24 giờ</strong></li>
            <li>Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này</li>
          </ul>
        `, '#f59e0b', '#fef3cd')}
        <p>Trân trọng,<br><strong>Đội ngũ WebModSkin</strong></p>
      `),
    })
  }
}

// Singleton instance
export const emailService = new EmailService()