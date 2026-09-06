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
            // -------------------------------------------------
            // Renderer
            // -------------------------------------------------

            renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: false,
                alpha: false,
                powerPreference: "high-performance"
            });

            renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, 1.75)
            );

            renderer.setClearColor(0x080808, 1);

            // Make canvas itself fullscreen
            canvas.style.position = "fixed";
            canvas.style.inset = "0";
            canvas.style.width = "100vw";
            canvas.style.height = "100vh";
            canvas.style.display = "block";
            canvas.style.zIndex = "-1";
            canvas.style.pointerEvents = "none";

            // -------------------------------------------------
            // Scene
            // -------------------------------------------------

            scene = new THREE.Scene();

            camera = new THREE.OrthographicCamera(
                -1,
                1,
                1,
                -1,
                0,
                1
            );

            // -------------------------------------------------
            // Fullscreen triangle
            //
            // This is better than a normal quad because it
            // completely covers the viewport without diagonal
            // gaps or half-rendering issues.
            // -------------------------------------------------

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

            // -------------------------------------------------
            // Shader
            // -------------------------------------------------

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

                    time: {
                        value: 0
                    },

                    xScale: {
                        value: 1.15
                    },

                    yScale: {
                        value: 0.42
                    },

                    distortion: {
                        value: 0.065
                    },

                    pointer: {
                        value: new THREE.Vector2(0, 0)
                    }
                }
            });

            mesh = new THREE.Mesh(
                geometry,
                material
            );

            scene.add(mesh);

            resizeWebGL();

            window.addEventListener(
                "resize",
                resizeWebGL,
                { passive: true }
            );

            // -------------------------------------------------
            // Motion
            // -------------------------------------------------

            if (reduceMotion) {
                material.uniforms.time.value = 0.8;

                renderer.render(
                    scene,
                    camera
                );
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

    // =========================================================
    // RESIZE
    // =========================================================

    function resizeWebGL() {
        if (!renderer || !mesh) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            1.75
        );

        renderer.setPixelRatio(pixelRatio);

        renderer.setSize(
            width,
            height,
            false
        );

        // IMPORTANT:
        // Shader resolution must use the actual drawing buffer
        // size, not just CSS viewport size.

        mesh.material.uniforms.resolution.value.set(
            width * pixelRatio,
            height * pixelRatio
        );

        renderer.render(
            scene,
            camera
        );
    }

    // =========================================================
    // ANIMATION
    // =========================================================

    function animate() {
        animationId = requestAnimationFrame(animate);

        pointer.x +=
            (targetPointer.x - pointer.x) * 0.035;

        pointer.y +=
            (targetPointer.y - pointer.y) * 0.035;

        mesh.material.uniforms.time.value += 0.0045;

        mesh.material.uniforms.pointer.value.set(
            pointer.x,
            pointer.y
        );

        renderer.render(
            scene,
            camera
        );
    }

    // =========================================================
    // POINTER
    // =========================================================

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