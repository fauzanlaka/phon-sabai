(() => {
  const $ = (id) => document.getElementById(id);

  const priceEl = $("price");
  const rateEl = $("rate");
  const monthsEl = $("months");
  const monthlyPaymentEl = $("monthlyPayment");
  const monthlyInterestEl = $("monthlyInterest");
  const totalInterestEl = $("totalInterest");
  const totalAmountEl = $("totalAmount");
  const copyBtn = $("copyBtn");
  const resetBtn = $("resetBtn");
  const installBtn = $("installBtn");
  const toast = $("toast");
  const plansEl = $("plans");
  const addPlanBtn = $("addPlanBtn");
  const copyCompareBtn = $("copyCompareBtn");
  const compareSub = $("compareSub");
  const planRowTpl = $("planRowTpl");
  const themeBtn = $("themeBtn");

  // ─── Theme toggle ────────────────────────────────────────────
  const THEME_KEY = "phon-sabai:theme";
  const mql = window.matchMedia("(prefers-color-scheme: dark)");

  const effectiveTheme = () => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return mql.matches ? "dark" : "light";
  };

  const syncThemeColorMeta = () => {
    const isDark = effectiveTheme() === "dark";
    const color = isDark ? "#0b0b1a" : "#4F46E5";
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
  };

  const applyTheme = (theme) => {
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem(THEME_KEY);
    }
    syncThemeColorMeta();
    themeBtn.setAttribute(
      "aria-label",
      effectiveTheme() === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"
    );
  };

  themeBtn.addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    if ("vibrate" in navigator) navigator.vibrate(6);
  });

  // Follow system changes only when user hasn't explicitly chosen
  mql.addEventListener("change", () => {
    if (!localStorage.getItem(THEME_KEY)) syncThemeColorMeta();
  });

  syncThemeColorMeta();

  const fmtInt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const fmt2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const parseNum = (s) => {
    if (s == null) return 0;
    const n = Number(String(s).replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : 0;
  };

  const formatPrice = (s) => {
    const digits = String(s).replace(/[^0-9]/g, "");
    if (!digits) return "";
    return fmtInt.format(Number(digits));
  };

  const formatRate = (s) => {
    let v = String(s).replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
    if (parts[1]?.length > 2) v = parts[0] + "." + parts[1].slice(0, 2);
    return v;
  };

  const formatMonths = (s) => {
    const digits = String(s).replace(/[^0-9]/g, "").slice(0, 3);
    return digits;
  };

  const calculate = () => {
    const price = parseNum(priceEl.value);
    const rate = parseNum(rateEl.value);
    const months = parseNum(monthsEl.value);

    const monthlyInterest = price * (rate / 100);
    const totalInterest = monthlyInterest * months;
    const totalAmount = price + totalInterest;
    const monthlyPayment = months > 0 ? totalAmount / months : 0;

    monthlyPaymentEl.textContent = fmtInt.format(Math.round(monthlyPayment));
    monthlyInterestEl.textContent = "฿" + fmt2.format(monthlyInterest);
    totalInterestEl.textContent = "฿" + fmtInt.format(Math.round(totalInterest));
    totalAmountEl.textContent = "฿" + fmtInt.format(Math.round(totalAmount));
  };

  // Input formatters
  priceEl.addEventListener("input", () => {
    const caretAtEnd = priceEl.selectionStart === priceEl.value.length;
    priceEl.value = formatPrice(priceEl.value);
    if (caretAtEnd) priceEl.setSelectionRange(priceEl.value.length, priceEl.value.length);
    calculate();
  });

  rateEl.addEventListener("input", () => {
    rateEl.value = formatRate(rateEl.value);
    updateActiveChip("rate", rateEl.value);
    calculate();
  });

  monthsEl.addEventListener("input", () => {
    monthsEl.value = formatMonths(monthsEl.value);
    updateActiveChip("months", monthsEl.value);
    calculate();
  });

  // Select all on focus for fast editing
  [priceEl, rateEl, monthsEl].forEach((el) => {
    el.addEventListener("focus", () => {
      setTimeout(() => el.select(), 0);
    });
  });

  // Chips
  const updateActiveChip = (target, value) => {
    document.querySelectorAll(`.chips[data-target="${target}"] button`).forEach((b) => {
      b.classList.toggle("active", b.dataset.val === String(value));
    });
  };

  document.querySelectorAll(".chips").forEach((group) => {
    const target = group.dataset.target;
    const input = $(target);
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-val]");
      if (!btn) return;
      input.value = btn.dataset.val;
      updateActiveChip(target, btn.dataset.val);
      if (target === "price") input.value = formatPrice(input.value);
      calculate();
      // tactile feedback
      if ("vibrate" in navigator) navigator.vibrate(8);
    });
  });

  // Copy summary
  const buildSummary = () => {
    const price = parseNum(priceEl.value);
    const rate = parseNum(rateEl.value);
    const months = parseNum(monthsEl.value);
    const monthlyInterest = price * (rate / 100);
    const totalInterest = monthlyInterest * months;
    const totalAmount = price + totalInterest;
    const monthlyPayment = months > 0 ? totalAmount / months : 0;
    return [
      "📱 สรุปค่างวด",
      `ราคาสินค้า: ฿${fmtInt.format(price)}`,
      `ดอกเบี้ย: ${rate}% × ${months} เดือน`,
      "—",
      `💸 ผ่อน ฿${fmtInt.format(Math.round(monthlyPayment))} / เดือน`,
      `รวมทั้งหมด ฿${fmtInt.format(Math.round(totalAmount))}`,
      `(ดอกเบี้ยรวม ฿${fmtInt.format(Math.round(totalInterest))})`,
    ].join("\n");
  };

  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
  };

  copyBtn.addEventListener("click", async () => {
    const text = buildSummary();
    try {
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast("คัดลอกแล้ว ✓");
      if ("vibrate" in navigator) navigator.vibrate(12);
    } catch (err) {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showToast("คัดลอกแล้ว ✓");
    }
  });

  resetBtn.addEventListener("click", () => {
    priceEl.value = "";
    rateEl.value = "";
    monthsEl.value = "";
    document.querySelectorAll(".chips button").forEach((b) => b.classList.remove("active"));
    calculate();
    priceEl.focus();
    if ("vibrate" in navigator) navigator.vibrate(8);
  });

  // PWA install
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") installBtn.hidden = true;
    deferredPrompt = null;
  });

  window.addEventListener("appinstalled", () => {
    installBtn.hidden = true;
    showToast("ติดตั้งเรียบร้อย 🎉");
  });

  // Service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  // ─── Compare plans ───────────────────────────────────────────
  const STORAGE_KEY = "phon-sabai:plans:v1";
  const DEFAULT_PLANS = [
    { months: 6,  rate: 0.99 },
    { months: 12, rate: 0.99 },
    { months: 24, rate: 1.25 },
  ];

  const loadPlans = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PLANS.slice();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return DEFAULT_PLANS.slice();
      return arr.map((p) => ({ months: Number(p.months) || 0, rate: Number(p.rate) || 0 }));
    } catch {
      return DEFAULT_PLANS.slice();
    }
  };

  const savePlans = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plans)); } catch {}
  };

  let plans = loadPlans();

  const computePlan = (price, p) => {
    const monthlyInterest = price * (p.rate / 100);
    const totalInterest = monthlyInterest * p.months;
    const totalAmount = price + totalInterest;
    const monthlyPayment = p.months > 0 ? totalAmount / p.months : 0;
    return { monthlyInterest, totalInterest, totalAmount, monthlyPayment };
  };

  const updateCompareSub = () => {
    const price = parseNum(priceEl.value);
    compareSub.textContent = price > 0
      ? `ฐานราคา ฿${fmtInt.format(price)}`
      : "ใส่ราคาสินค้าด้านบนเพื่อเปรียบเทียบ";
  };

  const updateRowDisplay = (row, p, price) => {
    const { monthlyPayment, totalInterest, totalAmount } = computePlan(price, p);
    row.querySelector(".plan-amount").textContent = fmtInt.format(Math.round(monthlyPayment));
    row.querySelector(".plan-total").textContent = "฿" + fmtInt.format(Math.round(totalAmount));
    row.querySelector(".plan-interest").textContent = "฿" + fmtInt.format(Math.round(totalInterest));
  };

  const updateBest = () => {
    const price = parseNum(priceEl.value);
    let bestIdx = -1;
    let bestVal = Infinity;
    if (price > 0) {
      plans.forEach((p, i) => {
        if (p.months <= 0) return;
        const { monthlyPayment } = computePlan(price, p);
        if (monthlyPayment < bestVal) { bestVal = monthlyPayment; bestIdx = i; }
      });
    }
    plansEl.querySelectorAll(".plan-row").forEach((row, i) => {
      row.classList.toggle("best", i === bestIdx);
    });
  };

  const refreshAllDisplays = () => {
    const price = parseNum(priceEl.value);
    plansEl.querySelectorAll(".plan-row").forEach((row, i) => {
      if (plans[i]) updateRowDisplay(row, plans[i], price);
    });
    updateBest();
    updateCompareSub();
  };

  const buildRow = (p, i) => {
    const node = planRowTpl.content.firstElementChild.cloneNode(true);
    node.dataset.idx = String(i);
    const monthsInput = node.querySelector(".plan-months");
    const rateInput = node.querySelector(".plan-rate");
    monthsInput.value = String(p.months);
    rateInput.value = String(p.rate);
    rateInput.classList.add("rate");

    const onMonths = () => {
      monthsInput.value = monthsInput.value.replace(/[^0-9]/g, "").slice(0, 3);
      const idx = Number(node.dataset.idx);
      plans[idx].months = Number(monthsInput.value) || 0;
      savePlans();
      updateRowDisplay(node, plans[idx], parseNum(priceEl.value));
      updateBest();
    };

    const onRate = () => {
      rateInput.value = formatRate(rateInput.value);
      const idx = Number(node.dataset.idx);
      plans[idx].rate = Number(rateInput.value) || 0;
      savePlans();
      updateRowDisplay(node, plans[idx], parseNum(priceEl.value));
      updateBest();
    };

    monthsInput.addEventListener("input", onMonths);
    rateInput.addEventListener("input", onRate);

    [monthsInput, rateInput].forEach((el) => {
      el.addEventListener("focus", () => setTimeout(() => el.select(), 0));
    });

    node.querySelector(".plan-remove").addEventListener("click", () => {
      if (plans.length <= 1) return;
      const idx = Number(node.dataset.idx);
      plans.splice(idx, 1);
      savePlans();
      renderPlans();
      if ("vibrate" in navigator) navigator.vibrate(8);
    });

    return node;
  };

  const renderPlans = () => {
    plansEl.innerHTML = "";
    plans.forEach((p, i) => plansEl.appendChild(buildRow(p, i)));
    refreshAllDisplays();
  };

  addPlanBtn.addEventListener("click", () => {
    // Default new plan: 12 months / current rate input, or 0.99
    const lastRate = plans.length ? plans[plans.length - 1].rate : 0.99;
    plans.push({ months: 12, rate: lastRate });
    savePlans();
    renderPlans();
    if ("vibrate" in navigator) navigator.vibrate(8);
    // scroll to last row
    requestAnimationFrame(() => {
      const last = plansEl.lastElementChild;
      if (last) last.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });

  copyCompareBtn.addEventListener("click", async () => {
    const price = parseNum(priceEl.value);
    if (price <= 0 || plans.length === 0) {
      showToast("ใส่ราคาสินค้าก่อน");
      return;
    }
    const lines = [
      "📱 เปรียบเทียบแผนผ่อน",
      `ราคาสินค้า: ฿${fmtInt.format(price)}`,
      "—",
    ];
    plans.forEach((p) => {
      const { monthlyPayment, totalAmount, totalInterest } = computePlan(price, p);
      lines.push(`• ${p.months} เดือน @ ${p.rate}% → ฿${fmtInt.format(Math.round(monthlyPayment))}/ด.`);
      lines.push(`  รวม ฿${fmtInt.format(Math.round(totalAmount))} (ดอก ฿${fmtInt.format(Math.round(totalInterest))})`);
    });
    const text = lines.join("\n");
    try {
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast("คัดลอกแล้ว ✓");
      if ("vibrate" in navigator) navigator.vibrate(12);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showToast("คัดลอกแล้ว ✓");
    }
  });

  // Refresh compare displays when price changes (doesn't touch input values)
  priceEl.addEventListener("input", refreshAllDisplays);

  // Initial render
  calculate();
  renderPlans();
})();
