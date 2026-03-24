#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');
const OUTPUT_FILE = path.join(__dirname, 'index.html');
const IMAGES_DIR = path.join(__dirname, 'images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

// ─── Data helpers ─────────────────────────────────────────────────────────────

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Portfolio HTML Generator ─────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isVideo(path) { return path && /\.(mp4|webm|ogg|mov)$/i.test(path); }

// Returns a full element string for image, video, or gradient
// fit=true: image renders as <img> with natural proportions (no cropping)
function mediaEl(image, gradient, baseClass, fit) {
  if (image) {
    if (isVideo(image)) {
      const vStyle = fit
        ? 'width:100%;height:auto;display:block;border-radius:inherit;'
        : 'width:100%;height:100%;object-fit:cover;display:block;';
      return `<div class="${baseClass}"><video autoplay muted loop playsinline src="${esc(image)}" style="${vStyle}"></video></div>`;
    }
    if (fit) {
      return `<div class="${baseClass}"><img src="${esc(image)}" alt="" style="width:100%;height:auto;display:block;border-radius:inherit;" /></div>`;
    }
    return `<div class="${baseClass}" style="background-image:url('${esc(image)}');background-size:cover;background-position:center;"></div>`;
  }
  return `<div class="${baseClass} ${esc(gradient)}"></div>`;
}

// Legacy helper kept for hover image (images only, no video)
function bgAttr(image, gradient, baseClass) {
  if (image) return `class="${baseClass}" style="background-image:url('${esc(image)}');background-size:cover;background-position:center;"`;
  return `class="${baseClass} ${esc(gradient)}"`;
}

function nl2br(str) { return esc(str).replace(/\n/g, '<br>'); }
function renderRte(str) {
  if (!str) return '';
  if (/<[a-zA-Z]/.test(str)) return str;
  return '<p>' + nl2br(str) + '</p>';
}
function renderRteInline(str) {
  if (!str) return '';
  if (/<[a-zA-Z]/.test(str)) return str;
  return nl2br(str);
}

function generatePortfolio(data) {
  const { meta, hero, nav, footer, password, homeProjectOrder, projects } = data;

  const projectMap = {};
  projects.forEach(p => { projectMap[p.id] = p; });

  function renderHomeProjects() {
    return homeProjectOrder.map(id => {
      const p = projectMap[id];
      if (!p) return '';
      const dataImage = p.image ? ` data-image="${esc(p.image)}"` : '';
      return `
          <div class="pcard" data-gradient="${esc(p.gradient)}"${dataImage} onclick="requestProject(${p.id})">
            <div class="pcard-left">
              <div class="pcard-info">
                <div class="pcard-client">${esc(p.client)}<span class="pcard-year">${esc(p.year)}</span></div>
                <div class="pcard-title">${esc(p.title)}</div>
              </div>
            </div>
            <div class="pcard-right">${mediaEl(p.image, p.gradient, 'pcard-img')}</div>
          </div>`;
    }).join('\n');
  }

  function renderProjectPage(p) {
    const d = p.detail;
    const sections = d.sections.map(s => `
    <div class="proj-section${s.reverse ? ' reverse' : ''}${s.fullWidth ? ' full-width' : ''}">
      ${mediaEl(s.image, s.gradient, 'proj-section-img', true)}
      <div class="proj-section-body">
        <div class="proj-section-label">${esc(s.label)}</div>
        <div class="proj-section-title">${esc(s.title)}</div>
        <div class="proj-section-text">${renderRte(s.text)}</div>
      </div>
    </div>`).join('\n');

    const metaItems = d.meta.map(m => `
        <div class="meta-item"><div class="meta-label">${esc(m.label)}</div><div class="meta-val">${esc(m.value)}</div></div>`).join('');

    const impactItems = d.impact.map(i => `
      <div class="impact-item">
        <div class="impact-num">${esc(i.num)}</div>
        <div class="impact-desc">${esc(i.desc)}</div>
      </div>`).join('');

    const didItems = d.whatIDid.map(item => `<li>${renderRteInline(item)}</li>`).join('\n        ');
    const learnedParas = d.whatILearned.map(lp => renderRte(lp)).join('\n        ');

    const next = d.nextProject;
    const nextHtml = next ? `
    <div class="next-proj" onclick="showProject(${next.id})">
      <div><div class="next-label">${esc(next.label)}</div><div class="next-t">${esc(next.title)}</div></div>
      <div class="next-arr"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
    </div>` : '';

    return `
<!-- ── Project ${p.id}: ${esc(p.title)} ── -->
<div class="page" id="project-${p.id}">
  <div class="proj-page">
    <button class="back-btn" onclick="showPage('home')">
      <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      Back to work
    </button>

    <div class="proj-header">
      <span class="proj-tag">${esc(d.headerTag)}</span>
      <h1 class="proj-title">${esc(d.title)}</h1>
      <div class="proj-meta">${metaItems}
      </div>
    </div>

    ${mediaEl(d.heroImage, d.heroGradient, 'proj-hero')}

    <div class="proj-outcome">
      <div class="proj-outcome-label">Outcome</div>
      <div class="proj-outcome-text">${renderRte(d.outcome)}</div>
    </div>

    <div class="proj-impact">${impactItems}
    </div>

    ${sections}

    <div class="proj-did">
      <div class="proj-did-label">What I did</div>
      <ul class="proj-did-list">
        ${didItems}
      </ul>
    </div>

    <div class="proj-learned">
      <div class="proj-learned-label">What I learned</div>
      <div class="proj-learned-content">
        ${learnedParas}
      </div>
    </div>
    ${nextHtml}
  </div>
</div>`;
  }

  const navLinks = nav.links.map(l =>
    `<a href="${esc(l.url)}">${esc(l.label)}</a>`
  ).join('\n    ');

  const allProjectPages = projects.map(renderProjectPage).join('\n');

  // Build per-project hover data for JS
  const hoverDataJS = projects.map(p => {
    const img = p.image ? `'${p.image.replace(/'/g, "\\'")}'` : 'null';
    return `${p.id}: { gradient: '${p.gradient}', image: ${img} }`;
  }).join(', ');

  // Build per-project next-project data for JS (skip hidden projects)
  const homeSet = new Set(homeProjectOrder);
  const nextDataJS = projects.map(p => {
    const np = p.detail.nextProject;
    if (!np || !homeSet.has(np.id)) return null;
    return `${p.id}: { id: ${np.id}, title: '${np.title.replace(/'/g, "\\'")}' }`;
  }).filter(Boolean).join(', ');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0e0e0e;
    --border: #2a2a2a;
    --text: #f0ede8;
    --muted: #666660;
    --card-bg: #1a1a1a;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: Inter, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    overflow-x: hidden;
    cursor: none;
  }

  .cursor {
    width: 8px; height: 8px;
    background: var(--text); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9999;
    transform: translate(-50%, -50%);
    transition: width 0.15s, height 0.15s;
  }
  .cursor-ring {
    width: 36px; height: 36px;
    border: 1px solid rgba(240,237,232,0.25); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9998;
    transform: translate(-50%, -50%);
  }

  .pw-overlay {
    position: fixed; inset: 0; z-index: 500;
    display: flex; align-items: center; justify-content: center;
    background: rgba(14,14,14,0.85);
    backdrop-filter: blur(20px);
    opacity: 0; pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .pw-overlay.visible { opacity: 1; pointer-events: all; }
  .pw-box {
    width: 440px; background: #111; padding: 56px 48px;
    position: relative;
    transform: translateY(12px); transition: transform 0.3s ease;
  }
  .pw-overlay.visible .pw-box { transform: translateY(0); }
  .pw-close {
    position: absolute; top: 20px; right: 20px;
    background: none; border: none; color: #666;
    font-size: 18px; cursor: none; transition: color 0.2s;
  }
  .pw-close:hover { color: #fff; }
  .pw-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #555; margin-bottom: 20px; display: block; font-family: Inter; }
  .pw-title { font-size: 26px; font-weight: 500; color: #fff; margin-bottom: 8px; }
  .pw-sub { color: #555; font-size: 12px; margin-bottom: 32px; line-height: 1.7; }
  .pw-input-wrap { position: relative; margin-bottom: 10px; }
  .pw-input {
    width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a;
    color: #fff; font-family: Inter; font-size: 13px;
    padding: 15px 48px 15px 18px; outline: none; transition: border-color 0.25s; cursor: none;
  }
  .pw-input:focus { border-color: #444; }
  .pw-input.error { border-color: #7a2a2a; animation: shake 0.3s ease; }
  .pw-toggle {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #555; cursor: none;
    display: flex; align-items: center; transition: color 0.2s;
  }
  .pw-toggle:hover { color: #fff; }
  .pw-toggle svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.5; }
  .pw-error { font-size: 11px; color: #7a2a2a; height: 16px; margin-bottom: 12px; font-family: Inter; }
  .pw-btn {
    width: 100%; background: #fff; border: none; color: #111;
    font-family: Inter; font-weight: 500; font-size: 11px;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 17px; cursor: none; transition: background 0.2s;
  }
  .pw-btn:hover { background: #e0e0e0; }
  .pw-hint { margin-top: 18px; font-size: 11px; color: #3a3a3a; font-family: Inter; }
  .pw-hint span { color: #666; }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  nav {
    position: absolute; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; justify-content: space-between; align-items: center;
    padding: 28px 32px;
  }
  .nav-logo {
    font-size: 14px; font-weight: 400; letter-spacing: 0.06em;
    color: var(--text); cursor: none;
    display: inline-flex; align-items: center;
    position: relative; height: 20px;
    min-width: 26px; transition: min-width 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .nav-logo:hover { min-width: 110px; }
  .nav-logo .logo-letter { display: inline-block; transition: opacity 0.15s ease, transform 0.15s ease; }
  .nav-logo .logo-mm { display: inline-flex; }
  .nav-logo .logo-mm .logo-letter { opacity: 1; transform: translateX(0); }
  .nav-logo .logo-full-name { display: inline-flex; position: absolute; left: 0; white-space: nowrap; }
  .nav-logo .logo-full-name .logo-letter { opacity: 0; transform: translateX(-5px); transition: opacity 0.18s ease, transform 0.18s ease; }
  .nav-logo:hover .logo-mm .logo-letter { opacity: 0; transform: translateX(4px); }
  .nav-logo:hover .logo-full-name .logo-letter { opacity: 1; transform: translateX(0); }
  .nav-social-links { display: flex; gap: 14px; }
  .nav-social-links a { font-size: 11px; font-weight: 500; color: var(--muted); text-decoration: none; cursor: none; transition: color 0.2s; }
  .nav-social-links a:hover { color: var(--text); }

  .dock {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    z-index: 200; background: var(--text); border-radius: 100px; padding: 6px 6px;
    display: flex; gap: 2px; opacity: 0; pointer-events: none;
    transition: opacity 0.35s ease, transform 0.35s ease;
    transform: translateX(-50%) translateY(12px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  }
  .dock.visible { opacity: 1; pointer-events: all; transform: translateX(-50%) translateY(0); }
  .dock-link {
    font-size: 12px; font-weight: 500; color: rgba(14,14,14,0.55);
    padding: 8px 20px; border-radius: 100px; text-decoration: none;
    cursor: none; transition: color 0.2s, background 0.2s; white-space: nowrap;
  }
  .dock-link:hover { color: #0e0e0e; }
  .dock-link.active { background: rgba(0,0,0,0.1); color: #0e0e0e; }

  .page { display: none; min-height: 100vh; }
  .page.active { display: block; }
  #home { display: block; visibility: hidden; position: fixed; pointer-events: none; width: 0; height: 0; overflow: hidden; }
  #home.active { visibility: visible; position: static; pointer-events: auto; width: auto; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

  .hero {
    flex: 1; min-height: 0; padding: 90px 32px 60px;
    display: flex; align-items: stretch; gap: 0; position: relative;
  }
  .hero-left { flex: 1; display: flex; flex-direction: column; padding-right: 48px; }
  .hero-left-top { display: flex; flex-direction: column; gap: 16px; margin-bottom: auto; }
  .hero-headline-wrap { flex: 1; display: flex; align-items: center; }
  .hero-right {
    position: absolute; right: 0; top: 0; bottom: 0; width: 1000px;
    display: flex; align-items: center; justify-content: flex-end; pointer-events: none;
  }
  .hero-date { font-size: 11px; color: var(--muted); display: flex; gap: 20px; }
  .hero-date span:first-child { color: #555550; }

  .sphere-wrap { width: 1000px; height: 1000px; position: relative; overflow: hidden; pointer-events: all; }
  .sphere-wrap canvas { display: block !important; width: 1000px !important; height: 1000px !important; position: absolute; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%); }
  .hero-headline {
    font-size: clamp(16px, 1.6vw, 24px);
    font-weight: 300; line-height: 1.4; letter-spacing: -0.01em; color: var(--text);
    width: 60%; animation: fadeUp 0.8s 0.1s ease both;
  }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  .projects { padding-top: 100px; }
  .case-studies-label { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 20px; }
  .projects-list { display: flex; flex-direction: column; }
  .pcard { display: flex; align-items: center; padding: 11px 0; cursor: none; transition: opacity 0.25s; position: relative; animation: fadeUp 0.8s ease both; }
  .pcard:nth-child(1) { animation-delay: 0.25s; }
  .pcard:nth-child(2) { animation-delay: 0.4s; }
  .pcard:nth-child(3) { animation-delay: 0.55s; }
  .pcard:nth-child(4) { animation-delay: 0.7s; }
  .pcard:nth-child(5) { animation-delay: 0.85s; }
  .pcard:hover { opacity: 0.55; }
  .pcard-left { display: flex; align-items: center; gap: 28px; flex: 1; min-width: 0; }
  .pcard-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .pcard-client { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 8px; }
  .pcard-title { font-size: clamp(15px, 1.4vw, 20px); font-weight: 500; letter-spacing: -0.02em; color: var(--text); line-height: 1; }
  .pcard-year { font-size: 11px; color: var(--muted); opacity: 0.5; }
  .pcard-right { display: none; }

  .proj-hover-img {
    position: fixed; z-index: 300; width: 525px; height: 320px;
    border-radius: 12px; overflow: hidden; pointer-events: none;
    opacity: 0; transform: scale(0.92) rotate(-1deg);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .proj-hover-img.visible { opacity: 1; transform: scale(1) rotate(0deg); }
  .proj-hover-img .pcard-img { width: 100%; height: 100%; }

  .g1 { background: radial-gradient(ellipse at 25% 35%, #162840 0%, #050c14 55%), linear-gradient(160deg,#0a1520,#060606); }
  .g2 { background: radial-gradient(ellipse at 75% 55%, #1e1030 0%, #060308 55%), linear-gradient(160deg,#120820,#060606); }
  .g3 { background: radial-gradient(ellipse at 35% 65%, #0c1e10 0%, #040804 55%), linear-gradient(160deg,#081408,#060606); }
  .g4 { background: radial-gradient(ellipse at 65% 25%, #1e1c0a 0%, #080803 55%), linear-gradient(160deg,#141200,#060606); }
  .g5 { background: radial-gradient(ellipse at 50% 50%, #150808 0%, #040404 70%); }
  .g6 { background: radial-gradient(ellipse at 60% 40%, #0a1a2e 0%, #050a10 55%), linear-gradient(160deg,#061018,#020608); }

  .site-footer { display: none; }
  .hero-footer { position: absolute; bottom: 32px; right: 32px; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; z-index: 10; }
  .hero-footer-copy { font-size: 11px; color: var(--muted); font-family: Inter; }
  .hero-footer a { font-size: 11px; color: var(--muted); text-decoration: none; cursor: none; transition: color 0.2s; font-family: Inter; }
  .hero-footer a:hover { color: var(--text); }

  .proj-page { padding: 120px 32px 80px; max-width: 1100px; margin: 0 auto; }
  .back-btn {
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); cursor: none; transition: color 0.2s; margin-bottom: 64px;
    font-family: Inter; border: none; background: none; padding: 0;
  }
  .back-btn:hover { color: var(--text); }
  .back-btn svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; }
  .proj-header { margin-bottom: 64px; }
  .proj-tag { font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 16px; display: block; }
  .proj-title { font-size: clamp(44px, 5.5vw, 80px); font-weight: 500; line-height: 0.92; letter-spacing: -0.03em; margin-bottom: 40px; }
  .proj-meta { display: flex; gap: 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .meta-item { flex: 1; padding: 18px 0; border-right: 1px solid var(--border); padding-right: 24px; margin-right: 24px; }
  .meta-item:last-child { border-right: none; }
  .meta-label { font-size: 10px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
  .meta-val { font-size: 13px; font-weight: 500; }
  .proj-hero { width: 100%; aspect-ratio: 16/7; margin: 64px 0; border-radius: 12px; overflow: hidden; }
  .proj-outcome { display: grid; grid-template-columns: 1fr 2fr; gap: 64px; padding: 64px 0; margin-bottom: 64px; }
  .proj-outcome-label { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding-top: 6px; }
  .proj-outcome-text { font-size: clamp(18px, 2vw, 24px); font-weight: 400; line-height: 1.6; color: var(--text); }
  .proj-impact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-bottom: 64px; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .impact-item { padding: 36px 32px; border-right: 1px solid var(--border); }
  .impact-item:last-child { border-right: none; }
  .impact-num { font-size: 40px; font-weight: 300; letter-spacing: -0.03em; line-height: 1; margin-bottom: 8px; }
  .impact-desc { font-size: 12px; color: var(--muted); line-height: 1.6; }
  .proj-section { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; padding: 64px 0; align-items: center; }
  .proj-section.reverse { direction: rtl; }
  .proj-section.reverse > * { direction: ltr; }
  .proj-section.full-width { grid-template-columns: 1fr; gap: 28px; }
  .proj-section-img { border-radius: 12px; overflow: hidden; }
  .proj-section-label { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
  .proj-section-title { font-size: 22px; font-weight: 500; letter-spacing: -0.02em; margin-bottom: 16px; }
  .proj-section-text { font-size: 16px; color: var(--muted); line-height: 1.9; }
  .proj-section-text p { margin-bottom: 8px; } .proj-section-text p:last-child { margin-bottom: 0; }
  .proj-section-text ul, .proj-section-text ol { padding-left: 20px; margin: 8px 0; }
  .proj-outcome-text p { margin-bottom: 12px; } .proj-outcome-text p:last-child { margin-bottom: 0; }
  .proj-outcome-text ul, .proj-outcome-text ol { padding-left: 20px; margin: 8px 0; }
  .proj-learned-content ul, .proj-learned-content ol { padding-left: 20px; margin: 8px 0; }
  .proj-did { padding: 64px 0; margin-bottom: 0; display: grid; grid-template-columns: 1fr 2fr; gap: 64px; }
  .proj-did-label { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding-top: 4px; }
  .proj-did-list { list-style: none; }
  .proj-did-list li { padding: 16px 0; border-bottom: 1px solid var(--border); font-size: 16px; color: var(--text); line-height: 1.7; display: grid; grid-template-columns: 20px 1fr; gap: 16px; align-items: start; }
  .proj-did-list li:last-child { border-bottom: none; }
  .proj-did-list li::before { content: '→'; color: var(--muted); font-size: 12px; margin-top: 1px; }
  .proj-learned { padding: 64px 0; margin-bottom: 64px; display: grid; grid-template-columns: 1fr 2fr; gap: 64px; }
  .proj-learned-label { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding-top: 4px; }
  .proj-learned-content p { font-size: 15px; color: var(--text); line-height: 1.9; margin-bottom: 16px; }
  .proj-learned-content p:last-child { margin-bottom: 0; }
  .next-proj { border-top: 1px solid var(--border); padding: 44px 0 0; display: flex; justify-content: space-between; align-items: center; cursor: none; transition: opacity 0.25s; }
  .next-proj:hover { opacity: 0.55; }
  .next-label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
  .next-t { font-size: 26px; font-weight: 500; letter-spacing: -0.02em; }
  .next-arr { width: 48px; height: 48px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; transition: background 0.2s, border-color 0.2s; }
  .next-proj:hover .next-arr { background: var(--text); border-color: var(--text); }
  .next-arr svg { width: 16px; height: 16px; fill: none; stroke: var(--text); stroke-width: 2; transition: stroke 0.2s; }
  .next-proj:hover .next-arr svg { stroke: var(--bg); }

  @media (max-width: 768px) {
    .cursor, .cursor-ring { display: none; }
    body { cursor: auto; }
    a, button, [onclick] { cursor: pointer; }
    nav { padding: 20px; }
    .dock { bottom: 20px; }
    .dock-link { padding: 8px 14px; font-size: 11px; }
    #home.active { height: auto; overflow: visible; }
    .hero { flex: none; padding: 100px 20px 72px; flex-direction: column; align-items: flex-start; gap: 0; }
    .hero-left { gap: 72px; padding-right: 0; }
    .hero-right { order: -1; position: relative; width: 100%; height: 260px; display: flex !important; align-items: center; justify-content: center; pointer-events: all; }
    .sphere-wrap { width: 260px !important; height: 260px !important; }
    .sphere-wrap canvas { width: 260px !important; height: 260px !important; }
    .hero-headline { font-size: clamp(18px, 5vw, 28px); width: 100%; }
    .projects { padding: 0; }
    .pcard:hover { opacity: 1; }
    .pcard-right { display: block; flex: 0 0 120px; height: 80px; border-radius: 12px; overflow: hidden; }
    .pcard-right .pcard-img { width: 100%; height: 100%; }
    .pcard-title { font-size: 14px; }
    .pw-box { width: calc(100vw - 32px); padding: 40px 28px; }
    .hero-footer { bottom: 20px; right: 20px; }
    .proj-page { padding: 90px 20px 60px; }
    .proj-title { font-size: clamp(36px, 10vw, 56px); }
    .proj-meta { flex-wrap: wrap; }
    .meta-item { flex: 1 1 40%; border-right: none; padding-right: 0; margin-right: 0; border-bottom: 1px solid var(--border); padding-bottom: 14px; margin-bottom: 14px; }
    .proj-hero { aspect-ratio: 16/9; margin: 40px 0; }
    .proj-outcome { grid-template-columns: 1fr; gap: 20px; padding: 40px 0; margin-bottom: 40px; }
    .proj-impact { grid-template-columns: 1fr; border-radius: 16px; margin-bottom: 40px; }
    .impact-item { border-right: none; border-bottom: 1px solid var(--border); }
    .impact-item:last-child { border-bottom: none; }
    .proj-section { grid-template-columns: 1fr; gap: 28px; padding: 0; }
    .proj-section.reverse { direction: ltr; }
    .proj-did { grid-template-columns: 1fr; gap: 20px; padding: 40px 0; }
    .proj-learned { grid-template-columns: 1fr; gap: 20px; padding: 40px 0; margin-bottom: 40px; }
    .back-btn { margin-bottom: 40px; }
  }

  @media (max-width: 480px) {
    .hero-headline { font-size: clamp(16px, 5vw, 22px); }
    .proj-title { font-size: clamp(30px, 12vw, 44px); }
  }
${data.customCSS ? '\n/* Custom CSS */\n' + data.customCSS + '\n' : ''}
</style>
</head>
<body>

<div class="cursor" id="cursor"></div>
<div class="cursor-ring" id="cursorRing"></div>

<nav id="nav">
  <span class="nav-logo" onclick="showPage('home')">
    <span class="logo-mm">
      <span class="logo-letter" style="transition-delay:0.08s">M</span><span class="logo-letter" style="transition-delay:0.04s">M</span>
    </span>
    <span class="logo-full-name" style="position:absolute;">
      <span class="logo-letter" style="transition-delay:0.00s">M</span><span class="logo-letter" style="transition-delay:0.03s">a</span><span class="logo-letter" style="transition-delay:0.06s">t</span><span class="logo-letter" style="transition-delay:0.09s">t</span><span class="logo-letter" style="transition-delay:0.12s">e</span><span class="logo-letter" style="transition-delay:0.15s">o</span><span class="logo-letter" style="transition-delay:0.18s">&nbsp;</span><span class="logo-letter" style="transition-delay:0.21s">M</span><span class="logo-letter" style="transition-delay:0.24s">a</span><span class="logo-letter" style="transition-delay:0.27s">r</span><span class="logo-letter" style="transition-delay:0.30s">t</span><span class="logo-letter" style="transition-delay:0.33s">i</span><span class="logo-letter" style="transition-delay:0.36s">n</span>
    </span>
  </span>
  <div class="nav-social-links">
    ${navLinks}
  </div>
</nav>

<div class="dock" id="dock"></div>

<!-- HOME -->
<div class="page active" id="home">
  <section class="hero">
    <div class="hero-left">
      <div class="hero-headline-wrap">
        <h1 class="hero-headline">${nl2br(hero.tagline)}</h1>
      </div>
      <section class="projects" id="projects-section">
        <div class="case-studies-label">Case studies</div>
        <div class="projects-list">
${renderHomeProjects()}
        </div>
      </section>
    </div>
    <div class="hero-right">
      <div class="sphere-wrap" id="sphereWrap"></div>
    </div>
    <div class="hero-footer">
      <span class="hero-footer-copy">${esc(footer.copyright)}</span>
      <a href="mailto:${esc(footer.email)}">${esc(footer.email)}</a>
      ${footer.phone ? `<a href="tel:${esc(footer.phone)}">${esc(footer.phone)}</a>` : ''}
    </div>
  </section>
</div>

<!-- PROJECT PAGES -->
${allProjectPages}

<div class="proj-hover-img" id="projHoverImg">
  <div class="pcard-img" id="projHoverImgInner"></div>
</div>

<!-- Password Modal -->
<div class="pw-overlay" id="pwOverlay">
  <div class="pw-box">
    <button class="pw-close" id="pwClose">&#x2715;</button>
    <span class="pw-label">Protected Content</span>
    <h2 class="pw-title">Case Study Access</h2>
    <p class="pw-sub">This project is password protected. Enter the access code to view the full case study.</p>
    <div class="pw-input-wrap">
      <input class="pw-input" id="pwInput" type="password" placeholder="Enter password" autocomplete="off" />
      <button class="pw-toggle" id="pwToggle" tabindex="-1">
        <svg id="eyeIcon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
    </div>
    <div class="pw-error" id="pwError"></div>
    <button class="pw-btn" id="pwSubmit">Unlock Project</button>
  </div>
</div>

<script>
(function() {
  var PASSWORD = '${password.replace(/'/g, "\\'")}';
  var unlocked = sessionStorage.getItem('portfolio_unlocked') === 'true';
  var pendingProject = null;

  // Per-project hover data (gradient fallback + optional image)
  var projectHoverData = { ${hoverDataJS} };
  var projectNextData = { ${nextDataJS} };

  function showPage(id) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    var el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          el.style.transition = 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
          el.style.opacity = '';
          el.style.transform = '';
          setTimeout(function() { el.style.transition = ''; }, 550);
        });
      });
    }
    window.scrollTo(0, 0);
    var dock = document.getElementById('dock');
    if (dock) {
      var onProj = id !== 'home';
      dock.classList.toggle('visible', onProj);
      if (onProj) {
        var pid = parseInt(id.replace('project-', ''));
        var np = projectNextData[pid];
        var arrow = '<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2.5" fill="none" style="display:inline-block;vertical-align:middle;margin-left:5px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
        dock.innerHTML = '<a class="dock-link" href="#" onclick="showPage(&quot;home&quot;);return false;">Home</a>'
          + (np ? '<a class="dock-link" href="#" onclick="showProject('+np.id+');return false;">Next'+arrow+'</a>' : '');
      }
    }
    if (typeof window._resumeSphere === 'function') window._resumeSphere(id === 'home');
  }

  function openModal(n) {
    pendingProject = n;
    document.getElementById('pwInput').value = '';
    document.getElementById('pwError').textContent = '';
    document.getElementById('pwInput').classList.remove('error');
    document.getElementById('pwOverlay').classList.add('visible');
    setTimeout(function() { document.getElementById('pwInput').focus(); }, 300);
  }

  function closeModal() { document.getElementById('pwOverlay').classList.remove('visible'); }

  function requestProject(n) {
    if (unlocked) { showPage('project-' + n); }
    else { openModal(n); }
  }

  function showProject(n) { requestProject(n); }

  function scrollToProjects() {
    setTimeout(function() {
      var el = document.getElementById('projects-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function attemptUnlock() {
    if (document.getElementById('pwInput').value === PASSWORD) {
      unlocked = true;
      sessionStorage.setItem('portfolio_unlocked', 'true');
      var target = pendingProject;
      closeModal();
      showPage('project-' + target);
    } else {
      var inp = document.getElementById('pwInput');
      inp.classList.add('error');
      document.getElementById('pwError').textContent = 'Incorrect password. Please try again.';
      inp.value = '';
      setTimeout(function() { inp.classList.remove('error'); }, 400);
    }
  }

  window.showPage = showPage;
  window.requestProject = requestProject;
  window.showProject = showProject;
  window.scrollToProjects = scrollToProjects;

  document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('pwSubmit').addEventListener('click', attemptUnlock);
    document.getElementById('pwInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') attemptUnlock(); });
    document.getElementById('pwClose').addEventListener('click', closeModal);
    document.getElementById('pwOverlay').addEventListener('click', function(e) { if (e.target === document.getElementById('pwOverlay')) closeModal(); });

    var showPw = false;
    document.getElementById('pwToggle').addEventListener('click', function() {
      showPw = !showPw;
      document.getElementById('pwInput').type = showPw ? 'text' : 'password';
      document.getElementById('eyeIcon').innerHTML = showPw
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    });

    var cursor = document.getElementById('cursor');
    var ring = document.getElementById('cursorRing');
    if (cursor && ring) {
      var rx = 0, ry = 0, mx = 0, my = 0;
      document.addEventListener('mousemove', function(e) {
        mx = e.clientX; my = e.clientY;
        cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
      });
      (function anim() {
        rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
        requestAnimationFrame(anim);
      })();
      document.querySelectorAll('[onclick], a, button').forEach(function(el) {
        el.addEventListener('mouseenter', function() { cursor.style.width = '14px'; cursor.style.height = '14px'; ring.style.width = '52px'; ring.style.height = '52px'; });
        el.addEventListener('mouseleave', function() { cursor.style.width = '8px'; cursor.style.height = '8px'; ring.style.width = '36px'; ring.style.height = '36px'; });
      });
    }

    var hoverImg = document.getElementById('projHoverImg');
    var hoverImgInner = document.getElementById('projHoverImgInner');
    var hoverX = 0, hoverY = 0, targetX = 0, targetY = 0;
    (function animateHover() {
      hoverX += (targetX - hoverX) * 0.1; hoverY += (targetY - hoverY) * 0.1;
      hoverImg.style.left = hoverX + 'px'; hoverImg.style.top = hoverY + 'px';
      requestAnimationFrame(animateHover);
    })();

    document.querySelectorAll('.pcard[data-gradient]').forEach(function(card) {
      var left = card.querySelector('.pcard-left');
      if (!left) return;
      var projId = parseInt(card.getAttribute('onclick').match(/\\d+/)[0]);
      var hd = projectHoverData[projId] || {};
      left.addEventListener('mouseenter', function() {
        if (hd.image) {
          hoverImgInner.className = 'pcard-img';
          hoverImgInner.style.backgroundImage = "url('" + hd.image + "')";
          hoverImgInner.style.backgroundSize = 'cover';
          hoverImgInner.style.backgroundPosition = 'center';
        } else {
          hoverImgInner.className = 'pcard-img ' + (hd.gradient || card.getAttribute('data-gradient'));
          hoverImgInner.style.backgroundImage = '';
        }
        hoverImg.classList.add('visible');
      });
      left.addEventListener('mouseleave', function() { hoverImg.classList.remove('visible'); });
    });

    document.addEventListener('mousemove', function(e) { targetX = e.clientX + 200; targetY = e.clientY - 300; });

  });
})();
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function() {
  var wrap = document.getElementById('sphereWrap');
  if (!wrap) return;
  var W = wrap.offsetWidth || 1000, H = wrap.offsetHeight || 1000;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
  camera.position.z = 5.5;
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);

  var DOT_COUNT = 1600;
  var positions = new Float32Array(DOT_COUNT * 3);
  var originalPositions = new Float32Array(DOT_COUNT * 3);
  var velocities = new Float32Array(DOT_COUNT * 3);
  var SHAPES = ['sphere', 'cube', 'octahedron', 'tetrahedron', 'torus', 'icosahedron', 'dodecahedron', 'mobius'];
  var shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

  function geoToPts(geo, count) {
    var arr = geo.attributes.position.array, result = [];
    for (var i = 0; i < arr.length; i += 3) result.push(new THREE.Vector3(arr[i], arr[i+1], arr[i+2]));
    while (result.length < count) result.push(result[result.length - 1].clone());
    return result.slice(0, count);
  }

  function getPolyhedronFaces(verts, indices) {
    var faces = [];
    for (var i = 0; i < indices.length; i += 3)
      faces.push([new THREE.Vector3().fromArray(verts, indices[i]*3), new THREE.Vector3().fromArray(verts, indices[i+1]*3), new THREE.Vector3().fromArray(verts, indices[i+2]*3)]);
    return faces;
  }

  function distributeEvenlyOnFaces(faces, count) {
    var dotsPerFace = count / faces.length;
    var n = Math.max(1, Math.round((-3 + Math.sqrt(9 + 8 * dotsPerFace)) / 2));
    var pts = [];
    faces.forEach(function(f) {
      for (var i = 0; i <= n; i++) for (var j = 0; j <= n - i; j++) {
        var u = i / n, v = j / n;
        pts.push(new THREE.Vector3(f[0].x+u*(f[1].x-f[0].x)+v*(f[2].x-f[0].x), f[0].y+u*(f[1].y-f[0].y)+v*(f[2].y-f[0].y), f[0].z+u*(f[1].z-f[0].z)+v*(f[2].z-f[0].z)));
      }
    });
    while (pts.length < count) pts.push(pts[pts.length - 1].clone());
    return pts.slice(0, count);
  }

  var R = 1.15;
  function buildShapePts(s) {
    var pts;
    if (s === 'sphere') {
      pts = [];
      for (var i = 0; i < DOT_COUNT; i++) { var phi = Math.acos(1 - 2*(i+0.5)/DOT_COUNT); var theta = Math.PI*(1+Math.sqrt(5))*i; pts.push(new THREE.Vector3(R*Math.sin(phi)*Math.cos(theta), R*Math.sin(phi)*Math.sin(theta), R*Math.cos(phi))); }
    } else if (s === 'cube') {
      var h = R/Math.sqrt(3); var cv = [-h,-h,-h,h,-h,-h,h,h,-h,-h,h,-h,-h,-h,h,h,-h,h,h,h,h,-h,h,h]; var ci = [0,1,2,0,2,3,4,6,5,4,7,6,0,5,1,0,4,5,2,6,3,3,6,7,0,7,4,0,3,7,1,5,6,1,6,2]; pts = distributeEvenlyOnFaces(getPolyhedronFaces(cv, ci), DOT_COUNT);
    } else if (s === 'octahedron') {
      var r = R; var ov = [r,0,0,-r,0,0,0,r,0,0,-r,0,0,0,r,0,0,-r]; var oi = [0,2,4,0,4,3,0,3,5,0,5,2,1,4,2,1,3,4,1,5,3,1,2,5]; pts = distributeEvenlyOnFaces(getPolyhedronFaces(ov, oi), DOT_COUNT);
    } else if (s === 'tetrahedron') {
      var t = R/Math.sqrt(3); var tv = [t,t,t,t,-t,-t,-t,t,-t,-t,-t,t]; var ti = [0,1,2,0,2,3,0,3,1,1,3,2]; pts = distributeEvenlyOnFaces(getPolyhedronFaces(tv, ti), DOT_COUNT);
    } else if (s === 'torus') {
      pts = geoToPts(new THREE.TorusGeometry(0.76, 0.38, 32, 50), DOT_COUNT);
    } else if (s === 'icosahedron') {
      pts = geoToPts(new THREE.IcosahedronGeometry(R * 0.92, 3), DOT_COUNT);
    } else if (s === 'dodecahedron') {
      pts = geoToPts(new THREE.DodecahedronGeometry(R * 0.88, 2), DOT_COUNT);
    } else {
      pts = [];
      var uN = 80, vN = 20, RM = 0.86, w = 0.44;
      for (var ui = 0; ui < uN; ui++) {
        for (var vi = 0; vi < vN; vi++) {
          var u = (ui / uN) * Math.PI * 2, v = -w + (vi / (vN - 1)) * 2 * w;
          pts.push(new THREE.Vector3((RM + v * Math.cos(u / 2)) * Math.cos(u), (RM + v * Math.cos(u / 2)) * Math.sin(u), v * Math.sin(u / 2)));
        }
      }
    }
    return pts;
  }

  var pts = buildShapePts(shape);
  for (var i = 0; i < DOT_COUNT; i++) { positions[i*3]=pts[i].x; positions[i*3+1]=pts[i].y; positions[i*3+2]=pts[i].z; originalPositions[i*3]=pts[i].x; originalPositions[i*3+1]=pts[i].y; originalPositions[i*3+2]=pts[i].z; }

  // Morph system
  var morphStart = new Float32Array(DOT_COUNT * 3);
  var morphTarget = new Float32Array(DOT_COUNT * 3);
  var morphT = 1.0;
  var shapeIdx = SHAPES.indexOf(shape);

  function startMorph(newShape) {
    morphStart.set(originalPositions);
    var npts = buildShapePts(newShape);
    for (var i = 0; i < DOT_COUNT; i++) { morphTarget[i*3]=npts[i].x; morphTarget[i*3+1]=npts[i].y; morphTarget[i*3+2]=npts[i].z; }
    morphT = 0;
    shape = newShape;
  }

  // Tap to cycle shapes on mobile
  var tapStartX, tapStartY;
  wrap.addEventListener('touchstart', function(e) { tapStartX = e.touches[0].clientX; tapStartY = e.touches[0].clientY; }, { passive: true });
  wrap.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - tapStartX, dy = e.changedTouches[0].clientY - tapStartY;
    if (Math.sqrt(dx*dx+dy*dy) < 10) { shapeIdx = (shapeIdx + 1) % SHAPES.length; startMorph(SHAPES[shapeIdx]); }
  }, { passive: true });

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var material = new THREE.PointsMaterial({ color: 0xf0ede8, size: 0.018, sizeAttenuation: true, transparent: true, opacity: 0.75 });
  var points = new THREE.Points(geometry, material);
  scene.add(points);

  var mouse3D = new THREE.Vector3(), mouse3DTarget = new THREE.Vector3(), mouseMoved = false;
  var mouseNDC = new THREE.Vector2(0, 0), mouseNDCTarget = new THREE.Vector2(0, 0);

  function handlePointer(clientX, clientY) {
    var rect = wrap.getBoundingClientRect(); var cW = rect.width, cH = rect.height;
    mouseNDCTarget.x = ((clientX-rect.left)/cW)*2-1; mouseNDCTarget.y = -((clientY-rect.top)/cH)*2+1;
    var vec = new THREE.Vector3(mouseNDCTarget.x, mouseNDCTarget.y, 0.5); vec.unproject(camera);
    var dir = vec.sub(camera.position).normalize(); var dist = -camera.position.z/dir.z;
    var newPos = new THREE.Vector3().copy(camera.position).addScaledVector(dir, dist);
    if (!mouseMoved) { mouse3D.copy(newPos); mouse3DTarget.copy(newPos); mouseNDC.copy(mouseNDCTarget); mouseMoved = true; }
    else { mouse3DTarget.copy(newPos); }
  }

  document.addEventListener('mousemove', function(e) { handlePointer(e.clientX, e.clientY); });
  wrap.addEventListener('touchstart', function(e) { e.preventDefault(); handlePointer(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  wrap.addEventListener('touchmove',  function(e) { e.preventDefault(); handlePointer(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });

  var DISTURB_RADIUS=1.6, DISTURB_STRENGTH=15, RETURN_SPEED=0.055, VELOCITY_DAMP=0.82, autoRotY=0, sphereRunning=true;

  function animateSphere() {
    if (!sphereRunning) return;
    requestAnimationFrame(animateSphere);
    autoRotY += 0.003; points.rotation.y = autoRotY;
    points.rotation.x += (mouseNDC.y*0.25 - points.rotation.x)*0.05;
    mouse3D.lerp(mouse3DTarget, 0.12); mouseNDC.x += (mouseNDCTarget.x-mouseNDC.x)*0.08; mouseNDC.y += (mouseNDCTarget.y-mouseNDC.y)*0.08;
    if (morphT < 1) {
      morphT = Math.min(1, morphT + 0.018);
      var ease = morphT < 0.5 ? 2*morphT*morphT : -1+(4-2*morphT)*morphT;
      for (var k = 0; k < DOT_COUNT * 3; k++) originalPositions[k] = morphStart[k] + (morphTarget[k] - morphStart[k]) * ease;
      if (morphT >= 1) morphStart.set(originalPositions);
    }
    points.updateMatrixWorld();
    var pos = geometry.attributes.position.array;
    var invMatrix = new THREE.Matrix4().copy(points.matrixWorld).invert();
    var localMouse = mouse3D.clone().applyMatrix4(invMatrix);
    for (var i = 0; i < DOT_COUNT; i++) {
      var ix=i*3, iy=i*3+1, iz=i*3+2;
      if (mouseMoved) { var dx=pos[ix]-localMouse.x, dy=pos[iy]-localMouse.y, dz=pos[iz]-localMouse.z; var d=Math.sqrt(dx*dx+dy*dy+dz*dz); if (d<DISTURB_RADIUS) { var force=(1-d/DISTURB_RADIUS)*DISTURB_STRENGTH; velocities[ix]+=(dx/(d+0.001))*force; velocities[iy]+=(dy/(d+0.001))*force; velocities[iz]+=(dz/(d+0.001))*force*0.6; } }
      pos[ix]+=velocities[ix]; pos[iy]+=velocities[iy]; pos[iz]+=velocities[iz];
      pos[ix]+=(originalPositions[ix]-pos[ix])*RETURN_SPEED; pos[iy]+=(originalPositions[iy]-pos[iy])*RETURN_SPEED; pos[iz]+=(originalPositions[iz]-pos[iz])*RETURN_SPEED;
      velocities[ix]*=VELOCITY_DAMP; velocities[iy]*=VELOCITY_DAMP; velocities[iz]*=VELOCITY_DAMP;
    }
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  window._resumeSphere = function(active) {
    if (active && !sphereRunning) { sphereRunning = true; renderer.setSize(W, H); animateSphere(); }
    else if (!active) { sphereRunning = false; }
  };
  animateSphere();
})();
</script>
</body>
</html>`;

  // ── Extract CSS ──────────────────────────────────────────────────────────────
  const cssMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/);
  const css = (cssMatch ? cssMatch[1] : '').trim();

  // ── Extract JS (both inline script blocks) ──────────────────────────────────
  const jsBlocks = [];
  const scriptRe = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g;
  let sm;
  while ((sm = scriptRe.exec(fullHtml)) !== null) jsBlocks.push(sm[1].trim());
  const js = jsBlocks.join('\n\n');

  // ── Build clean HTML with external file references ───────────────────────────
  const html = fullHtml
    .replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="portfolio.css">')
    .replace(
      /<script>[\s\S]*?<\/script>\s*<script src="[^"]*three\.min\.js[^"]*"><\/script>\s*<script>[\s\S]*?<\/script>/,
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script src="portfolio.js"></script>'
    );

  return { html, css, js };
}

// ─── Admin UI HTML ────────────────────────────────────────────────────────────

function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portfolio CMS</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0e0e0e; --surface: #141414; --surface2: #1a1a1a;
    --border: #2a2a2a; --border2: #222;
    --text: #f0ede8; --muted: #666660;
    --accent-dim: rgba(240,237,232,0.08);
    --danger: #7a2a2a; --radius: 8px;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { background: var(--bg); color: var(--text); font-family: Inter, sans-serif; font-size: 13px; line-height: 1.6; }

  .layout { display: flex; height: 100vh; }
  .sidebar { width: 220px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; }
  .main { flex: 1; overflow-y: auto; }

  .sidebar-header { padding: 20px 20px 16px; border-bottom: 1px solid var(--border); }
  .sidebar-title { font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .sidebar-subtitle { font-size: 11px; color: #444; margin-top: 2px; }
  .sidebar-nav { padding: 8px 0; flex: 1; }
  .nav-section { padding: 16px 20px 6px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #444; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 20px; font-size: 12px; color: var(--muted); cursor: pointer; transition: color 0.15s, background 0.15s; }
  .nav-item:hover { color: var(--text); background: var(--accent-dim); }
  .nav-item.active { color: var(--text); background: var(--accent-dim); }
  .nav-item .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); flex-shrink: 0; }
  .nav-item.active .dot { background: var(--text); }

  .topbar { position: sticky; top: 0; z-index: 10; background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 32px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
  .topbar-title { font-size: 13px; font-weight: 500; }
  .topbar-actions { display: flex; gap: 10px; align-items: center; }

  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; transition: all 0.15s; border-radius: 4px; font-family: Inter; text-decoration: none; }
  .btn:hover { color: var(--text); border-color: #444; }
  .btn-primary { background: var(--text); color: #111; border-color: var(--text); }
  .btn-primary:hover { background: #ddd; border-color: #ddd; color: #111; }
  .btn-sm { padding: 5px 10px; font-size: 10px; }
  .btn-danger { border-color: var(--danger); color: #c05050; }
  .btn-danger:hover { background: var(--danger); color: var(--text); border-color: var(--danger); }
  .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: 1px solid var(--border); border-radius: 4px; background: transparent; color: var(--muted); cursor: pointer; transition: all 0.15s; }
  .btn-icon:hover { color: var(--text); border-color: #444; background: var(--accent-dim); }

  #toast { position: fixed; bottom: 24px; right: 24px; z-index: 1000; padding: 12px 20px; font-size: 12px; font-weight: 500; background: #1a1a1a; border: 1px solid var(--border); border-radius: 6px; color: var(--text); opacity: 0; transform: translateY(8px); transition: all 0.25s ease; pointer-events: none; }
  #toast.show { opacity: 1; transform: translateY(0); }
  #toast.success { border-color: #2a5a2a; color: #6fcf6f; }
  #toast.error { border-color: var(--danger); color: #c05050; }

  .content { padding: 32px; max-width: 900px; }
  .section { display: none; }
  .section.active { display: block; }
  .section-header { margin-bottom: 28px; }
  .section-header h2 { font-size: 20px; font-weight: 500; letter-spacing: -0.02em; margin-bottom: 4px; }
  .section-header p { font-size: 12px; color: var(--muted); }

  .field-group { margin-bottom: 24px; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .field:last-child { margin-bottom: 0; }
  label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
  input[type="text"], input[type="password"], input[type="email"], input[type="number"], textarea, select { background: var(--surface2); border: 1px solid var(--border); color: var(--text); font-family: Inter; font-size: 13px; padding: 10px 14px; outline: none; transition: border-color 0.2s; border-radius: 4px; width: 100%; }
  input:focus, textarea:focus, select:focus { border-color: #444; }
  textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
  textarea.tall { min-height: 120px; }
  textarea.xtall { min-height: 160px; }
  select { cursor: pointer; }
  .field-hint { font-size: 11px; color: #444; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
  .sub-header { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #444; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border2); }

  /* Image upload zone */
  .image-upload-zone {
    border: 1px dashed #333; border-radius: 8px; overflow: hidden;
    position: relative; cursor: pointer; transition: border-color 0.2s;
  }
  .image-upload-zone:hover { border-color: #555; }
  .image-upload-zone.has-image { border-style: solid; border-color: var(--border); }
  .image-upload-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; padding: 24px 16px; min-height: 100px;
    color: var(--muted); font-size: 12px; text-align: center;
  }
  .image-upload-empty svg { opacity: 0.4; }
  .image-upload-empty span { font-size: 11px; color: #444; }
  .image-preview { position: relative; }
  .image-preview img, .image-preview video { width: 100%; height: 140px; object-fit: cover; display: block; }
  .image-preview-wide img, .image-preview-wide video { height: 110px; }
  .image-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center; gap: 8px;
    opacity: 0; transition: opacity 0.2s;
  }
  .image-preview:hover .image-overlay { opacity: 1; }
  .upload-input { display: none; }
  .gradient-fallback { display: flex; align-items: center; gap: 10px; padding: 10px 0; }
  .gradient-fallback-label { font-size: 11px; color: var(--muted); }

  /* Gradient swatches */
  .gradient-picker { display: flex; gap: 8px; flex-wrap: wrap; }
  .gradient-swatch { width: 32px; height: 32px; border-radius: 6px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s; }
  .gradient-swatch.selected { border-color: var(--text); }
  .gradient-swatch:hover { border-color: #666; }
  .g1-swatch { background: radial-gradient(ellipse at 25% 35%, #162840, #050c14); }
  .g2-swatch { background: radial-gradient(ellipse at 75% 55%, #1e1030, #060308); }
  .g3-swatch { background: radial-gradient(ellipse at 35% 65%, #0c1e10, #040804); }
  .g4-swatch { background: radial-gradient(ellipse at 65% 25%, #1e1c0a, #080803); }
  .g5-swatch { background: radial-gradient(ellipse at 50% 50%, #150808, #040404); }
  .g6-swatch { background: radial-gradient(ellipse at 60% 40%, #0a1a2e, #050a10); }

  .link-row { display: grid; grid-template-columns: 80px 1fr 32px; gap: 10px; align-items: center; margin-bottom: 10px; }
  .list-item-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px; }
  .list-item-row textarea { flex: 1; min-height: 60px; }
  .list-item-row .rte-wrap { flex: 1; }
  .rte-wrap { border: 1px solid var(--border); border-radius: 4px; overflow: hidden; background: var(--surface2); transition: border-color 0.2s; }
  .rte-wrap:focus-within { border-color: #444; }
  .rte-toolbar { display: flex; gap: 2px; padding: 5px 8px; border-bottom: 1px solid var(--border); background: var(--surface); }
  .rte-btn { background: none; border: 1px solid transparent; border-radius: 3px; color: var(--muted); padding: 3px 8px; font-size: 12px; cursor: pointer; transition: background 0.15s, color 0.15s; font-family: Inter; line-height: 1.4; }
  .rte-btn:hover { background: var(--accent-dim); color: var(--text); }
  .rte-content { min-height: 80px; padding: 10px 14px; font-size: 13px; font-family: Inter; color: var(--text); background: transparent; outline: none; line-height: 1.6; }
  .rte-content.tall { min-height: 120px; }
  .rte-content.xtall { min-height: 160px; }
  .rte-content ul, .rte-content ol { padding-left: 20px; margin: 4px 0; }

  .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
  .tab { padding: 8px 16px; font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s; }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--text); border-bottom-color: var(--text); }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  .project-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 12px; overflow: hidden; }
  .project-item-header { display: flex; align-items: center; gap: 14px; padding: 14px 18px; cursor: pointer; transition: background 0.15s; }
  .project-item-header:hover { background: var(--accent-dim); }
  .project-num { font-size: 11px; color: #444; width: 18px; text-align: right; flex-shrink: 0; }
  .project-gradient { width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0; }
  .project-info { flex: 1; min-width: 0; }
  .project-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .project-meta-text { font-size: 11px; color: var(--muted); }
  .project-body { display: none; padding: 0 18px 18px; border-top: 1px solid var(--border); }
  .project-body.open { display: block; }
  .project-body > * { margin-top: 18px; }

  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge-visible { background: rgba(42,90,42,0.3); color: #6fcf6f; border: 1px solid #2a5a2a; }
  .badge-hidden { background: rgba(50,50,50,0.3); color: var(--muted); border: 1px solid var(--border); }

  .order-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; background: var(--surface2); }
  .order-item-name { flex: 1; font-size: 12px; }
  .order-item-client { font-size: 11px; color: var(--muted); }
  .order-controls { display: flex; gap: 4px; }
</style>
</head>
<body>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">Portfolio CMS</div>
      <div class="sidebar-subtitle">Matteo Martin</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">Global</div>
      <div class="nav-item active" onclick="showSection('hero', this)"><span class="dot"></span> Hero</div>
      <div class="nav-item" onclick="showSection('nav', this)"><span class="dot"></span> Navigation</div>
      <div class="nav-item" onclick="showSection('footer', this)"><span class="dot"></span> Footer</div>
      <div class="nav-item" onclick="showSection('access', this)"><span class="dot"></span> Access</div>
      <div class="nav-item" onclick="showSection('css', this)"><span class="dot"></span> Custom CSS</div>
      <div class="nav-section">Projects</div>
      <div class="nav-item" onclick="showSection('home-order', this)"><span class="dot"></span> Home Order</div>
      <div class="nav-item" onclick="showSection('projects', this)"><span class="dot"></span> All Projects</div>
    </nav>
  </aside>

  <div class="main">
    <div class="topbar">
      <span class="topbar-title" id="topbarTitle">Hero</span>
      <div class="topbar-actions">
        <a href="/preview" target="_blank" class="btn">Preview Portfolio</a>
        <button class="btn btn-primary" onclick="saveAll()">Save &amp; Publish</button>
      </div>
    </div>

    <div class="content">

      <!-- HERO -->
      <div class="section active" id="section-hero">
        <div class="section-header"><h2>Hero Section</h2><p>The main headline and date on the portfolio homepage.</p></div>
        <div class="field"><label>Page Title (browser tab)</label><input type="text" id="meta-title" /></div>
        <div class="field"><label>Tagline / Headline</label><textarea class="tall" id="hero-tagline"></textarea></div>
        <div class="field-row">
          <div class="field"><label>Label</label><input type="text" id="hero-lastUpdated" /></div>
          <div class="field"><label>Date Range</label><input type="text" id="hero-dateRange" /></div>
        </div>
      </div>

      <!-- NAV -->
      <div class="section" id="section-nav">
        <div class="section-header"><h2>Navigation Links</h2><p>Social/external links in the top-right nav.</p></div>
        <div id="nav-links-container"></div>
        <button class="btn btn-sm" onclick="addNavLink()" style="margin-top:4px">+ Add Link</button>
      </div>

      <!-- FOOTER -->
      <div class="section" id="section-footer">
        <div class="section-header"><h2>Footer</h2><p>Contact info and copyright at the bottom of the homepage.</p></div>
        <div class="field"><label>Copyright text</label><input type="text" id="footer-copyright" /></div>
        <div class="field-row">
          <div class="field"><label>Email</label><input type="email" id="footer-email" /></div>
          <div class="field"><label>Phone</label><input type="text" id="footer-phone" /></div>
        </div>
      </div>

      <!-- ACCESS -->
      <div class="section" id="section-access">
        <div class="section-header"><h2>Access Password</h2><p>Password required to view case study content.</p></div>
        <div class="field" style="max-width:320px">
          <label>Portfolio password</label>
          <input type="text" id="access-password" />
          <span class="field-hint">Shown as a hint in the modal.</span>
        </div>
      </div>

      <!-- CUSTOM CSS -->
      <div class="section" id="section-css">
        <div class="section-header"><h2>Custom CSS</h2><p>Add custom CSS that will be injected at the end of the portfolio stylesheet. Changes take effect when you publish.</p></div>
        <div class="field">
          <label>CSS</label>
          <textarea id="custom-css-input" spellcheck="false" style="font-family:monospace;font-size:12px;line-height:1.6;min-height:400px;resize:vertical;tab-size:2;" placeholder="/* your custom styles */"></textarea>
        </div>
      </div>

      <!-- HOME ORDER -->
      <div class="section" id="section-home-order">
        <div class="section-header"><h2>Home Page Order</h2><p>Control which projects appear on the home page and in what order.</p></div>
        <div id="home-order-container"></div>
        <hr class="divider">
        <div class="sub-header">Not shown on home page</div>
        <div id="hidden-projects-container"></div>
      </div>

      <!-- PROJECTS -->
      <div class="section" id="section-projects">
        <div class="section-header"><h2>All Projects</h2><p>Click a project to expand its editor.</p></div>
        <div id="projects-container"></div>
      </div>

    </div>
  </div>
</div>

<div id="toast"></div>

<script>
let data = null;

function rteLoad(str) {
  if (!str) return '';
  if (/<[a-zA-Z]/.test(str)) return str;
  return str.split('\\n').filter(function(l){return l.trim();}).map(function(l){
    return '<p>'+l.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</p>';
  }).join('');
}
function rte(id, val, onExpr, sz, inlineOnly) {
  var extra = inlineOnly ? '' : \`<button class="rte-btn" onmousedown="event.preventDefault();document.getElementById('\${id}').focus();document.execCommand('insertUnorderedList')">&#8226; List</button><button class="rte-btn" onmousedown="event.preventDefault();document.getElementById('\${id}').focus();document.execCommand('insertOrderedList')">1. List</button>\`;
  return \`<div class="rte-wrap"><div class="rte-toolbar"><button class="rte-btn" onmousedown="event.preventDefault();document.getElementById('\${id}').focus();document.execCommand('bold')"><b>B</b></button><button class="rte-btn" style="font-style:italic;font-weight:600" onmousedown="event.preventDefault();document.getElementById('\${id}').focus();document.execCommand('italic')">I</button>\${extra}</div><div class="rte-content \${sz||''}" id="\${id}" contenteditable="true" oninput="\${onExpr}">\${rteLoad(val)}</div></div>\`;
}

fetch('/api/data').then(r => r.json()).then(d => { data = d; renderAll(); }).catch(() => showToast('Failed to load data', 'error'));

function showSection(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  el.classList.add('active');
  const titles = { hero:'Hero Section', nav:'Navigation Links', footer:'Footer', access:'Access Password', css:'Custom CSS', 'home-order':'Home Page Order', projects:'All Projects' };
  document.getElementById('topbarTitle').textContent = titles[id] || id;
}

function renderAll() {
  if (!data) return;
  document.getElementById('meta-title').value = data.meta.title || '';
  document.getElementById('hero-tagline').value = data.hero.tagline || '';
  document.getElementById('hero-lastUpdated').value = data.hero.lastUpdated || '';
  document.getElementById('hero-dateRange').value = data.hero.dateRange || '';
  document.getElementById('footer-copyright').value = data.footer.copyright || '';
  document.getElementById('footer-email').value = data.footer.email || '';
  document.getElementById('footer-phone').value = data.footer.phone || '';
  document.getElementById('access-password').value = data.password || '';
  document.getElementById('custom-css-input').value = data.customCSS || '';
  renderNavLinks();
  renderHomeOrder();
  renderProjects();
}

// ── Nav links ──
function renderNavLinks() {
  document.getElementById('nav-links-container').innerHTML = data.nav.links.map((link, i) => \`
    <div class="link-row">
      <input type="text" value="\${esc(link.label)}" placeholder="Label" oninput="data.nav.links[\${i}].label=this.value" />
      <input type="text" value="\${esc(link.url)}" placeholder="URL" oninput="data.nav.links[\${i}].url=this.value" />
      <button class="btn-icon" onclick="removeNavLink(\${i})"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
  \`).join('');
}
function addNavLink() { data.nav.links.push({label:'',url:'#'}); renderNavLinks(); }
function removeNavLink(i) { data.nav.links.splice(i,1); renderNavLinks(); }

// ── Home order ──
function renderHomeOrder() {
  const pm = {}; data.projects.forEach(p => pm[p.id]=p);
  const homeSet = new Set(data.homeProjectOrder);
  document.getElementById('home-order-container').innerHTML = data.homeProjectOrder.map((id,idx) => {
    const p = pm[id]; if (!p) return '';
    return \`<div class="order-item">
      <div class="project-gradient \${p.gradient}-swatch"></div>
      <div class="order-item-name">\${esc(p.title)}<br><span class="order-item-client">\${esc(p.client)}</span></div>
      <div class="order-controls">
        <button class="btn-icon" onclick="moveHomeProject(\${idx},-1)" \${idx===0?'disabled':''}>↑</button>
        <button class="btn-icon" onclick="moveHomeProject(\${idx},1)" \${idx===data.homeProjectOrder.length-1?'disabled':''}>↓</button>
        <button class="btn-icon btn-danger" onclick="removeFromHome(\${id})">×</button>
      </div>
    </div>\`;
  }).join('');
  const hidden = data.projects.filter(p => !homeSet.has(p.id));
  document.getElementById('hidden-projects-container').innerHTML = hidden.length === 0
    ? '<p style="color:var(--muted);font-size:12px;">All projects are shown.</p>'
    : hidden.map(p => \`<div class="order-item">
        <div class="project-gradient \${p.gradient}-swatch"></div>
        <div class="order-item-name">\${esc(p.title)}<br><span class="order-item-client">\${esc(p.client)}</span></div>
        <div class="order-controls"><button class="btn btn-sm" onclick="addToHome(\${p.id})">+ Add to home</button></div>
      </div>\`).join('');
}
function moveHomeProject(idx,dir) { const a=data.homeProjectOrder,ni=idx+dir; if(ni<0||ni>=a.length)return; [a[idx],a[ni]]=[a[ni],a[idx]]; renderHomeOrder(); }
function removeFromHome(id) { data.homeProjectOrder=data.homeProjectOrder.filter(x=>x!==id); renderHomeOrder(); }
function addToHome(id) { data.homeProjectOrder.push(id); renderHomeOrder(); }

// ── Image upload ──
function isVideoPath(p) { return p && /\.(mp4|webm|ogg|mov)$/i.test(p); }

function imageUploadZone(currentPath, onUpload, onClear, aspectClass) {
  const inputId = 'fi-' + Math.random().toString(36).slice(2);
  const accept = 'image/*,video/mp4,video/webm,video/ogg,video/quicktime';
  if (currentPath) {
    const media = isVideoPath(currentPath)
      ? \`<video src="/\${esc(currentPath)}" muted autoplay loop playsinline style="width:100%;height:100%;object-fit:cover;display:block;"></video>\`
      : \`<img src="/\${esc(currentPath)}" alt="" />\`;
    return \`
      <div class="image-upload-zone has-image">
        <div class="image-preview \${aspectClass||''}">
          \${media}
          <div class="image-overlay">
            <button class="btn btn-sm" onclick="document.getElementById('\${inputId}').click()">Replace</button>
            <button class="btn btn-sm btn-danger" onclick="(\${onClear})()">Remove</button>
          </div>
        </div>
        <input type="file" accept="\${accept}" class="upload-input" id="\${inputId}" onchange="\${onUpload}(this)" />
      </div>\`;
  }
  return \`
    <div class="image-upload-zone" onclick="document.getElementById('\${inputId}').click()">
      <div class="image-upload-empty">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <div>Click to upload image or video</div>
        <span>JPG, PNG, WEBP, MP4, WEBM</span>
      </div>
      <input type="file" accept="\${accept}" class="upload-input" id="\${inputId}" onchange="\${onUpload}(this)" />
    </div>\`;
}

async function uploadFile(file, callback) {
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result.split(',')[1];
    const ext = file.name.split('.').pop();
    const filename = 'img-' + Date.now() + '.' + ext;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data: base64 })
      });
      const json = await res.json();
      if (json.path) { callback(json.path); showToast('Uploaded', 'success'); }
      else showToast('Upload failed', 'error');
    } catch(e) { showToast('Upload error', 'error'); }
  };
  reader.readAsDataURL(file);
}

// ── Projects ──
const gradients = ['g1','g2','g3','g4','g5','g6'];

function renderProjects() {
  document.getElementById('projects-container').innerHTML = data.projects.map((p, pi) => renderProjectCard(p, pi)).join('');
}

function renderProjectCard(p, pi) {
  const d = p.detail;

  // Gradient swatches

  // Image zones
  const cardImgZone = imageUploadZone(
    p.image,
    \`(function(inp){ if(inp.files&&inp.files[0]) uploadFile(inp.files[0], function(path){ data.projects[\${pi}].image=path; renderProjects(); reopenProject(\${pi}); }); })\`,
    \`function(){ data.projects[\${pi}].image=null; renderProjects(); reopenProject(\${pi}); }\`
  );

  const heroImgZone = imageUploadZone(
    d.heroImage,
    \`(function(inp){ if(inp.files&&inp.files[0]) uploadFile(inp.files[0], function(path){ data.projects[\${pi}].detail.heroImage=path; renderProjects(); reopenProject(\${pi},'content'); }); })\`,
    \`function(){ data.projects[\${pi}].detail.heroImage=null; renderProjects(); reopenProject(\${pi},'content'); }\`,
    'image-preview-wide'
  );

  const sectionImgZones = d.sections.map((s, si) => imageUploadZone(
    s.image,
    \`(function(inp){ if(inp.files&&inp.files[0]) uploadFile(inp.files[0], function(path){ data.projects[\${pi}].detail.sections[\${si}].image=path; renderProjects(); reopenProject(\${pi},'sections'); }); })\`,
    \`function(){ data.projects[\${pi}].detail.sections[\${si}].image=null; renderProjects(); reopenProject(\${pi},'sections'); }\`
  ));

  const metaRows = d.meta.map((m,mi) => \`
    <div class="field-row">
      <div class="field"><label>Label</label><input type="text" value="\${esc(m.label)}" oninput="data.projects[\${pi}].detail.meta[\${mi}].label=this.value" /></div>
      <div class="field"><label>Value</label><input type="text" value="\${esc(m.value)}" oninput="data.projects[\${pi}].detail.meta[\${mi}].value=this.value" /></div>
    </div>\`).join('');

  const impactRows = d.impact.map((imp,ii) => \`
    <div class="field-row">
      <div class="field"><label>Number</label><input type="text" value="\${esc(imp.num)}" oninput="data.projects[\${pi}].detail.impact[\${ii}].num=this.value" /></div>
      <div class="field"><label>Description</label><input type="text" value="\${esc(imp.desc)}" oninput="data.projects[\${pi}].detail.impact[\${ii}].desc=this.value" /></div>
    </div>\`).join('');

  const sectionRows = d.sections.map((s,si) => \`
    <div class="card" style="margin-bottom:12px">
      <div class="sub-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span>Section \${si+1}\${s.label ? ' — '+esc(s.label) : ''}</span>
        <div style="display:flex;align-items:center;gap:10px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);cursor:pointer;font-weight:400;letter-spacing:normal;text-transform:none">
            <input type="checkbox" \${s.reverse?'checked':''} onchange="data.projects[\${pi}].detail.sections[\${si}].reverse=this.checked;renderProjects();reopenProject(\${pi},'sections')" style="cursor:pointer"> Reverse
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);cursor:pointer;font-weight:400;letter-spacing:normal;text-transform:none">
            <input type="checkbox" \${s.fullWidth?'checked':''} onchange="data.projects[\${pi}].detail.sections[\${si}].fullWidth=this.checked;renderProjects();reopenProject(\${pi},'sections')" style="cursor:pointer"> Full width
          </label>
          \${d.sections.length > 1 ? \`<button class="btn-icon btn-danger" title="Remove section" onclick="removeSection(\${pi},\${si})">×</button>\` : ''}
        </div>
      </div>
      <div class="field-row" style="margin-bottom:16px">
        <div class="field">
          <label>Image</label>
          \${sectionImgZones[si]}
          \${!s.image ? \`<div class="gradient-fallback"><span class="gradient-fallback-label">Gradient:</span><div class="gradient-swatch \${s.gradient}-swatch" style="pointer-events:none"></div></div>\` : ''}
        </div>
        <div>
          <div class="field"><label>Label</label><input type="text" value="\${esc(s.label)}" oninput="data.projects[\${pi}].detail.sections[\${si}].label=this.value" /></div>
          <div class="field"><label>Title</label><input type="text" value="\${esc(s.title)}" oninput="data.projects[\${pi}].detail.sections[\${si}].title=this.value" /></div>
        </div>
      </div>
      <div class="field"><label>Body text</label>\${rte(\`rte-stxt-\${pi}-\${si}\`,s.text,\`data.projects[\${pi}].detail.sections[\${si}].text=this.innerHTML\`,'tall')}</div>
    </div>\`).join('');

  const didItems = d.whatIDid.map((item,ii) => \`
    <div class="list-item-row">
      \${rte(\`rte-did-\${pi}-\${ii}\`,item,\`data.projects[\${pi}].detail.whatIDid[\${ii}]=this.innerHTML\`,'',true)}
      <button class="btn-icon btn-danger" onclick="removeListItem(\${pi},'whatIDid',\${ii})">×</button>
    </div>\`).join('');

  const learnedItems = d.whatILearned.map((item,ii) => \`
    <div class="list-item-row">
      \${rte(\`rte-learned-\${pi}-\${ii}\`,item,\`data.projects[\${pi}].detail.whatILearned[\${ii}]=this.innerHTML\`,'tall')}
      <button class="btn-icon btn-danger" onclick="removeListItem(\${pi},'whatILearned',\${ii})">×</button>
    </div>\`).join('');

  const nextP = d.nextProject;

  return \`
    <div class="project-item" id="proj-card-\${pi}">
      <div class="project-item-header" onclick="toggleProject(\${pi})">
        <span class="project-num">\${pi+1}</span>
        <div class="project-gradient \${p.gradient}-swatch" \${p.image?'style="background-image:url(/'+esc(p.image)+');background-size:cover;background-position:center;"':''}></div>
        <div class="project-info">
          <div class="project-name">\${esc(p.title)}</div>
          <div class="project-meta-text">\${esc(p.client)} · \${esc(p.year)}</div>
        </div>
        <span class="badge \${data.homeProjectOrder.includes(p.id)?'badge-visible':'badge-hidden'}" onclick="event.stopPropagation()">
          \${data.homeProjectOrder.includes(p.id)?'On Home':'Hidden'}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" style="flex-shrink:0;transition:transform 0.2s" id="proj-chevron-\${pi}"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <div class="project-body" id="proj-body-\${pi}">
        <div class="tabs">
          <div class="tab active" onclick="switchTab(\${pi},'basics',this)">Basics</div>
          <div class="tab" onclick="switchTab(\${pi},'content',this)">Content</div>
          <div class="tab" onclick="switchTab(\${pi},'sections',this)">Sections</div>
          <div class="tab" onclick="switchTab(\${pi},'work',this)">Work & Learning</div>
        </div>

        <!-- BASICS -->
        <div class="tab-panel active" id="proj-tab-\${pi}-basics">
          <div class="field-row">
            <div class="field"><label>Client name</label><input type="text" value="\${esc(p.client)}" oninput="data.projects[\${pi}].client=this.value" /></div>
            <div class="field"><label>Project title</label><input type="text" value="\${esc(p.title)}" oninput="data.projects[\${pi}].title=this.value;data.projects[\${pi}].detail.title=this.value" /></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Tag / Category</label><input type="text" value="\${esc(p.tag)}" oninput="data.projects[\${pi}].tag=this.value" /></div>
            <div class="field"><label>Year</label><input type="text" value="\${esc(p.year)}" oninput="data.projects[\${pi}].year=this.value" /></div>
          </div>
          <div class="field"><label>Header tag (project page)</label><input type="text" value="\${esc(d.headerTag)}" oninput="data.projects[\${pi}].detail.headerTag=this.value" /></div>
          <hr class="divider">
          <div class="field-row">
            <div class="field">
              <label>Card &amp; Hover Image</label>
              \${cardImgZone}
              \${!p.image ? \`<div class="gradient-fallback" style="margin-top:8px"><span class="gradient-fallback-label">Gradient:</span><div class="gradient-swatch \${p.gradient}-swatch" style="pointer-events:none"></div></div>\` : \`<p style="font-size:11px;color:var(--muted);margin-top:6px">Remove image to use gradient instead.</p>\`}
            </div>
            <div></div>
          </div>
          <hr class="divider">
          <div class="sub-header">Meta strip (4 items)</div>
          \${metaRows}
        </div>

        <!-- CONTENT -->
        <div class="tab-panel" id="proj-tab-\${pi}-content">
          <div class="field-row">
            <div class="field">
              <label>Hero Image</label>
              \${heroImgZone}
              \${!d.heroImage ? \`<div class="gradient-fallback" style="margin-top:8px"><span class="gradient-fallback-label">Gradient:</span><div class="gradient-swatch \${d.heroGradient}-swatch" style="pointer-events:none"></div></div>\` : \`<p style="font-size:11px;color:var(--muted);margin-top:6px">Remove image to use gradient instead.</p>\`}
            </div>
            <div></div>
          </div>
          <hr class="divider">
          <div class="field"><label>Outcome statement</label>\${rte(\`rte-outcome-\${pi}\`,d.outcome,\`data.projects[\${pi}].detail.outcome=this.innerHTML\`,'xtall')}</div>
          <hr class="divider">
          <div class="sub-header">Impact numbers</div>
          \${impactRows}
        </div>

        <!-- SECTIONS -->
        <div class="tab-panel" id="proj-tab-\${pi}-sections">
          \${sectionRows}
          <button class="btn btn-sm" onclick="addSection(\${pi})" style="margin-top:4px">+ Add section</button>
        </div>

        <!-- WORK & LEARNING -->
        <div class="tab-panel" id="proj-tab-\${pi}-work">
          <div class="sub-header">What I did</div>
          <div id="proj-did-\${pi}">\${didItems}</div>
          <button class="btn btn-sm" onclick="addListItem(\${pi},'whatIDid')" style="margin-top:4px">+ Add item</button>
          <hr class="divider">
          <div class="sub-header">What I learned</div>
          <div id="proj-learned-\${pi}">\${learnedItems}</div>
          <button class="btn btn-sm" onclick="addListItem(\${pi},'whatILearned')" style="margin-top:4px">+ Add item</button>
          <hr class="divider">
          <div class="sub-header">Next project link</div>
          \${nextP ? \`
          <div class="field-row">
            <div class="field"><label>Label</label><input type="text" value="\${esc(nextP.label)}" oninput="data.projects[\${pi}].detail.nextProject.label=this.value" /></div>
            <div class="field"><label>Display title</label><input type="text" value="\${esc(nextP.title)}" oninput="data.projects[\${pi}].detail.nextProject.title=this.value" /></div>
          </div>
          <div class="field" style="max-width:160px"><label>Links to project ID</label><input type="number" value="\${nextP.id}" min="1" max="20" oninput="data.projects[\${pi}].detail.nextProject.id=parseInt(this.value)||1" /></div>
          \` : '<p style="color:var(--muted);font-size:12px">No next project configured.</p>'}
        </div>
      </div>
    </div>\`;
}

function setGradient(pi, g) { data.projects[pi].gradient=g; data.projects[pi].detail.heroGradient=g; renderProjects(); reopenProject(pi); }

function toggleProject(pi) {
  const body = document.getElementById('proj-body-'+pi);
  const chevron = document.getElementById('proj-chevron-'+pi);
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function reopenProject(pi, tabName) {
  const body = document.getElementById('proj-body-'+pi);
  const chevron = document.getElementById('proj-chevron-'+pi);
  if (body) { body.classList.add('open'); }
  if (chevron) chevron.style.transform = 'rotate(180deg)';
  if (tabName) {
    const card = document.getElementById('proj-card-'+pi);
    if (!card) return;
    card.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    card.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
    const tab = card.querySelector(\`.tab[onclick*="'\${tabName}'"]\`);
    const panel = document.getElementById('proj-tab-'+pi+'-'+tabName);
    if (tab) tab.classList.add('active');
    if (panel) panel.classList.add('active');
  }
}

function switchTab(pi, tabName, el) {
  const card = document.getElementById('proj-card-'+pi);
  card.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  card.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('proj-tab-'+pi+'-'+tabName).classList.add('active');
}

function removeListItem(pi, field, idx) { data.projects[pi].detail[field].splice(idx,1); renderProjects(); reopenProject(pi,'work'); }
function addListItem(pi, field) { data.projects[pi].detail[field].push(''); renderProjects(); reopenProject(pi,'work'); }

function removeSection(pi, si) { data.projects[pi].detail.sections.splice(si,1); renderProjects(); reopenProject(pi,'sections'); }
function addSection(pi) { data.projects[pi].detail.sections.push({label:'New Section',title:'',text:'',gradient:'g1',image:null,reverse:false,fullWidth:false}); renderProjects(); reopenProject(pi,'sections'); }

// ── Save ──
function saveAll() {
  data.meta.title = document.getElementById('meta-title').value;
  data.hero.tagline = document.getElementById('hero-tagline').value;
  data.hero.lastUpdated = document.getElementById('hero-lastUpdated').value;
  data.hero.dateRange = document.getElementById('hero-dateRange').value;
  data.footer.copyright = document.getElementById('footer-copyright').value;
  data.footer.email = document.getElementById('footer-email').value;
  data.footer.phone = document.getElementById('footer-phone').value;
  data.password = document.getElementById('access-password').value;
  data.customCSS = document.getElementById('custom-css-input').value;
  fetch('/api/save', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    .then(r => r.json())
    .then(res => { if(res.ok) showToast('Saved & published successfully','success'); else showToast('Error: '+(res.error||'Unknown'),'error'); })
    .catch(() => showToast('Network error','error'));
}

// ── Toast ──
let toastTimer;
function showToast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3000);
}

function esc(str) { return String(str??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
</script>
</body>
</html>`;
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────

const MIME = { '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.ogg':'video/ogg','.mov':'video/quicktime' };

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;

  function json(data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  function html(content, status = 200) {
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  }

  if (req.method === 'GET' && (pathname === '/' || pathname === '/admin')) {
    html(getAdminHTML()); return;
  }

  if (req.method === 'GET' && pathname === '/api/data') {
    try { json(loadData()); } catch(e) { json({ error: e.message }, 500); }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newData = JSON.parse(body);
        saveData(newData);
        const { html, css, js } = generatePortfolio(newData);
        fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
        fs.writeFileSync(path.join(__dirname, 'portfolio.css'), css, 'utf8');
        fs.writeFileSync(path.join(__dirname, 'portfolio.js'), js, 'utf8');
        json({ ok: true });
      } catch(e) { json({ ok: false, error: e.message }, 400); }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/upload') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filename, data } = JSON.parse(body);
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        fs.writeFileSync(path.join(IMAGES_DIR, safeName), Buffer.from(data, 'base64'));
        json({ path: 'images/' + safeName });
      } catch(e) { json({ ok: false, error: e.message }, 400); }
    });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/images/')) {
    const imgPath = path.join(__dirname, pathname);
    if (fs.existsSync(imgPath)) {
      const ext = path.extname(imgPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(imgPath));
    } else { res.writeHead(404); res.end(); }
    return;
  }

  if (req.method === 'GET' && (pathname === '/portfolio.css' || pathname === '/portfolio.js')) {
    const filePath = path.join(__dirname, pathname.slice(1));
    if (fs.existsSync(filePath)) {
      const ct = pathname.endsWith('.css') ? 'text/css' : 'application/javascript';
      res.writeHead(200, { 'Content-Type': ct });
      res.end(fs.readFileSync(filePath));
    } else { res.writeHead(404); res.end(); }
    return;
  }

  if (req.method === 'GET' && pathname === '/preview') {
    try {
      if (!fs.existsSync(OUTPUT_FILE)) {
        const { html: h, css: c, js: j } = generatePortfolio(loadData());
        fs.writeFileSync(OUTPUT_FILE, h, 'utf8');
        fs.writeFileSync(path.join(__dirname, 'portfolio.css'), c, 'utf8');
        fs.writeFileSync(path.join(__dirname, 'portfolio.js'), j, 'utf8');
      }
      html(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch(e) { html(`<pre>Error: ${e.message}</pre>`, 500); }
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Portfolio CMS running at http://localhost:${PORT}\n`);
  console.log(`  Admin:   http://localhost:${PORT}/`);
  console.log(`  Preview: http://localhost:${PORT}/preview\n`);
});
