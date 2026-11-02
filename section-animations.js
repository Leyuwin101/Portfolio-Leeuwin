(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    const animationTheme = window.portfolioAnimationTheme;

    const rgb = (color) => color.map((channel) => Math.round(channel)).join(", ");
    const rgba = (color, alpha) => `rgba(${rgb(color)},${alpha})`;

    class SectionAnimation {
        constructor(canvas) {
            this.canvas = canvas;
            this.section = canvas.parentElement;
            this.ctx = canvas.getContext("2d", { alpha: true });
            this.width = 1;
            this.height = 1;
            this.active = false;
            this.pointer = { x: 0, y: 0, active: false };
        }

        resize() {
            if (!this.ctx) return;
            const bounds = this.section.getBoundingClientRect();
            this.width = Math.max(1, bounds.width);
            this.height = Math.max(1, bounds.height);
            const scale = Math.min(window.devicePixelRatio || 1, this.width < 700 ? 1 : 1.25);
            this.canvas.width = Math.round(this.width * scale);
            this.canvas.height = Math.round(this.height * scale);
            this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
            this.reset();
            this.render(0);
        }

        reset() {}
        update() {}

        clear() {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.globalAlpha = 0.72;
        }

        setPointer(event) {
            if (!finePointer.matches || motionQuery.matches) return;
            const bounds = this.section.getBoundingClientRect();
            this.pointer.x = event.clientX - bounds.left;
            this.pointer.y = event.clientY - bounds.top;
            this.pointer.active = this.pointer.x >= 0 && this.pointer.x <= bounds.width &&
                this.pointer.y >= 0 && this.pointer.y <= bounds.height;
        }

        ambient(x, y, radius, color, alpha) {
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(${color},${alpha})`);
            gradient.addColorStop(1, `rgba(${color},0)`);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        pointerLight(color = [80, 174, 204], alpha = 0.06) {
            if (this.pointer.active && finePointer.matches && !motionQuery.matches) {
                this.ambient(this.pointer.x, this.pointer.y, Math.min(this.width, this.height) * 0.38, rgb(color), alpha);
            }
        }

        get colors() {
            return animationTheme?.getColors() || animationTheme?.themes.dark;
        }
    }

    class AboutNeuralNetwork extends SectionAnimation {
        reset() {
            const count = Math.min(32, Math.max(18, Math.round(this.width * this.height / 38000)));
            this.nodes = Array.from({ length: count }, () => ({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.12,
                vy: (Math.random() - 0.5) * 0.12,
                phase: Math.random() * Math.PI * 2
            }));
        }

        update(_time, delta) {
            this.nodes.forEach((node) => {
                node.x = (node.x + node.vx * delta + this.width) % this.width;
                node.y = (node.y + node.vy * delta + this.height) % this.height;
            });
        }

        render(time) {
            const colors = this.colors;
            this.clear();
            this.ambient(this.width * 0.78, this.height * 0.42, this.width * 0.58, rgb(colors.glow), 0.05);
            this.pointerLight(colors.accent, 0.075);
            const limit = Math.min(175, this.width * 0.23);

            this.nodes.forEach((node, i) => {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const next = this.nodes[j];
                    const dx = next.x - node.x;
                    const dy = next.y - node.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance > limit) continue;
                    this.ctx.strokeStyle = rgba(colors.connection, (1 - distance / limit) * 0.13);
                    this.ctx.lineWidth = 0.75;
                    this.ctx.beginPath();
                    this.ctx.moveTo(node.x, node.y);
                    this.ctx.lineTo(next.x, next.y);
                    this.ctx.stroke();

                    const pulse = (time * 0.075 + i * 0.17 + j * 0.11) % 1;
                    if (pulse < 0.045 && (i + j) % 3 === 0) {
                        this.ctx.fillStyle = rgba(colors.cyan, 0.72);
                        this.ctx.beginPath();
                        this.ctx.arc(node.x + dx * pulse / 0.045, node.y + dy * pulse / 0.045, 1.5, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
                this.ctx.fillStyle = rgba(colors.particle, 0.65 + Math.sin(time * 0.7 + node.phase) * 0.2);
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, 1.6, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
    }

    class ProjectComputationalGrid extends SectionAnimation {
        reset() {
            this.signals = Array.from({ length: 9 }, (_, i) => ({ progress: i / 9, speed: 0.035 + (i % 3) * 0.009, lane: i }));
        }

        render(time) {
            const colors = this.colors;
            const ctx = this.ctx;
            const horizon = this.height * 0.4;
            const vanishX = this.width * 0.52;
            this.clear();
            this.ambient(this.width * 0.5, horizon, this.width * 0.75, rgb(colors.glow), 0.045);
            this.pointerLight(colors.accent, 0.065);

            ctx.lineWidth = 0.8;
            ctx.strokeStyle = rgba(colors.grid, 0.085);
            for (let ray = 0; ray <= 16; ray++) {
                const bottomX = this.width * ray / 16;
                ctx.beginPath();
                ctx.moveTo(vanishX + (bottomX - vanishX) * 0.08, horizon);
                ctx.lineTo(bottomX, this.height);
                ctx.stroke();
            }
            for (let row = 1; row <= 11; row++) {
                const p = row / 11;
                const y = horizon + (this.height - horizon) * p * p;
                ctx.globalAlpha = 0.18 + p * 0.55;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            const scanY = ((time * 24) % (this.height + 120)) - 60;
            const scan = ctx.createLinearGradient(0, scanY - 42, 0, scanY + 42);
            scan.addColorStop(0, rgba(colors.cyan, 0));
            scan.addColorStop(0.5, rgba(colors.cyan, 0.065));
            scan.addColorStop(1, rgba(colors.cyan, 0));
            ctx.fillStyle = scan;
            ctx.fillRect(0, horizon, this.width, this.height - horizon);

            // Rotating wireframe prism, distinct from the hero wave.
            const cx = this.width * 0.76;
            const cy = this.height * 0.25;
            const size = Math.min(this.width, this.height) * 0.085;
            const angle = time * 0.12;
            const points = [];
            for (let z = 0; z < 2; z++) {
                for (let i = 0; i < 4; i++) {
                    const a = angle + Math.PI / 4 + i * Math.PI / 2;
                    points.push({ x: cx + Math.cos(a) * size * (z ? 0.72 : 1), y: cy + Math.sin(a) * size * (z ? 0.72 : 1) - (z ? size * 0.55 : 0) });
                }
            }
            ctx.strokeStyle = rgba(colors.connection, 0.15);
            for (let i = 0; i < 4; i++) {
                const n = (i + 1) % 4;
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[n].x, points[n].y);
                ctx.lineTo(points[n + 4].x, points[n + 4].y);
                ctx.lineTo(points[i + 4].x, points[i + 4].y);
                ctx.stroke();
            }

            this.signals.forEach((signal) => {
                if (!motionQuery.matches) signal.progress = (signal.progress + signal.speed * 0.016) % 1;
                const x = vanishX + (this.width * signal.lane / 8 - vanishX) * signal.progress;
                const y = horizon + (this.height - horizon) * signal.progress * signal.progress;
                ctx.fillStyle = rgba(colors.cyan, 0.78);
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    class SkillsDataFlow extends SectionAnimation {
        reset() {
            this.routes = [];
            for (let i = 0; i < 8; i++) {
                const y = this.height * (0.1 + i * 0.105);
                const jog = (i % 2 ? 1 : -1) * this.height * 0.055;
                this.routes.push({
                    points: [
                        { x: 0, y }, { x: this.width * 0.22, y },
                        { x: this.width * 0.22, y: y + jog },
                        { x: this.width * 0.55, y: y + jog },
                        { x: this.width * 0.55, y }, { x: this.width, y }
                    ],
                    phase: i / 8,
                    speed: 0.035 + (i % 4) * 0.012
                });
            }
        }

        render(time) {
            const colors = this.colors;
            const ctx = this.ctx;
            this.clear();
            this.ambient(this.width * 0.18, this.height * 0.5, this.width * 0.5, rgb(colors.glow), 0.04);
            this.pointerLight(colors.accent, 0.075);

            this.routes.forEach((route) => {
                ctx.strokeStyle = rgba(colors.connection, 0.095);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(route.points[0].x, route.points[0].y);
                route.points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
                ctx.stroke();
                route.points.slice(1, -1).forEach((point) => {
                    ctx.fillStyle = rgba(colors.secondary, 0.5);
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 1.7, 0, Math.PI * 2);
                    ctx.fill();
                });

                let total = 0;
                const segments = route.points.slice(1).map((point, i) => {
                    const from = route.points[i];
                    const length = Math.hypot(point.x - from.x, point.y - from.y);
                    total += length;
                    return { from, point, length };
                });
                if (!motionQuery.matches) route.phase = (route.phase + route.speed * 0.016) % 1;
                let remaining = route.phase * total;
                for (const segment of segments) {
                    if (remaining <= segment.length) {
                        const p = segment.length ? remaining / segment.length : 0;
                        ctx.fillStyle = rgba(colors.cyan, 0.82);
                        ctx.beginPath();
                        ctx.arc(segment.from.x + (segment.point.x - segment.from.x) * p, segment.from.y + (segment.point.y - segment.from.y) * p, 2, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    }
                    remaining -= segment.length;
                }
            });
        }
    }

    class PhilosophyGeometry extends SectionAnimation {
        reset() {
            this.vertices = [];
            [-1, 1].forEach((x) => [-1, 1].forEach((y) => [-1, 1].forEach((z) => this.vertices.push({ x, y, z }))));
            this.edges = [];
            for (let a = 0; a < this.vertices.length; a++) {
                for (let b = a + 1; b < this.vertices.length; b++) {
                    const first = this.vertices[a];
                    const second = this.vertices[b];
                    if (Math.abs(first.x - second.x) + Math.abs(first.y - second.y) + Math.abs(first.z - second.z) === 2) this.edges.push([a, b]);
                }
            }
        }

        render(time) {
            const colors = this.colors;
            const ctx = this.ctx;
            this.clear();
            this.ambient(this.width * 0.72, this.height * 0.45, this.width * 0.52, rgb(colors.glow), 0.05);
            this.pointerLight(colors.accent, 0.055);
            const px = this.pointer.active && !motionQuery.matches ? (this.pointer.x / this.width - 0.5) * 14 : 0;
            const py = this.pointer.active && !motionQuery.matches ? (this.pointer.y / this.height - 0.5) * 10 : 0;
            const structures = [
                { x: this.width * 0.77 + px, y: this.height * 0.48 + py, radius: Math.min(this.width, this.height) * 0.2, phase: 0 },
                { x: this.width * 0.24 - px * 0.5, y: this.height * 0.72 - py * 0.5, radius: Math.min(this.width, this.height) * 0.09, phase: 1.3 }
            ];

            structures.forEach((shape) => {
                const angle = (motionQuery.matches ? 0 : time * 0.18) + shape.phase;
                const projected = this.vertices.map((v) => {
                    const x = v.x * Math.cos(angle) - v.z * Math.sin(angle);
                    const z = v.x * Math.sin(angle) + v.z * Math.cos(angle);
                    const y = v.y * Math.cos(angle * 0.67) - z * Math.sin(angle * 0.67);
                    const depth = v.y * Math.sin(angle * 0.67) + z * Math.cos(angle * 0.67);
                    const perspective = 3.5 / (3.5 + depth);
                    return { x: shape.x + x * shape.radius * perspective, y: shape.y + y * shape.radius * perspective, depth };
                });
                this.edges.forEach(([a, b], index) => {
                    const first = projected[a];
                    const second = projected[b];
                    ctx.strokeStyle = rgba(colors.connection, 0.11 + ((first.depth + second.depth + 4) / 8) * 0.13);
                    ctx.lineWidth = 0.85;
                    ctx.beginPath();
                    ctx.moveTo(first.x, first.y);
                    ctx.lineTo(second.x, second.y);
                    ctx.stroke();
                    if (index % 3 === 0) {
                        const pulse = motionQuery.matches ? 0.5 : (time * 0.16 + index * 0.13 + shape.phase) % 1;
                        ctx.fillStyle = rgba(colors.cyan, 0.65);
                        ctx.beginPath();
                        ctx.arc(first.x + (second.x - first.x) * pulse, first.y + (second.y - first.y) * pulse, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                projected.forEach((point) => {
                    ctx.fillStyle = rgba(colors.particle, 0.7);
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, point.depth > 0 ? 1.8 : 1.2, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
        }
    }

    class ContactAmbient extends SectionAnimation {
        reset() {
            this.particles = Array.from({ length: 16 }, () => ({
                x: Math.random() * this.width, y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.045, vy: (Math.random() - 0.5) * 0.045,
                phase: Math.random() * Math.PI * 2
            }));
        }

        update(_time, delta) {
            this.particles.forEach((p) => {
                p.x = (p.x + p.vx * delta + this.width) % this.width;
                p.y = (p.y + p.vy * delta + this.height) % this.height;
            });
        }

        render(time) {
            const colors = this.colors;
            const ctx = this.ctx;
            this.clear();
            this.ambient(this.width * 0.54, this.height * 0.35, this.width * 0.48, rgb(colors.glow), 0.045);
            this.pointerLight(colors.accent, 0.04);
            this.particles.forEach((p, i) => {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const other = this.particles[j];
                    const distance = Math.hypot(other.x - p.x, other.y - p.y);
                    if (distance > 155) continue;
                    ctx.strokeStyle = rgba(colors.connection, (1 - distance / 155) * 0.075);
                    ctx.lineWidth = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
                ctx.fillStyle = rgba(colors.particle, 0.45 + Math.sin(time * 0.55 + p.phase) * 0.18);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.35, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    const animationTypes = {
        about: AboutNeuralNetwork,
        projects: ProjectComputationalGrid,
        skills: SkillsDataFlow,
        philosophy: PhilosophyGeometry,
        contact: ContactAmbient
    };
    const sectionAnimations = [...document.querySelectorAll(".section-animation")]
        .map((canvas) => {
            const typeName = Object.keys(animationTypes).find((name) => canvas.classList.contains("section-animation--" + name));
            if (!typeName) return null;
            const animation = new animationTypes[typeName](canvas);
            animation.resize();
            return animation;
        })
        .filter(Boolean);

    window.addEventListener("portfolio-theme-change", () => {
        if (motionQuery.matches) {
            sectionAnimations.forEach((animation) => {
                if (animation.active) animation.render(sectionTime);
            });
        }
    });

    let sectionFrame = null;
    let lastSectionFrame = 0;
    let sectionTime = 0;

    function animateSections(timestamp) {
        if (document.hidden || motionQuery.matches) {
            sectionFrame = null;
            return;
        }
        const delta = lastSectionFrame ? Math.min(timestamp - lastSectionFrame, 50) : 16;
        lastSectionFrame = timestamp;
        sectionTime += delta / 1000;
        let visible = false;
        sectionAnimations.forEach((animation) => {
            if (!animation.active) return;
            visible = true;
            animation.update(sectionTime, delta);
            animation.render(sectionTime);
        });
        sectionFrame = visible ? requestAnimationFrame(animateSections) : null;
    }

    function startSectionAnimations() {
        if (sectionFrame === null && !document.hidden && !motionQuery.matches) {
            sectionFrame = requestAnimationFrame(animateSections);
        }
    }

    function initSectionAnimations() {
        if (!sectionAnimations.length) return;

        if ("ResizeObserver" in window) {
            const resizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => {
                    sectionAnimations.find((animation) => animation.section === entry.target)?.resize();
                });
            });
            sectionAnimations.forEach((animation) => resizeObserver.observe(animation.section));
        } else {
            window.addEventListener("resize", () => sectionAnimations.forEach((animation) => animation.resize()), { passive: true });
        }

        if ("IntersectionObserver" in window) {
            const visibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const animation = sectionAnimations.find((item) => item.section === entry.target);
                    if (!animation) return;
                    animation.active = entry.isIntersecting;
                    if (animation.active && motionQuery.matches) animation.render(sectionTime);
                });
                startSectionAnimations();
            }, { rootMargin: "100px 0px", threshold: 0 });
            sectionAnimations.forEach((animation) => visibilityObserver.observe(animation.section));
        } else {
            sectionAnimations.forEach((animation) => { animation.active = true; });
            startSectionAnimations();
        }

        document.addEventListener("pointermove", (event) => {
            sectionAnimations.forEach((animation) => animation.setPointer(event));
        }, { passive: true });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                cancelAnimationFrame(sectionFrame);
                sectionFrame = null;
                lastSectionFrame = 0;
            } else {
                startSectionAnimations();
            }
        });

        motionQuery.addEventListener?.("change", (event) => {
            if (event.matches) {
                cancelAnimationFrame(sectionFrame);
                sectionFrame = null;
                sectionAnimations.forEach((animation) => animation.render(sectionTime));
            } else {
                startSectionAnimations();
            }
        });
    }

    initSectionAnimations();
})();
