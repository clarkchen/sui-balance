(() => {
  'use strict';

  const measurementId = 'G-3JN86QC9JJ';
  const consentKey = 'sui-balance-analytics-consent';
  const isChinese = document.documentElement.lang.toLowerCase().startsWith('zh');
  const copy = isChinese ? {
    title: '网站访问统计',
    description: '同意后，本网站才会加载 Google Analytics 以统计访问量。Chrome 扩展程序不使用此统计代码。',
    allow: '同意统计',
    decline: '拒绝',
    settings: '统计设置',
    policy: '隐私政策',
    label: '网站统计选项'
  } : {
    title: 'Website analytics',
    description: 'Google Analytics loads only if you agree. The Chrome extension does not use this analytics code.',
    allow: 'Allow analytics',
    decline: 'Decline',
    settings: 'Analytics settings',
    policy: 'Privacy policy',
    label: 'Website analytics choice'
  };

  let choice;
  try { choice = localStorage.getItem(consentKey); } catch (_) { choice = null; }
  let tagLoaded = false;
  let banner;

  function saveChoice(value) {
    choice = value;
    try { localStorage.setItem(consentKey, value); } catch (_) { /* Keep the choice for this page. */ }
  }

  function loadAnalytics() {
    if (tagLoaded) return;
    tagLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  function dismissBanner() {
    banner?.remove();
    banner = null;
  }

  function choose(value) {
    saveChoice(value);
    dismissBanner();
    if (value === 'granted') {
      loadAnalytics();
    } else if (tagLoaded) {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      window.location.reload();
    }
  }

  function showBanner() {
    if (banner) return;
    banner = document.createElement('section');
    banner.className = 'analytics-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', copy.label);

    const title = document.createElement('strong');
    title.textContent = copy.title;
    const description = document.createElement('p');
    description.textContent = copy.description + ' ';
    const policy = document.createElement('a');
    policy.href = isChinese ? '/zh/privacy/' : '/privacy/';
    policy.textContent = copy.policy;
    description.appendChild(policy);

    const actions = document.createElement('div');
    actions.className = 'analytics-consent-actions';
    for (const [value, label] of [['denied', copy.decline], ['granted', copy.allow]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.className = value === 'granted' ? 'analytics-allow' : 'analytics-decline';
      button.addEventListener('click', () => choose(value));
      actions.appendChild(button);
    }
    banner.append(title, description, actions);
    document.body.appendChild(banner);
  }

  const footer = document.querySelector('footer nav');
  if (footer) {
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'analytics-settings';
    settings.textContent = copy.settings;
    settings.addEventListener('click', showBanner);
    footer.appendChild(settings);
  }

  if (choice === 'granted') loadAnalytics();
  else if (choice !== 'denied') showBanner();
})();
