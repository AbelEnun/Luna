/**
 * Email OTP Delivery Service for Luna
 *
 * Supports sending real 6-digit OTP emails directly from the browser
 * using EmailJS REST API (no backend or paid Cloud Functions needed).
 * 
 * Free tier on EmailJS provides 200 free emails/month:
 * 1. Create a free account at https://www.emailjs.com
 * 2. Connect an Email Service (e.g. Gmail)
 * 3. Create an Email Template with {{otp_code}} and {{to_email}}
 * 4. Add the 3 keys to your .env file:
 *    VITE_EMAILJS_SERVICE_ID=...
 *    VITE_EMAILJS_TEMPLATE_ID=...
 *    VITE_EMAILJS_PUBLIC_KEY=...
 */

export async function sendOtpEmail(toEmail, otpCode, recipientName = "Valued Member") {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (serviceId && templateId && publicKey) {
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: toEmail,
            to_name: recipientName,
            otp_code: otpCode,
            app_name: "Luna",
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("EmailJS delivery error:", errorText);
        return { sent: false, error: errorText };
      }

      return { sent: true };
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      return { sent: false, error: err.message };
    }
  }

  // If EmailJS is not yet configured in .env, print clearly to browser console for testing
  console.log(
    `%c🔐 [Luna Email OTP] Sent to ${toEmail}: %c${otpCode}`,
    "color: #166534; font-weight: bold; background: #f0fdf4; padding: 4px 8px; border-radius: 4px;",
    "color: #1e3a8a; font-size: 16px; font-weight: 800; background: #eff6ff; padding: 4px 8px; border-radius: 4px;"
  );
  return { sent: false, sandbox: true };
}

