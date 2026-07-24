document.addEventListener('DOMContentLoaded', () => {

    // 1. Animación de gráficos circulares
    const circles = document.querySelectorAll('.circle-chart');
    circles.forEach(chart => {
        const percent = parseFloat(chart.getAttribute('data-percent') || 0);
        const path = chart.querySelector('.circle');
        if (path) {
            path.style.strokeDasharray = `0, 100`;
            setTimeout(() => {
                path.style.transition = 'stroke-dasharray 1s ease';
                path.style.strokeDasharray = `${percent}, 100`;
            }, 300);
        }
    });

    // 2. Dropdowns (Notificaciones y Perfil)
    const btnNotif = document.getElementById('btn-notification');
    const notifDropdown = document.getElementById('notif-dropdown');
    const btnProfile = document.getElementById('btn-profile');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (btnNotif && notifDropdown) {
        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
            if (profileDropdown) profileDropdown.classList.remove('show');
        });
    }

    if (btnProfile && profileDropdown) {
        btnProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            if (notifDropdown) notifDropdown.classList.remove('show');
        });
    }

    document.addEventListener('click', () => {
        if (notifDropdown) notifDropdown.classList.remove('show');
        if (profileDropdown) profileDropdown.classList.remove('show');
    });

    // 3. Pestañas (Nav Tabs) - SPA Routing
    const navLinks = document.querySelectorAll('.main-nav a');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const targetId = link.getAttribute('data-target');
            if (targetId) {
                viewSections.forEach(view => {
                    view.classList.remove('active');
                    view.style.display = 'none';
                });
                const targetView = document.getElementById(targetId);
                if (targetView) {
                    targetView.style.display = 'block';
                    void targetView.offsetWidth;
                    targetView.classList.add('active');
                }
            }
        });
    });

    // 4. Acordeón de Cursos
    const courseItems = document.querySelectorAll('.course-item');
    courseItems.forEach(item => {
        const header = item.querySelector('.course-header');
        if (header) {
            header.addEventListener('click', () => {
                const isExpanded = item.classList.contains('expanded');
                courseItems.forEach(i => i.classList.remove('expanded'));
                if (!isExpanded) item.classList.add('expanded');
            });
        }
    });

    // 5. Care Clips - miniaturas de video
    const clips = document.querySelectorAll('.clip');
    const timeStart = document.querySelector('.video-controls .time:first-of-type');
    const timeEnd = document.querySelector('.video-controls .time:last-of-type');

    clips.forEach(clip => {
        clip.addEventListener('click', () => {
            clips.forEach(c => c.classList.remove('active'));
            clip.classList.add('active');
            if (timeStart) timeStart.textContent = clip.getAttribute('data-time') || '0:00';
            if (timeEnd) timeEnd.textContent = clip.getAttribute('data-end') || '-0:30';
        });
    });

    // 6. Tags de Resource Vault (en el widget del dashboard)
    const tags = document.querySelectorAll('.vault-tags .tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
        });
    });

    // 7. Categorías de la vista Resource Vault completa
    const categoryBtns = document.querySelectorAll('.btn-category');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});

// Función global para reproducir video en la vista "Care Clips"
window.playVideo = function(src, title, author) {
    const videoPlayer = document.getElementById('main-video-player');
    const overlayTitle = document.querySelector('.video-info-overlay h2');
    const overlayAuthor = document.querySelector('.video-info-overlay p');

    if (videoPlayer && overlayTitle && overlayAuthor) {
        videoPlayer.src = src;
        overlayTitle.textContent = title;
        overlayAuthor.textContent = author;
        videoPlayer.load();
        videoPlayer.play();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
