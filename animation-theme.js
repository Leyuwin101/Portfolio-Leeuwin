(() => {
    const themes = {
        dark: {
            background: [8, 8, 8],
            primary: [255, 255, 255],
            secondary: [161, 161, 170],
            particle: [255, 255, 255],
            connection: [255, 255, 255],
            accent: [96, 165, 250],
            cyan: [103, 232, 249],
            glow: [96, 165, 250],
            grid: [255, 255, 255],
            waveBackground: [0, 0, 0],
            wave: [255, 255, 255],
            waveContrast: 1
        },
        light: {
            background: [248, 250, 252],
            primary: [17, 17, 17],
            secondary: [82, 82, 91],
            particle: [17, 17, 17],
            connection: [35, 42, 52],
            accent: [59, 130, 246],
            cyan: [59, 130, 246],
            glow: [59, 130, 246],
            grid: [17, 24, 39],
            waveBackground: [248, 250, 252],
            wave: [48, 56, 68],
            waveContrast: 1.5
        }
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let from = themes[document.documentElement.dataset.theme === "light" ? "light" : "dark"];
    let target = from;
    let transitionStart = 0;
    const transitionDuration = 600;

    function getColors() {
        if (reduceMotion.matches || from === target) return target;

        const progress = Math.min((performance.now() - transitionStart) / transitionDuration, 1);
        const eased = progress * progress * (3 - 2 * progress);
        if (progress === 1) {
            from = target;
            return target;
        }

        const result = {};
        Object.keys(target).forEach((key) => {
            result[key] = Array.isArray(target[key])
                ? target[key].map((value, index) => from[key][index] + (value - from[key][index]) * eased)
                : from[key] + (target[key] - from[key]) * eased;
        });
        return result;
    }

    window.portfolioAnimationTheme = { themes, getColors };

    window.addEventListener("portfolio-theme-change", (event) => {
        from = getColors();
        target = themes[event.detail?.theme === "light" ? "light" : "dark"];
        transitionStart = performance.now();
    });
})();
