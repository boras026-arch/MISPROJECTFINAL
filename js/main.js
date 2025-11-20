// ADDED BY AGENT: 2025-01-27
// Main JavaScript for navigation, accessibility, and cinematic background animation

(function() {
    'use strict';

    // Mobile Navigation Toggle
    function initMobileNav() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const isExpanded = navLinks.classList.contains('active');
                menuToggle.setAttribute('aria-expanded', isExpanded);
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.navbar') && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Close menu on link click
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    // Cinematic Background Animation (Canvas)
    function initCinematicBackground() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'hero__canvas';
        canvas.setAttribute('aria-hidden', 'true');
        hero.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let animationId;
        let particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            };
        }

        function initParticles() {
            particles = [];
            const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
            for (let i = 0; i < particleCount; i++) {
                particles.push(createParticle());
            }
        }

        function animate() {
            // Check if page is hidden
            if (document.hidden) {
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, 'rgba(11, 15, 18, 0.8)');
            gradient.addColorStop(0.5, 'rgba(15, 23, 32, 0.6)');
            gradient.addColorStop(1, 'rgba(11, 15, 18, 0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(125, 211, 252, ${particle.opacity})`;
                ctx.fill();
            });

            animationId = requestAnimationFrame(animate);
        }

        function startAnimation() {
            if (!document.hidden) {
                resizeCanvas();
                initParticles();
                animate();
            }
        }

        function stopAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });

        // Handle resize
        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
            startAnimation();
        }
    }

    // Image Lazy Loading
    function initLazyLoading() {
        // Handle all images (both lazy and eager)
        const allImages = document.querySelectorAll('img');
        
        allImages.forEach(img => {
            // If image is already loaded (cached), add loaded class immediately
            if (img.complete && img.naturalHeight !== 0) {
                img.classList.add('loaded');
            } else {
                // Otherwise, wait for load event
                img.addEventListener('load', function() {
                    this.classList.add('loaded');
                });
                
                // Also handle error case
                img.addEventListener('error', function() {
                    console.error('Image failed to load:', this.src);
                    // Still show it (might be a path issue)
                    this.classList.add('loaded');
                });
            }
        });

        // Additional handling for lazy-loaded images
        if ('loading' in HTMLImageElement.prototype) {
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            lazyImages.forEach(img => {
                if (!img.classList.contains('loaded')) {
                    img.addEventListener('load', function() {
                        this.classList.add('loaded');
                    });
                }
            });
        } else {
            // Fallback for browsers that don't support native lazy loading
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Smooth Scroll
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Set Active Navigation Link
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a').forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Initialize everything when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        initMobileNav();
        initCinematicBackground();
        initLazyLoading();
        initSmoothScroll();
        setActiveNavLink();
    }

})();

