export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    // Rate limiting / Spam prevention (Very basic validation)
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long. Please keep it under 5000 characters.' });
    }
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_EMAIL || 'delivered@resend.dev'; // Fallback for testing if not provided

    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured.');
      return res.status(500).json({ error: 'Server configuration error. Email service is unavailable.' });
    }

    // Construct the email content
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #ff6b00; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">New Portfolio Contact</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Subject:</strong> ${subject || 'No Subject Provided'}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>IP Address:</strong> ${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'}</p>
        <p><strong>User Agent:</strong> ${req.headers['user-agent'] || 'Unknown'}</p>
        <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; white-space: pre-wrap;">
          ${message}
        </div>
      </div>
    `;

    // Make the request to Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <onboarding@resend.dev>', // onboarding@resend.dev only works for sending to the registered account email
        to: toEmail,
        subject: `New Message from ${name}: ${subject || 'Portfolio Inquiry'}`,
        html: emailHtml,
        reply_to: email
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API Error:', data);
      return res.status(500).json({ error: 'Failed to send the email. Please try again later.' });
    }

    // Success
    return res.status(200).json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Error processing contact form:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
