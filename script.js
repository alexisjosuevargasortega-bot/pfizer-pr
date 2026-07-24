document.addEventListener('DOMContentLoaded', () => {
    // Animar gráficos circulares (Left Column)
    const circles = document.querySelectorAll('.circle-chart');
    
    circles.forEach(chart => {
        const percent = chart.getAttribute('data-percent');
        const circle = chart.querySelector('.circle');
        
        // La animación CSS se encarga del keyframe 'progress', pero podemos forzar el valor final
        // La longitud de la circunferencia para r=15.9155 es 100
        setTimeout(() => {
            circle.style.strokeDasharray = `${percent}, 100`;
        }, 100);
    });

    // Animar Gauge (Right Column)
    const gaugeFill = document.querySelector('.gauge-fill');
    if (gaugeFill) {
        // La circunferencia del gauge (r=35) es ~220, pero solo mostramos la mitad (~110)
        // El atributo actual en HTML es stroke-dasharray="110" stroke-dashoffset="15"
        // Inicializamos vacío y luego llenamos
        gaugeFill.style.strokeDashoffset = '110'; // Empezar vacío
        
        setTimeout(() => {
            // Animarlo hasta casi lleno (unos 15 de offset)
            gaugeFill.style.strokeDashoffset = '15'; 
        }, 300);
    }

    // --- INTERACTIVIDAD AÑADIDA ---

    // 1. Dropdowns del Header
    const toggleDropdown = (btnId, dropdownId) => {
        const btn = document.getElementById(btnId);
        const dropdown = document.getElementById(dropdownId);
        if(btn && dropdown) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Cerrar otros dropdowns
                document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                    if (m !== dropdown) m.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });
        }
    };
    toggleDropdown('btn-notification', 'notif-dropdown');
    toggleDropdown('btn-profile', 'profile-dropdown');

    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
    });

    // 2. Acordeón para Cursos Recomendados
    const courseItems = document.querySelectorAll('.course-item');
    courseItems.forEach(item => {
        item.addEventListener('click', () => {
            // Alternar estado de expansión
            item.classList.toggle('expanded');
        });
    });

    // Evitar que el clic en el botón cierre el acordeón
    document.querySelectorAll('.course-item .btn-primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            alert('Continuando curso...');
        });
    });

    // 3. Pestañas (Nav Tabs) - SPA Routing Simulation
    const navLinks = document.querySelectorAll('.main-nav a');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Actualizar clase activa en tabs
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Mostrar vista correspondiente
            const targetId = link.getAttribute('data-target');
            if(targetId) {
                viewSections.forEach(view => {
                    view.classList.remove('active');
                    view.style.display = 'none'; // ocultar por completo
                });
                const targetView = document.getElementById(targetId);
                if (targetView) {
                    targetView.style.display = 'block'; // preparar display
                    // forzar reflujo para que la animación css funcione
                    void targetView.offsetWidth; 
                    targetView.classList.add('active');
                }
            }
        });
    });

    // 4. Resource Vault Tags (Filtros)
    const vaultTags = document.querySelectorAll('.vault-tags .tag');
    vaultTags.forEach(tag => {
        tag.addEventListener('click', () => {
            vaultTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
        });
    });

    // 5. Selección de Videos en Care Clips
    const clips = document.querySelectorAll('.clip');
    const mainTimeDisplay = document.querySelector('.video-controls .time:first-of-type');
    const endTimeDisplay = document.querySelector('.video-controls .time:last-of-type');

    clips.forEach(clip => {
        clip.addEventListener('click', () => {
            clips.forEach(c => c.classList.remove('active'));
            clip.classList.add('active');
            
            // Simular cambio de video actualizando tiempos si existen en data attributes
            const startTime = clip.getAttribute('data-time');
            const endTime = clip.getAttribute('data-end');
            
            if(startTime && mainTimeDisplay) mainTimeDisplay.textContent = startTime;
            if(endTime && endTimeDisplay) endTimeDisplay.textContent = endTime;
        });
    });
});

// Función global para reproducir video en la vista "Care Clips"
window.playVideo = function(src, title, author) {
    const videoPlayer = document.getElementById('main-video-player');
    const overlayTitle = document.querySelector('.video-info-overlay h2');
    const overlayAuthor = document.querySelector('.video-info-overlay p');

    if(videoPlayer && overlayTitle && overlayAuthor) {
        videoPlayer.src = src;
        overlayTitle.textContent = title;
        overlayAuthor.textContent = author;
        videoPlayer.play();
        
        // Simular efecto visual
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
