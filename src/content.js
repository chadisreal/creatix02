// All copy below comes from creatixinnovation.com (home, about, team, services, portfolio,
// contact, experience and the ten service landing pages), scraped 16 Sep 2026.
// Wording is kept close to the source; only trimmed for length and grammar.

export const CONTACT = {
  phone: '8854800811',
  phoneHref: 'tel:8854800811',
  whatsapp: '918854800811',
  email: 'hello@creatixinnovation.com',
  location: 'Jaipur, Rajasthan, India',
  hours: 'Mon to Sat, 10 AM to 7 PM',
}
export const wa = text => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`

export const WORKFLOW = ['Discovery', 'Design', 'Develop', 'Launch']

export const CLIENTS = ['Vantage Studio', 'Apex Global', 'Nova Systems', 'Pulse Digital', 'Lumina Media', 'Horizon Tech', 'Zenith Creative']

export const ABOUT =
  'Creatix Innovation is a full-stack IT & digital agency based in Jaipur. From crafting stunning websites and mobile apps to implementing enterprise systems like ERP, CRM and HRMS, we cover the entire spectrum of digital needs.'

export const NUMBERS = [
  { value: 10, suffix: '+', label: 'Years of digital innovation' },
  { value: 150, suffix: '+', label: 'Projects delivered' },
  { value: 99, suffix: '%', label: 'Client satisfaction' },
  { value: 24, suffix: '/7', label: 'Dedicated support' },
]

export const TIMELINE = [
  { year: '2015', text: 'Founded in Jaipur' },
  { year: '2019', text: 'Enterprise solutions' },
  { year: '2021', text: 'Global expansion' },
  { year: '2023', text: 'AI & RPA integration' },
]

export const VALUES = [
  { title: 'Innovation', text: 'We constantly push boundaries to create unique and forward-thinking solutions.' },
  { title: 'Excellence', text: 'We are committed to the highest standards of quality in everything we do.' },
  { title: 'Integrity', text: 'We build trust through transparency, honesty, and ethical business practices.' },
]

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'build', label: 'Web & Apps' },
  { id: 'systems', label: 'Business Systems' },
  { id: 'growth', label: 'Growth & Creative' },
  { id: 'care', label: 'Digital Care' },
]

// slug is the page URL (/slug). tone: photo | dark | light. Sizes per filter live in SERVICE_LAYOUT so every grid fills its rows.
export const SERVICES = [
  {
    id: 'web', slug: 'website-development', cat: 'build', tone: 'photo', img: '/img/web-ui.jpg', title: 'Website Development',
    short: 'Custom, responsive and high-performance websites and web apps, built to turn visitors into customers.',
    points: ['Bespoke websites and modern web apps', 'Lightning-fast, responsive layouts', 'SEO-friendly structure', 'Ecommerce with payment integration', 'Connects with WhatsApp, CRM, email and payment gateways', 'Conversion-focused landing pages'],
  },
  {
    id: 'crm', slug: 'crm-solutions', cat: 'systems', tone: 'photo', img: '/img/automate.jpg', title: 'CRM Solutions & Integration',
    short: 'Track every customer, automate WhatsApp and email follow-ups, and stop losing valuable leads.',
    points: ['Leads from Facebook Ads, Google Ads, website forms and WhatsApp in one inbox', 'Automatic WhatsApp and SMS greeting within 10 seconds', 'Visual pipeline from New Inquiry to Payment Received', 'Owner dashboard on mobile', 'Automated reminders and task alerts for staff', 'Secure access and multi-branch control'],
    industries: ['Retailers & Wholesalers', 'Real Estate & Property Consultants', 'Coaching Institutes & Academies', 'Service Agencies & Freelancers', 'Manufacturers & Suppliers', 'Financial & Insurance Agents'],
  },
  {
    id: 'erp', slug: 'erp-solutions', cat: 'systems', tone: 'dark', title: 'ERP Solutions',
    short: 'Unify inventory, stock, GST billing, purchasing and staff management in one easy cloud system.',
    points: ['Barcode auto stock management with low-stock alerts', '1-click GST invoices sent on WhatsApp', 'All shops, godowns and offices on one dashboard', 'Supplier purchase and payment tracker', 'Automated profit & loss statements', 'Role-based staff access and mobile app'],
    industries: ['Wholesale Distributors & Stockists', 'Hardware & Electronics Stores', 'Textile & Garment Manufacturers', 'FMCG & Grocery Suppliers', 'Auto Spare Parts Dealers', 'Chemical & Industrial Suppliers'],
  },
  {
    id: 'pos', slug: 'pos-billing-software', cat: 'systems', tone: 'light', title: 'POS Billing Software',
    short: 'Superfast billing for retail and restaurants, with UPI and card payments and WhatsApp bills.',
    points: ['Barcode scan billing in under 2 seconds', 'Works offline and syncs when the internet returns', 'Integrated UPI QR and card payments', 'Paperless WhatsApp invoices and loyalty', 'Batch and expiry date alerts', 'Runs on your Windows PC, laptop or Android'],
    industries: ['Supermarkets & Grocery Stores', 'Fashion & Garment Boutiques', 'Restaurants, Cafes & Food Joints', 'Medical & Pharmacy Stores', 'Bakeries & Sweet Shops', 'Footwear & Accessory Stores'],
  },
  {
    id: 'hrms', slug: 'hrms-software', cat: 'systems', tone: 'light', title: 'HRMS System',
    short: 'Complete Human Resource Management Systems to streamline your workforce.',
    points: ['Workforce administration in one place', 'Built around your HR processes', 'Staff access by role'],
  },
  {
    id: 'mgmt', slug: 'custom-management-software', cat: 'systems', tone: 'light', title: 'Custom Management Software',
    short: 'Replace messy paperwork and registers with software built around your exact business process.',
    points: ['Tailor-made workflows, forms and approvals', 'Task assignment with photo and GPS verification', 'One-time ownership, zero monthly per-user fees', 'PDF quotations and work orders in 30 seconds', 'Searchable records with cloud backup', 'Step-by-step prompts so new staff work from day one'],
    industries: ['Educational Institutions & Schools', 'Hospitality & Event Management', 'Service Centers & Repair Shops', 'Construction & Contracting Firms', 'Transport & Logistics Agencies', 'Healthcare Clinics & Labs'],
  },
  {
    id: 'salesforce', slug: 'salesforce-development', cat: 'systems', tone: 'light', title: 'Salesforce Development',
    short: 'Custom Apex code, Lightning Web Components and API integrations tailored for high ROI.',
    points: ['Salesforce implementation and configuration', 'Custom Apex development', 'Lightning Web Components (LWC)', 'Flow automation', 'ERP and API integrations'],
  },
  {
    id: 'automation', slug: 'business-automation', cat: 'growth', tone: 'dark', title: 'Business Automation & Digital Growth',
    short: 'Automate lead intake, customer communication and operational workflows.',
    points: ['Workflow and task automation', 'Automatic lead collection and routing', 'WhatsApp bots and communication workflows', 'Marketing automation', 'Custom API integrations', 'AI chat integrations'],
  },
  {
    id: 'app', slug: 'app-development', cat: 'build', tone: 'light', title: 'App Development',
    short: 'Native and cross-platform mobile apps for Android and iOS.',
    points: ['Android and iOS apps with native performance', 'Cross-platform builds in Flutter or React Native', 'Custom backend APIs', 'Connects with payments, CRM and your databases', 'Play Store publishing support'],
  },
  {
    id: 'uiux', slug: 'ui-ux-design', cat: 'build', tone: 'light', title: 'UI / UX Design',
    short: 'User-centered design that ensures a seamless and engaging experience.',
    points: ['Interface design', 'User experience planning', 'Prototypes', 'Clear navigation and usable interactions'],
  },
  {
    id: 'marketing', slug: 'digital-marketing', cat: 'growth', tone: 'light', title: 'Digital Marketing',
    short: 'SEO, PPC, social media marketing and content strategy to grow your brand online.',
    points: ['Search engine optimization', 'Pay-per-click advertising', 'Social media marketing', 'Content strategy', 'Digital campaigns and ad creatives'],
  },
  {
    id: 'design', slug: 'graphic-design-branding', cat: 'growth', tone: 'light', title: 'Graphic Design & Brand Identity',
    short: 'Striking logos, high-converting display ad banners, brochures and brand graphics.',
    points: ['Logo design', 'Brand identity and style guides', 'Google display ad banners', 'Corporate brochures', 'Rebranding packages'],
  },
  {
    id: 'video', slug: 'video-editing-motion-graphics', cat: 'growth', tone: 'dark', title: 'Video Editing & Motion Graphics',
    short: 'Professional editing, 3D motion graphics, VFX and social media reels for your ad campaigns.',
    points: ['Professional video editing', '3D motion graphics', 'Sound and visual effects', 'Commercial and ad videos', 'Social media reels'],
  },
  {
    id: 'care', slug: 'website-maintenance', cat: 'care', tone: 'dark', title: 'Complete Digital Care',
    short: 'Continuous maintenance, 24/7 monitoring, security patches, performance tuning and content updates.',
    points: ['Proactive 24/7 server monitoring', 'Security updates and patches', 'Performance tuning', 'Content updates', 'Technical troubleshooting and maintenance'],
  },
]

// s = 1x1, w = 2x1, xl = 2x2, full = 4x1. Each filter's spans add up to whole rows of 4.
export const SERVICE_LAYOUT = {
  all: { web: 'xl', crm: 'xl', erp: 'w', pos: 's', hrms: 's', mgmt: 's', salesforce: 's', automation: 'w', app: 's', uiux: 's', marketing: 's', design: 's', video: 'w', care: 'w' },
  build: { web: 'w', app: 's', uiux: 's' },
  systems: { crm: 'w', erp: 'w', pos: 's', hrms: 's', mgmt: 's', salesforce: 's' },
  growth: { automation: 'w', video: 'w', marketing: 'w', design: 'w' },
  care: { care: 'full' },
}

export const PROCESS = [
  { title: 'First, we listen.', text: 'Your business, your challenges, your ambition. We start with a free consultation, understand your workflow, and find the problem worth solving.' },
  { title: 'Then, we make it tangible.', text: 'Ideas become interfaces, workflows, and a tailored prototype. Together, we shape what the right solution looks like.' },
  { title: 'We build the details.', text: 'Thoughtful development, connected APIs and databases, and careful testing. This is where the vision starts doing real work.' },
  { title: 'Launch is a beginning.', text: 'We help you get up and running, train your team, and support the next stage of your digital business.' },
]

export const CASES = [
  { client: 'Rajesh Trading Co.', place: 'Jaipur', service: 'CRM', before: 'Losing 40% of leads due to delayed phone callbacks.', after: 'Lead response dropped from 3 hours to 15 seconds. Sales grew by 240% in 90 days.', from: '3 hrs', to: '15 sec', metric: 'Lead response time' },
  { client: 'Vikas Enterprises', place: 'Wholesaler', service: 'ERP', before: 'Inventory leaks worth ₹85,000 every month due to paper billing.', after: 'Zero stock discrepancies in 6 months, and ₹1.2 lakh saved in accountant overheads.', from: '₹85K', to: '₹0', metric: 'Monthly inventory leaks' },
  { client: 'Green Grocery Superstore', place: 'Retail', service: 'POS', before: 'Checkout queues averaged 12 minutes per customer during evening hours.', after: 'Billing time down to 45 seconds per customer. Daily turnover up by 35%.', from: '12 min', to: '45 sec', metric: 'Checkout per customer' },
  { client: 'Apex Security & Facility Services', place: 'Field staff', service: 'Custom app', before: 'Field guard attendance was verified manually on paper registers.', after: 'A custom attendance and task app with selfie GPS verification reduced no-shows by 95%.', from: 'Paper', to: '95%', metric: 'Fewer guard no-shows' },
]

export const IMPACT = [
  { value: 20, prefix: '', suffix: '+ hrs', label: 'Weekly time saved' },
  { value: 300, prefix: '', suffix: '%', label: 'Faster response rate' },
  { value: 40, prefix: '₹', suffix: 'K+', label: 'Monthly expense saved' },
  { value: 99.9, prefix: '', suffix: '%', label: 'System uptime' },
]

export const TEAM = [
  { name: 'Tanu Gulwani', role: 'CEO & Founder', img: '/img/team-tanu.jpg', text: 'Visionary leader driving Creatix towards global excellence with strategic insight.' },
  { name: 'Amit Sir', role: 'Chief Operating Officer', img: '/img/team-amit.jpg', text: 'Ensuring operational efficiency and seamless delivery of all client projects.' },
  { name: 'Ashish Sir', role: 'Lead UI/UX Designer', img: '/img/team-ashish.jpg', text: 'Crafting intuitive and beautiful digital experiences that users love.' },
]

export const TESTIMONIALS = [
  { quote: 'Creatix Innovation completely revamped our corporate website and web app. Our organic lead conversion jumped by 140% in just two months!', name: 'Sarah Jenkins', role: 'VP of Product, Vantage Global', img: '/img/client-sarah.jpg' },
  { quote: 'Their CRM integration and automated workflow engines eliminated over 25 hours of repetitive manual data entry every single week.', name: 'David Chen', role: 'Co-Founder, Apex Technologies', img: '/img/client-david.jpg' },
  { quote: 'Exceptional design sensibility, rock-solid security, and top-tier communication. Creatix is the gold standard of agency partners.', name: 'Elena Rostova', role: 'Director of Marketing, Lumina', img: '/img/client-elena.jpg' },
]

export const FAQ = [
  { q: 'Can you build around our existing tools?', a: 'Yes. We connect websites, CRM, payment gateways, databases, and other business tools. We’ll explore your current setup and the integrations your project needs.' },
  { q: 'What if we only need help with one part?', a: 'We can focus on a website, brand identity, application, or workflow. You don’t have to take on a complete digital overhaul.' },
  { q: 'Do I or my staff need technical knowledge to use the software?', a: 'Not at all. Our software is designed to be as simple as using WhatsApp, and we provide live training for your staff.' },
  { q: 'How long does it take for full live deployment?', a: 'Most custom projects are fully configured, tested and deployed live within 3 to 7 business days.' },
  { q: 'Is my business data completely safe and confidential?', a: 'Yes. Your data is stored on secure, encrypted cloud servers with zero access given to unauthorized persons.' },
  { q: 'Are there any hidden charges or surprise costs later?', a: 'No. We believe in complete pricing transparency. All costs are clear upfront with zero hidden fees.' },
  { q: 'How can I schedule a live demo or phone call?', a: 'Fill out the form, or call or WhatsApp us directly at 8854800811 for an instant live demo.' },
  { q: 'Do you help after launch?', a: 'Yes. Digital care services cover maintenance, updates, troubleshooting, and ongoing improvements. We’ll agree on the support your project requires.' },
]

export const INQUIRY_SERVICES = ['Web Development', 'Complete Digital Care', 'CRM Solutions & Integration', 'Automated Business Systems', 'Other Consultation']
