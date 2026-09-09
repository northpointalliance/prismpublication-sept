// Lean static site builder. Zero framework, zero runtime deps on the deployed site.
// Usage: node _site-kit/build.js <path-to-site-dir>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(process.argv[2] || '.');
const configPath = path.join(siteDir, 'site.config.json');

if (!fs.existsSync(configPath)) {
  console.error(`No site.config.json found in ${siteDir}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const articlesDir = path.join(siteDir, 'articles');
const distDir = path.join(siteDir, 'dist');

function getSiteUrl() {
  return config.siteUrl || ('https://' + config.name.toLowerCase().replace(/\s+/g, '') + '.pages.dev');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

function jsonLdScripts(schemas) {
  return schemas.map(function(s) {
    return '<script type="application/ld+json">' + JSON.stringify(s) + '</script>';
  }).join('\n');
}

function baseJsonLd() {
  const siteUrl = getSiteUrl();
  const orgName = (config.organization && config.organization.name) || 'Prism Publication';
  const orgEmail = (config.organization && config.organization.email) || 'info@prismpublication.com';
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': config.name,
      'url': siteUrl + '/',
      'description': config.tagline,
      'publisher': { '@id': siteUrl + '/#organization' }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': siteUrl + '/#organization',
      'name': orgName,
      'url': siteUrl + '/',
      'email': orgEmail
    }
  ];
}

function articleJsonLd(a) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': a.title,
    'description': a.summary || a.title,
    'datePublished': a.date,
    'author': { '@type': 'Organization', 'name': a.author || 'IsraeliLeads' },
    'publisher': { '@id': siteUrl + '/#organization' },
    'mainEntityOfPage': siteUrl + '/articles/' + a.slug + '/'
  };
}

function extractTrendingItems(xml, max) {
  const items = [];
  const itemRe = /<item[\s\S]*?<\/item>/g;
  const titleRe = /<title>([\s\S]*?)<\/title>/;
  const linkRe = /<link>([\s\S]*?)<\/link>/;
  let m;
  while ((m = itemRe.exec(xml)) && items.length < max) {
    const block = m[0];
    const t = titleRe.exec(block);
    const l = linkRe.exec(block);
    if (t && l) {
      const title = t[1].replace('<![CDATA[', '').replace(']]>', '').trim();
      const link = l[1].replace('<![CDATA[', '').replace(']]>', '').trim();
      if (title && link) items.push({ title, link });
    }
  }
  return items;
}

async function fetchTrendingAtBuild() {
  const sources = config.rssSources || (config.rssSource ? [config.rssSource] : []);
  const results = [];
  for (const src of sources) {
    try {
      const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; site-kit-bot/1.0)' } });
      if (!res.ok) continue;
      const xml = await res.text();
      results.push(...extractTrendingItems(xml, 4));
      if (results.length >= 6) break;
    } catch (e) {
      /* keep partial results */
    }
  }
  return results.slice(0, 6);
}

function renderTrendingWidget(items) {
  if (!items || !items.length) {
    return '<p class="trending-empty">Trending headlines refresh on each build. Live feed loads when JavaScript is enabled.</p>';
  }
  const lis = items.map(function(it) {
    return '    <li><a href="' + escapeHtml(it.link) + '" target="_blank" rel="noopener">' + escapeHtml(it.title) + '</a></li>';
  }).join('\n');
  return [
    '<h3>Trending in ' + escapeHtml(config.niche) + '</h3>',
    '  <ul>',
    lis,
    '  </ul>'
  ].join('\n');
}

try { fs.rmSync(distDir, { recursive: true, force: true }); } catch (e) { /* overwrite in place */ }
fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'articles'), { recursive: true });

fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(distDir, 'assets', 'style.css'));
const overridePath = path.join(siteDir, 'style-override.css');
if (fs.existsSync(overridePath)) {
  fs.appendFileSync(path.join(distDir, 'assets', 'style.css'), '\n' + fs.readFileSync(overridePath, 'utf8'));
}

function resolveAffLinks(markdown) {
  return markdown.replace(/\(aff:\/\/([a-zA-Z0-9_-]+)\)/g, (full, key) => {
    const entry = config.affiliates && config.affiliates[key];
    const real = typeof entry === 'string' ? entry : (entry && entry.url);
    if (!real) {
      console.warn(`  ! aff key "${key}" not found in site.config.json affiliates map, leaving as-is`);
      return full;
    }
    return `(${real}#__AFF__)`;
  });
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function loadArticles() {
  if (!fs.existsSync(articlesDir)) return [];
  return fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(articlesDir, f), 'utf8');
      const { data, content } = matter(raw);
      const slug = data.slug || slugify(data.title || f.replace('.md', ''));
      const resolvedMd = resolveAffLinks(content);
      let html = marked.parse(resolvedMd);
      html = html.replace(/<a href="([^"]+)#__AFF__">([^<]*)<\/a>/g,
        '<a href="$1" class="aff-link" rel="sponsored noopener" target="_blank">$2 ↗</a>');
      return { ...data, slug, html, raw: content };
    })
    .filter(a => a.title && a.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function aiBadge(article) {
  return article.ai_written
    ? `<span class="badge-ai">AI-written, human-reviewed</span>`
    : `<span class="badge-ai" style="background:#eef2ff;color:#4338ca;">Human-written</span>`;
}

function cadenceLine() {
  if (!config.publishCadence) return '';
  return '<p class="publish-cadence">' + escapeHtml(config.publishCadence) + '</p>';
}

function layout(opts) {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const bodyClass = opts.bodyClass || '';
  const content = opts.content;
  const canonicalPath = opts.canonicalPath;
  const siteUrl = getSiteUrl();
  const schemas = opts.jsonLd || baseJsonLd();

  const head = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<title>' + title + '</title>',
    '<meta name="description" content="' + description + '" />',
    '<link rel="canonical" href="' + siteUrl + canonicalPath + '" />',
    '<link rel="alternate" type="application/rss+xml" title="' + escapeHtml(config.name) + ' RSS" href="/feed.xml" />',
    jsonLdScripts(schemas),
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />',
    '<link rel="stylesheet" href="/assets/style.css" />',
    '</head>',
    '<body class="' + bodyClass + '">',
    '<nav>',
    '  <a class="logo" href="/">' + escapeHtml(config.name) + '</a>',
    '  <div class="nav-links">',
    '    <a href="/">Articles</a>',
    '    <a href="/feed.xml">RSS</a>',
    '    <a href="/about.html">About</a>',
    '  </div>',
    '</nav>'
  ].join('\n');

  const footer = [
    '<footer>',
    '  <div>&copy; ' + new Date().getFullYear() + ' ' + escapeHtml(config.name) + '. Some links are affiliate links, see our <a href="/about.html#disclosure">disclosure</a>.</div>',
    '  <div><a href="/about.html">About</a> &middot; <a href="/feed.xml">RSS feed</a></div>',
    '  <div class="footer-company">Copyright 2026 Prism Publication &middot; Dr Enrico Fabrigat, Holon, Israel &middot; <a href="mailto:info@prismpublication.com">info@prismpublication.com</a></div>',
    '</footer>'
  ].join('\n');

  const niche = escapeHtml(config.niche).replace(/'/g, "\\'");
  const script = [
    '<script>',
    '(function(){',
    "  var el = document.getElementById('trending-widget');",
    '  if (!el) return;',
    "  fetch('/trending').then(function(r){ return r.json(); }).then(function(items){",
    '    if (!items || !items.length) return;',
    "    var html = '<h3>Trending in " + niche + "</h3><ul>' + items.slice(0,6).map(function(it){",
    "      return '<li><a href=\"' + it.link + '\" target=\"_blank\" rel=\"noopener\">' + it.title + '</a></li>';",
    "    }).join('') + '</ul>';",
    '    el.innerHTML = html;',
    '  }).catch(function(){});',
    '})();',
    '</script>',
    '</body>',
    '</html>'
  ].join('\n');

  return head + '\n' + content + '\n' + footer + '\n' + script;
}

function renderHome(articles, trendingItems) {
  const cards = articles.map(function(a) {
    return [
      '  <a class="article-card" href="/articles/' + a.slug + '/">',
      '    <div class="article-title">' + escapeHtml(a.title) + '</div>',
      '    <div class="article-meta">' + aiBadge(a) + '<span>' + escapeHtml(a.date) + '</span></div>',
      a.summary ? ('    <div class="article-summary">' + escapeHtml(a.summary) + '</div>') : '',
      '  </a>'
    ].join('\n');
  }).join('\n');

  const content = [
    '<div class="wrap">',
    '  <div class="hero">',
    '    <h1>' + escapeHtml(config.name) + '</h1>',
    '    <p>' + escapeHtml(config.tagline) + '</p>',
    cadenceLine(),
    '  </div>',
    '  <div id="trending-widget" class="trending">',
    '  ' + renderTrendingWidget(trendingItems),
    '  </div>',
    '  <div class="article-list">' + (cards || '<p style="padding:2rem 0;color:#6b7280;">First articles coming soon.</p>') + '</div>',
    '</div>'
  ].join('\n');

  return layout({
    title: config.name + ' — ' + config.tagline,
    description: config.tagline,
    content: content,
    canonicalPath: '/'
  });
}

function renderArticle(a) {
  const content = [
    '<article class="article-body">',
    '  <h1>' + escapeHtml(a.title) + '</h1>',
    '  <div class="article-byline">',
    '    ' + aiBadge(a),
    '    <span>' + escapeHtml(a.date) + '</span>',
    a.author ? ('    <span>by ' + escapeHtml(a.author) + '</span>') : '',
    '  </div>',
    '  ' + a.html,
    '  <div class="aff-disclosure" id="disclosure">This post may contain affiliate links. If you buy through one, ' + escapeHtml(config.name) + ' may earn a small commission at no extra cost to you. We only link tools we think are actually worth trying.</div>',
    '</article>'
  ].join('\n');

  return layout({
    title: a.title + ' | ' + config.name,
    description: a.summary || a.title,
    content: content,
    canonicalPath: '/articles/' + a.slug + '/',
    jsonLd: baseJsonLd().concat([articleJsonLd(a)])
  });
}

function renderAbout() {
  const cadenceBlock = config.publishCadence
    ? ('  <h2 id="schedule">Publishing schedule</h2>\n  <p>' + escapeHtml(config.publishCadence) + '</p>')
    : '';
  const content = [
    '<article class="article-body">',
    '  <h1>About ' + escapeHtml(config.name) + '</h1>',
    '  <p>' + escapeHtml(config.about || config.tagline) + '</p>',
    cadenceBlock,
    '  <h2 id="disclosure">Disclosure</h2>',
    '  <p>' + escapeHtml(config.name) + ' is an independent site. Some posts contain affiliate links, marked clearly where they appear. Articles marked "AI-written, human-reviewed" are drafted with AI assistance and reviewed by a human editor before publishing. We separate sponsored/affiliate content from editorial navigation, affiliate links never appear disguised as a site section.</p>',
    '</article>'
  ].join('\n');
  return layout({ title: 'About | ' + config.name, description: 'About and disclosure', content: content, canonicalPath: '/about.html' });
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, function(c) {
    return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c];
  });
}

function renderFeed(articles) {
  const siteUrl = getSiteUrl();
  const items = articles.map(function(a) {
    return [
      '  <item>',
      '    <title>' + escapeXml(a.title) + '</title>',
      '    <link>' + siteUrl + '/articles/' + a.slug + '/</link>',
      '    <guid>' + siteUrl + '/articles/' + a.slug + '/</guid>',
      '    <pubDate>' + new Date(a.date).toUTCString() + '</pubDate>',
      '    <description>' + escapeXml(a.summary || '') + '</description>',
      '  </item>'
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    '  <title>' + escapeXml(config.name) + '</title>',
    '  <link>' + siteUrl + '</link>',
    '  <description>' + escapeXml(config.tagline) + '</description>',
    items,
    '</channel>',
    '</rss>'
  ].join('\n');
}

function renderRobots() {
  const siteUrl = getSiteUrl();
  return [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: ' + siteUrl + '/sitemap.xml'
  ].join('\n');
}

function renderSitemap(articles) {
  const siteUrl = getSiteUrl();
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: siteUrl + '/', lastmod: today },
    { loc: siteUrl + '/about.html', lastmod: today }
  ];
  for (const a of articles) {
    urls.push({ loc: siteUrl + '/articles/' + a.slug + '/', lastmod: a.date });
  }
  const entries = urls.map(function(u) {
    return [
      '  <url>',
      '    <loc>' + escapeXml(u.loc) + '</loc>',
      '    <lastmod>' + escapeXml(u.lastmod) + '</lastmod>',
      '  </url>'
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>'
  ].join('\n');
}

async function main() {
  const articles = loadArticles();
  const trendingItems = await fetchTrendingAtBuild();
  console.log('  trending headlines at build: ' + trendingItems.length);

  fs.writeFileSync(path.join(distDir, 'index.html'), renderHome(articles, trendingItems));
  fs.writeFileSync(path.join(distDir, 'about.html'), renderAbout());
  fs.writeFileSync(path.join(distDir, 'feed.xml'), renderFeed(articles));
  fs.writeFileSync(path.join(distDir, 'robots.txt'), renderRobots());
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), renderSitemap(articles));

  for (const a of articles) {
    const dir = path.join(distDir, 'articles', a.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderArticle(a));
  }

  console.log('Built ' + config.name + ': ' + articles.length + ' article(s) -> ' + distDir);

  const functionsDir = path.join(distDir, 'functions');
  fs.mkdirSync(functionsDir, { recursive: true });

  const rssSources = JSON.stringify(config.rssSources || (config.rssSource ? [config.rssSource] : []));
  const trendingTemplate = fs.readFileSync(path.join(__dirname, 'trending-template.js'), 'utf8');
  const trendingFn = trendingTemplate.replace('__SOURCES__', rssSources);

  fs.writeFileSync(path.join(functionsDir, 'trending.js'), trendingFn);
  console.log('  + functions/trending.js (sources: ' + rssSources + ')');
  console.log('  + robots.txt, sitemap.xml');
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
