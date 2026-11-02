(() => {
    const root = document.documentElement;
    const buttons = [...document.querySelectorAll("[data-theme-choice]")];
    const themeColor = document.querySelector('meta[name="theme-color"]');

    function setTheme(theme, persist = true) {
        const nextTheme = theme === "light" ? "light" : "dark";
        root.dataset.theme = nextTheme;
        root.style.colorScheme = nextTheme;

        buttons.forEach((button) => {
            const selected = button.dataset.themeChoice === nextTheme;
            button.setAttribute("aria-pressed", String(selected));
        });

        if (themeColor) {
            themeColor.content = nextTheme === "light" ? "#F8FAFC" : "#080808";
        }

        if (persist) {
            try {
                localStorage.setItem("portfolio-theme", nextTheme);
            } catch (_) {
                // Theme still works for this visit if storage is unavailable.
            }
        }

        window.dispatchEvent(new CustomEvent("portfolio-theme-change", {
            detail: { theme: nextTheme }
        }));
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            setTheme(button.dataset.themeChoice);
        });
    });

    window.addEventListener("storage", (event) => {
        if (event.key === "portfolio-theme" && (event.newValue === "light" || event.newValue === "dark")) {
            setTheme(event.newValue, false);
        }
    });

    setTheme(root.dataset.theme, false);
})();
