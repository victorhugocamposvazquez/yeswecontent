/*! yeswecontent embed v1 · <div id="ywc-blog" data-site="ID"></div><script src=".../embed.js" async></script> */
(function () {
  var el = document.getElementById("ywc-blog") || document.querySelector("[data-ywc-blog]");
  if (!el || el.__ywc) return;
  el.__ywc = 1;
  var d = el.dataset;
  var sc = document.querySelector('script[src*="embed.js"]');
  var base = (d.base || (sc ? new URL(sc.src).origin : "")).replace(/\/$/, "");
  var limit = +d.limit || 12;
  var accent = /^#[0-9a-f]{3,8}$/i.test(d.accent || "") ? d.accent : "#ff4f1f";
  var items = [];
  var listY = 0;

  if (d.styles !== "none") {
    var st = document.createElement("style");
    var dark = d.theme === "dark" || (d.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    st.textContent =
      ".ywc{--a:" + accent + ";--m:" + (dark ? "#a8a29e" : "#6b6459") + ";--l:" + (dark ? "#ffffff22" : "#00000014") + ";color:" + (dark ? "#f5f5f4" : "inherit") + ";max-width:720px;margin:0 auto;line-height:1.65}" +
      ".ywc a{color:var(--a)}.ywc ul.ywc-l{list-style:none;margin:0;padding:0}.ywc-l li{padding:20px 0;border-bottom:1px solid var(--l)}" +
      ".ywc-l h3{margin:4px 0 6px;font-size:1.25em;line-height:1.3}.ywc-l a{text-decoration:none}.ywc-l a:hover{text-decoration:underline}" +
      ".ywc-m{color:var(--m);font-size:.875em;margin:0}.ywc-b{display:inline-block;margin:0 0 16px;padding:8px 0;cursor:pointer;background:none;border:0;color:var(--a);font:inherit}" +
      ".ywc-a h1{font-size:2em;line-height:1.2;margin:0 0 8px}.ywc-a img{max-width:100%;height:auto;border-radius:10px}" +
      ".ywc-a blockquote{border-left:3px solid var(--a);margin-left:0;padding-left:1em;color:var(--m)}.ywc-a .ywc-faq{border-top:1px solid var(--l);margin-top:2em}";
    document.head.appendChild(st);
  }

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function date(s, lang) {
    try {
      return new Date(s).toLocaleDateString(lang || "es", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return "";
    }
  }
  function slugOf(it) {
    return (it._ywc && it._ywc.slug) || String(it.url).split("/").pop();
  }

  function list() {
    var root = h("div", "ywc");
    var ul = h("ul", "ywc-l");
    items.slice(0, limit).forEach(function (it) {
      var li = h("li");
      li.appendChild(h("p", "ywc-m", date(it.date_published, it.language)));
      var t = h("h3");
      var a = h("a", "", it.title);
      a.href = "#/" + slugOf(it);
      t.appendChild(a);
      li.appendChild(t);
      if (it.summary) li.appendChild(h("p", "ywc-m", it.summary));
      ul.appendChild(li);
    });
    if (!items.length) root.appendChild(h("p", "ywc-m", "Todavía no hay artículos."));
    root.appendChild(ul);
    return root;
  }

  function article(it) {
    var root = h("div", "ywc ywc-a");
    var back = h("button", "ywc-b", "← Todos los artículos");
    back.type = "button";
    back.onclick = function () {
      history.pushState("", document.title, location.pathname + location.search);
      render();
      scrollTo(0, listY);
    };
    root.appendChild(back);
    root.appendChild(h("h1", "", it.title));
    root.appendChild(h("p", "ywc-m", date(it.date_published, it.language)));
    if (it.image) {
      var img = h("img");
      img.src = it.image;
      img.alt = it.title;
      img.loading = "lazy";
      root.appendChild(img);
    }
    var body = h("div");
    body.innerHTML = it.content_html; // HTML ya escapado en origen por yeswecontent
    root.appendChild(body);
    return root;
  }

  function render() {
    var m = /^#\/([a-z0-9][a-z0-9-_]*)$/i.exec(location.hash);
    var it = m && items.filter(function (x) { return slugOf(x) === m[1]; })[0];
    el.replaceChildren(it ? article(it) : list());
    if (it) {
      el.scrollIntoView({ block: "start" });
      if (d.title !== "keep") document.title = it.title;
    }
  }

  addEventListener("hashchange", function () {
    if (!/^#\//.test(location.hash)) return render();
    listY = scrollY;
    render();
  });

  el.setAttribute("aria-busy", "true");
  fetch(base + "/api/v1/sites/" + encodeURIComponent(d.site) + "/feed.json" + (d.lang ? "?lang=" + encodeURIComponent(d.lang) : ""))
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (feed) {
      items = feed.items || [];
      render();
    })
    .catch(function () {
      el.replaceChildren(h("p", "ywc-m", "No hemos podido cargar el blog."));
    })
    .finally(function () {
      el.removeAttribute("aria-busy");
    });
})();
