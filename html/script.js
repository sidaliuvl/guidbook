document.addEventListener('DOMContentLoaded', function() {
    // Global Variables
    let bookPages = [];
    let currentBookType = '';
    let canEdit = false;
    let activeCategory = null;
    let currentMediaType = '';
    let quill = null;
    let isEditMode = false;

    // DOM Elements
    const guidebookContainer = document.getElementById('guidebook-container');
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const searchInput = document.getElementById('search-input');
    const navItems = document.getElementById('nav-items');
    const navigation = document.getElementById('navigation');
    const searchResults = document.getElementById('search-results');
    const contentTitle = document.getElementById('content-title');
    const contentSubtitle = document.getElementById('content-subtitle');
    const contentBody = document.getElementById('content-body');
    const welcomeBanner = document.getElementById('welcome-banner');
    const dynamicContent = document.getElementById('dynamic-content');

    // Header buttons
    const editModeBtn = document.getElementById('edit-mode-btn');
    const closeBtn = document.getElementById('close-btn');

    // Edit mode elements
    const addCategoryBtn = document.getElementById('add-category-btn');
    const deleteCategoryBtn = document.getElementById('delete-category-btn');
    const insertImageBtn = document.getElementById('insert-image-btn');
    const insertVideoBtn = document.getElementById('insert-video-btn');
    const insertYoutubeBtn = document.getElementById('insert-youtube-btn');
    const insertLinkBtn = document.getElementById('insert-link-btn');
    const saveBtn = document.getElementById('save-btn');
    const previewBtn = document.getElementById('preview-btn');
    const exitEditBtn = document.getElementById('exit-edit-btn');

    // Modals
    const addCategoryModal = document.getElementById('add-category-modal');
    const deleteCategoryModal = document.getElementById('delete-category-modal');
    const mediaModal = document.getElementById('media-modal');
    const linkModal = document.getElementById('link-modal');

    // Initialize Quill Editor
    function initializeEditor() {
        if (quill) return;
        
        quill = new Quill('#editor', {
            theme: 'snow',
            modules: {
                toolbar: false // We'll use custom toolbar
            },
            placeholder: 'Start writing your content here...'
        });

        // Custom toolbar functionality
        setupCustomToolbar();
    }

    // Setup custom toolbar
    function setupCustomToolbar() {
        const toolbarButtons = {
            'bold-btn': () => quill.format('bold', !quill.getFormat().bold),
            'italic-btn': () => quill.format('italic', !quill.getFormat().italic),
            'underline-btn': () => quill.format('underline', !quill.getFormat().underline),
            'h1-btn': () => quill.format('header', quill.getFormat().header === 1 ? false : 1),
            'h2-btn': () => quill.format('header', quill.getFormat().header === 2 ? false : 2),
            'h3-btn': () => quill.format('header', quill.getFormat().header === 3 ? false : 3),
            'list-btn': () => quill.format('list', quill.getFormat().list === 'bullet' ? false : 'bullet'),
            'ordered-list-btn': () => quill.format('list', quill.getFormat().list === 'ordered' ? false : 'ordered'),
            'align-left-btn': () => quill.format('align', false),
            'align-center-btn': () => quill.format('align', 'center'),
            'align-right-btn': () => quill.format('align', 'right')
        };

        Object.keys(toolbarButtons).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', toolbarButtons[btnId]);
            }
        });

        // Update toolbar button states
        quill.on('selection-change', updateToolbarStates);
    }

    // Update toolbar button states
    function updateToolbarStates() {
        if (!quill.getSelection()) return;
        
        const format = quill.getFormat();
        
        // Toggle button states
        toggleButtonState('bold-btn', format.bold);
        toggleButtonState('italic-btn', format.italic);
        toggleButtonState('underline-btn', format.underline);
        toggleButtonState('h1-btn', format.header === 1);
        toggleButtonState('h2-btn', format.header === 2);
        toggleButtonState('h3-btn', format.header === 3);
        toggleButtonState('list-btn', format.list === 'bullet');
        toggleButtonState('ordered-list-btn', format.list === 'ordered');
        toggleButtonState('align-left-btn', !format.align);
        toggleButtonState('align-center-btn', format.align === 'center');
        toggleButtonState('align-right-btn', format.align === 'right');
    }

    // Toggle button state
    function toggleButtonState(btnId, isActive) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.classList.toggle('active', isActive);
        }
    }

    // Get category icon
    function getCategoryIcon(category) {
        const iconMap = {
            'jobs': 'fas fa-briefcase',
            'rules': 'fas fa-gavel',
            'map': 'fas fa-map',
            'vehicles': 'fas fa-car',
            'housing': 'fas fa-home',
            'businesses': 'fas fa-store',
            'government': 'fas fa-landmark',
            'police': 'fas fa-shield-alt',
            'medical': 'fas fa-user-md',
            'mechanics': 'fas fa-wrench',
            'welcome': 'fas fa-hand-wave',
            'getting started': 'fas fa-play',
            'faq': 'fas fa-question-circle'
        };
        
        return iconMap[category.toLowerCase()] || 'fas fa-folder';
    }

    // Render navigation menu
    function renderNavMenu() {
        if (!navItems) return;
        
        navItems.innerHTML = '';
        
        if (bookPages.length === 0) {
            navItems.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-folder-open" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                    <p>No categories available</p>
                    ${canEdit ? '<p style="font-size: 12px;">Use Edit Mode to add categories</p>' : ''}
                </div>
            `;
            return;
        }

        bookPages.forEach(page => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            navItem.dataset.category = page.category;
            
            navItem.innerHTML = `
                <div class="nav-icon">
                    <i class="${getCategoryIcon(page.category)}"></i>
                </div>
                <div class="nav-text">${page.category}</div>
            `;
            
            navItem.addEventListener('click', () => {
                if (!isEditMode) {
                    renderContent(page.category);
                }
            });
            
            navItems.appendChild(navItem);
        });
    }

    // Process internal links
    function processInternalLinks(content) {
        return content.replace(/\[LINK:([^\]]+)\|([^\]]+)\]/g, (match, linkText, targetCategory) => {
            return `<a href="#" class="internal-link" data-link-category="${targetCategory}">${linkText}</a>`;
        });
    }

    // Process media content
    function processMediaContent(content) {
        // Process images
        content = content.replace(/\[IMG:([^\]]+)\|([^\]]*)\|([^\]]+)\|([^\]]+)\]/g, (match, url, alt, position, size) => {
            const altText = alt || 'Image';
            return `<div class="media-container media-${position} media-${size}">
                        <img src="${url}" alt="${altText}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <p style="display: none; color: var(--error-color); text-align: center; padding: 20px;">
                            <i class="fas fa-exclamation-triangle"></i> Failed to load image
                        </p>
                    </div>`;
        });

        // Process videos
        content = content.replace(/\[VIDEO:([^\]]+)\|([^\]]*)\|([^\]]+)\|([^\]]+)\]/g, (match, url, alt, position, size) => {
            return `<div class="media-container media-${position} media-${size}">
                        <video controls preload="metadata">
                            <source src="${url}" type="video/mp4">
                            Your browser does not support video playback.
                        </video>
                    </div>`;
        });

        // Process YouTube videos
        content = content.replace(/\[YOUTUBE:([^\]]+)\|([^\]]*)\|([^\]]+)\|([^\]]+)\]/g, (match, url, alt, position, size) => {
            let embedUrl = url;
            if (url.includes('youtube.com/watch?v=')) {
                const videoId = url.split('v=')[1].split('&')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (url.includes('youtu.be/')) {
                const videoId = url.split('youtu.be/')[1].split('?')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
            
            return `<div class="media-container media-${position} media-${size}">
                        <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                    </div>`;
        });

        return content;
    }

    // Render content
    function renderContent(categoryName) {
        const page = bookPages.find(p => p.category.toLowerCase() === categoryName.toLowerCase());
        
        if (!page) return;

        // Hide welcome banner when showing specific content
        if (welcomeBanner) {
            welcomeBanner.style.display = 'none';
        }

        // Update header
        contentTitle.textContent = page.category;
        contentSubtitle.textContent = `Learn about ${page.category.toLowerCase()} in our server`;

        // Process and display content
        let processedContent = processInternalLinks(page.content);
        processedContent = processMediaContent(processedContent);
        
        dynamicContent.innerHTML = processedContent + '<div class="clearfix"></div>';

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.category.toLowerCase() === categoryName.toLowerCase());
        });

        activeCategory = page.category;
    }

    // Handle search
    function handleSearch(query) {
        const lowerCaseQuery = query.toLowerCase().trim();
        
        if (lowerCaseQuery === '') {
            searchResults.classList.add('hidden');
            navigation.classList.remove('hidden');
            return;
        }

        const results = [];
        const tempDiv = document.createElement('div');
        
        bookPages.forEach(page => {
            tempDiv.innerHTML = page.content;
            const plainTextContent = tempDiv.textContent || "";
            const contentIndex = plainTextContent.toLowerCase().indexOf(lowerCaseQuery);
            
            if (page.category.toLowerCase().includes(lowerCaseQuery) || contentIndex !== -1) {
                let snippet = '';
                if (contentIndex !== -1) {
                    const startIndex = Math.max(0, contentIndex - 40);
                    snippet = '...' + plainTextContent.substring(startIndex, startIndex + 120) + '...';
                    snippet = snippet.replace(new RegExp(query, 'gi'), `<mark>$&</mark>`);
                } else {
                    snippet = plainTextContent.substring(0, 120) + '...';
                }
                results.push({ category: page.category, snippet: snippet });
            }
        });

        navigation.classList.add('hidden');
        searchResults.classList.remove('hidden');
        searchResults.innerHTML = '';
        
        if (results.length > 0) {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result';
                resultItem.innerHTML = `
                    <div class="search-result-title">
                        <i class="${getCategoryIcon(result.category)}"></i> ${result.category}
                    </div>
                    <div class="search-result-snippet">${result.snippet}</div>
                `;
                resultItem.addEventListener('click', () => {
                    renderContent(result.category);
                    searchInput.value = '';
                    handleSearch('');
                });
                searchResults.appendChild(resultItem);
            });
        } else {
            searchResults.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-search" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                    <p>No results found for "${query}"</p>
                </div>
            `;
        }
    }

    // Switch to edit mode
    function switchToEditMode() {
        if (!canEdit) return;
        
        isEditMode = true;
        viewMode.classList.add('hidden');
        editMode.classList.remove('hidden');
        editMode.classList.add('active');
        
        initializeEditor();
        
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (currentPage) {
            quill.root.innerHTML = currentPage.content;
        } else if (bookPages.length > 0) {
            quill.root.innerHTML = bookPages[0].content;
            activeCategory = bookPages[0].category;
        } else {
            quill.root.innerHTML = '<p>Start writing your content here...</p>';
        }
    }

    // Switch to view mode
    function switchToViewMode() {
        isEditMode = false;
        editMode.classList.remove('active');
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
        
        if (activeCategory) {
            renderContent(activeCategory);
        } else if (bookPages.length > 0) {
            renderContent(bookPages[0].category);
        } else {
            // Show welcome banner if no content
            if (welcomeBanner) {
                welcomeBanner.style.display = 'block';
            }
            contentTitle.textContent = 'Welcome to DzCrew';
            contentSubtitle.textContent = 'Your comprehensive server guide';
            dynamicContent.innerHTML = '<p>No content available. Admins can add categories in edit mode.</p>';
        }
    }

    // Close guidebook
    function closeGuidebook() {
        guidebookContainer.classList.add('closing');
        setTimeout(() => {
            guidebookContainer.style.display = 'none';
            guidebookContainer.classList.remove('closing');
            searchInput.value = '';
            handleSearch('');
            switchToViewMode();
            
            // Notify parent window
            fetch(`https://ap_guidebook/closeBook`, { method: 'POST' });
        }, 300);
    }

    // Save content
    function saveContent() {
        if (!canEdit || !quill) return;
        
        const newContent = quill.root.innerHTML;
        const currentPage = bookPages.find(p => p.category === activeCategory);
        
        if (!currentPage) {
            switchToViewMode();
            return;
        }
        
        fetch(`https://ap_guidebook/savePage`, {
            method: 'POST',
            body: JSON.stringify({ pageId: currentPage.id, newContent: newContent })
        }).then(resp => resp.json()).then(response => {
            if (response.success) {
                currentPage.content = newContent;
                // Show success feedback
                showNotification('Content saved successfully!', 'success');
            } else {
                showNotification('Failed to save content', 'error');
            }
        }).catch(() => {
            showNotification('Failed to save content', 'error');
        });
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
            color: white;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Modal functions
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Add category
    function addCategory() {
        const categoryName = document.getElementById('category-name').value.trim();
        const categoryIcon = document.getElementById('category-icon').value.trim();
        
        if (!categoryName) return;
        
        fetch(`https://ap_guidebook/addCategory`, {
            method: 'POST',
            body: JSON.stringify({ 
                bookType: currentBookType, 
                categoryName: categoryName,
                categoryIcon: categoryIcon || 'fas fa-folder'
            })
        }).then(resp => resp.json()).then(response => {
            if (response.success) {
                const newPage = {
                    id: response.newPageId,
                    book_type: currentBookType,
                    category: categoryName,
                    content: '',
                    deletable: 1,
                    priority: 99
                };
                bookPages.push(newPage);
                renderNavMenu();
                activeCategory = categoryName;
                showNotification('Category added successfully!', 'success');
            } else {
                showNotification('Failed to add category', 'error');
            }
        }).catch(() => {
            showNotification('Failed to add category', 'error');
        });
        
        hideModal('add-category-modal');
        document.getElementById('category-name').value = '';
        document.getElementById('category-icon').value = 'fas fa-folder';
    }

    // Delete category
    function deleteCategory() {
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage) return;
        
        fetch(`https://ap_guidebook/removeCategory`, {
            method: 'POST',
            body: JSON.stringify({ pageId: currentPage.id })
        }).then(resp => resp.json()).then(response => {
            if (response.success) {
                bookPages = bookPages.filter(p => p.id !== currentPage.id);
                renderNavMenu();
                
                if (bookPages.length > 0) {
                    activeCategory = bookPages[0].category;
                    renderContent(activeCategory);
                } else {
                    activeCategory = null;
                    switchToViewMode();
                }
                
                showNotification('Category deleted successfully!', 'success');
            } else {
                showNotification('Failed to delete category', 'error');
            }
        }).catch(() => {
            showNotification('Failed to delete category', 'error');
        });
        
        hideModal('delete-category-modal');
    }

    // Media functions
    function openMediaModal(mediaType) {
        currentMediaType = mediaType;
        
        const titles = {
            'image': '<i class="fas fa-image"></i> Insert Image',
            'video': '<i class="fas fa-video"></i> Insert Video',
            'youtube': '<i class="fab fa-youtube"></i> Insert YouTube Video'
        };
        
        const placeholders = {
            'image': 'https://example.com/image.jpg',
            'video': 'https://example.com/video.mp4',
            'youtube': 'https://www.youtube.com/watch?v=...'
        };
        
        document.getElementById('media-modal-title').innerHTML = titles[mediaType];
        document.getElementById('media-url').placeholder = placeholders[mediaType];
        document.getElementById('media-url').value = '';
        document.getElementById('media-alt').value = '';
        document.getElementById('media-position-modal').value = 'center';
        document.getElementById('media-size-modal').value = 'medium';
        document.getElementById('media-preview-container').classList.add('hidden');
        
        showModal('media-modal');
    }

    // Preview media
    function previewMedia() {
        const url = document.getElementById('media-url').value.trim();
        if (!url) return;
        
        const alt = document.getElementById('media-alt').value.trim() || 'Preview';
        const preview = document.getElementById('media-preview');
        const container = document.getElementById('media-preview-container');
        
        let previewHTML = '';
        
        switch(currentMediaType) {
            case 'image':
                previewHTML = `<img src="${url}" alt="${alt}" style="max-width: 100%; max-height: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                              <p style="display: none; color: var(--error-color);"><i class="fas fa-exclamation-triangle"></i> Failed to load image</p>`;
                break;
            case 'video':
                previewHTML = `<video controls style="max-width: 100%; max-height: 200px;" preload="metadata">
                                  <source src="${url}" type="video/mp4">
                                  Your browser does not support video playback.
                               </video>`;
                break;
            case 'youtube':
                let embedUrl = url;
                if (url.includes('youtube.com/watch?v=')) {
                    const videoId = url.split('v=')[1].split('&')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                } else if (url.includes('youtu.be/')) {
                    const videoId = url.split('youtu.be/')[1].split('?')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
                previewHTML = `<iframe src="${embedUrl}" width="300" height="200" frameborder="0" allowfullscreen></iframe>`;
                break;
        }
        
        preview.innerHTML = previewHTML;
        container.classList.remove('hidden');
    }

    // Insert media
    function insertMedia() {
        if (!canEdit || !quill) return;
        
        const url = document.getElementById('media-url').value.trim();
        if (!url) return;
        
        const alt = document.getElementById('media-alt').value.trim() || '';
        const position = document.getElementById('media-position-modal').value;
        const size = document.getElementById('media-size-modal').value;
        
        let mediaCode = '';
        
        switch(currentMediaType) {
            case 'image':
                mediaCode = `[IMG:${url}|${alt}|${position}|${size}]`;
                break;
            case 'video':
                mediaCode = `[VIDEO:${url}|${alt}|${position}|${size}]`;
                break;
            case 'youtube':
                mediaCode = `[YOUTUBE:${url}|${alt}|${position}|${size}]`;
                break;
        }
        
        const range = quill.getSelection();
        if (range) {
            quill.insertText(range.index, '\n' + mediaCode + '\n');
        } else {
            quill.insertText(quill.getLength(), '\n' + mediaCode + '\n');
        }
        
        hideModal('media-modal');
    }

    // Insert internal link
    function insertInternalLink() {
        const linkText = document.getElementById('link-text').value.trim();
        const targetCategory = document.getElementById('link-target').value;
        
        if (!linkText || !targetCategory) return;
        
        const linkCode = `[LINK:${linkText}|${targetCategory}]`;
        
        const range = quill.getSelection();
        if (range) {
            quill.insertText(range.index, linkCode);
        } else {
            quill.insertText(quill.getLength(), linkCode);
        }
        
        hideModal('link-modal');
        document.getElementById('link-text').value = '';
        document.getElementById('link-target').value = '';
    }

    // Populate link target options
    function populateLinkTargets() {
        const select = document.getElementById('link-target');
        select.innerHTML = '<option value="">Select a category...</option>';
        
        bookPages.forEach(page => {
            if (page.category !== activeCategory) {
                const option = document.createElement('option');
                option.value = page.category;
                option.textContent = page.category;
                select.appendChild(option);
            }
        });
    }

    // Event Listeners
    window.addEventListener('message', function(event) {
        const data = event.data;
        if (data.action === 'openBook') {
            bookPages = data.pages || [];
            currentBookType = data.bookType || '';
            canEdit = data.canEdit || false;
            
            searchInput.value = '';
            handleSearch('');
            renderNavMenu();
            
            if (bookPages.length > 0) {
                const categoryToStart = data.startCategory && bookPages.find(p => p.category === data.startCategory) 
                    ? data.startCategory 
                    : bookPages[0].category;
                renderContent(categoryToStart);
            } else {
                activeCategory = null;
                switchToViewMode();
            }
            
            if (editModeBtn) {
                editModeBtn.style.display = canEdit ? 'inline-flex' : 'none';
            }
            
            guidebookContainer.style.display = 'block';
            switchToViewMode();
        }
    });

    // Header button events
    if (editModeBtn) {
        editModeBtn.addEventListener('click', switchToEditMode);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeGuidebook);
    }

    // Edit mode button events
    if (saveBtn) {
        saveBtn.addEventListener('click', saveContent);
    }
    
    if (previewBtn) {
        previewBtn.addEventListener('click', switchToViewMode);
    }
    
    if (exitEditBtn) {
        exitEditBtn.addEventListener('click', switchToViewMode);
    }

    // Category management
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => showModal('add-category-modal'));
    }
    
    if (deleteCategoryBtn) {
        deleteCategoryBtn.addEventListener('click', () => {
            if (activeCategory) {
                document.getElementById('delete-category-text').textContent = 
                    `Are you sure you want to delete the "${activeCategory}" category? This action cannot be undone.`;
                showModal('delete-category-modal');
            }
        });
    }

    // Media insertion
    if (insertImageBtn) {
        insertImageBtn.addEventListener('click', () => openMediaModal('image'));
    }
    
    if (insertVideoBtn) {
        insertVideoBtn.addEventListener('click', () => openMediaModal('video'));
    }
    
    if (insertYoutubeBtn) {
        insertYoutubeBtn.addEventListener('click', () => openMediaModal('youtube'));
    }

    // Internal links
    if (insertLinkBtn) {
        insertLinkBtn.addEventListener('click', () => {
            populateLinkTargets();
            showModal('link-modal');
        });
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            handleSearch(searchInput.value);
        });
    }

    // Modal events
    const modalEvents = {
        'confirm-add-category': addCategory,
        'cancel-add-category': () => hideModal('add-category-modal'),
        'confirm-delete-category': deleteCategory,
        'cancel-delete-category': () => hideModal('delete-category-modal'),
        'insert-media-btn': insertMedia,
        'preview-media-btn': previewMedia,
        'cancel-media-btn': () => hideModal('media-modal'),
        'insert-link-confirm': insertInternalLink,
        'cancel-link-btn': () => hideModal('link-modal')
    };

    Object.keys(modalEvents).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', modalEvents[id]);
        }
    });

    // Auto-preview media on URL input
    const mediaUrlInput = document.getElementById('media-url');
    if (mediaUrlInput) {
        mediaUrlInput.addEventListener('input', () => {
            if (mediaUrlInput.value.trim()) {
                setTimeout(previewMedia, 500); // Debounce
            }
        });
    }

    // Internal link navigation
    if (contentBody) {
        contentBody.addEventListener('click', function(event) {
            const link = event.target.closest('.internal-link');
            if (link) {
                event.preventDefault();
                const targetCategory = link.dataset.linkCategory;
                if (targetCategory && !isEditMode) {
                    renderContent(targetCategory);
                }
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 's':
                    event.preventDefault();
                    if (isEditMode) saveContent();
                    break;
                case 'e':
                    event.preventDefault();
                    if (canEdit && !isEditMode) switchToEditMode();
                    break;
                case 'Escape':
                    if (isEditMode) switchToViewMode();
                    break;
            }
        }
    });

    // Close modals on outside click
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.classList.add('hidden');
        }
    });
});