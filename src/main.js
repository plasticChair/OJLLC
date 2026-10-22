import { createIcons } from 'lucide';
import siteContent from 'virtual:site-content';
import { icons } from './icons.js';
import './style.css';

const { site } = siteContent;
const renderIcons = (root = document) => createIcons({ icons, root, attrs: { 'stroke-width': 1.75 } });
renderIcons();

const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');

function setMenu(isOpen) {
  const label = isOpen ? site.close_navigation_label : site.open_navigation_label;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', label);
  menuToggle.title = label;
  menuToggle.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}" aria-hidden="true"></i>`;
  nav.classList.toggle('is-open', isOpen);
  header.classList.toggle('menu-open', isOpen);
  renderIcons(menuToggle);
}

menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});
window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...nav.querySelectorAll('a[href^="#"]:not(.button)')];
let scrollFrame = 0;

function updateScrollState() {
  scrollFrame = 0;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  const marker = window.innerHeight * 0.4;
  const current = atBottom ? sections.at(-1) : sections.findLast((section) => section.getBoundingClientRect().top <= marker);
  for (const link of navLinks) {
    if (current && link.getAttribute('href') === `#${current.id}`) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

updateScrollState();
window.addEventListener('scroll', () => {
  scrollFrame ||= requestAnimationFrame(updateScrollState);
}, { passive: true });

document.querySelector('#year').textContent = new Date().getFullYear();
