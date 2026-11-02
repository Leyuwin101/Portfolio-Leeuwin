(() => {
    const canvas = document.getElementById("webgl-canvas");
    const loader = document.querySelector(".loader");
    const portrait = document.querySelector(".hero__portrait-wrap");
    const hero = document.querySelector(".hero");
    const nav = document.querySelector(".nav");
    const menuToggle = document.querySelector(".menu-toggle");
    const cursor = document.querySelector(".cursor");

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // =========================================================
    // THREE.JS FULLSCREEN WEBGL BACKGROUND
    // =========================================================

    let renderer;
    let scene;
    let camera;
    let mesh;
    let animationId;

    function syncWaveTheme() {
        if (!renderer || !mesh || !window.portfolioAnimationTheme) return;

        const colors = window.portfolioAnimationTheme.getColors();
        const uniforms = mesh.material.uniforms;
        uniforms.waveColor.value.set(
            colors.wave[0] / 255,
            colors.wave[1] / 255,
            colors.wave[2] / 255
        );
        uniforms.backgroundColor.value.set(
            colors.waveBackground[0] / 255,
            colors.waveBackground[1] / 255,
            colors.waveBackground[2] / 255
        );
        uniforms.waveContrast.value = colors.waveContrast;
    }

    const targetPointer = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0 };

    function initWebGL() {
        if (!canvas || !window.THREE) return;

        const vertexShaderElement =
            document.getElementById("js-vertex-shader");

        const fragmentShaderElement =
            document.getElementById("js-fragment-shader");

        if (!vertexShaderElement || !fragmentShaderElement) {
            console.warn("WebGL shaders were not found.");
            return;
        }

        try {
            const initialLightMode =
                document.documentElement.dataset.theme === "light";

            renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: false,
                alpha: false,
                powerPreference: "high-performance"
            });

            renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, 1.75)
            );
            renderer.setClearColor(initialLightMode ? 0xF8FAFC : 0x080808, 1);

            canvas.style.position = "fixed";
            canvas.style.inset = "0";
            canvas.style.width = "100vw";
            canvas.style.height = "100vh";
            canvas.style.display = "block";
            canvas.style.zIndex = "-1";
            canvas.style.pointerEvents = "none";

            scene = new THREE.Scene();
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([
                -1, -1, 0,
                 3, -1, 0,
                -1,  3, 0
            ]);
            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3)
            );

            const material = new THREE.RawShaderMaterial({
                vertexShader: vertexShaderElement.textContent,
                fragmentShader: fragmentShaderElement.textContent,
                uniforms: {
                    resolution: {
                        value: new THREE.Vector2(
                            window.innerWidth,
                            window.innerHeight
                        )
                    },
                    time: { value: 0 },
                    xScale: { value: 1.15 },
                    yScale: { value: 0.42 },
                    distortion: { value: 0.065 },
                    pointer: { value: new THREE.Vector2(0, 0) },
                    waveColor: {
                        value: initialLightMode
                            ? new THREE.Vector3(0.34, 0.48, 0.62)
                            : new THREE.Vector3(1, 1, 1)
                    },
                    backgroundColor: {
                        value: new THREE.Vector3()
                    },
                    waveContrast: { value: 1 }
                }
            });

            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            syncWaveTheme();
            resizeWebGL();

            window.addEventListener(
                "resize",
                resizeWebGL,
                { passive: true }
            );

            window.addEventListener("portfolio-theme-change", (event) => {
                syncWaveTheme();
                renderer.render(scene, camera);
            });

            if (reduceMotion) {
                material.uniforms.time.value = 0.8;
                renderer.render(scene, camera);
            } else {
                animate();
            }
        } catch (error) {
            console.warn(
                "WebGL background could not initialize.",
                error
            );
        }
    }

    function resizeWebGL() {
        if (!renderer || !mesh) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            1.75
        );

        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        mesh.material.uniforms.resolution.value.set(
            width * pixelRatio,
            height * pixelRatio
        );
        renderer.render(scene, camera);
    }

    function animate() {
        if (document.hidden) {
            animationId = null;
            return;
        }

        animationId = requestAnimationFrame(animate);
        pointer.x += (targetPointer.x - pointer.x) * 0.035;
        pointer.y += (targetPointer.y - pointer.y) * 0.035;
        mesh.material.uniforms.time.value += 0.0045;
        mesh.material.uniforms.pointer.value.set(
            pointer.x,
            pointer.y
        );
        syncWaveTheme();
        renderer.render(scene, camera);
    }

    document.addEventListener("visibilitychange", () => {
        if (!renderer || reduceMotion) return;

        if (document.hidden) {
            cancelAnimationFrame(animationId);
            animationId = null;
        } else if (!animationId) {
            animate();
        }
    });

    document.addEventListener(
        "pointermove",
        (event) => {
            targetPointer.x =
                (event.clientX / window.innerWidth) * 2 - 1;
            targetPointer.y =
                (event.clientY / window.innerHeight) * -2 + 1;

            if (
                hero &&
                portrait &&
                event.pointerType !== "touch" &&
                !reduceMotion
            ) {
                const px = targetPointer.x * 5;
                const py = targetPointer.y * 4;
                portrait.style.transform =
                    `translate(${px}px, ${py}px)`;
            }
        },
        { passive: true }
    );
    // =========================================================
    // PAGE LOADING
    // =========================================================

    document.body.classList.add("is-loading");

    function finishLoading() {
        loader?.classList.add("done");
        document.body.classList.remove("is-loading");
    }

    if (document.readyState === "complete") {
        setTimeout(
            finishLoading,
            reduceMotion ? 150 : 850
        );
    } else {
        window.addEventListener(
            "load",
            () => {
                setTimeout(
                    finishLoading,
                    reduceMotion ? 150 : 850
                );
            },
            { once: true }
        );
    }

    // =========================================================
    // MOBILE NAVIGATION
    // =========================================================

    menuToggle?.addEventListener(
        "click",
        () => {
            const open =
                nav.classList.toggle("is-open");

            menuToggle.classList.toggle(
                "is-open",
                open
            );

            menuToggle.setAttribute(
                "aria-expanded",
                String(open)
            );
        }
    );

    nav?.querySelectorAll("a").forEach(
        (link) => {
            link.addEventListener(
                "click",
                () => {
                    nav.classList.remove("is-open");

                    menuToggle?.classList.remove(
                        "is-open"
                    );

                    menuToggle?.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            );
        }
    );

    // =========================================================
    // SCROLL REVEAL
    // =========================================================

    const revealItems =
        document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
        const observer =
            new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach(
                        (entry) => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add(
                                    "is-visible"
                                );

                                obs.unobserve(
                                    entry.target
                                );
                            }
                        }
                    );
                },
                {
                    threshold: 0.12,
                    rootMargin:
                        "0px 0px -40px"
                }
            );

        revealItems.forEach(
            (item) => observer.observe(item)
        );

    } else {
        revealItems.forEach(
            (item) =>
                item.classList.add("is-visible")
        );
    }

    // Keep the navigation in sync with the section in view.
    const sectionLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
    const sections = sectionLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    sectionLinks.forEach((link) => {
                        const active = link.hash === `#${entry.target.id}`;
                        link.classList.toggle("is-active", active);
                        if (active) link.setAttribute("aria-current", "location");
                        else link.removeAttribute("aria-current");
                    });
                });
            },
            { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
        );

        sections.forEach((section) => sectionObserver.observe(section));
    }

    document.querySelectorAll(".project").forEach((project) => {
        project.addEventListener("pointermove", (event) => {
            const bounds = project.getBoundingClientRect();
            project.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
            project.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
        }, { passive: true });
    });

    if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
        document.querySelectorAll(".magnetic").forEach((button) => {
            button.addEventListener("pointermove", (event) => {
                const bounds = button.getBoundingClientRect();
                const x = (event.clientX - bounds.left - bounds.width / 2) * 0.08;
                const y = (event.clientY - bounds.top - bounds.height / 2) * 0.08;
                button.style.setProperty("--mag-x", `${x.toFixed(1)}px`);
                button.style.setProperty("--mag-y", `${y.toFixed(1)}px`);
            }, { passive: true });

            button.addEventListener("pointerleave", () => {
                button.style.setProperty("--mag-x", "0px");
                button.style.setProperty("--mag-y", "0px");
            });
        });
    }

    // =========================================================
    // CUSTOM CURSOR
    // =========================================================

    if (
        cursor &&
        window.matchMedia("(pointer: fine)").matches
    ) {
        let mouseX = -100;
        let mouseY = -100;

        let cursorX = -100;
        let cursorY = -100;

        document.addEventListener(
            "pointermove",
            (event) => {
                mouseX = event.clientX;
                mouseY = event.clientY;
            },
            { passive: true }
        );

        function moveCursor() {
            cursorX +=
                (mouseX - cursorX) * 0.2;

            cursorY +=
                (mouseY - cursorY) * 0.2;

            cursor.style.left =
                `${cursorX}px`;

            cursor.style.top =
                `${cursorY}px`;

            requestAnimationFrame(
                moveCursor
            );
        }

        moveCursor();

        document
            .querySelectorAll("a, button")
            .forEach((element) => {
                element.addEventListener(
                    "mouseenter",
                    () => {
                        cursor.classList.add(
                            "is-hover"
                        );
                    }
                );

                element.addEventListener(
                    "mouseleave",
                    () => {
                        cursor.classList.remove(
                            "is-hover"
                        );
                    }
                );
            });
    }

    // =========================================================
    // INIT
    // =========================================================

    initWebGL();

})();
