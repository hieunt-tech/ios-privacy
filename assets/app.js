// Language picking for the Penote site.
// English lives in the HTML itself (so the pages read fine without JavaScript); other languages
// come from strings.js. Choice order: ?lang=xx → saved choice → browser languages → English.
(function () {
  "use strict";

  var LANGS = [
    ["en", "English"], ["vi", "Tiếng Việt"], ["fr", "Français"], ["zh-Hans", "简体中文"],
    ["ko", "한국어"], ["ja", "日本語"], ["de", "Deutsch"]
  ];
  var CODES = LANGS.map(function (l) { return l[0]; });
  var STRINGS = window.INKSPACE_STRINGS || {};
  var en = {};

  function normalize(tag) {
    if (!tag) return null;
    var lower = String(tag).toLowerCase();
    if (lower.indexOf("zh") === 0) return "zh-Hans";
    var base = lower.split("-")[0];
    return CODES.indexOf(base) >= 0 ? base : null;
  }

  function stored() {
    try { return localStorage.getItem("inkspace.lang"); } catch (e) { return null; }
  }

  function pick() {
    var fromURL = normalize(new URLSearchParams(location.search).get("lang"));
    if (fromURL) return fromURL;
    var saved = normalize(stored());
    if (saved) return saved;
    var prefs = navigator.languages || [navigator.language];
    for (var i = 0; i < prefs.length; i++) {
      var code = normalize(prefs[i]);
      if (code) return code;
    }
    return "en";
  }

  // Snapshot the English copy from the page before anything is replaced.
  function collectEnglish() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) { en[el.dataset.i18n] = el.textContent; });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) { en[el.dataset.i18nHtml] = el.innerHTML; });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      en[el.dataset.i18nAria] = el.getAttribute("aria-label");
    });
    en.__title = document.title;
  }

  function t(lang, key) {
    var table = STRINGS[lang];
    return (table && table[key]) || en[key];
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(lang, el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(lang, el.dataset.i18nHtml); });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(lang, el.dataset.i18nAria));
    });
    document.querySelectorAll("time[data-date]").forEach(function (el) {
      var date = new Date(el.dataset.date + "T12:00:00");
      try {
        el.textContent = new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(date);
      } catch (e) { /* keep the English date */ }
    });
    var titleKey = document.body.dataset.title;
    document.title = titleKey && lang !== "en" ? t(lang, titleKey) + " · Penote" : en.__title;
    var select = document.getElementById("lang");
    if (select) select.value = lang;
  }

  function init() {
    collectEnglish();
    var select = document.getElementById("lang");
    if (select) {
      LANGS.forEach(function (l) {
        var option = document.createElement("option");
        option.value = l[0];
        option.textContent = l[1];
        option.lang = l[0];
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        var lang = select.value;
        try { localStorage.setItem("inkspace.lang", lang); } catch (e) { /* private mode */ }
        var url = new URL(location.href);
        url.searchParams.delete("lang");
        history.replaceState(null, "", url);
        apply(lang);
      });
    }
    apply(pick());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
