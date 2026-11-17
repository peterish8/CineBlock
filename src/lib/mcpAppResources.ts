import type { McpServer } from "@modelcontextprotocol/server";

// Versioned URIs are host cache keys. Bump the version whenever the widget
// HTML/JS contract changes, then reconnect MCP clients so they refetch.
export const TITLE_CAROUSEL_URI = "ui://cineblock/title-carousel/v2.html";
export const CONFIRMATION_CARD_URI = "ui://cineblock/confirmation-card/v2.html";
export const STAMP_INTERVIEW_URI = "ui://cineblock/stamp-interview/v2.html";
// Maximum stamp text length (characters after trimming). Must match
// STAMP_REVIEW_MAX in convex/mcp.ts, convex/stamps.ts and StampModal.tsx.
export const STAMP_TEXT_MAX = 1000;
export const CINEBLOCK_MCP_ICON_URL = "https://www.cineblock.in/brand/cineblock-icon-256.png";
export const CINEBLOCK_MCP_ICON = {
  src: CINEBLOCK_MCP_ICON_URL,
  mimeType: "image/png",
  sizes: ["256x256"],
};

// MCP Apps protocol revision implemented by the bridge below
// (modelcontextprotocol/ext-apps LATEST_PROTOCOL_VERSION).
const MCP_APPS_PROTOCOL_VERSION = "2026-01-26";
const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";
const RESOURCE_META = {
  ui: {
    prefersBorder: true,
    domain: "https://www.cineblock.in",
    csp: { resourceDomains: ["https://image.tmdb.org"] },
  },
};

// NOTE: everything below is emitted inside a TypeScript template literal.
// Never write a bare "\n" escape in the widget JS (it becomes a raw newline and
// breaks the string literal); use "\\n". Avoid backticks and "${" in widget JS.

const widgetStyles = `
  :root {
    color-scheme: dark;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --ink: #020817;
    --ink-2: #050F2E;
    --ink-3: #0A1628;
    --glass: rgba(255, 255, 255, .06);
    --glass-raised: rgba(255, 255, 255, .09);
    --line: rgba(255, 255, 255, .12);
    --text: #f8fafc;
    --muted: rgba(226, 232, 240, .72);
    --blue: #60A5FA;
    --blue-soft: rgba(96, 165, 250, .16);
    --orange: #F97316;
    --orange-soft: rgba(249, 115, 22, .14);
    --danger: #fca5a5;
    --success: #86efac;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    min-width: 280px;
    color: var(--text);
    background:
      radial-gradient(circle at 8% 0%, rgba(96, 165, 250, .14), transparent 19rem),
      radial-gradient(circle at 94% 100%, rgba(249, 115, 22, .1), transparent 18rem),
      linear-gradient(180deg, var(--ink-2), var(--ink));
  }
  button, textarea { font: inherit; }
  .widget { padding: 16px; }
  .eyebrow { color: var(--blue); font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .heading > div:first-child { min-width: 0; }
  h1, h2, p { margin: 0; }
  h1 { font-size: 20px; letter-spacing: -.03em; line-height: 1.15; overflow-wrap: anywhere; }
  .subtle { color: var(--muted); font-size: 12px; line-height: 1.5; }
  .status { min-height: 18px; margin-top: 10px; color: var(--muted); font-size: 12px; line-height: 1.5; }
  .status[data-tone="error"] { color: var(--danger); }
  .status[data-tone="success"] { color: var(--success); }
  .rail-actions { display: flex; gap: 6px; flex: none; }
  .icon-button, .primary-button, .secondary-button, .choose, .option, .privacy-button {
    border: 1px solid var(--line);
    color: var(--text);
    background: var(--glass);
    cursor: pointer;
    transition: transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .icon-button { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; font-size: 20px; line-height: 1; }
  .icon-button:hover:not(:disabled), .secondary-button:hover:not(:disabled), .option:hover, .privacy-button:hover { border-color: rgba(96, 165, 250, .55); background: var(--blue-soft); }
  .icon-button:active:not(:disabled), .primary-button:active:not(:disabled), .secondary-button:active:not(:disabled), .choose:active:not(:disabled) { transform: scale(.97); }
  :is(.icon-button, .primary-button, .secondary-button, .choose, .option, .privacy-button, a, .rail):focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
  button:disabled { cursor: not-allowed; opacity: .5; }
  button[aria-busy="true"] { cursor: progress; opacity: .75; }
  .rail { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(148px, 19%); gap: 12px; overflow-x: auto; overscroll-behavior-inline: contain; scroll-snap-type: x proximity; padding: 2px 2px 12px; scrollbar-width: thin; scrollbar-color: rgba(96, 165, 250, .55) rgba(255, 255, 255, .06); }
  .rail::-webkit-scrollbar { height: 6px; }
  .rail::-webkit-scrollbar-track { background: rgba(255, 255, 255, .06); border-radius: 99px; }
  .rail::-webkit-scrollbar-thumb { background: rgba(96, 165, 250, .6); border-radius: 99px; }
  .movie { display: flex; flex-direction: column; min-width: 0; scroll-snap-align: start; animation: lift-in .42s cubic-bezier(.22, 1, .36, 1) both; }
  .poster { position: relative; aspect-ratio: 2 / 3; overflow: hidden; border: 1px solid rgba(255, 255, 255, .13); border-radius: 14px; background: linear-gradient(145deg, rgba(96, 165, 250, .18), rgba(255, 255, 255, .04)); box-shadow: 0 12px 28px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255, 255, 255, .14); }
  .poster img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .45s ease; }
  .movie:hover .poster img { transform: scale(1.04); }
  .poster-empty { display: grid; height: 100%; place-items: center; padding: 14px; color: rgba(226, 232, 240, .55); text-align: center; font-size: 11px; }
  .movie-title { margin-top: 9px; color: var(--text); font-size: 13px; font-weight: 650; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
  .movie-meta { margin-top: 4px; color: rgba(191, 219, 254, .7); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
  .choose { width: 100%; min-height: 44px; margin-top: auto; padding: 9px 10px; border-radius: 12px; color: var(--ink); background: var(--blue); border-color: rgba(147, 197, 253, .6); font-size: 12px; font-weight: 750; }
  .movie-meta + .choose { margin-top: 9px; }
  .choose[data-sent="true"] { color: var(--text); background: var(--orange-soft); border-color: rgba(249, 115, 22, .5); }
  .empty { padding: 22px 12px; border: 1px dashed var(--line); border-radius: 16px; color: var(--muted); text-align: center; font-size: 12px; line-height: 1.5; }
  .empty[data-tone="error"] { border-style: solid; border-color: rgba(252, 165, 165, .35); color: var(--danger); background: rgba(127, 29, 29, .16); }
  .skeleton { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(148px, 19%); gap: 12px; overflow: hidden; }
  .skeleton span { aspect-ratio: 2 / 3; border-radius: 14px; background: linear-gradient(100deg, rgba(255,255,255,.05) 30%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.05) 70%); background-size: 300% 100%; animation: shimmer 1.4s ease-in-out infinite; }
  .confirmation { border: 1px solid var(--line); border-radius: 20px; background: linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); box-shadow: 0 16px 42px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.11); padding: 17px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
  .confirm-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
  .confirm-head > div { min-width: 0; }
  .badge { display: inline-flex; flex: none; align-items: center; gap: 6px; padding: 6px 9px; border: 1px solid rgba(96, 165, 250, .3); border-radius: 99px; color: var(--blue); background: var(--blue-soft); font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
  .badge::before { content: ""; width: 6px; height: 6px; border-radius: 99px; background: currentColor; }
  .confirm-title { margin-top: 8px; font-size: 22px; line-height: 1.1; letter-spacing: -.03em; overflow-wrap: anywhere; }
  .pill { display: inline-block; margin-top: 10px; padding: 5px 9px; border-radius: 99px; background: var(--orange-soft); color: #fdba74; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
  .mini-rail { display: flex; gap: 8px; overflow-x: auto; margin: 16px 0 0; padding-bottom: 4px; }
  .mini-poster { flex: 0 0 54px; width: 54px; height: 78px; overflow: hidden; border-radius: 9px; border: 1px solid rgba(255, 255, 255, .14); background: rgba(255,255,255,.06); }
  .mini-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .mini-poster-empty { display: grid; place-items: center; height: 100%; padding: 4px; color: rgba(226, 232, 240, .5); font-size: 8px; text-align: center; }
  .detail { margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--line); }
  .detail-label { color: rgba(191, 219, 254, .7); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .detail-value { margin-top: 5px; color: var(--text); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
  .review { max-height: 180px; margin-bottom: 0; overflow: auto; white-space: pre-wrap; color: rgba(226, 232, 240, .88); font: 12px/1.65 ui-monospace, SFMono-Regular, Consolas, monospace; }
  .primary-button, .secondary-button { display: block; width: 100%; min-height: 44px; margin-top: 12px; padding: 11px 13px; border-radius: 12px; font-size: 13px; font-weight: 750; }
  .primary-button { color: var(--ink); background: var(--blue); border-color: rgba(147, 197, 253, .6); }
  .primary-button:hover:not(:disabled) { box-shadow: 0 8px 20px rgba(96, 165, 250, .25); }
  .saved { text-align: center; }
  .saved-mark { display: grid; width: 44px; height: 44px; margin: 0 auto 12px; place-items: center; border: 1px solid rgba(134, 239, 172, .35); border-radius: 50%; color: var(--success); background: rgba(74, 222, 128, .1); font-size: 20px; }
  .saved a { display: inline-flex; align-items: center; min-height: 44px; margin-top: 8px; padding: 0 6px; color: var(--blue); font-size: 13px; font-weight: 650; text-decoration: none; }
  .saved a:hover { text-decoration: underline; }
  @keyframes lift-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
  @media (max-width: 520px) { .rail, .skeleton { grid-auto-columns: minmax(136px, 44vw); } .widget { padding: 12px; } .confirmation { padding: 14px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
`;

// Shared MCP Apps bridge (ui/* JSON-RPC over postMessage) with a ChatGPT
// window.openai compatibility fallback. Exposes window.cineblockBridge.
const bridgeScript = `
  (function () {
    var pending = new Map();
    var nextId = 1;
    var state = { initialized: false, initDone: false, hostCapabilities: {}, hostContext: {}, renderer: null, latest: null, lastKey: null };

    function openai() { return window.openai && typeof window.openai === "object" ? window.openai : null; }
    function toError(value, fallback) {
      if (value instanceof Error) return value;
      var error = new Error(value && typeof value.message === "string" && value.message ? value.message : (fallback || "Something went wrong."));
      if (value && typeof value.code === "number") error.code = value.code;
      return error;
    }
    function post(message) { window.parent.postMessage(message, "*"); }
    function rpc(method, params, timeoutMs) {
      var id = nextId++;
      return new Promise(function (resolve, reject) {
        var timer = window.setTimeout(function () {
          if (!pending.has(id)) return;
          pending.delete(id);
          var error = new Error("The chat app did not respond. Please try again.");
          error.timeout = true;
          reject(error);
        }, timeoutMs || 10000);
        pending.set(id, {
          resolve: function (value) { window.clearTimeout(timer); resolve(value); },
          reject: function (error) { window.clearTimeout(timer); reject(error); }
        });
        try { post({ jsonrpc: "2.0", id: id, method: method, params: params || {} }); }
        catch (error) { pending.delete(id); window.clearTimeout(timer); reject(toError(error)); }
      });
    }
    function notify(method, params) {
      try { post({ jsonrpc: "2.0", method: method, params: params || {} }); } catch (_) {}
    }
    function reply(id, result, error) {
      try { post(error ? { jsonrpc: "2.0", id: id, error: error } : { jsonrpc: "2.0", id: id, result: result || {} }); } catch (_) {}
    }
    function textFrom(content) {
      if (!Array.isArray(content)) return "";
      return content.filter(function (block) { return block && block.type === "text" && typeof block.text === "string"; }).map(function (block) { return block.text; }).join(" ").trim();
    }

    // Normalise a CallToolResult (or window.openai payload) to { data, error }.
    function normaliseResult(result) {
      if (!result || typeof result !== "object") return { data: null, error: null };
      if (result.isError) return { data: null, error: textFrom(result.content) || "CineBlock could not finish that request." };
      var data = result.structuredContent && typeof result.structuredContent === "object" ? result.structuredContent : null;
      return { data: data, error: data ? null : (textFrom(result.content) || null) };
    }
    function deliver(payload) {
      var key;
      try { key = JSON.stringify(payload); } catch (_) { key = String(Math.random()); }
      // Hosts may re-send the same result (or fire openai:set_globals for
      // unrelated changes). Re-rendering would wipe in-progress answers.
      if (key === state.lastKey) return;
      state.lastKey = key;
      state.latest = payload;
      if (state.renderer) {
        try { state.renderer(payload.data, payload.error); } catch (error) { console.error("CineBlock widget render failed", error && error.message); }
      }
    }
    function registerRenderer(renderer) {
      state.renderer = renderer;
      renderer(state.latest ? state.latest.data : null, state.latest ? state.latest.error : null);
    }

    function reportSize() {
      var height = Math.ceil(document.documentElement.getBoundingClientRect().height);
      var width = Math.ceil(document.documentElement.getBoundingClientRect().width);
      if (state.initialized) notify("ui/notifications/size-changed", { width: width, height: height });
      var host = openai();
      if (host && typeof host.notifyIntrinsicHeight === "function") { try { host.notifyIntrinsicHeight(height); } catch (_) {} }
    }
    var sizeQueued = false;
    function queueSize() {
      if (sizeQueued) return;
      sizeQueued = true;
      window.requestAnimationFrame(function () { sizeQueued = false; reportSize(); });
    }
    if (typeof ResizeObserver === "function") new ResizeObserver(queueSize).observe(document.documentElement);

    function applyHostContext(context) {
      if (!context || typeof context !== "object") return;
      for (var key in context) state.hostContext[key] = context[key];
      if (context.theme === "light" || context.theme === "dark") document.documentElement.setAttribute("data-host-theme", context.theme);
      var insets = context.safeAreaInsets;
      if (insets && typeof insets === "object") {
        document.body.style.paddingTop = (Number(insets.top) || 0) + "px";
        document.body.style.paddingRight = (Number(insets.right) || 0) + "px";
        document.body.style.paddingBottom = (Number(insets.bottom) || 0) + "px";
        document.body.style.paddingLeft = (Number(insets.left) || 0) + "px";
      }
    }

    window.addEventListener("message", function (event) {
      if (event.source !== window.parent) return;
      var message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.method === undefined && message.id !== undefined) {
        var entry = pending.get(message.id);
        if (!entry) return;
        pending.delete(message.id);
        if (message.error) entry.reject(toError(message.error, "The chat app rejected the request."));
        else entry.resolve(message.result);
        return;
      }
      if (message.id !== undefined && typeof message.method === "string") {
        // Requests from the host must always be answered.
        if (message.method === "ui/resource-teardown" || message.method === "ping") reply(message.id, {});
        else reply(message.id, null, { code: -32601, message: "Method not found" });
        return;
      }
      if (message.method === "ui/notifications/tool-result") deliver(normaliseResult(message.params));
      else if (message.method === "ui/notifications/tool-cancelled") deliver({ data: null, error: "The request was cancelled before CineBlock finished." });
      else if (message.method === "ui/notifications/host-context-changed") applyHostContext(message.params);
    });

    // ChatGPT Apps SDK compatibility: toolOutput + openai:set_globals.
    function readOpenAiGlobals(globals) {
      if (!globals || typeof globals !== "object") return;
      if (globals.toolOutput && typeof globals.toolOutput === "object") deliver({ data: globals.toolOutput, error: null });
    }
    window.addEventListener("openai:set_globals", function (event) {
      readOpenAiGlobals(event && event.detail && event.detail.globals);
    });
    if (openai()) readOpenAiGlobals(openai());

    rpc("ui/initialize", {
      protocolVersion: "${MCP_APPS_PROTOCOL_VERSION}",
      appInfo: { name: "cineblock-mcp-app", title: "CineBlock", version: "2.0.0", websiteUrl: "https://www.cineblock.in", icons: [{ src: "${CINEBLOCK_MCP_ICON_URL}", mimeType: "image/png", sizes: ["256x256"] }] },
      appCapabilities: { availableDisplayModes: ["inline"] }
    }, 8000).then(function (result) {
      state.initialized = true;
      state.hostCapabilities = (result && result.hostCapabilities) || {};
      applyHostContext(result && result.hostContext);
      notify("ui/notifications/initialized", {});
      queueSize();
    }).catch(function () {
      // No MCP Apps host. ChatGPT's window.openai bridge may still deliver data.
      if (!state.latest && !openai()) deliver({ data: null, error: "This chat app did not connect to the CineBlock card. The same details are in the chat reply." });
    }).then(function () { state.initDone = true; });

    function waitForInit() {
      if (state.initDone) return Promise.resolve();
      return new Promise(function (resolve) {
        var started = Date.now();
        (function check() { if (state.initDone || Date.now() - started > 9000) resolve(); else window.setTimeout(check, 50); }());
      });
    }
    function fallbackAllowed(error) { return !!error && (error.code === -32601 || error.timeout === true); }

    function callTool(name, args) {
      return waitForInit().then(function () {
        var host = openai();
        var viaOpenAi = function () {
          return Promise.resolve(host.callTool(name, args)).then(function (response) {
            if (response && typeof response.result === "string" && !response.structuredContent && !response.content) {
              try { return { structuredContent: JSON.parse(response.result) }; } catch (_) { return { content: [{ type: "text", text: response.result }] }; }
            }
            return response;
          });
        };
        var attempt = state.initialized
          ? rpc("tools/call", { name: name, arguments: args }, 45000).catch(function (error) {
              if (host && typeof host.callTool === "function" && fallbackAllowed(error)) return viaOpenAi();
              throw error;
            })
          : (host && typeof host.callTool === "function" ? viaOpenAi() : Promise.reject(new Error("This chat app does not let CineBlock cards run actions. Reply in the chat instead.")));
        return attempt.then(function (result) {
          var normalised = normaliseResult(result);
          if (normalised.error && !normalised.data) throw new Error(normalised.error);
          if (!normalised.data) throw new Error("CineBlock returned an empty response. Please try again.");
          return normalised.data;
        });
      });
    }

    function sendMessage(text) {
      return waitForInit().then(function () {
        var host = openai();
        var viaOpenAi = function () { return Promise.resolve(host.sendFollowUpMessage({ prompt: text })); };
        if (state.initialized) {
          return rpc("ui/message", { role: "user", content: [{ type: "text", text: text }] }, 15000).then(function (result) {
            if (result && result.isError) throw new Error("The chat app did not accept the message.");
            return result;
          }).catch(function (error) {
            if (host && typeof host.sendFollowUpMessage === "function" && error && error.code === -32601) return viaOpenAi();
            throw error;
          });
        }
        if (host && typeof host.sendFollowUpMessage === "function") return viaOpenAi();
        throw new Error("This chat app does not let CineBlock cards send messages.");
      });
    }

    function openLink(url) {
      return waitForInit().then(function () {
        var host = openai();
        if (state.initialized) {
          return rpc("ui/open-link", { url: url }, 10000).then(function (result) {
            if (result && result.isError) throw new Error("Link blocked");
          }).catch(function () {
            if (host && typeof host.openExternal === "function") return host.openExternal({ href: url });
            window.open(url, "_blank", "noopener,noreferrer");
          });
        }
        if (host && typeof host.openExternal === "function") return host.openExternal({ href: url });
        window.open(url, "_blank", "noopener,noreferrer");
      });
    }

    // Best effort: tell the model what the user just did inside the card.
    function updateModelContext(text, structuredContent) {
      if (!state.initialized) return Promise.resolve();
      return rpc("ui/update-model-context", { content: [{ type: "text", text: text }], structuredContent: structuredContent }, 8000).catch(function () {});
    }

    function getWidgetState() { var host = openai(); return host && host.widgetState && typeof host.widgetState === "object" ? host.widgetState : null; }
    function setWidgetState(value) { var host = openai(); if (host && typeof host.setWidgetState === "function") { try { host.setWidgetState(value); } catch (_) {} } }

    window.cineblockBridge = {
      registerRenderer: registerRenderer,
      callTool: callTool,
      sendMessage: sendMessage,
      openLink: openLink,
      updateModelContext: updateModelContext,
      getWidgetState: getWidgetState,
      setWidgetState: setWidgetState,
      resize: queueSize
    };
  }());
`;

// Shared DOM helpers + preview/saved card renderer used by the confirmation
// card and by the inline preview inside the stamp interview.
const uiScript = `
  (function () {
    function text(value, fallback) { return String(value === undefined || value === null || value === "" ? (fallback || "") : value); }
    function sentence(value, fallback) { var copy = text(value, fallback).trim(); return /[.!?]$/.test(copy) ? copy : copy + "."; }
    function el(tag, className, content) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (content !== undefined) node.textContent = content;
      return node;
    }
    function button(label, className, handler) {
      var node = el("button", className, label);
      node.type = "button";
      node.addEventListener("click", handler);
      return node;
    }
    function safeImage(value) {
      var raw = String(value || "");
      if (!raw) return "";
      if (raw.charAt(0) === "/" && raw.charAt(1) !== "/") return "https://image.tmdb.org/t/p/w500" + raw;
      try { var url = new URL(raw); return url.protocol === "https:" && url.hostname === "image.tmdb.org" && url.pathname.indexOf("/t/p/") === 0 ? url.href : ""; } catch (_) { return ""; }
    }
    var ALLOWED_LINK_HOSTS = ["www.cineblock.in", "cineblock.in", "cineblock.vercel.app"];
    function safeLink(value) {
      try { var url = new URL(String(value)); return url.protocol === "https:" && ALLOWED_LINK_HOSTS.indexOf(url.hostname) !== -1 ? url.href : "https://www.cineblock.in"; } catch (_) { return "https://www.cineblock.in"; }
    }
    function poster(className, value, label, emptyClass) {
      var holder = el("div", className);
      var src = safeImage(value);
      if (src) {
        var image = el("img");
        image.src = src; image.alt = "Poster for " + text(label, "title"); image.loading = "lazy"; image.referrerPolicy = "no-referrer";
        image.addEventListener("error", function () { holder.replaceChildren(el("span", emptyClass, "No poster")); });
        holder.appendChild(image);
      } else {
        holder.appendChild(el("span", emptyClass, "No poster"));
      }
      return holder;
    }
    function setStatus(node, message, tone) {
      if (!node) return;
      node.textContent = message || "";
      if (tone) node.setAttribute("data-tone", tone); else node.removeAttribute("data-tone");
    }
    function setBusy(node, busy, label) {
      node.disabled = !!busy;
      if (busy) node.setAttribute("aria-busy", "true"); else node.removeAttribute("aria-busy");
      if (label) node.textContent = label;
    }
    function message(root, copy, tone) {
      var box = el("div", "empty", copy);
      if (tone) box.setAttribute("data-tone", tone);
      box.setAttribute("role", tone === "error" ? "alert" : "status");
      root.replaceChildren(box);
    }
    function addDetail(parent, label, value, review) {
      var detail = el("div", "detail");
      detail.appendChild(el("p", "detail-label", label));
      detail.appendChild(el(review ? "pre" : "p", review ? "detail-value review" : "detail-value", text(value, "-")));
      parent.appendChild(detail);
    }

    function renderSaved(root, data) {
      var card = el("section", "confirmation saved");
      card.setAttribute("role", "status");
      card.appendChild(el("div", "saved-mark", "\\u2713"));
      card.appendChild(el("p", "eyebrow", data.kind === "stamp-saved" ? "CineBlock / stamp saved" : "CineBlock / saved"));
      card.appendChild(el("h1", "confirm-title", text(data.title || data.movieTitle, "Saved")));
      var body = el("p", "subtle", text(data.message, "Your CineBlock update is saved."));
      body.style.marginTop = "10px";
      card.appendChild(body);
      if (data.link) {
        var href = safeLink(data.link);
        var link = el("a", "", data.kind === "stamp-saved" ? "Open your profile \\u2197" : "Open in CineBlock \\u2197");
        link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.addEventListener("click", function (event) { event.preventDefault(); window.cineblockBridge.openLink(href); });
        card.appendChild(link);
      }
      root.replaceChildren(card);
    }

    // Renders a playlist/stamp preview with a direct "Approve & save" action.
    // The write is a separate tools/call carrying the exact confirmationToken
    // the server issued for this preview; nothing else is sent.
    function renderPreview(root, data, options) {
      options = options || {};
      var isStamp = data.kind === "stamp-preview";
      var card = el("section", "confirmation");
      var head = el("div", "confirm-head");
      var copy = el("div");
      copy.appendChild(el("p", "eyebrow", isStamp ? "CineBlock / stamp preview" : "CineBlock / playlist preview"));
      copy.appendChild(el("h1", "confirm-title", isStamp ? text(data.movie && data.movie.title, "Personal stamp") : text(data.title, "New CineBlock")));
      head.appendChild(copy);
      head.appendChild(el("span", "badge", "Not saved yet"));
      card.appendChild(head);
      card.appendChild(el("span", "pill", data.isPublic ? "Public" : "Private"));
      if (isStamp) {
        var movie = data.movie || {};
        var meta = el("p", "subtle", (movie.mediaType === "tv" ? "TV series" : "Movie") + " \\u00b7 " + text(movie.year, "year unknown") + " \\u00b7 TMDB " + text(movie.id));
        meta.style.marginTop = "10px";
        card.appendChild(meta);
        var rail = el("div", "mini-rail");
        rail.appendChild(poster("mini-poster", movie.posterUrl, movie.title, "mini-poster-empty"));
        card.appendChild(rail);
        var review = text(data.reviewText);
        addDetail(card, "Your words \\u00b7 " + review.length + "/1000", review, true);
      } else {
        var movies = Array.isArray(data.movies) ? data.movies.slice(0, 35) : [];
        var count = el("p", "subtle", movies.length + " title" + (movies.length === 1 ? "" : "s") + " \\u00b7 " + (Array.isArray(data.sources) && data.sources.length ? data.sources.join(", ") : "selected library"));
        count.style.marginTop = "10px";
        card.appendChild(count);
        var miniRail = el("div", "mini-rail");
        miniRail.setAttribute("aria-label", "Poster preview");
        movies.slice(0, 12).forEach(function (item) { miniRail.appendChild(poster("mini-poster", item.posterPath, item.movieTitle, "mini-poster-empty")); });
        card.appendChild(miniRail);
        if (data.description) addDetail(card, "Description", data.description, false);
        addDetail(card, "Titles", movies.map(function (item) { return text(item.movieTitle, "Untitled"); }).join(" \\u00b7 "), false);
      }
      var note = el("p", "subtle", "Check the title, visibility, and text. Nothing is saved until you approve.");
      note.style.marginTop = "14px";
      card.appendChild(note);
      var status = el("p", "status");
      status.setAttribute("aria-live", "polite");
      var token = typeof data.confirmationToken === "string" ? data.confirmationToken : "";
      var label = isStamp ? "Approve & save stamp" : "Approve & save CineBlock";
      var busy = false;
      var approve = button(label, "primary-button", function () {
        if (busy || !token) return;
        busy = true;
        setBusy(approve, true, "Saving\\u2026");
        if (back) back.disabled = true;
        setStatus(status, "");
        window.cineblockBridge.callTool(isStamp ? "save_stamp" : "create_playlist", { confirmationToken: token }).then(function (saved) {
          if (!saved || (saved.kind !== "stamp-saved" && saved.kind !== "playlist-saved")) throw new Error("CineBlock returned an unexpected response.");
          window.cineblockBridge.setWidgetState({ saved: saved });
          renderSaved(root, saved);
          window.cineblockBridge.updateModelContext(
            (isStamp ? "The user approved and saved this CineBlock stamp from the card: " : "The user approved and saved this CineBlock playlist from the card: ") + text(saved.title || saved.movieTitle) + ". Link: " + text(saved.link) + ". Do not call the save tool again.",
            saved
          );
        }).catch(function (error) {
          busy = false;
          setBusy(approve, false, "Try again");
          if (back) back.disabled = false;
          setStatus(status, (error && error.message) || "Saving failed. Please try again.", "error");
        });
      });
      card.appendChild(approve);
      var back = null;
      if (typeof options.onBack === "function") {
        back = button("Back to edit", "secondary-button", options.onBack);
        card.appendChild(back);
      }
      if (!token) {
        approve.disabled = true;
        setStatus(status, "This preview has no approval handle. Ask CineBlock to prepare the preview again.", "error");
      }
      card.appendChild(status);
      root.replaceChildren(card);
    }

    window.cineblockUi = { text: text, sentence: sentence, el: el, button: button, safeImage: safeImage, poster: poster, setStatus: setStatus, setBusy: setBusy, message: message, renderSaved: renderSaved, renderPreview: renderPreview };
  }());
`;

function page(title: string, extraStyles: string, body: string, script: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${widgetStyles}${extraStyles}</style></head>
<body>${body}<script>${bridgeScript}${uiScript}${script}</script></body></html>`;
}

const titleCarouselHtml = page(
  "CineBlock title results",
  "",
  `<main class="widget"><div class="heading"><div><p class="eyebrow">CineBlock / find your movie</p><h1>Choose your next screen.</h1><p class="subtle" data-count>Finding exact title matches…</p></div><div class="rail-actions" data-rail-actions hidden><button class="icon-button" type="button" data-prev aria-label="Scroll titles left">‹</button><button class="icon-button" type="button" data-next aria-label="Scroll titles right">›</button></div></div><div data-root></div><p class="status" data-status aria-live="polite"></p></main>`,
  `
  (function () {
    var ui = window.cineblockUi;
    var root = document.querySelector("[data-root]");
    var count = document.querySelector("[data-count]");
    var status = document.querySelector("[data-status]");
    var actions = document.querySelector("[data-rail-actions]");
    var prev = document.querySelector("[data-prev]");
    var next = document.querySelector("[data-next]");
    var rail = null;
    function updateArrows() {
      if (!rail) { actions.hidden = true; return; }
      var overflow = rail.scrollWidth - rail.clientWidth > 4;
      actions.hidden = !overflow;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    }
    function loading() {
      var skeleton = ui.el("div", "skeleton");
      skeleton.setAttribute("aria-hidden", "true");
      for (var i = 0; i < 4; i++) skeleton.appendChild(ui.el("span"));
      root.replaceChildren(skeleton);
    }
    function render(data, error) {
      rail = null;
      if (error) { count.textContent = "Search didn't finish."; ui.message(root, error, "error"); updateArrows(); return; }
      if (!data) { count.textContent = "Finding exact title matches\\u2026"; loading(); updateArrows(); return; }
      var titles = Array.isArray(data.titles) ? data.titles.slice(0, 8) : [];
      if (!titles.length) {
        count.textContent = "No matching titles found.";
        ui.message(root, "No movie or series matched" + (data.query ? " \\u201c" + ui.text(data.query) + "\\u201d" : "") + ". Try a different spelling or add the year.");
        updateArrows();
        return;
      }
      count.textContent = titles.length + " match" + (titles.length === 1 ? "" : "es") + " \\u00b7 choose one to continue";
      rail = ui.el("div", "rail");
      rail.setAttribute("role", "list");
      rail.setAttribute("aria-label", "Title results");
      titles.forEach(function (title, index) {
        var name = ui.text(title && title.title, "Untitled");
        var card = ui.el("article", "movie");
        card.setAttribute("role", "listitem");
        card.style.animationDelay = Math.min(index * 45, 280) + "ms";
        card.appendChild(ui.poster("poster", title && title.posterUrl, name, "poster-empty"));
        var heading = ui.el("h2", "movie-title", name);
        heading.title = name;
        card.appendChild(heading);
        card.appendChild(ui.el("p", "movie-meta", (title.mediaType === "tv" ? "Series" : "Movie") + " \\u00b7 " + ui.text(title.year, "Year unknown")));
        var choose = ui.button("Use this title", "choose", function () {
          if (choose.disabled) return;
          ui.setBusy(choose, true, "Sending\\u2026");
          ui.setStatus(status, "");
          var identity = name + " (" + ui.text(title.year, "year unknown") + ", " + (title.mediaType === "tv" ? "tv" : "movie") + ", TMDB " + ui.text(title.id) + ")";
          window.cineblockBridge.sendMessage("Use this exact CineBlock title: " + identity + ".").then(function () {
            ui.setBusy(choose, false, "Selected \\u2713");
            choose.setAttribute("data-sent", "true");
            ui.setStatus(status, name + " was sent to the chat. Tell CineBlock what to do next, like starting a stamp.", "success");
          }).catch(function (sendError) {
            ui.setBusy(choose, false, "Use this title");
            ui.setStatus(status, ui.sentence(sendError && sendError.message, "Could not send the title.") + " You can type: Use " + identity + ".", "error");
          });
        });
        choose.setAttribute("aria-label", "Use " + name);
        card.appendChild(choose);
        rail.appendChild(card);
      });
      rail.addEventListener("scroll", updateArrows, { passive: true });
      root.replaceChildren(rail);
      window.requestAnimationFrame(updateArrows);
    }
    prev.addEventListener("click", function () { if (rail) rail.scrollBy({ left: -rail.clientWidth * .8, behavior: "smooth" }); });
    next.addEventListener("click", function () { if (rail) rail.scrollBy({ left: rail.clientWidth * .8, behavior: "smooth" }); });
    window.addEventListener("resize", updateArrows);
    window.cineblockBridge.registerRenderer(render);
  }());
`,
);

const stampInterviewStyles = `
  .interview { border: 1px solid var(--line); border-radius: 20px; overflow: hidden; background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025)); box-shadow: 0 16px 42px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
  .interview-head { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 13px; align-items: center; padding: 16px; border-bottom: 1px solid var(--line); }
  .interview-poster { width: 64px; height: 92px; overflow: hidden; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: rgba(255,255,255,.05); }
  .interview-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .interview-title { margin-top: 4px; font-size: 22px; line-height: 1.1; letter-spacing: -.035em; overflow-wrap: anywhere; }
  .interview-body { padding: 4px 16px 16px; }
  .question { padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
  .question-number { display: inline-grid; width: 20px; height: 20px; margin-right: 7px; place-items: center; border: 1px solid rgba(96,165,250,.45); border-radius: 50%; color: var(--blue); font-size: 10px; font-weight: 800; vertical-align: 1px; }
  .question h2 { display: inline; font-size: 14px; line-height: 1.35; letter-spacing: -.01em; }
  .options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .option { min-height: 44px; padding: 8px 14px; border-radius: 999px; color: rgba(226,232,240,.88); font-size: 12px; }
  .option[aria-pressed="true"] { border-color: var(--blue); color: var(--ink); background: var(--blue); font-weight: 700; }
  .answer { display: block; width: 100%; min-height: 56px; margin-top: 10px; padding: 10px 11px; resize: vertical; border: 1px solid rgba(255,255,255,.14); border-radius: 11px; outline: 0; color: var(--text); background: rgba(2,8,23,.55); font-family: inherit; font-size: 13px; line-height: 1.45; }
  .answer::placeholder { color: rgba(148,163,184,.75); }
  .answer:focus-visible { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(96,165,250,.25); }
  .field-meta { margin-top: 4px; color: rgba(148,163,184,.8); font-size: 11px; text-align: right; }
  .privacy { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 15px; padding: 12px; border: 1px solid rgba(255,255,255,.09); border-radius: 13px; background: rgba(255,255,255,.03); }
  .privacy-title { color: var(--text); font-size: 13px; font-weight: 700; }
  .privacy-actions { display: flex; gap: 6px; }
  .privacy-button { min-height: 44px; min-width: 76px; padding: 8px 14px; border-radius: 999px; color: var(--muted); background: transparent; font-size: 12px; font-weight: 750; }
  .privacy-button[aria-pressed="true"] { border-color: rgba(249,115,22,.6); color: #ffedd5; background: var(--orange-soft); }
  .counter { margin-top: 14px; color: var(--muted); font-size: 12px; }
  .counter[data-tone="warn"], .field-meta[data-tone="warn"] { color: #fdba74; font-weight: 700; }
  .counter[data-tone="error"] { color: var(--danger); font-weight: 700; }
  @media (max-width: 420px) { .interview-head { grid-template-columns: 52px minmax(0, 1fr); padding: 13px; } .interview-poster { width: 52px; height: 76px; } .interview-title { font-size: 19px; } .interview-body { padding: 3px 13px 13px; } .privacy-actions { width: 100%; } .privacy-button { flex: 1; } }
`;

const stampInterviewHtml = page(
  "CineBlock stamp interview",
  stampInterviewStyles,
  `<main class="widget"><div data-root></div></main>`,
  `
  (function () {
    var ui = window.cineblockUi;
    var root = document.querySelector("[data-root]");
    var MAX_STAMP = ${STAMP_TEXT_MAX};
    var WARN_AT = Math.floor(MAX_STAMP * 0.9);
    var HEADINGS = { feeling: "How it left me", memory: "What stayed with me", meaning: "Why it mattered", extra: "Anything else" };
    var builtFor = null;

    function render(data, error) {
      if (error) { builtFor = null; ui.message(root, error, "error"); return; }
      if (!data) { builtFor = null; ui.message(root, "Loading your stamp prompts\\u2026"); return; }
      if (data.kind === "stamp-preview" || data.kind === "playlist-preview") { builtFor = null; ui.renderPreview(root, data); return; }
      if (data.kind === "stamp-saved" || data.kind === "playlist-saved") { builtFor = null; ui.renderSaved(root, data); return; }
      if (data.kind !== "stamp-interview" || !data.movie || !Array.isArray(data.questions)) { builtFor = null; ui.message(root, "CineBlock could not load the stamp prompts. Ask again in the chat.", "error"); return; }
      var movie = data.movie;
      var identityKey = String(movie.id) + ":" + String(movie.mediaType);
      if (builtFor === identityKey) return; // keep the user's in-progress answers
      builtFor = identityKey;
      var validIdentity = Number.isInteger(movie.id) && movie.id > 0 && (movie.mediaType === "movie" || movie.mediaType === "tv");
      var questions = data.questions.slice(0, 3);
      var choices = {}; var ownWords = {}; var isPublic = false; var busy = false;

      var card = ui.el("section", "interview");
      card.setAttribute("aria-label", "Personal stamp for " + ui.text(movie.title, "this title"));
      var head = ui.el("header", "interview-head");
      head.appendChild(ui.poster("interview-poster", movie.posterUrl, movie.title, "mini-poster-empty"));
      var headCopy = ui.el("div");
      headCopy.appendChild(ui.el("p", "eyebrow", data.existingDraft ? "CineBlock / continue a draft" : "CineBlock / personal stamp"));
      headCopy.appendChild(ui.el("h1", "interview-title", ui.text(movie.title, "Your title")));
      var sub = ui.el("p", "subtle", (movie.mediaType === "tv" ? "Series" : "Movie") + " \\u00b7 " + ui.text(movie.year, "year unknown") + ". Answer any one prompt; tap an option, write your own, or both.");
      sub.style.marginTop = "6px";
      headCopy.appendChild(sub);
      head.appendChild(headCopy);
      card.appendChild(head);

      var body = ui.el("div", "interview-body");
      questions.forEach(function (question, index) {
        var section = ui.el("section", "question");
        var heading = ui.el("h2");
        heading.id = "q-" + index;
        heading.appendChild(ui.el("span", "question-number", String(index + 1)));
        heading.appendChild(document.createTextNode(ui.text(question.prompt)));
        section.appendChild(heading);
        var helper = ui.el("p", "subtle", ui.text(question.helper));
        helper.style.marginTop = "5px";
        section.appendChild(helper);
        var options = ui.el("div", "options");
        options.setAttribute("role", "group");
        options.setAttribute("aria-labelledby", heading.id);
        (Array.isArray(question.options) ? question.options.slice(0, 6) : []).forEach(function (label) {
          var value = ui.text(label);
          var option = ui.button(value, "option", function () {
            choices[question.id] = choices[question.id] === value ? "" : value;
            Array.prototype.forEach.call(options.children, function (item) { item.setAttribute("aria-pressed", item.getAttribute("data-value") === choices[question.id] ? "true" : "false"); });
            update();
          });
          option.setAttribute("data-value", value);
          option.setAttribute("aria-pressed", "false");
          options.appendChild(option);
        });
        section.appendChild(options);
        var input = ui.el("textarea", "answer");
        input.maxLength = MAX_STAMP; input.rows = 2;
        input.placeholder = ui.text(question.placeholder, "Write it your way\\u2026");
        input.setAttribute("aria-label", "Your own words: " + ui.text(question.prompt));
        section.appendChild(input);
        section.appendChild(fieldMeter(input, question.id));
        body.appendChild(section);
      });

      // Optional catch-all for anything the prompts did not cover.
      var extraSection = ui.el("section", "question");
      var extraHeading = ui.el("h2");
      extraHeading.id = "q-extra";
      extraHeading.appendChild(ui.el("span", "question-number", "+"));
      extraHeading.appendChild(document.createTextNode("Anything else?"));
      extraSection.appendChild(extraHeading);
      var extraHelper = ui.el("p", "subtle", "Optional. Whatever the prompts missed, in your own words.");
      extraHelper.style.marginTop = "5px";
      extraSection.appendChild(extraHelper);
      var extraInput = ui.el("textarea", "answer");
      extraInput.maxLength = MAX_STAMP; extraInput.rows = 3;
      extraInput.placeholder = "A line, a moment, a thought\\u2026";
      extraInput.setAttribute("aria-labelledby", "q-extra");
      extraSection.appendChild(extraInput);
      extraSection.appendChild(fieldMeter(extraInput, "extra"));
      body.appendChild(extraSection);

      var privacy = ui.el("div", "privacy");
      var privacyCopy = ui.el("div");
      privacyCopy.appendChild(ui.el("p", "privacy-title", "Who can see it"));
      privacyCopy.appendChild(ui.el("p", "subtle", "Private by default."));
      var privacyActions = ui.el("div", "privacy-actions");
      privacyActions.setAttribute("role", "group");
      privacyActions.setAttribute("aria-label", "Stamp visibility");
      ["Private", "Public"].forEach(function (label) {
        var option = ui.button(label, "privacy-button", function () {
          isPublic = label === "Public";
          Array.prototype.forEach.call(privacyActions.children, function (item) { item.setAttribute("aria-pressed", item.textContent === label ? "true" : "false"); });
        });
        option.setAttribute("aria-pressed", label === "Private" ? "true" : "false");
        privacyActions.appendChild(option);
      });
      privacy.appendChild(privacyCopy);
      privacy.appendChild(privacyActions);
      body.appendChild(privacy);

      var counter = ui.el("p", "counter");
      counter.setAttribute("aria-live", "polite");
      body.appendChild(counter);
      var status = ui.el("p", "status");
      status.setAttribute("aria-live", "polite");

      function fieldMeter(input, id) {
        var meta = ui.el("p", "field-meta", "0/" + MAX_STAMP);
        input.addEventListener("input", function () {
          ownWords[id] = input.value.trim();
          meta.textContent = input.value.length + "/" + MAX_STAMP;
          if (input.value.length >= WARN_AT) meta.setAttribute("data-tone", "warn"); else meta.removeAttribute("data-tone");
          update();
        });
        return meta;
      }
      function answers() {
        var list = questions.map(function (question) {
          var choice = choices[question.id] || ""; var words = ownWords[question.id] || "";
          var answer = choice && words ? choice + ". " + words : (words || choice);
          return { id: question.id, prompt: ui.text(question.prompt), answer: answer };
        });
        list.push({ id: "extra", prompt: "Anything else?", answer: ownWords.extra || "" });
        return list.filter(function (item) { return item.answer; });
      }
      // Markdown built only from the user's own selections and words.
      function compose() {
        return answers().map(function (item) { return "**" + (HEADINGS[item.id] || item.prompt) + "**\\n" + item.answer; }).join("\\n\\n").trim();
      }
      function update() {
        var length = compose().length;
        var tooLong = length > MAX_STAMP;
        counter.textContent = length ? "Stamp length: " + length + "/" + MAX_STAMP + " characters" + (tooLong ? ". Shorten your words by " + (length - MAX_STAMP) + "." : "") : "Answer at least one prompt to continue.";
        if (tooLong) counter.setAttribute("data-tone", "error"); else if (length >= WARN_AT) counter.setAttribute("data-tone", "warn"); else counter.removeAttribute("data-tone");
        if (!busy) { previewButton.disabled = !length || tooLong || !validIdentity; polishButton.disabled = !length || tooLong; }
      }

      var previewButton = ui.button("Preview my stamp", "primary-button", function () {
        var reviewText = compose();
        if (busy || !reviewText || reviewText.length > MAX_STAMP || !validIdentity) return;
        busy = true;
        ui.setBusy(previewButton, true, "Preparing preview\\u2026");
        polishButton.disabled = true;
        ui.setStatus(status, "");
        window.cineblockBridge.callTool("preview_stamp", { tmdbId: movie.id, mediaType: movie.mediaType, reviewText: reviewText, isPublic: isPublic }).then(function (preview) {
          if (!preview || preview.kind !== "stamp-preview") throw new Error("CineBlock returned an unexpected preview.");
          busy = false;
          ui.setBusy(previewButton, false, "Preview my stamp");
          var holder = ui.el("div");
          ui.renderPreview(holder, preview, { onBack: function () { root.replaceChildren(card); update(); window.cineblockBridge.resize(); } });
          root.replaceChildren(holder);
        }).catch(function (previewError) {
          busy = false;
          ui.setBusy(previewButton, false, "Preview my stamp");
          update();
          ui.setStatus(status, (previewError && previewError.message) || "The preview failed. Please try again.", "error");
        });
      });
      var polishButton = ui.button("Ask the AI to polish it first", "secondary-button", function () {
        var list = answers();
        if (busy || !list.length) return;
        busy = true;
        ui.setBusy(polishButton, true, "Sending to chat\\u2026");
        previewButton.disabled = true;
        ui.setStatus(status, "");
        var text = "CineBlock stamp answers for the exact title " + ui.text(movie.title) + " (TMDB " + ui.text(movie.id) + ", " + ui.text(movie.mediaType) + "). Visibility: " + (isPublic ? "public" : "private") + ".\\n" + list.map(function (item) { return "- " + item.prompt + " " + item.answer; }).join("\\n") + "\\n\\nUse only these answers, including anything under Anything else. Do not ask more questions. Organise them into a clean first-person, spoiler-light stamp in my voice, at most " + MAX_STAMP + " characters, with no invented feelings, then call preview_stamp for this exact TMDB ID, media type, and visibility.";
        window.cineblockBridge.sendMessage(text).then(function () {
          busy = false;
          ui.setBusy(polishButton, false, "Sent to chat \\u2713");
          update();
          polishButton.disabled = true;
          ui.setStatus(status, "Your answers are in the chat. CineBlock will show a preview before anything is saved.", "success");
        }).catch(function (sendError) {
          busy = false;
          ui.setBusy(polishButton, false, "Ask the AI to polish it first");
          update();
          ui.setStatus(status, ui.sentence(sendError && sendError.message, "Could not send your answers.") + " You can still use Preview my stamp.", "error");
        });
      });
      body.appendChild(previewButton);
      body.appendChild(polishButton);
      body.appendChild(status);
      if (!validIdentity) ui.setStatus(status, "This title is missing its exact TMDB identity. Ask CineBlock to find the title again.", "error");
      card.appendChild(body);
      root.replaceChildren(card);
      update();
    }
    window.cineblockBridge.registerRenderer(render);
  }());
`,
);

const confirmationCardHtml = page(
  "CineBlock confirmation",
  "",
  `<main class="widget"><div data-root></div></main>`,
  `
  (function () {
    var ui = window.cineblockUi;
    var root = document.querySelector("[data-root]");
    function render(data, error) {
      if (error) { ui.message(root, error, "error"); return; }
      if (!data || typeof data !== "object") { ui.message(root, "Preparing your CineBlock preview\\u2026"); return; }
      if (data.kind === "playlist-saved" || data.kind === "stamp-saved") { ui.renderSaved(root, data); return; }
      if (data.kind !== "stamp-preview" && data.kind !== "playlist-preview") { ui.message(root, "CineBlock could not show this preview. Ask for a new preview in the chat.", "error"); return; }
      // ChatGPT keeps per-card widget state; if this card already saved, show that.
      var saved = window.cineblockBridge.getWidgetState();
      if (saved && saved.saved && (saved.saved.kind === "stamp-saved" || saved.saved.kind === "playlist-saved")) { ui.renderSaved(root, saved.saved); return; }
      ui.renderPreview(root, data);
    }
    window.cineblockBridge.registerRenderer(render);
  }());
`,
);

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
