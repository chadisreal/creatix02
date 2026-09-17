import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { return res.status(400).json({ ok: false, message: 'Invalid request body' }) }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, message: 'Invalid request body' })

  const { name, phone, email, business, service, originService, message, company } = body

  // Honeypot: real users never see/fill this field. If it's filled, pretend success and stop.
  if (company) return res.status(200).json({ ok: true })

  // Server-side re-validation — mirrors TalkSheet's client checks but is authoritative.
  const cleanName = String(name || '').trim().slice(0, 120)
  const digits = String(phone || '').replace(/\D/g, '').slice(-10)
  const cleanEmail = String(email || '').trim().slice(0, 200)
  const cleanBusiness = String(business || '').trim().slice(0, 150)
  const cleanService = String(service || '').trim().slice(0, 100)
  const cleanOriginService = String(originService || '').trim().slice(0, 100)
  const cleanMessage = String(message || '').trim().slice(0, 2000)

  const errors = {}
  if (!cleanName) errors.name = 'Name is required.'
  if (!/^[6-9]\d{9}$/.test(digits)) errors.phone = 'Enter a valid 10 digit mobile number.'
  if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) errors.email = 'Email looks invalid.'
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, message: 'Please check the form fields.', errors })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })

  const lines = [
    `Name: ${cleanName}`,
    `Phone: ${digits}`,
    cleanEmail && `Email: ${cleanEmail}`,
    cleanBusiness && `Business: ${cleanBusiness}`,
    `Service: ${cleanService}${cleanOriginService && cleanOriginService !== cleanService ? ` (opened from: ${cleanOriginService})` : ''}`,
    cleanMessage && `Requirement: ${cleanMessage}`,
    '',
    'Sent from the "Let\'s talk" form on the Creatix Innovation website.',
  ].filter(Boolean)

  try {
    await transporter.sendMail({
      from: `"Creatix Website Leads" <${process.env.GMAIL_USER}>`,
      to: process.env.LEADS_TO_EMAIL,
      replyTo: cleanEmail || undefined,
      subject: `New lead: ${cleanName} — ${cleanService}`,
      text: lines.join('\n'),
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('send-lead: nodemailer error', err)
    return res.status(500).json({ ok: false, message: 'Could not send the message. Please try again shortly.' })
  }
}
