function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(to: string, subject: string, body: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CineBlock <noreply@cineblock.in>",
      to: [to],
      subject,
      text: body,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error("Resend error: " + JSON.stringify(err));
  }
}

export const ResendOTPPasswordReset = {
  id: "resend-otp-reset",
  type: "email" as const,
  name: "ResendOTPReset",
  from: "CineBlock <onboarding@resend.dev>",
  maxAge: 60 * 15, // 15 minutes
  generateVerificationToken: generateOTP,
  async sendVerificationRequest({ identifier: email, token }: { identifier: string; token: string; expires: Date; provider: Record<string, unknown> }) {
    await sendEmail(
      email,
      "Reset your CineBlock password",
      `Your CineBlock password reset code: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, you can ignore this email.`
    );
  },
  options: {},
};

export const ResendOTPEmailVerification = {
  id: "resend-otp-verify",
  type: "email" as const,
  name: "ResendOTPVerify",
  from: "CineBlock <onboarding@resend.dev>",
  maxAge: 60 * 15, // 15 minutes
  generateVerificationToken: generateOTP,
  async sendVerificationRequest({ identifier: email, token }: { identifier: string; token: string; expires: Date; provider: Record<string, unknown> }) {
    await sendEmail(
      email,
      "Verify your CineBlock email",
      `Your CineBlock verification code: ${token}\n\nThis code expires in 15 minutes.`
    );
  },
  options: {},
};
