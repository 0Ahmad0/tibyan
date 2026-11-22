(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  const moon =
    '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>';
  const sun =
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>';
  let theme;
  try {
    theme = localStorage.getItem("tibyan-theme");
  } catch {}
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  const setTheme = (dark) => {
    root.dataset.theme = dark ? "dark" : "light";
    $$(".theme-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute(
        "aria-label",
        dark ? "تفعيل المظهر الفاتح" : "تفعيل المظهر الداكن",
      );
      button.querySelector("svg").innerHTML = dark ? sun : moon;
    });
    $('meta[name="theme-color"]')?.setAttribute(
      "content",
      dark ? "#101e19" : "#075344",
    );
  };
  setTheme(theme ? theme === "dark" : scheme.matches);
  scheme.addEventListener("change", (event) => {
    if (!theme) setTheme(event.matches);
  });
  $$(".theme-toggle").forEach((button) =>
    button.addEventListener("click", () => {
      theme = root.dataset.theme === "dark" ? "light" : "dark";
      setTheme(theme === "dark");
      try {
        localStorage.setItem("tibyan-theme", theme);
      } catch {}
    }),
  );

  const menuButton = $(".menu-toggle");
  const menu = $("#mobile-nav");
  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "فتح القائمة");
  };
  menuButton?.addEventListener("click", () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    menuButton.setAttribute("aria-expanded", String(opening));
    menuButton.setAttribute(
      "aria-label",
      opening ? "إغلاق القائمة" : "فتح القائمة",
    );
  });
  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu && !menu.hidden) {
      closeMenu();
      menuButton.focus();
    }
  });
  matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });

  // Only hide reveal elements once an observer is successfully available.
  if ("IntersectionObserver" in window && !reduced.matches) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    $$("[data-reveal]").forEach((element) => observer.observe(element));
    root.classList.add("js");
  }
  const progress = $(".scroll-progress");
  let framePending = false;
  const updateProgress = () => {
    const total = root.scrollHeight - innerHeight;
    if (progress)
      progress.style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`;
    framePending = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!framePending) {
        framePending = true;
        requestAnimationFrame(updateProgress);
      }
    },
    { passive: true },
  );
  updateProgress();
  $$(".button").forEach((button) =>
    button.addEventListener("pointerdown", () => {
      if (reduced.matches) return;
      const ripple = document.createElement("span");
      ripple.className = "button-ripple";
      button.append(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), {
        once: true,
      });
    }),
  );

  const audio = $("#adhan-player");
  const voices = $("#adhan-voice");
  const audioStatus = $(".audio-status");
  if (audio && voices) {
    const panel = audio.closest(".audio-panel");
    voices.addEventListener("change", () => {
      audio.pause();
      audio.src = voices.value;
      audio.load();
      audioStatus.textContent =
        "تم اختيار " +
        voices.selectedOptions[0].textContent +
        "، اضغط تشغيل للاستماع.";
    });
    audio.addEventListener("play", () => {
      panel.classList.add("is-playing");
      audioStatus.textContent =
        "تستمع إلى " + voices.selectedOptions[0].textContent + ".";
    });
    audio.addEventListener("pause", () => panel.classList.remove("is-playing"));
    audio.addEventListener("ended", () => {
      panel.classList.remove("is-playing");
      audioStatus.textContent = "انتهت العيّنة. يمكنك اختيار صوت آخر.";
    });
    audio.addEventListener("error", () => {
      panel.classList.remove("is-playing");
      audioStatus.textContent =
        "تعذّر تحميل الصوت. تحقّق من اتصالك وأعد المحاولة.";
    });
  }

  const countNode = $("#tasbih-count");
  if (countNode) {
    let count = 0;
    const formatter = new Intl.NumberFormat("ar", { numberingSystem: "arab" });
    const render = () => {
      countNode.textContent = formatter.format(count);
    };
    $(".tasbih-button").addEventListener("click", () => {
      count += 1;
      render();
      if (!reduced.matches)
        countNode.animate(
          [
            { transform: "translateY(6px)", opacity: 0.3 },
            { transform: "translateY(0)", opacity: 1 },
          ],
          { duration: 220, easing: "ease-out" },
        );
      $("#tasbih-status").textContent =
        "عدد التسبيحات: " + formatter.format(count) + " · معاينة للموقع.";
    });
    $(".tasbih-reset").addEventListener("click", () => {
      count = 0;
      render();
      $("#tasbih-status").textContent = "أُعيد العد إلى الصفر.";
    });
  }
  const eraPanel = $("#era-panel");
  if (eraPanel) {
    const eras = {
      mecca: [
        "مكة المكرمة",
        "بداية الدعوة",
        "استكشف أحداث العهد المكي في الخط الزمني داخل تبيان، واقرأ التفاصيل في سياقها.",
      ],
      hijra: [
        "من مكة إلى المدينة",
        "الهجرة النبوية",
        "تعرّف إلى رحلة الهجرة من خلال خريطة السيرة داخل التطبيق، وانتقل بين المواضع لقراءة تفاصيلها.",
      ],
      medina: [
        "المدينة المنورة",
        "العهد المدني",
        "تابع أحداث العهد المدني على الخط الزمني، واستكشف الغزوات والمواضع المرتبطة بها داخل قسم السيرة.",
      ],
    };
    const tabs = $$("[data-era]");
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        tabs.forEach((item) => {
          const selected = item === tab;
          item.setAttribute("aria-selected", String(selected));
          item.tabIndex = selected ? 0 : -1;
        });
        const [place, title, description] = eras[tab.dataset.era];
        eraPanel.setAttribute("aria-labelledby", tab.id);
        eraPanel.querySelector(".chapter-label").textContent = place;
        eraPanel.querySelector("h4").textContent = title;
        eraPanel.querySelector("p").textContent = description;
        if (!reduced.matches)
          eraPanel.animate(
            [
              { opacity: 0, transform: "translateY(8px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 300 },
          );
      });
      tab.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowLeft") next = (index + 1) % tabs.length;
        if (event.key === "ArrowRight")
          next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          tabs[next].focus();
          tabs[next].click();
        }
      });
    });
  }
  const search = $("#guide-search");
  if (search) {
    const normalize = (text) =>
      text
        .normalize("NFKD")
        .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ى/g, "ي")
        .toLowerCase();
    search.addEventListener("input", () => {
      const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
      let matches = 0;
      $$("[data-searchable]").forEach((article) => {
        const visible = terms.every((term) =>
          normalize(article.textContent).includes(term),
        );
        article.hidden = !visible;
        if (visible) matches += 1;
      });
      $$(".guide-nav a").forEach((anchor) => {
        const target = $(anchor.getAttribute("href"));
        anchor.hidden = !!target?.hidden;
      });
      $("#guide-search-status").textContent = terms.length
        ? matches
          ? `أقسام مطابقة: ${matches}`
          : "لا توجد نتائج. جرّب كلمات مثل الأذان أو المصحف أو السبحة."
        : "";
    });
  }

  const validInvite = $("#valid-invite");
  if (validInvite) {
    const raw = new URLSearchParams(location.search).get("code") || "";
    const code = /^[a-zA-Z0-9]{6}$/.test(raw) ? raw.toUpperCase() : "";
    const status = $("#invite-status");
    validInvite.hidden = !code;
    $("#invalid-invite").hidden = !!code;
    if (!code)
      $("#invite-description").textContent =
        "نحتاج إلى رابط دعوة يحتوي على رمز حلقة صحيح.";
    if (code) {
      const customLink = "tibyan://c?code=" + code;
      const fallback =
        "https://play.google.com/store/apps/details?id=com.app.tibyan";
      const open = $("#open-app");
      $("#invite-code").textContent = code;
      // A user click starts the intent; timers are blocked by many Android browsers.
      open.href = /Android/i.test(navigator.userAgent)
        ? `intent://c?code=${code}#Intent;scheme=tibyan;package=com.app.tibyan;S.browser_fallback_url=${encodeURIComponent(fallback)};end`
        : customLink;
      open.addEventListener("click", () => {
        status.textContent =
          "إذا لم يفتح تبيان، افتح الرابط بمتصفح خارجي أو انسخ الرمز للانضمام من داخل التطبيق.";
      });
      $("#copy-code").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code);
          status.textContent = "تم نسخ رمز الحلقة: " + code;
        } catch {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents($("#invite-code"));
          selection.removeAllRanges();
          selection.addRange(range);
          status.textContent =
            "تعذّر النسخ التلقائي. حُدّد الرمز لتنسخه يدويًا: " + code;
        }
      });
    }
  }
})();
