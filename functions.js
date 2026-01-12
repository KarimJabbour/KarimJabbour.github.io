
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('color-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check local storage or system preference
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggle) toggle.checked = true;
    } else if (currentTheme === 'light') {
        document.body.classList.remove('dark-mode');
        if (toggle) toggle.checked = false;
    } else if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-mode');
        if (toggle) toggle.checked = true;
    }

    // Toggle logic
    if (toggle) {
        toggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Optional: Add intersection observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.card, .reveal-on-scroll').forEach((el) => {
        observer.observe(el);
    });
});
