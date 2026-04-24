/* =========================================================
   GameKit UI — main.js
   Ankun Bing | SI 539 Final Project | W26
   ========================================================= */

(function () {
  'use strict';

  /* ---------- DOM ready ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initYear();
    initNavToggle();
    initCurrentPage();
    initHealthBars();
    initXPBars();
    initCooldowns();
    initInventories();
    initToasts();
    initStatCards();
    initCodeToggles();
    initCopyButtons();
    initCodeTabs();
  });

  /* ---------- Dynamic footer year ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Mobile nav ---------- */
  function initNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Mark current nav link ---------- */
  function initCurrentPage() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === current || (current === '' && href === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- Reduced-motion check (used by demo loops) ---------- */
  function prefersReducedMotion() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* =========================================================
     C1. HEALTH BAR
     ========================================================= */
  function initHealthBars() {
    document.querySelectorAll('[data-hp]').forEach(bar => {
      let hp = parseInt(bar.dataset.hp, 10) || 100;
      const max = parseInt(bar.dataset.hpMax, 10) || 100;
      const fill = bar.querySelector('.hp-fill');
      const value = bar.querySelector('.hp-value');

      const render = () => {
        const pct = Math.max(0, Math.min(100, (hp / max) * 100));
        fill.style.width = pct + '%';
        value.textContent = hp + ' / ' + max;
        bar.classList.toggle('mid', pct <= 50 && pct > 25);
        bar.classList.toggle('low', pct <= 25);
        bar.setAttribute('aria-valuenow', hp);
      };

      // Buttons live in a sibling .component-controls, so search the
      // wrapping component-card. Fallback keeps homepage demo working.
      const root = bar.closest('.component-card') || bar.parentElement || document;

      root.querySelectorAll('[data-hp-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const delta = parseInt(btn.dataset.hpAction, 10);
          hp = Math.max(0, Math.min(max, hp + delta));
          render();
        });
      });

      // Reset button
      const reset = root.querySelector('[data-hp-reset]');
      if (reset) {
        reset.addEventListener('click', () => { hp = max; render(); });
      }

      render();

      // Demo mode: auto-cycle to make hero preview feel alive
      if (bar.hasAttribute('data-demo') && !prefersReducedMotion()) {
        startHpDemoLoop(v => { hp = v; render(); });
      }
    });
  }

  function startHpDemoLoop(setHp) {
    // [target HP, hold time before next step in ms]
    const seq = [
      [100, 1600],
      [75,  900],
      [50,  900],
      [25,  1500],   // pause at low to show red pulse
      [12,  1300],
      [100, 1400],   // heal back to full
    ];
    let i = 0;
    const tick = () => {
      setHp(seq[i][0]);
      const wait = seq[i][1];
      i = (i + 1) % seq.length;
      setTimeout(tick, wait);
    };
    setTimeout(tick, 800); // small delay so initial render lands first
  }

  /* =========================================================
     C2. XP BAR
     ========================================================= */
  function initXPBars() {
    document.querySelectorAll('[data-xp]').forEach(wrap => {
      let xp = parseInt(wrap.dataset.xp, 10) || 0;
      let lvl = parseInt(wrap.dataset.lvl, 10) || 1;
      const perLevel = parseInt(wrap.dataset.xpPerLevel, 10) || 100;
      const fill = wrap.querySelector('.xp-fill');
      const lvlNum = wrap.querySelector('.lvl-num');
      const points = wrap.querySelector('.xp-points');

      const render = () => {
        const pct = (xp / perLevel) * 100;
        fill.style.width = pct + '%';
        lvlNum.textContent = lvl;
        points.textContent = xp + ' / ' + perLevel + ' XP';
        fill.setAttribute('aria-valuenow', xp);
      };

      const addXP = n => {
        xp += n;
        while (xp >= perLevel) {
          xp -= perLevel;
          lvl++;
          wrap.classList.add('level-up');
          setTimeout(() => wrap.classList.remove('level-up'), 800);
          // fire a toast if there's a stack on the page
          dispatchToast({
            type: 'success',
            title: 'Level Up!',
            message: 'You reached level ' + lvl + '.'
          });
        }
        render();
      };

      // Buttons live in a sibling .component-controls, so search the
      // wrapping component-card. Fallback keeps homepage demo working.
      const root = wrap.closest('.component-card') || wrap.parentElement || document;

      root.querySelectorAll('[data-xp-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          addXP(parseInt(btn.dataset.xpAction, 10));
        });
      });

      const reset = root.querySelector('[data-xp-reset]');
      if (reset) {
        reset.addEventListener('click', () => { xp = 0; lvl = 1; render(); });
      }

      // Force initial render starting from 0% so we see the entry fill animation
      if (wrap.hasAttribute('data-demo') && !prefersReducedMotion()) {
        fill.style.width = '0%';
        setTimeout(() => {
          render();
          startXpDemoLoop(
            () => xp,
            v => { xp = v; render(); }
          );
        }, 250);
      } else {
        render();
      }
    });
  }

  function startXpDemoLoop(getXp, setXp) {
    // Oscillate between low and high without crossing 100 — no level-up cascade
    const seq = [
      [30,  1200],
      [55,  900],
      [80,  900],
      [95,  1400],   // pause near full
      [70,  900],
      [45,  900],
    ];
    let i = 0;
    const tick = () => {
      setXp(seq[i][0]);
      const wait = seq[i][1];
      i = (i + 1) % seq.length;
      setTimeout(tick, wait);
    };
    setTimeout(tick, 1100);
  }

  /* =========================================================
     C3. COOLDOWN
     ========================================================= */
  function initCooldowns() {
    document.querySelectorAll('.cd-skill').forEach(skill => {
      const duration = parseFloat(skill.dataset.cd) || 3;
      const timerEl = skill.querySelector('.cd-timer');
      let rafId = null;

      const trigger = () => {
        if (skill.classList.contains('cooling')) return;
        skill.classList.add('cooling');
        skill.setAttribute('aria-disabled', 'true');
        const start = performance.now();

        const tick = (now) => {
          const elapsed = (now - start) / 1000;
          const remaining = duration - elapsed;
          if (remaining <= 0) {
            skill.classList.remove('cooling');
            skill.setAttribute('aria-disabled', 'false');
            skill.style.setProperty('--cd-progress', '0deg');
            if (timerEl) timerEl.textContent = '';
            return;
          }
          const deg = (remaining / duration) * 360;
          skill.style.setProperty('--cd-progress', deg + 'deg');
          if (timerEl) timerEl.textContent = remaining.toFixed(1);
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      };

      skill.addEventListener('click', trigger);
      skill.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger();
        }
      });
    });
  }

  /* =========================================================
     C4. INVENTORY
     ========================================================= */
  function initInventories() {
    document.querySelectorAll('.inv').forEach(inv => {
      inv.querySelectorAll('.inv-slot').forEach(slot => {
        slot.addEventListener('click', () => {
          if (slot.classList.contains('empty')) return;
          const name = slot.dataset.name || 'Item';
          dispatchToast({
            type: 'success',
            title: 'Item used',
            message: name + ' consumed.'
          });
        });
      });
    });
  }

  /* =========================================================
     C5. TOAST
     ========================================================= */
  const toastIcons = { success: '✓', warn: '⚠', error: '✕', info: 'i' };

  function dispatchToast(data) {
    const stack = document.querySelector('.toast-stack[data-live]');
    if (!stack) return;
    spawnToast(stack, data);
  }

  function spawnToast(stack, { type = 'info', title = '', message = '', life = 3500 }) {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="toast-icon" aria-hidden="true">' + (toastIcons[type] || 'i') + '</div>' +
      '<div class="toast-body">' +
        '<div class="toast-title">' + escapeHtml(title) + '</div>' +
        '<div class="toast-msg">' + escapeHtml(message) + '</div>' +
      '</div>' +
      '<button class="toast-close" aria-label="Dismiss notification">×</button>';

    const close = () => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 250);
    };
    el.querySelector('.toast-close').addEventListener('click', close);
    stack.appendChild(el);
    if (life > 0) setTimeout(close, life);
  }

  function initToasts() {
    document.querySelectorAll('[data-toast-trigger]').forEach(btn => {
      btn.addEventListener('click', () => {
        const stack = btn.closest('.component-demo, .hero').querySelector('.toast-stack[data-live]')
                   || document.querySelector('.toast-stack[data-live]');
        if (!stack) return;

        const type = btn.dataset.toastTrigger;
        const presets = {
          success: { title: 'Quest Complete', message: 'You earned 250 XP and 3 loot crates.' },
          warn:    { title: 'Low Health',     message: 'HP below 25%. Find a health pack.' },
          error:   { title: 'Connection Lost',message: 'Reconnecting to server...' },
          info:    { title: 'New Message',    message: 'Guild chat: raid starts in 5 min.' }
        };
        spawnToast(stack, { type, ...presets[type] });
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* =========================================================
     C6. STAT CARD (no interactive logic needed — pure display)
     ========================================================= */
  function initStatCards() { /* reserved */ }

  /* =========================================================
     UTILITIES — Code toggle, copy, tabs
     ========================================================= */
  function initCodeToggles() {
    document.querySelectorAll('.code-toggle').forEach(btn => {
      const targetId = btn.getAttribute('aria-controls');
      const target = document.getElementById(targetId);
      if (!target) return;
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !open);
        target.hidden = open;
      });
    });
  }

  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.dataset.copyTarget;
        const target = document.getElementById(targetId);
        if (!target) return;
        const text = target.textContent;
        try {
          await navigator.clipboard.writeText(text);
          const original = btn.textContent;
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('copied');
          }, 1500);
        } catch (err) {
          // fallback for older browsers
          const range = document.createRange();
          range.selectNode(target);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          sel.removeAllRanges();
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 1500);
        }
      });
    });
  }

  function initCodeTabs() {
    document.querySelectorAll('[role="tablist"]').forEach(list => {
      const tabs = list.querySelectorAll('[role="tab"]');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', e => {
          const idx = Array.from(tabs).indexOf(tab);
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            tabs[(idx + 1) % tabs.length].focus();
            activate(tabs[(idx + 1) % tabs.length]);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            tabs[(idx - 1 + tabs.length) % tabs.length].focus();
            activate(tabs[(idx - 1 + tabs.length) % tabs.length]);
          }
        });
      });

      function activate(tab) {
        tabs.forEach(t => {
          const panel = document.getElementById(t.getAttribute('aria-controls'));
          const selected = (t === tab);
          t.setAttribute('aria-selected', selected ? 'true' : 'false');
          t.setAttribute('tabindex', selected ? '0' : '-1');
          if (panel) panel.hidden = !selected;
        });
      }
    });
  }
})();
