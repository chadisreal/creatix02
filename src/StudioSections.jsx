import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, DownloadSimpleIcon, CopyIcon, XIcon } from '@phosphor-icons/react'
import { SERVICES, wa } from './content.js'
import { useReducedMotion, useSiteMotion } from './site-motion.jsx'
import { Link } from './router.jsx'

export const DISCIPLINES = [
  { title: 'Web & mobile.', label: 'Experiences that connect', text: 'Make every interaction count. Custom websites, ecommerce experiences, and applications that put your customers first.', ids: ['web', 'app', 'uiux'], tone: 'paper' },
  { title: 'Business, connected.', label: 'Systems that make sense', text: 'Bring your teams, customers, and operations together with software built around the way you work.', ids: ['crm', 'erp', 'pos', 'hrms', 'mgmt', 'salesforce'], tone: 'lilac' },
  { title: 'Designed to be felt.', label: 'Brands with something to say', text: 'A distinct identity. A better experience. Design and storytelling that give people a reason to remember you.', ids: ['design', 'marketing', 'video'], tone: 'peach' },
  { title: 'Make room for growth.', label: 'Less repetition. More possibility.', text: 'Connect your tools, automate the repetitive work, and keep your digital business running smoothly.', ids: ['automation', 'care'], tone: 'ink' },
]

export function DisciplineStack() {
  return <div className="discipline-stack">
    {DISCIPLINES.map((item, i) => <article key={item.title} className={'discipline discipline-' + item.tone} style={{ '--order': i }}>
      <div className="discipline-top"><span>0{i + 1}</span><span>{item.label}</span><ArrowUpRightIcon size={28} /></div>
      <div className="discipline-main"><h3>{item.title}</h3><div><p>{item.text}</p><div className="discipline-links">
        {item.ids.map(id => { const s = SERVICES.find(x => x.id === id); return <Link key={id} to={'/' + s.slug}>{s.title}<ArrowUpRightIcon size={15} /></Link> })}
      </div></div></div>
    </article>)}
  </div>
}

export function ManifestoStrip() {
  return <div className="manifesto-strip" aria-label="Thoughtfully designed. Precisely engineered. Built for your business.">
    <div aria-hidden="true">{[0, 1].map(i => <span key={i}>Thoughtfully designed <b>✳</b> Precisely engineered <b>✳</b> Built for your business <b>✳</b></span>)}</div>
  </div>
}

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  return <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
}

export function MotionToggle() {
  const { reduced, toggle, systemReduced } = useSiteMotion()
  return <button type="button" className="motion-toggle" aria-pressed={reduced} onClick={toggle} disabled={systemReduced} title={systemReduced ? 'Reduced motion follows your device settings' : undefined}>Motion: {reduced ? 'off' : 'on'} <span aria-hidden="true">{reduced ? '○' : '◉'}</span></button>
}

export function Possibilities() {
  const viewport = useRef(null)
  const cards = useRef([])
  const [active, setActive] = useState(0)
  const [color, setColor] = useState('#b8a1d3')
  const reduced = useReducedMotion()
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(Number(entry.target.dataset.index)) })
    }, { root: viewport.current, threshold: .65 })
    cards.current.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [])
  const go = index => {
    const next = Math.max(0, Math.min(2, index))
    viewport.current.scrollTo({ left: cards.current[next].offsetLeft - cards.current[0].offsetLeft, behavior: reduced ? 'instant' : 'smooth' })
    setActive(next)
  }
  return <section id="possibilities" className="possibilities" aria-labelledby="possibilities-title">
    <div className="wrap possibilities-head">
      <div><p className="eyebrow eyebrow-light">The possibilities</p><h2 id="possibilities-title" className="h2">Built around<br /><span className="editorial-serif">your next chapter.</span></h2></div>
      <div><p>A glimpse of what we can create.<br />Illustrative concepts, ready for your ambition.</p><div className="rail-arrows">
        <button className="round" type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous concept"><ArrowLeftIcon size={20} /></button>
        <button className="round" type="button" onClick={() => go(active + 1)} disabled={active === 2} aria-label="Next concept"><ArrowRightIcon size={20} /></button>
        <span className="concept-count" aria-live="polite">0{active + 1} / 03</span>
      </div></div>
    </div>
    <div className="concept-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Design concepts; scroll horizontally to explore">
      <div className="concept-track">
        <article className="concept concept-commerce" data-index="0" ref={el => { cards.current[0] = el }}>
          <div className="concept-meta"><span>01 / Digital storefronts</span><span>Concept</span></div>
          <div className="concept-visual"><div className="shop-demo"><div className="demo-nav"><b>form & function</b><span>Objects for everyday.</span></div><div className="shop-heading">A little less.<br /><em>A little better.</em></div><div className="swatches" role="group" aria-label="Collection color">{[['#b8a1d3', 'Lavender'], ['#bacaaf', 'Sage'], ['#e1b399', 'Terracotta']].map(([value, name]) => <button type="button" key={value} aria-label={name + ' collection'} aria-pressed={color === value} style={{ backgroundColor: value }} onClick={() => setColor(value)} />)}</div><div className="collection-band" style={{ backgroundColor: color }}>The everyday collection <ArrowUpRightIcon size={18} /></div></div></div>
          <div className="concept-bottom"><h3>From browsing<br />to belonging.</h3><span>Ecommerce / Web development</span></div>
        </article>
        <article className="concept concept-systems" data-index="1" ref={el => { cards.current[1] = el }}>
          <div className="concept-meta"><span>02 / Connected operations</span><span>Concept</span></div>
          <div className="concept-visual"><div className="workflow-demo"><div className="demo-nav"><b>your workspace</b><span>Overview ↗</span></div><h4>Everything. In sync.</h4>{[['New inquiry', 'Captured automatically'], ['Right person', 'Assigned to your team'], ['Next step', 'A follow-up, right on time']].map(([title, text], i) => <div className="workflow-step" key={title}><span>0{i + 1}</span><div><b>{title}</b><small>{text}</small></div></div>)}</div></div>
          <div className="concept-bottom"><h3>Less busywork.<br />More momentum.</h3><span>CRM / Business automation</span></div>
        </article>
        <article className="concept concept-identity" data-index="2" ref={el => { cards.current[2] = el }}>
          <div className="concept-meta"><span>03 / Distinctive identities</span><span>Concept</span></div>
          <div className="concept-visual"><div className="identity-demo"><strong>other<em>wise.</em></strong><p>Another way to see things.</p><div className="identity-palette" aria-hidden="true"><i /><i /><i /><i /></div></div></div>
          <div className="concept-bottom"><h3>Unmistakably<br />you.</h3><span>Brand strategy / Visual identity</span></div>
        </article>
      </div>
    </div>
    <div className="concept-progress wrap" aria-hidden="true"><span style={{ width: ((active + 1) / 3 * 100) + '%' }} /></div>
  </section>
}

export function GlassStory({ onTalk }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40])
  return <section className="glass-story" ref={ref}>
    <motion.img src="/img/glass-sculpture.webp" alt="" loading="lazy" style={reduced ? undefined : { y }} />
    <div className="glass-story-pane"><p className="eyebrow eyebrow-light">Creativity, meet clarity.</p><h2 className="h2">Beautiful on the outside.<br /><span className="editorial-serif">Brilliant underneath.</span></h2><p>Design that people enjoy.<br />Technology your business can depend on.</p><button type="button" className="pill pill-white pill-lg" onClick={onTalk}>Bring us your idea <ArrowUpRightIcon size={18} /></button></div>
    <p className="glass-equation">Design <span>+</span> Engineering <span>=</span> Possibility</p>
  </section>
}

export function ProjectBrief() {
  const dialog = useRef(null)
  const [brief, setBrief] = useState('')
  const [status, setStatus] = useState('')
  const create = e => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (!data.get('message').trim()) {
      const field = e.currentTarget.elements.message
      field.setCustomValidity('Please add a few details about your project.')
      field.reportValidity()
      return
    }
    setBrief(`CREATIX INNOVATION — PROJECT BRIEF\n\nName: ${data.get('name').trim()}\nEmail: ${data.get('email').trim()}\nBusiness: ${data.get('business').trim() || 'Not specified'}\nServices: ${data.getAll('services').join(', ') || 'Let’s explore together'}\n\nPROJECT OVERVIEW\n${data.get('message').trim()}\n\nPrepared ${new Date().toLocaleDateString('en-GB')}\nThis brief has not been submitted.`)
    setStatus('')
    dialog.current.showModal()
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'creatix-project-brief.txt'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setStatus('Your brief is ready to download.')
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(brief); setStatus('Brief copied to clipboard.') }
    catch { setStatus('Clipboard access is unavailable. Download your brief instead.') }
  }
  return <div className="brief-area wrap" id="project-brief">
    <div className="brief-intro"><p className="eyebrow">Your next chapter</p><h2 className="h2">Something good<br />starts with <span className="editorial-serif">hello.</span></h2><p>An idea on a napkin.<br />A system that needs rethinking.<br />A brand ready for its next chapter.</p><p>Tell us what you have in mind.<br />Let’s give it somewhere to go.</p><span className="brief-emblem" aria-hidden="true">✳</span></div>
    <form className="brief-form" onSubmit={create}>
      <div className="brief-row"><label>Your name<input name="name" autoComplete="name" placeholder="Alex Morgan" required maxLength={100} pattern=".*\S.*" /></label><label>Email address<input name="email" type="email" autoComplete="email" placeholder="alex@company.com" required maxLength={200} /></label></div>
      <label>Business name <small>(optional)</small><input name="business" autoComplete="organization" placeholder="Your company" maxLength={150} /></label>
      <fieldset><legend>What are you thinking about?</legend><div className="brief-options">{['Web & mobile', 'Business software', 'Design & marketing', 'Automation & support'].map(service => <label key={service}><input type="checkbox" name="services" value={service} /><span>{service}</span></label>)}</div></fieldset>
      <label>A little about your project<textarea name="message" rows={4} placeholder="The idea, the challenge, the possibilities…" required maxLength={5000} onInput={e => e.currentTarget.setCustomValidity('')} /></label>
      <div className="brief-submit"><small>Your brief stays in your browser.<br />Nothing is sent until you share it.</small><button type="submit" className="pill pill-red pill-lg">Create my brief <ArrowUpRightIcon size={18} /></button></div>
    </form>
    <dialog className="brief-dialog" ref={dialog} aria-labelledby="brief-title" onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.current.close() } }}>
      <button className="sheet-close" type="button" onClick={() => dialog.current.close()} aria-label="Close project brief"><XIcon size={20} /></button><p className="eyebrow">A good place to start</p><h2 id="brief-title" className="h2">Your next chapter,<br /><span className="editorial-serif">on paper.</span></h2><p>Your brief is ready to download, copy, or share with Creatix. Nothing has been sent.</p><pre>{brief}</pre>
      <div className="brief-dialog-actions"><button type="button" className="pill pill-red" onClick={download}>Download <DownloadSimpleIcon size={18} /></button><button type="button" className="pill pill-outline" onClick={copy}>Copy <CopyIcon size={18} /></button><a className="pill pill-outline" href={wa(brief)} target="_blank" rel="noreferrer">Share on WhatsApp <ArrowUpRightIcon size={18} /></a></div><p role="status">{status}</p>
    </dialog>
  </div>
}
