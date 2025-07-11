// DzCrew GuideBook Script
// Enhanced Gaming Interface Version

document.addEventListener('DOMContentLoaded', () => {
    
    let bookPages = [], activeCategory = '', currentBookType = 'server', quill;
    let currentMediaType = 'image';
    let canEdit = false;

    // DOM Elements
    const ipadFrame = document.querySelector('.ipad-frame');
    const viewModeWrapper = document.querySelector('.view-mode-wrapper');
    const editModeWrapper = document.querySelector('.edit-mode-wrapper');
    const contentBodyView = document.getElementById('content-body-view');
    const searchInput = document.getElementById('search-input');
    const navMenu = document.getElementById('nav-menu-view');
    const searchResultsContainer = document.getElementById('search-results');
    const removeCategoryButton = document.getElementById('remove-category-button');
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save-button');
    const exitEditButton = document.getElementById('exit-edit-button');
    const closeButton = document.getElementById('close-button-view');
    const addCategoryButton = document.getElementById('add-category-button');
    const welcomeBanner = document.getElementById('welcome-banner');

    // Modal Elements
    const addCategoryModal = document.getElementById('add-category-modal');
    const newCategoryInput = document.getElementById('new-category-input');
    const confirmAddButton = document.getElementById('confirm-add-button');
    const removeCategoryModal = document.getElementById('remove-category-modal');
    const removeConfirmText = document.getElementById('remove-confirm-text');
    const confirmRemoveButton = document.getElementById('confirm-remove-button');
    const modalCancelButtons = document.querySelectorAll('.modal-cancel-button');

    // Media Elements
    const mediaModal = document.getElementById('media-modal');
    const mediaModalTitle = document.getElementById('media-modal-title');
    const mediaUrlInput = document.getElementById('media-url-input');
    const mediaAltInput = document.getElementById('media-alt-input');
    const mediaPositionModal = document.getElementById('media-position-modal');
    const mediaSizeModal = document.getElementById('media-size-modal');
    const mediaPreview = document.getElementById('media-preview');
    const mediaPreviewContent = document.getElementById('media-preview-content');
    const insertMediaConfirm = document.getElementById('insert-media-confirm');
    const previewMediaBtn = document.getElementById('preview-media-btn');

    // Toolbar Elements
    const insertImageBtn = document.getElementById('insert-image-btn');
    const insertVideoBtn = document.getElementById('insert-video-btn');
    const insertYoutubeBtn = document.getElementById('insert-youtube-btn');
    const mediaPositionSelect = document.getElementById('media-position-select');
    const mediaSizeSelect = document.getElementById('media-size-select');

    // Initialize Quill Editor
    function initializeQuill() {
        quill = new Quill('#editor', {
            theme: 'snow',
            modules: { 
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }], 
                    ['bold', 'italic', 'underline', 'strike'], 
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
                    [{ 'color': [] }, { 'background': [] }], 
                    ['link'], 
                    ['clean']
                ] 
            }
        });
    }
    initializeQuill();

    // Get icon for category
    function getCategoryIcon(categoryName) {
        const name = categoryName.toLowerCase();
        if (name.includes('home') || name.includes('welcome')) return 'fa-home';
        if (name.includes('job') || name.includes('work')) return 'fa-briefcase';
        if (name.includes('rule') || name.includes('law')) return 'fa-gavel';
        if (name.includes('map') || name.includes('location')) return 'fa-map';
        if (name.includes('vehicle') || name.includes('car')) return 'fa-car';
        if (name.includes('house') || name.includes('property')) return 'fa-building';
        if (name.includes('business') || name.includes('shop')) return 'fa-store';
        if (name.includes('police') || name.includes('cop')) return 'fa-shield-alt';
        if (name.includes('medical') || name.includes('hospital')) return 'fa-hospital';
        if (name.includes('mechanic') || name.includes('garage')) return 'fa-wrench';
        if (name.includes('tutorial') || name.includes('guide')) return 'fa-graduation-cap';
        if (name.includes('command') || name.includes('cmd')) return 'fa-terminal';
        if (name.includes('keyboard') || name.includes('hotkey')) return 'fa-keyboard';
        return 'fa-book-open';
    }

    // Process internal links
    function processInternalLinks(content) {
        const linkRegex = /\[\[(.*?)\]\]/g;
        return content.replace(linkRegex, (match, categoryName) => {
            const trimmedCategoryName = categoryName.trim();
            const targetExists = bookPages.some(p => p.category.toLowerCase() === trimmedCategoryName.toLowerCase());
            if (targetExists) {
                return `<a href="#" class="internal-link" data-link-category="${trimmedCategoryName}">
                    <i class="fas fa-link"></i> ${trimmedCategoryName}
                </a>`;
            }
            return `<s style="color: #ff6b35;">${trimmedCategoryName} (Not Found)</s>`;
        });
    }

    // Process media content
    function processMediaContent(content) {
        // Process images
        content = content.replace(/\[IMG:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g, (match, url, alt, position, size) => {
            const altText = alt || 'Image';
            const positionClass = `media-${position}`;
            const sizeClass = `media-${size}`;
            return `<div class="media-container ${positionClass} ${sizeClass}">
                        <img src="${url}" alt="${altText}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; color: #ff6b35; text-align: center; padding: 20px;">
                            <i class="fas fa-exclamation-triangle"></i> Failed to load image
                        </div>
                    </div>`;
        });

        // Process videos
        content = content.replace(/\[VIDEO:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g, (match, url, alt, position, size) => {
            const altText = alt || 'Video';
            const positionClass = `media-${position}`;
            const sizeClass = `media-${size}`;
            return `<div class="media-container ${positionClass} ${sizeClass}">
                        <video controls preload="metadata" title="${altText}">
                            <source src="${url}" type="video/mp4">
                            Your browser does not support video playback.
                        </video>
                    </div>`;
        });

        // Process YouTube videos
        content = content.replace(/\[YOUTUBE:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g, (match, url, alt, position, size) => {
            const altText = alt || 'YouTube Video';
            const positionClass = `media-${position}`;
            const sizeClass = `media-${size}`;
            let embedUrl = url;
            
            // Convert YouTube URL to embed format
            if (url.includes('youtube.com/watch?v=')) {
                const videoId = url.split('v=')[1].split('&')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (url.includes('youtu.be/')) {
                const videoId = url.split('youtu.be/')[1].split('?')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
            
            return `<div class="media-container ${positionClass} ${sizeClass}">
                        <iframe src="${embedUrl}" title="${altText}" allowfullscreen></iframe>
                    </div>`;
        });

        return content;
    }
    
    // Render navigation menu
    function renderNavMenu() {
        navMenu.innerHTML = '';
        bookPages.sort((a, b) => a.priority - b.priority).forEach(page => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            navItem.dataset.category = page.category;
            
            const iconClass = getCategoryIcon(page.category);
            
            navItem.innerHTML = `
                <div class="nav-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="nav-text">${page.category}</div>
            `;
            
            navItem.addEventListener('click', () => renderContent(page.category));
            navMenu.appendChild(navItem);
        });
    }
    
    // Render content
    function renderContent(categoryName) {
        const page = bookPages.find(p => p.category.toLowerCase() === categoryName.toLowerCase());
        if (page) {
            // Hide welcome banner when showing specific content
            if (welcomeBanner) {
                welcomeBanner.style.display = 'none';
            }
            
            document.getElementById('content-title-view').innerText = page.category;
            let processedContent = processInternalLinks(page.content);
            processedContent = processMediaContent(processedContent);
            contentBodyView.innerHTML = processedContent + '<div class="clearfix"></div>';
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.category.toLowerCase() === categoryName.toLowerCase());
            });
            
            activeCategory = page.category;
            if (removeCategoryButton) {
                removeCategoryButton.disabled = false;
            }
        }
    }
    
    // Handle search
    function handleSearch(query) {
        const lowerCaseQuery = query.toLowerCase().trim();
        if (lowerCaseQuery === '') {
            searchResultsContainer.style.display = 'none';
            navMenu.style.display = 'block';
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
                    snippet = snippet.replace(new RegExp(query, 'gi'), `<strong>$&</strong>`);
                } else {
                    snippet = plainTextContent.substring(0, 120) + '...';
                }
                results.push({ category: page.category, snippet: snippet });
            }
        });

        navMenu.style.display = 'none';
        searchResultsContainer.style.display = 'block';
        searchResultsContainer.innerHTML = '';
        
        if (results.length > 0) {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = `
                    <div class="result-title">
                        <i class="fas ${getCategoryIcon(result.category)}"></i> ${result.category}
                    </div>
                    <div class="result-snippet">${result.snippet}</div>
                `;
                resultItem.addEventListener('click', () => {
                    renderContent(result.category);
                    searchInput.value = '';
                    handleSearch('');
                });
                searchResultsContainer.appendChild(resultItem);
            });
        } else {
            searchResultsContainer.innerHTML = `
                <div class="edit-info">
                    <i class="fas fa-search"></i> No results found for "${query}".
                </div>
            `;
        }
    }

    // Switch to edit mode
    function switchToEditMode() {
        if (!canEdit) return;
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage && bookPages.length > 0) return;
        
        document.getElementById('editing-category-title').innerText = currentPage ? `Editing: ${currentPage.category}` : 'Add First Category';
        quill.root.innerHTML = currentPage ? currentPage.content : '<p>Start writing here...</p>';
        
        viewModeWrapper.style.display = 'none';
        editModeWrapper.style.display = 'flex';
    }

    // Switch to view mode
    function switchToViewMode(newCategoryToShow = null) {
        if (newCategoryToShow) {
            renderContent(newCategoryToShow);
        } else if (!activeCategory && bookPages.length > 0) {
            // Show welcome banner if no specific category is selected
            if (welcomeBanner) {
                welcomeBanner.style.display = 'block';
            }
        }
        
        viewModeWrapper.style.display = 'flex';
        editModeWrapper.style.display = 'none';
    }
  
    // Close book
    function closeBook() {
        ipadFrame.classList.add('closing');
        setTimeout(() => {
            ipadFrame.style.display = 'none';
            ipadFrame.classList.remove('closing');
            searchInput.value = '';
            handleSearch('');
            switchToViewMode();
            fetch(`https://ap_guidebook/closeBook`, { method: 'POST' });
        }, 400);
    }

    // Save content
    function saveContent() {
        if (!canEdit) return;
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
                switchToViewMode(currentPage.category);
            }
        });
    }

    // Confirm add category
    function confirmAddCategory() {
        if (!canEdit) return;
        const categoryName = newCategoryInput.value;
        if (categoryName && categoryName.trim() !== "") {
            fetch(`https://ap_guidebook/addCategory`, {
                method: 'POST', 
                body: JSON.stringify({ bookType: currentBookType, categoryName: categoryName.trim() })
            }).then(resp => resp.json()).then(response => {
                if(response.success) {
                    const newPage = { 
                        id: response.newPageId, 
                        book_type: currentBookType, 
                        category: categoryName.trim(), 
                        content: '', 
                        deletable: 1, 
                        priority: 99 
                    };
                    bookPages.push(newPage);
                    renderNavMenu();
                    switchToViewMode(newPage.category);
                }
            });
        }
        addCategoryModal.style.display = 'none';
        newCategoryInput.value = '';
    }

    // Confirm remove category
    function confirmRemoveCategory() {
        if (!canEdit) return;
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage) return;
        
        fetch(`https://ap_guidebook/removeCategory`, {
            method: 'POST', 
            body: JSON.stringify({ pageId: currentPage.id })
        }).then(resp => resp.json()).then(response => {
            if(response.success) {
                bookPages = bookPages.filter(p => p.id !== currentPage.id);
                renderNavMenu();
                const nextCategory = bookPages.length > 0 ? bookPages[0].category : null;
                
                if (nextCategory) {
                    renderContent(nextCategory);
                } else {
                    document.getElementById('content-title-view').innerText = "Empty Guide";
                    document.getElementById('content-body-view').innerHTML = "<p>This guidebook is empty. Admins can add new categories in edit mode.</p>";
                    activeCategory = null;
                    if (removeCategoryButton) {
                        removeCategoryButton.disabled = true;
                    }
                    if (welcomeBanner) {
                        welcomeBanner.style.display = 'block';
                    }
                }
                switchToViewMode(nextCategory);
            }
        });
        removeCategoryModal.style.display = 'none';
    }

    // Media functions
    function openMediaModal(mediaType) {
        if (!canEdit) return;
        currentMediaType = mediaType;
        
        switch(mediaType) {
            case 'image':
                mediaModalTitle.innerHTML = '<i class="fas fa-image"></i> Insert Image';
                mediaUrlInput.placeholder = 'https://example.com/image.jpg';
                break;
            case 'video':
                mediaModalTitle.innerHTML = '<i class="fas fa-video"></i> Insert Video';
                mediaUrlInput.placeholder = 'https://example.com/video.mp4';
                break;
            case 'youtube':
                mediaModalTitle.innerHTML = '<i class="fab fa-youtube"></i> Insert YouTube Video';
                mediaUrlInput.placeholder = 'https://www.youtube.com/watch?v=...';
                break;
        }
        
        // Reset form
        mediaUrlInput.value = '';
        mediaAltInput.value = '';
        mediaPositionModal.value = 'center';
        mediaSizeModal.value = 'medium';
        mediaPreview.style.display = 'none';
        
        mediaModal.style.display = 'flex';
        mediaUrlInput.focus();
    }

    // Preview media
    function previewMedia() {
        const url = mediaUrlInput.value.trim();
        if (!url) return;

        const alt = mediaAltInput.value.trim() || 'Preview';
        let previewHTML = '';
        
        switch(currentMediaType) {
            case 'image':
                previewHTML = `<img src="${url}" alt="${alt}" style="max-width: 100%; max-height: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                              <p style="display: none; color: #ff6b35;"><i class="fas fa-exclamation-triangle"></i> Failed to load image</p>`;
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

        mediaPreviewContent.innerHTML = previewHTML;
        mediaPreview.style.display = 'block';
    }

    // Insert media
    function insertMedia() {
        if (!canEdit) return;
        const url = mediaUrlInput.value.trim();
        if (!url) return;

        const alt = mediaAltInput.value.trim() || '';
        const position = mediaPositionModal.value;
        const size = mediaSizeModal.value;

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

        // Insert at cursor position in Quill editor
        const range = quill.getSelection();
        if (range) {
            quill.insertText(range.index, '\n' + mediaCode + '\n');
        } else {
            quill.insertText(quill.getLength(), '\n' + mediaCode + '\n');
        }

        mediaModal.style.display = 'none';
    }

    // Event Listeners
    window.addEventListener('message', function(event) {
        const data = event.data;
        if (data.action === 'openBook') {
            bookPages = data.pages;
            currentBookType = data.bookType;
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
                document.getElementById('content-title-view').innerText = "Empty Guide";
                document.getElementById('content-body-view').innerHTML = "<p>This guidebook is empty. Admins can add new categories in edit mode.</p>";
                activeCategory = null;
                if (removeCategoryButton) {
                    removeCategoryButton.disabled = true;
                }
                if (welcomeBanner) {
                    welcomeBanner.style.display = 'block';
                }
            }

            if (editButton) {
                editButton.style.display = canEdit ? 'inline-block' : 'none';
            }
            
            ipadFrame.style.display = 'block';
            switchToViewMode(activeCategory);
        }
    });

    // Button Event Listeners
    if (editButton) {
        editButton.addEventListener('click', switchToEditMode);
    }
    if (saveButton) {
        saveButton.addEventListener('click', saveContent);
    }
    if (exitEditButton) {
        exitEditButton.addEventListener('click', () => switchToViewMode(activeCategory));
    }
    if (closeButton) {
        closeButton.addEventListener('click', closeBook);
    }

    // Category Management
    if (addCategoryButton) {
        addCategoryButton.addEventListener('click', () => {
            if (!canEdit) return;
            if (addCategoryModal) {
                addCategoryModal.style.display = 'flex';
                if (newCategoryInput) {
                    newCategoryInput.focus();
                }
            }
        });
    }

    if (removeCategoryButton) {
        removeCategoryButton.addEventListener('click', () => {
            if (!canEdit) return;
            const currentPage = bookPages.find(p => p.category === activeCategory);
            if (!currentPage) return;
            if (removeConfirmText) {
                removeConfirmText.innerText = `Are you sure you want to delete the "${currentPage.category}" category? This action cannot be undone.`;
            }
            if (removeCategoryModal) {
                removeCategoryModal.style.display = 'flex';
            }
        });
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            handleSearch(searchInput.value);
        });
    }

    // Modal Actions
    if (confirmAddButton) {
        confirmAddButton.addEventListener('click', confirmAddCategory);
    }
    if (confirmRemoveButton) {
        confirmRemoveButton.addEventListener('click', confirmRemoveCategory);
    }
    if (modalCancelButtons) {
        modalCancelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if(addCategoryModal) addCategoryModal.style.display = 'none';
                if(removeCategoryModal) removeCategoryModal.style.display = 'none';
                if(mediaModal) mediaModal.style.display = 'none';
            });
        });
    }
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') confirmAddCategory();
        });
    }

    // Media Event Listeners
    if (insertImageBtn) {
        insertImageBtn.addEventListener('click', () => openMediaModal('image'));
    }
    if (insertVideoBtn) {
        insertVideoBtn.addEventListener('click', () => openMediaModal('video'));
    }
    if (insertYoutubeBtn) {
        insertYoutubeBtn.addEventListener('click', () => openMediaModal('youtube'));
    }
    if (previewMediaBtn) {
        previewMediaBtn.addEventListener('click', previewMedia);
    }
    if (insertMediaConfirm) {
        insertMediaConfirm.addEventListener('click', insertMedia);
    }

    // Internal Link Navigation
    if (contentBodyView) {
        contentBodyView.addEventListener('click', function(event) {
            const link = event.target.closest('.internal-link');
            if (link) {
                event.preventDefault();
                const targetCategory = link.dataset.linkCategory;
                if (targetCategory) {
                    renderContent(targetCategory);
                }
            }
        });
    }

    // URL Input Preview
    if (mediaUrlInput) {
        mediaUrlInput.addEventListener('input', () => {
            if (mediaUrlInput.value.trim()) {
                previewMedia();
            } else {
                mediaPreview.style.display = 'none';
            }
        });
    }
});