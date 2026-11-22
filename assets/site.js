/* House of Solar Davao: shared by Option A and Option B.
   1) Message chooser: every m.me link opens #msgDialog (app link, web link, call, text).
   2) Free quote: any [data-quote] opens #quoteDialog; data-quote="battery" preselects a product.
      The page stays static: we only write the message, then hand it to Messenger (copied,
      because m.me links can't pre-fill text) or SMS (pre-filled body). No savings maths. */
(() => {
  const PAGE_ID = "100063559015218", PHONE = "+639100947620";
  const isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const inFacebookApp = /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram/i.test(navigator.userAgent);

  const lightDismiss = d => {                                   // Safari: tap outside to close
    if (!d || "closedBy" in HTMLDialogElement.prototype) return;
    let downOutside = false;
    const outside = e => { const r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
    d.addEventListener("pointerdown", e => { downOutside = outside(e); });
    d.addEventListener("pointerup", e => { if (downOutside && outside(e)) d.close(); });
  };

  // ---- 1. Message chooser
  const msg = document.getElementById("msgDialog");
  if (msg) {
    if (isPhone) msg.querySelector("#msgApp").hidden = false;
    if (inFacebookApp) msg.querySelector("#msgNote").hidden = false;
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="https://m.me/"]');
      if (!a || msg.contains(a)) return;
      e.preventDefault();
      msg.showModal();
      msg.querySelector(".btn:not([hidden])")?.focus();
    });
    lightDismiss(msg);
  }

  // ---- 2. Free quote. Every .quote-box (the #quoteDialog popup, or an inline block) gets wired up.
  async function copy(text, host) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0";
      host.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch {}
      ta.remove(); return ok;
    }
  }
  const site = () => location.pathname.replace(/index\.html$/, "").replace(/^\/|\/$/g, "") || "home";

  function wire(box) {
    const form = box.querySelector("form.quote-form");
    if (!form) return null;
    const f = form.elements;
    const preview = box.querySelector(".quote-preview"), toast = box.querySelector(".quote-toast");
    const sms = box.querySelector(".quote-sms"), kindRow = box.querySelector(".kind-row");
    const message = () => {
      const need = f.need.selectedOptions[0].dataset.say;
      const where = f.place.value.trim(), bill = f.bill.value, who = f.name.value.trim();
      let t = `Hi House of Solar! I'd like a quote for ${need} for our ${f.site.value.toLowerCase()}`;
      t += where ? ` in ${where}.` : ".";
      if (f.need.value === "setup" || f.need.value === "unsure") t += ` We want a ${f.kind.value} setup.`;
      if (bill) t += ` Our monthly electric bill is around ${bill}.`;
      if (who) t += ` My name is ${who}.`;
      return t + " Thank you!";
    };
    const render = () => {
      if (kindRow) kindRow.hidden = !(f.need.value === "setup" || f.need.value === "unsure");
      const text = message();
      preview.textContent = text;
      if (sms) sms.href = `sms:${PHONE}?&body=${encodeURIComponent(text)}`;
    };
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const ok = await copy(message(), box);
      toast.textContent = ok ? "Message copied. Paste it in the chat and send." : "Couldn't copy automatically. Long-press the message above to copy it.";
      window.goatcounter?.count?.({ path: site() + ": Quote sent" + (box.tagName === "DIALOG" ? " (popup)" : ""), title: f.need.value, event: true });
      if (isPhone && !inFacebookApp) location.href = `fb-messenger://user-thread/${PAGE_ID}`;
      else window.open("https://m.me/houseofsolardavao", "_blank", "noopener");
    });
    render();
    return { form, render, toast };
  }

  document.querySelectorAll(".quote-box").forEach(wire);
  const dlg = document.getElementById("quoteDialog");
  if (!dlg) return;
  const f = dlg.querySelector("form.quote-form").elements;
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-quote]");
    if (!t) return;
    e.preventDefault();
    const key = t.dataset.quote;
    if (key && [...f.need.options].some(o => o.value === key)) f.need.value = key;
    dlg.querySelector(".quote-toast").textContent = "";
    f.need.dispatchEvent(new Event("change", { bubbles: true }));
    dlg.showModal();
    f.need.focus();
  });
  lightDismiss(dlg);
})();
