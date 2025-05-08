// app/services/email.ts
import nodemailer from 'nodemailer';

interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
  attachments?: any[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private defaultFrom: string;
  private isConfigured: boolean;
  
  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@baassist.com';
    this.isConfigured = false;
    
    // Проверка наличия всех необходимых параметров
    const requiredParams = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS'
    ];
    
    const missingParams = requiredParams.filter(param => !process.env[param]);
    
    if (missingParams.length > 0) {
      console.warn(`Email сервис не полностью настроен. Отсутствуют параметры: ${missingParams.join(', ')}`);
      return;
    }
    
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: parseInt(process.env.SMTP_PORT || '587') === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      this.isConfigured = true;
      console.log('[EmailService] Email сервис успешно инициализирован');
    } catch (error) {
      console.error('[EmailService] Ошибка инициализации email сервиса:', error);
    }
  }
  
  async sendEmail(params: EmailParams): Promise<boolean> {
    const { to, subject, html, from, text, attachments } = params;
    
    // В режиме разработки или при отсутствии настроек - эмулируем отправку
    // Но если EMAIL_TEST_MODE=false, то отправляем реальные письма
    if (!this.isConfigured || !this.transporter || 
        (process.env.NODE_ENV === 'development' && process.env.EMAIL_TEST_MODE !== 'false')) {
      console.log('---------------------------------------------------');
      console.log('[EmailService] 🔵 ЭМУЛЯЦИЯ ОТПРАВКИ EMAIL:');
      console.log(`[EmailService] 📤 От: ${from || this.defaultFrom}`);
      console.log(`[EmailService] 📬 Кому: ${Array.isArray(to) ? to.join(',') : to}`);
      console.log(`[EmailService] 📌 Тема: ${subject}`);
      console.log('[EmailService] 📝 Содержимое:');
      console.log(text || html.replace(/<[^>]*>?/gm, ''));
      console.log('---------------------------------------------------');
      return true;
    }
    
    // Реальная отправка в production
    try {
      const mailOptions = {
        from: from || this.defaultFrom,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
        attachments
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] Email отправлен:', info.messageId);
      return true;
    } catch (error) {
      console.error('[EmailService] Ошибка отправки email:', error);
      return false;
    }
  }
  
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    // Формируем URL для верификации, теперь с правильным путем
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Подтверждение регистрации | BA Assist',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Подтверждение регистрации</h2>
          <p>Здравствуйте!</p>
          <p>Спасибо за регистрацию в системе BA Assist. Для завершения регистрации, пожалуйста, нажмите на кнопку ниже:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Подтвердить Email</a>
          </div>
          <p>Если вы не регистрировались в системе BA Assist, просто проигнорируйте это письмо.</p>
          <p>С уважением,<br>Команда BA Assist</p>
        </div>
      `
    });
  }
  
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Сброс пароля | BA Assist',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Сброс пароля</h2>
          <p>Здравствуйте!</p>
          <p>Вы (или кто-то другой) запросили сброс пароля в системе BA Assist. Для создания нового пароля, пожалуйста, нажмите на кнопку ниже:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Сбросить пароль</a>
          </div>
          <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо - ваш пароль останется прежним.</p>
          <p>Ссылка действительна в течение 1 часа.</p>
          <p>С уважением,<br>Команда BA Assist</p>
        </div>
      `
    });
  }
  
  async sendTaskNotificationEmail(email: string, taskTitle: string, projectTitle: string, taskLink: string, priority: number): Promise<boolean> {
    // Определение текста приоритета на основе числового значения
    let priorityText = 'Средний';
    let priorityColor = '#FFA500'; // Оранжевый
    
    if (priority === 1) {
      priorityText = 'Низкий';
      priorityColor = '#28A745'; // Зеленый
    } else if (priority === 3) {
      priorityText = 'Высокий';
      priorityColor = '#DC3545'; // Красный
    }
    
    return this.sendEmail({
      to: email,
      subject: `Задача: ${taskTitle} | Проект: ${projectTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Уведомление о задаче</h2>
          <p>Здравствуйте!</p>
          <p>Вы получили уведомление о задаче в проекте <strong>${projectTitle}</strong>:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${taskTitle}</h3>
            <p><strong>Приоритет:</strong> <span style="color: ${priorityColor};">${priorityText}</span></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskLink}" style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Просмотреть задачу</a>
          </div>
          <p>С уважением,<br>Команда BA Assist</p>
        </div>
      `
    });
  }
  
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }
    
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('[EmailService] Ошибка проверки соединения с SMTP:', error);
      return false;
    }
  }
  
  async sendTestEmail(email: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Тестовое письмо от BA Assist',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Тестовое письмо</h2>
          <p>Здравствуйте!</p>
          <p>Это тестовое письмо от системы BA Assist. Если вы его получили, значит настройки email-сервиса работают корректно.</p>
          <p>С уважением,<br>Команда BA Assist</p>
        </div>
      `
    });
  }
  
  async sendProjectInvitationEmail(email: string, projectTitle: string, inviterEmail: string, invitationLink: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Приглашение в проект "${projectTitle}" | BA Assist`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Приглашение в проект</h2>
          <p>Здравствуйте!</p>
          <p>Пользователь <strong>${inviterEmail}</strong> приглашает вас присоединиться к проекту <strong>${projectTitle}</strong> в системе BA Assist.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Принять приглашение</a>
          </div>
          <p>Если у вас еще нет учетной записи, вы сможете зарегистрироваться по этой ссылке. После регистрации вы будете автоматически добавлены в проект.</p>
          <p>Если вы не желаете принимать приглашение, просто проигнорируйте это письмо.</p>
          <p>С уважением,<br>Команда BA Assist</p>
        </div>
      `
    });
  }
}

// Создаем экземпляр сервиса для использования во всем приложении
const emailService = new EmailService();

// Экспортируем экземпляр сервиса по умолчанию
export default emailService;