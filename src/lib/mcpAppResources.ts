import type { McpServer } from "@modelcontextprotocol/server";

export const TITLE_CAROUSEL_URI = "ui://cineblock/title-carousel/v1.html";
export const CONFIRMATION_CARD_URI = "ui://cineblock/confirmation-card/v1.html";
export const STAMP_INTERVIEW_URI = "ui://cineblock/stamp-interview/v1.html";
export const CINEBLOCK_MCP_ICON_URL = "https://www.cineblock.in/brand/cineblock-icon-256.png";
export const CINEBLOCK_MCP_ICON = {
  src: CINEBLOCK_MCP_ICON_URL,
  mimeType: "image/png",
  sizes: ["256x256"],
};

const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";
const RESOURCE_META = {
  ui: {
    prefersBorder: true,
    domain: "https://www.cineblock.in",
    csp: { resourceDomains: ["https://image.tmdb.org"] },
  },
};

const widgetStyles = `
  :root {
    color-scheme: dark;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --ink: #06112c;
    --panel: rgba(7, 19, 45, .82);
    --panel-raised: rgba(255, 255, 255, .075);
    --line: rgba(255, 255, 255, .12);
    --muted: rgba(226, 232, 240, .68);
    --blue: #93c5fd;
    --cyan: #a5f3fc;
    --orange: #fdba74;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-width: 280px;
    color: #f8fafc;
    background:
      radial-gradient(circle at 7% 0%, rgba(34, 211, 238, .12), transparent 19rem),
      radial-gradient(circle at 94% 100%, rgba(249, 115, 22, .09), transparent 18rem),
      var(--ink);
  }
  button { font: inherit; }
  .widget { padding: 16px; overflow: hidden; }
  .eyebrow { color: var(--cyan); font-size: 10px; letter-spacing: .2em; text-transform: uppercase; }
  .heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  h1, h2, p { margin: 0; }
  h1 { font-size: 20px; letter-spacing: -.035em; line-height: 1.1; }
  .subtle { color: var(--muted); font-size: 12px; line-height: 1.5; }
  .rail-actions { display: flex; gap: 6px; }
  .icon-button, .primary-button, .secondary-button {
    border: 1px solid var(--line);
    color: #e0f2fe;
    background: rgba(255, 255, 255, .06);
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, background .18s ease;
  }
  .icon-button { width: 32px; height: 32px; border-radius: 50%; font-size: 17px; line-height: 1; }
  .icon-button:hover, .secondary-button:hover { border-color: rgba(165, 243, 252, .5); background: rgba(165, 243, 252, .1); }
  .icon-button:active, .primary-button:active, .secondary-button:active { transform: scale(.97); }
  .icon-button:focus-visible, .primary-button:focus-visible, .secondary-button:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
  .rail { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(148px, 19%); gap: 12px; overflow-x: auto; overscroll-behavior-inline: contain; scroll-snap-type: x proximity; padding: 2px 2px 12px; scrollbar-width: thin; scrollbar-color: rgba(147, 197, 253, .55) rgba(255, 255, 255, .06); }
  .rail::-webkit-scrollbar { height: 6px; }
  .rail::-webkit-scrollbar-track { background: rgba(255, 255, 255, .06); border-radius: 99px; }
  .rail::-webkit-scrollbar-thumb { background: linear-gradient(90deg, rgba(96, 165, 250, .75), rgba(34, 211, 238, .6)); border-radius: 99px; }
  .movie { min-width: 0; scroll-snap-align: start; animation: lift-in .42s cubic-bezier(.22, 1, .36, 1) both; }
  .poster { position: relative; aspect-ratio: 2 / 3; overflow: hidden; border: 1px solid rgba(255, 255, 255, .13); border-radius: 16px; background: linear-gradient(145deg, rgba(96, 165, 250, .18), rgba(255, 255, 255, .04)); box-shadow: 0 12px 28px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255, 255, 255, .14); }
  .poster::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(145deg, rgba(255,255,255,.18), transparent 30%, rgba(2,8,23,.35)); }
  .poster img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .45s ease; }
  .movie:hover .poster img { transform: scale(1.045); }
  .poster-empty { display: grid; height: 100%; place-items: center; padding: 14px; color: rgba(226, 232, 240, .5); text-align: center; font-size: 11px; }
  .movie-title { margin-top: 9px; overflow: hidden; color: #f8fafc; font-size: 13px; font-weight: 650; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
  .movie-meta { margin-top: 4px; color: rgba(186, 230, 253, .6); font-size: 10px; text-transform: uppercase; letter-spacing: .09em; }
  .choose { width: 100%; margin-top: 9px; padding: 8px 9px; border-radius: 10px; color: var(--ink); background: linear-gradient(100deg, #a5f3fc, #93c5fd); border-color: rgba(165, 243, 252, .55); font-size: 11px; font-weight: 750; }
  button:disabled { cursor: wait; opacity: .58; }
  .choose:hover, .primary-button:hover { transform: translateY(-1px); border-color: rgba(255, 255, 255, .72); box-shadow: 0 8px 20px rgba(96, 165, 250, .2); }
  .empty { padding: 22px 10px; border: 1px dashed var(--line); border-radius: 16px; color: var(--muted); text-align: center; font-size: 12px; }
  .confirmation { border: 1px solid var(--line); border-radius: 20px; background: linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.035)); box-shadow: 0 16px 42px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.11); padding: 17px; }
  .confirm-head { display: flex; justify-content: space-between; gap: 14px; align-items: start; }
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border: 1px solid rgba(165, 243, 252, .18); border-radius: 99px; color: var(--cyan); background: rgba(165, 243, 252, .07); font-size: 9px; letter-spacing: .15em; text-transform: uppercase; white-space: nowrap; }
  .badge::before { content: ""; width: 6px; height: 6px; border-radius: 99px; background: currentColor; box-shadow: 0 0 10px currentColor; }
  .confirm-title { margin-top: 8px; font-size: 22px; line-height: 1.08; letter-spacing: -.04em; }
  .pill { display: inline-block; margin-top: 9px; padding: 5px 8px; border-radius: 99px; background: rgba(249, 115, 22, .1); color: var(--orange); font-size: 10px; text-transform: uppercase; letter-spacing: .1em; }
  .mini-rail { display: flex; gap: 8px; overflow-x: auto; margin: 16px 0; padding-bottom: 4px; }
  .mini-poster { flex: 0 0 54px; width: 54px; height: 78px; overflow: hidden; border-radius: 9px; border: 1px solid rgba(255, 255, 255, .14); background: rgba(255,255,255,.06); }
  .mini-poster img { width: 100%; height: 100%; object-fit: cover; }
  .detail { margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--line); }
  .detail-label { color: rgba(186, 230, 253, .58); font-size: 9px; letter-spacing: .18em; text-transform: uppercase; }
  .detail-value { margin-top: 5px; color: #f8fafc; font-size: 12px; line-height: 1.5; }
  .review { max-height: 150px; overflow: auto; white-space: pre-wrap; color: rgba(226, 232, 240, .82); font: 12px/1.65 ui-monospace, SFMono-Regular, Consolas, monospace; }
  .primary-button, .secondary-button { width: 100%; margin-top: 16px; padding: 11px 13px; border-radius: 12px; font-size: 12px; font-weight: 750; }
  .primary-button { color: var(--ink); background: linear-gradient(100deg, #a5f3fc, #93c5fd); border-color: rgba(165, 243, 252, .55); }
  .secondary-button { color: #dbeafe; }
  .saved { text-align: center; }
  .saved-mark { display: grid; width: 44px; height: 44px; margin: 0 auto 12px; place-items: center; border: 1px solid rgba(74, 222, 128, .3); border-radius: 50%; color: #86efac; background: rgba(74, 222, 128, .1); font-size: 20px; }
  .saved a { display: inline-block; margin-top: 15px; color: var(--cyan); font-size: 12px; text-decoration: none; }
  .saved a:hover { text-decoration: underline; }
  @keyframes lift-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 520px) { .rail { grid-auto-columns: minmax(142px, 42vw); } .widget { padding: 12px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
`;

const bridgeScript = `
  (function () {
    var pending = new Map();
    var nextId = 1;
    var latestToolResult = null;
    function rpc(method, params) {
      var id = nextId++;
      window.parent.postMessage({ jsonrpc: "2.0", id: id, method: method, params: params || {} }, "*");
      return new Promise(function (resolve, reject) {
        pending.set(id, { resolve: resolve, reject: reject });
        window.setTimeout(function () {
          if (!pending.has(id)) return;
          pending.delete(id);
          reject(new Error("The host did not respond."));
        }, 10000);
      });
    }
    function notify(method, params) {
      window.parent.postMessage({ jsonrpc: "2.0", method: method, params: params || {} }, "*");
    }
    function sendToConversation(text) {
      return rpc("ui/message", { role: "user", content: [{ type: "text", text: text }] }).catch(function (error) {
        var status = document.querySelector("[data-bridge-status]");
        if (status) status.textContent = "Use the approval button in the conversation to continue.";
        throw error;
      });
    }
    function registerRenderer(renderer) {
      window.cineblockRender = renderer;
      renderer(latestToolResult);
    }
    window.cineblockBridge = { sendToConversation: sendToConversation, registerRenderer: registerRenderer };
    window.addEventListener("message", function (event) {
      if (event.source !== window.parent) return;
      var message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.id !== undefined && pending.has(message.id)) {
        var entry = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) entry.reject(message.error); else entry.resolve(message.result);
        return;
      }
      if (message.method === "ui/notifications/tool-result" && window.cineblockRender) {
        latestToolResult = message.params && message.params.structuredContent;
        window.cineblockRender(latestToolResult);
      } else if (message.method === "ui/notifications/tool-result") {
        latestToolResult = message.params && message.params.structuredContent;
      }
      if (message.method === "ui/notifications/tool-input" && window.cineblockToolInput) {
        window.cineblockToolInput(message.params);
      }
    }, { passive: true });
    rpc("ui/initialize", {
      protocolVersion: "2025-11-21",
      appInfo: { name: "cineblock-mcp-app", title: "CineBlock", version: "1.0.0", websiteUrl: "https://www.cineblock.in", icons: [{ src: "${CINEBLOCK_MCP_ICON_URL}", mimeType: "image/png", sizes: ["256x256"] }] },
      appCapabilities: {}
    }).then(function () {
      notify("ui/notifications/initialized", {});
    }).catch(function () {
      var status = document.querySelector("[data-bridge-status]");
      if (status) status.textContent = "Preview loaded in compatibility mode.";
    });
  }());
`;

const titleCarouselHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CineBlock title results</title><style>${widgetStyles}</style></head>
<body><main class="widget"><div class="heading"><div><p class="eyebrow">CineBlock / find your movie</p><h1>Choose your next screen.</h1><p class="subtle" data-count>Exact title matches, ready to explore.</p></div><div class="rail-actions"><button class="icon-button" type="button" data-prev aria-label="Scroll titles left">‹</button><button class="icon-button" type="button" data-next aria-label="Scroll titles right">›</button></div></div><div class="rail" data-rail role="list"></div><p class="subtle" data-bridge-status aria-live="polite"></p></main><script>${bridgeScript}
  (function () {
    var rail = document.querySelector("[data-rail]");
    var count = document.querySelector("[data-count]");
    var status = document.querySelector("[data-bridge-status]");
    function safeImage(value) {
      var raw = String(value || "");
      if (raw.charAt(0) === "/") return "https://image.tmdb.org/t/p/w500" + raw;
      try { var url = new URL(raw); return url.protocol === "https:" && url.hostname === "image.tmdb.org" && url.pathname.indexOf("/t/p/") === 0 ? url.href : ""; } catch (_) { return ""; }
    }
    function render(data) {
      rail.replaceChildren();
      var titles = data && Array.isArray(data.titles) ? data.titles.slice(0, 8) : [];
      count.textContent = titles.length ? titles.length + " exact match" + (titles.length === 1 ? "" : "es") + " · choose one to continue" : "No matching titles found.";
      if (!titles.length) { var empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "No matching movie or series was found."; rail.appendChild(empty); return; }
      titles.forEach(function (title, index) {
        var card = document.createElement("article"); card.className = "movie"; card.setAttribute("role", "listitem"); card.style.animationDelay = Math.min(index * 45, 280) + "ms";
        var poster = document.createElement("div"); poster.className = "poster";
        var imageUrl = safeImage(title && title.posterUrl);
        if (imageUrl) { var image = document.createElement("img"); image.src = imageUrl; image.alt = "Poster for " + String(title.title || "title"); image.loading = "lazy"; image.referrerPolicy = "no-referrer"; poster.appendChild(image); } else { var fallback = document.createElement("span"); fallback.className = "poster-empty"; fallback.textContent = "Poster unavailable"; poster.appendChild(fallback); }
        var name = document.createElement("h2"); name.className = "movie-title"; name.title = String(title.title || "Untitled"); name.textContent = String(title.title || "Untitled");
        var meta = document.createElement("p"); meta.className = "movie-meta"; meta.textContent = String(title.mediaType || "title") + " · " + String(title.year || "year unknown");
        var choose = document.createElement("button"); choose.type = "button"; choose.className = "choose"; choose.textContent = "Use this title";
        choose.addEventListener("click", function () {
          choose.disabled = true;
          choose.textContent = "Sending…";
          window.cineblockBridge.sendToConversation("Use this exact CineBlock title: " + String(title.title || "Untitled") + " (TMDB " + String(title.id) + ", " + String(title.mediaType) + ").").then(function () {
            status.textContent = "Title sent to the conversation. Choose what you want to do next.";
            choose.textContent = "Sent to chat";
          }).catch(function () {
            choose.disabled = false;
            choose.textContent = "Use this title";
          });
        });
        card.appendChild(poster); card.appendChild(name); card.appendChild(meta); card.appendChild(choose); rail.appendChild(card);
      });
      status.textContent = "Select a title to ask CineBlock for details, a stamp, or a playlist.";
    }
    document.querySelector("[data-prev]").addEventListener("click", function () { rail.scrollBy({ left: -rail.clientWidth * .72, behavior: "smooth" }); });
    document.querySelector("[data-next]").addEventListener("click", function () { rail.scrollBy({ left: rail.clientWidth * .72, behavior: "smooth" }); });
    window.cineblockBridge.registerRenderer(render);
  }());
</script></body></html>`;

const stampInterviewHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CineBlock stamp interview</title><style>${widgetStyles}
  .interview { border: 1px solid var(--line); border-radius: 20px; overflow: hidden; background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025)); box-shadow: 0 16px 42px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1); }
  .interview-head { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 13px; align-items: center; padding: 16px; border-bottom: 1px solid var(--line); }
  .interview-poster { width: 64px; height: 88px; overflow: hidden; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: rgba(255,255,255,.05); }
  .interview-poster img { width: 100%; height: 100%; object-fit: cover; }
  .interview-title { margin-top: 4px; font-size: 22px; line-height: 1; letter-spacing: -.045em; }
  .interview-body { padding: 4px 16px 16px; }
  .question { padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
  .question:last-of-type { border-bottom: 0; }
  .question-number { display: inline-grid; width: 19px; height: 19px; margin-right: 7px; place-items: center; border: 1px solid rgba(165,243,252,.3); border-radius: 50%; color: var(--cyan); font-size: 9px; font-weight: 800; vertical-align: 1px; }
  .question h2 { display: inline; font-size: 14px; line-height: 1.35; letter-spacing: -.018em; }
  .options { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
  .option { min-height: 34px; padding: 7px 10px; border: 1px solid rgba(255,255,255,.13); border-radius: 999px; color: rgba(226,232,240,.82); background: rgba(255,255,255,.035); cursor: pointer; font-size: 11px; transition: border-color .16s ease, background .16s ease, color .16s ease; }
  .option:hover { border-color: rgba(165,243,252,.45); background: rgba(165,243,252,.08); }
  .option[aria-pressed="true"] { border-color: rgba(165,243,252,.68); color: #ecfeff; background: rgba(14,116,144,.26); box-shadow: inset 0 0 0 1px rgba(165,243,252,.13); }
  .answer { width: 100%; min-height: 54px; margin-top: 9px; padding: 10px 11px; resize: vertical; border: 1px solid rgba(255,255,255,.12); border-radius: 11px; outline: 0; color: #f8fafc; background: rgba(2,8,23,.44); font: 12px/1.45 inherit; }
  .answer::placeholder { color: rgba(148,163,184,.66); }
  .answer:focus { border-color: rgba(165,243,252,.6); box-shadow: 0 0 0 3px rgba(165,243,252,.1); }
  .privacy { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 15px; padding: 12px; border: 1px solid rgba(255,255,255,.09); border-radius: 13px; background: rgba(255,255,255,.025); }
  .privacy-title { color: #f8fafc; font-size: 12px; font-weight: 700; }
  .privacy-actions { display: flex; gap: 6px; }
  .privacy-button { min-height: 32px; padding: 6px 9px; border: 1px solid rgba(255,255,255,.13); border-radius: 999px; color: var(--muted); background: transparent; cursor: pointer; font-size: 10px; font-weight: 750; }
  .privacy-button[aria-pressed="true"] { border-color: rgba(253,186,116,.52); color: #ffedd5; background: rgba(249,115,22,.14); }
  .interview-foot { padding-top: 2px; }
  @media (max-width: 420px) { .interview-head { grid-template-columns: 50px minmax(0, 1fr); padding: 13px; } .interview-poster { width: 50px; height: 70px; } .interview-title { font-size: 19px; } .interview-body { padding: 3px 13px 13px; } }
</style></head>
<body><main class="widget"><div data-root></div><p class="subtle" data-bridge-status aria-live="polite"></p></main><script>${bridgeScript}
  (function () {
    var root = document.querySelector("[data-root]");
    var status = document.querySelector("[data-bridge-status]");
    function safeImage(value) { var raw = String(value || ""); if (raw.charAt(0) === "/") return "https://image.tmdb.org/t/p/w500" + raw; try { var url = new URL(raw); return url.protocol === "https:" && url.hostname === "image.tmdb.org" && url.pathname.indexOf("/t/p/") === 0 ? url.href : ""; } catch (_) { return ""; } }
    function string(value, fallback) { return String(value === undefined || value === null ? (fallback || "") : value); }
    function render(data) {
      if (!data || data.kind !== "stamp-interview" || !data.movie || !Array.isArray(data.questions)) { var empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "Waiting for your CineBlock stamp prompts…"; root.replaceChildren(empty); return; }
      var movie = data.movie; var choices = {}; var ownWords = {}; var visibility = false;
      var card = document.createElement("section"); card.className = "interview";
      var head = document.createElement("header"); head.className = "interview-head";
      var poster = document.createElement("div"); poster.className = "interview-poster"; var imageUrl = safeImage(movie.posterUrl); if (imageUrl) { var image = document.createElement("img"); image.src = imageUrl; image.alt = "Poster for " + string(movie.title, "title"); image.loading = "lazy"; image.referrerPolicy = "no-referrer"; poster.appendChild(image); } else { poster.textContent = ""; }
      var headCopy = document.createElement("div"); var eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = data.existingDraft ? "CineBlock / continue a draft" : "CineBlock / personal stamp"; var title = document.createElement("h1"); title.className = "interview-title"; title.textContent = string(movie.title, "Your title"); var sub = document.createElement("p"); sub.className = "subtle"; sub.style.marginTop = "7px"; sub.textContent = "Three small prompts. Answer any one — write your own if the options miss it."; headCopy.append(eyebrow, title, sub); head.append(poster, headCopy); card.appendChild(head);
      var body = document.createElement("div"); body.className = "interview-body";
      data.questions.slice(0, 3).forEach(function (question, index) {
        var section = document.createElement("section"); section.className = "question";
        var heading = document.createElement("h2"); var number = document.createElement("span"); number.className = "question-number"; number.textContent = String(index + 1); heading.append(number, document.createTextNode(string(question.prompt))); section.appendChild(heading);
        var helper = document.createElement("p"); helper.className = "subtle"; helper.style.marginTop = "5px"; helper.textContent = string(question.helper); section.appendChild(helper);
        var options = document.createElement("div"); options.className = "options";
        (Array.isArray(question.options) ? question.options.slice(0, 6) : []).forEach(function (label) { var option = document.createElement("button"); option.type = "button"; option.className = "option"; option.textContent = string(label); option.setAttribute("aria-pressed", "false"); option.addEventListener("click", function () { choices[question.id] = choices[question.id] === label ? "" : label; Array.prototype.forEach.call(options.children, function (button) { button.setAttribute("aria-pressed", button.textContent === choices[question.id] ? "true" : "false"); }); }); options.appendChild(option); }); section.appendChild(options);
        var input = document.createElement("textarea"); input.className = "answer"; input.maxLength = 320; input.rows = 2; input.placeholder = string(question.placeholder, "Write it your way…"); input.setAttribute("aria-label", "Your own words for " + string(question.prompt)); input.addEventListener("input", function () { ownWords[question.id] = input.value.trim(); }); section.appendChild(input); body.appendChild(section);
      });
      var privacy = document.createElement("div"); privacy.className = "privacy"; var privacyCopy = document.createElement("div"); var privacyTitle = document.createElement("p"); privacyTitle.className = "privacy-title"; privacyTitle.textContent = "Keep this feeling"; var privacySub = document.createElement("p"); privacySub.className = "subtle"; privacySub.textContent = "Private by default. You can change it in the preview."; privacyCopy.append(privacyTitle, privacySub); var actions = document.createElement("div"); actions.className = "privacy-actions";
      ["Private", "Public"].forEach(function (label) { var button = document.createElement("button"); button.type = "button"; button.className = "privacy-button"; button.textContent = label; button.setAttribute("aria-pressed", label === "Private" ? "true" : "false"); button.addEventListener("click", function () { visibility = label === "Public"; Array.prototype.forEach.call(actions.children, function (item) { item.setAttribute("aria-pressed", item.textContent === label ? "true" : "false"); }); }); actions.appendChild(button); }); privacy.append(privacyCopy, actions); body.appendChild(privacy);
      var foot = document.createElement("div"); foot.className = "interview-foot"; var submit = document.createElement("button"); submit.type = "button"; submit.className = "primary-button"; submit.textContent = "Turn these into my stamp"; submit.addEventListener("click", function () { var answers = data.questions.slice(0, 3).map(function (question) { return { prompt: string(question.prompt), answer: ownWords[question.id] || choices[question.id] || "" }; }).filter(function (item) { return item.answer; }); if (!answers.length) { status.textContent = "Choose an option or add your own words for at least one prompt."; return; } submit.disabled = true; submit.textContent = "Sending your words…"; var message = "CineBlock stamp answers for the exact title " + string(movie.title) + " (TMDB " + string(movie.id) + ", " + string(movie.mediaType) + "). Visibility: " + (visibility ? "public" : "private") + ".\n" + answers.map(function (item) { return "- " + item.prompt + " — " + item.answer; }).join("\n") + "\n\nUse only these answers. Do not ask more questions. Draft a concise first-person, spoiler-light stamp with no invented feelings, then call preview_stamp for this exact TMDB ID and visibility."; window.cineblockBridge.sendToConversation(message).then(function () { status.textContent = "Your answers are in the conversation. CineBlock will prepare a preview before anything is saved."; submit.textContent = "Answers sent"; }).catch(function () { submit.disabled = false; submit.textContent = "Turn these into my stamp"; }); }); foot.appendChild(submit); body.appendChild(foot); card.appendChild(body); root.replaceChildren(card);
    }
    window.cineblockBridge.registerRenderer(render);
  }());
</script></body></html>`;

const confirmationCardHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CineBlock confirmation</title><style>${widgetStyles}</style></head>
<body><main class="widget"><div data-root></div><p class="subtle" data-bridge-status aria-live="polite"></p></main><script>${bridgeScript}
  (function () {
    var root = document.querySelector("[data-root]");
    function safeImage(value) { var raw = String(value || ""); if (raw.charAt(0) === "/") return "https://image.tmdb.org/t/p/w500" + raw; try { var url = new URL(raw); return url.protocol === "https:" && url.hostname === "image.tmdb.org" && url.pathname.indexOf("/t/p/") === 0 ? url.href : ""; } catch (_) { return ""; } }
    function text(value, fallback) { return String(value === undefined || value === null ? (fallback || "") : value); }
    function button(label, className, handler) { var item = document.createElement("button"); item.type = "button"; item.className = className; item.textContent = label; item.addEventListener("click", handler); return item; }
    function renderSaved(data) {
      var card = document.createElement("section"); card.className = "confirmation saved";
      var mark = document.createElement("div"); mark.className = "saved-mark"; mark.textContent = "✓";
      var eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "CineBlock / saved";
      var title = document.createElement("h1"); title.className = "confirm-title"; title.textContent = text(data.title || data.movieTitle, "Saved");
      var body = document.createElement("p"); body.className = "subtle"; body.style.marginTop = "10px"; body.textContent = text(data.message, "Your CineBlock update is ready.");
      card.append(mark, eyebrow, title, body);
      if (data.link) { var link = document.createElement("a"); link.href = safeLink(data.link); link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Open in CineBlock ↗"; card.appendChild(link); }
      root.replaceChildren(card);
    }
    function safeLink(value) { try { var url = new URL(String(value)); return url.protocol === "https:" && (url.hostname === "www.cineblock.in" || url.hostname === "cineblock.in") ? url.href : "https://www.cineblock.in"; } catch (_) { return "https://www.cineblock.in"; } }
    function render(data) {
      if (!data || typeof data !== "object") { var empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "Waiting for a CineBlock preview…"; root.replaceChildren(empty); return; }
      if (data.kind === "playlist-saved" || data.kind === "stamp-saved") { renderSaved(data); return; }
      var isStamp = data.kind === "stamp-preview";
      var card = document.createElement("section"); card.className = "confirmation";
      var head = document.createElement("div"); head.className = "confirm-head";
      var copy = document.createElement("div"); var eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = isStamp ? "CineBlock / stamp preview" : "CineBlock / playlist preview";
      var title = document.createElement("h1"); title.className = "confirm-title"; title.textContent = isStamp ? text(data.movie && data.movie.title, "Personal stamp") : text(data.title, "New CineBlock"); copy.append(eyebrow, title);
      var badge = document.createElement("span"); badge.className = "badge"; badge.textContent = "Nothing saved"; head.append(copy, badge); card.appendChild(head);
      var visibility = document.createElement("span"); visibility.className = "pill"; visibility.textContent = text(data.isPublic ? "Public" : "Private"); card.appendChild(visibility);
      if (isStamp) {
        var movie = data.movie || {}; var meta = document.createElement("p"); meta.className = "subtle"; meta.style.marginTop = "10px"; meta.textContent = text(movie.mediaType, "movie") + " · " + text(movie.year, "year unknown") + " · TMDB " + text(movie.id); card.appendChild(meta);
        var poster = document.createElement("div"); poster.className = "mini-rail"; appendPoster(poster, movie.posterUrl, movie.title); card.appendChild(poster);
        addDetail(card, "Your exact feeling", data.reviewText, true);
      } else {
        var movies = Array.isArray(data.movies) ? data.movies.slice(0, 35) : []; var count = document.createElement("p"); count.className = "subtle"; count.style.marginTop = "10px"; count.textContent = movies.length + " title" + (movies.length === 1 ? "" : "s") + " · " + text(Array.isArray(data.sources) ? data.sources.join(", ") : "selected library"); card.appendChild(count);
        var rail = document.createElement("div"); rail.className = "mini-rail"; movies.slice(0, 10).forEach(function (movie) { appendPoster(rail, movie.posterPath, movie.movieTitle); }); card.appendChild(rail);
        addDetail(card, "Titles", movies.map(function (movie) { return text(movie.movieTitle, "Untitled"); }).join(" · "), false);
      }
      var note = document.createElement("p"); note.className = "subtle"; note.style.marginTop = "14px"; note.textContent = "Review the exact title, visibility, and text above. Approve here to ask ChatGPT to save this preview."; card.appendChild(note);
      var approve = button("Approve in conversation", "primary-button", function () {
        approve.disabled = true;
        approve.textContent = "Sending approval…";
        window.cineblockBridge.sendToConversation(isStamp ? "I approve this exact CineBlock stamp preview. Call save_stamp with the confirmationToken from the latest preview." : "I approve this exact CineBlock playlist preview. Call create_playlist with the confirmationToken from the latest preview.").then(function () {
          approve.textContent = "Approval sent";
        }).catch(function () {
          approve.disabled = false;
          approve.textContent = "Approve in conversation";
        });
      }); card.appendChild(approve);
      root.replaceChildren(card);
    }
    function appendPoster(parent, value, label) { var imageUrl = safeImage(value); if (!imageUrl) return; var holder = document.createElement("div"); holder.className = "mini-poster"; var image = document.createElement("img"); image.src = imageUrl; image.alt = "Poster for " + text(label, "title"); image.loading = "lazy"; image.referrerPolicy = "no-referrer"; holder.appendChild(image); parent.appendChild(holder); }
    function addDetail(parent, label, value, review) { var detail = document.createElement("div"); detail.className = "detail"; var heading = document.createElement("p"); heading.className = "detail-label"; heading.textContent = label; var content = document.createElement(review ? "pre" : "p"); content.className = review ? "detail-value review" : "detail-value"; content.textContent = text(value, "—"); detail.append(heading, content); parent.appendChild(detail); }
    window.cineblockBridge.registerRenderer(render);
  }());
</script></body></html>`;

export function registerMcpAppResources(server: McpServer) {
  server.registerResource("cineblock-title-carousel", TITLE_CAROUSEL_URI, { title: "CineBlock title carousel", mimeType: RESOURCE_MIME_TYPE, _meta: RESOURCE_META }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: RESOURCE_MIME_TYPE, text: titleCarouselHtml, _meta: RESOURCE_META }],
  }));
  server.registerResource("cineblock-confirmation-card", CONFIRMATION_CARD_URI, { title: "CineBlock confirmation card", mimeType: RESOURCE_MIME_TYPE, _meta: RESOURCE_META }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: RESOURCE_MIME_TYPE, text: confirmationCardHtml, _meta: RESOURCE_META }],
  }));
  server.registerResource("cineblock-stamp-interview", STAMP_INTERVIEW_URI, { title: "CineBlock personal stamp interview", mimeType: RESOURCE_MIME_TYPE, _meta: RESOURCE_META }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: RESOURCE_MIME_TYPE, text: stampInterviewHtml, _meta: RESOURCE_META }],
  }));
}
