// Anya Project Guidebook Script
// Version: 2.0.0 - Enhanced with Media Support

document.addEventListener('DOMContentLoaded', () => {
    
    let bookPages = [], activeCategory = '', currentBookType = 'warga', quill;
    let currentMediaType = 'image';
    let canEdit = false;

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
    const addCategoryModal = document.getElementById('add-category-modal');
    const newCategoryInput = document.getElementById('new-category-input');
    const confirmAddButton = document.getElementById('confirm-add-button');
    const removeCategoryModal = document.getElementById('remove-category-modal');
    const removeConfirmText = document.getElementById('remove-confirm-text');
    const confirmRemoveButton = document.getElementById('confirm-remove-button');
    const modalCancelButtons = document.querySelectorAll('.modal-cancel-button');

    // Media elements
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

    // Toolbar elements
    const insertImageBtn = document.getElementById('insert-image-btn');
    const insertVideoBtn = document.getElementById('insert-video-btn');
    const insertYoutubeBtn = document.getElementById('insert-youtube-btn');
    const mediaPositionSelect = document.getElementById('media-position-select');
    const mediaSizeSelect = document.getElementById('media-size-select');

    
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
    

    function processInternalLinks(content) {
        const linkRegex = /\[\[(.*?)\]\]/g;
        return content.replace(linkRegex, (match, categoryName) => {
            const trimmedCategoryName = categoryName.trim();
            const targetExists = bookPages.some(p => p.category.toLowerCase() === trimmedCategoryName.toLowerCase());
            if (targetExists) {
                return `<a href="#" class="internal-link" data-link-category="${trimmedCategoryName}">${trimmedCategoryName}</a>`;
            }
            return `<s>${trimmedCategoryName}</s>`;
        });
    }

    function processMediaContent(content) {
        // Process images
        content = content.replace(/\[IMG:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g, (match, url, alt, position, size) => {
            const altText = alt || 'صورة';
            const positionClass = `media-${position}`;
            const sizeClass = `media-${size}`;
            return `<div class="media-container ${positionClass} ${sizeClass}">
                        <img src="${url}" alt="${altText}" loading="lazy" onerror="this.style.display='none'">
                    </div>`;
        });

        // Process videos
        content = content.replace(/\[VIDEO:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g, (match, url, alt, position, size) => {
            const altText = alt || 'فيديو';
            const positionClass = `media-${position}`;
            const sizeClass = `media-${size}`;
            return `<div class="media-container ${positionClass} ${sizeClass}">
                        <video controls preload="metadata" title="${altText}">
                            <source src="${url}" type="video/mp4">
                            متصفحك لا يدعم تشغيل الفيديو.
                        </video>
                    </div>`;
        });

        // Process YouTube videos
        content = content.replace(/\[YOUTUBE:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g, (match, url, alt, position, size) => {
            const altText = alt || 'فيديو يوتيوب';
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
    
    function renderNavMenu() {
        navMenu.innerHTML = '';
        bookPages.sort((a, b) => a.priority - b.priority).forEach(page => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            navItem.dataset.category = page.category;
            let iconClass = 'fa-solid fa-book-open';
            if (page.category.toLowerCase().includes('rules')) iconClass = 'fa-solid fa-gavel';
            if (page.category.toLowerCase().includes('hotkeys')) iconClass = 'fa-solid fa-keyboard';
            if (page.category.toLowerCase().includes('tutorial')) iconClass = 'fa-solid fa-graduation-cap';
            if (page.category.toLowerCase().includes('jobs')) iconClass = 'fa-solid fa-briefcase';
            navItem.innerHTML = `<i class="${iconClass}"></i> ${page.category}`;
            navItem.addEventListener('click', () => renderContent(page.category));
            navMenu.appendChild(navItem);
        });
    }
    
    function renderContent(categoryName) {
        const page = bookPages.find(p => p.category.toLowerCase() === categoryName.toLowerCase());
        if (page) {
            document.getElementById('content-title-view').innerText = page.category;
            let processedContent = processInternalLinks(page.content);
            processedContent = processMediaContent(processedContent);
            contentBodyView.innerHTML = processedContent + '<div class="clearfix"></div>';
            
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.category.toLowerCase() === categoryName.toLowerCase());
            });
            activeCategory = page.category;
            if (removeCategoryButton) {
                removeCategoryButton.disabled = false;
            }
        }
    }
    
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
                    const startIndex = Math.max(0, contentIndex - 30);
                    snippet = '...' + plainTextContent.substring(startIndex, startIndex + 100) + '...';
                    snippet = snippet.replace(new RegExp(query, 'gi'), `<strong>${query}</strong>`);
                } else {
                    snippet = plainTextContent.substring(0, 100) + '...';
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
                resultItem.innerHTML = `<span class="result-title">${result.category}</span><p class="result-snippet">${result.snippet}</p>`;
                resultItem.addEventListener('click', () => {
                    renderContent(result.category);
                    searchInput.value = '';
                    handleSearch('');
                });
                searchResultsContainer.appendChild(resultItem);
            });
        } else {
            searchResultsContainer.innerHTML = `<p class="edit-info">No results found for "${query}".</p>`;
        }
    }

    function switchToEditMode() {
        if (!canEdit) return;
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage && bookPages.length > 0) return;
        document.getElementById('editing-category-title').innerText = currentPage ? `Editing: ${currentPage.category}` : 'Add First Category';
        quill.root.innerHTML = currentPage ? currentPage.content : '<p>ابدأ الكتابة هنا...</p>';
        viewModeWrapper.style.display = 'none';
        editModeWrapper.style.display = 'flex';
    }

    function switchToViewMode(newCategoryToShow = null) {
        if (newCategoryToShow) renderContent(newCategoryToShow);
        viewModeWrapper.style.display = 'flex';
        editModeWrapper.style.display = 'none';
    }
  
    function closeBook() {
        ipadFrame.classList.add('closing');
        setTimeout(() => {
            ipadFrame.style.display = 'none';
            ipadFrame.classList.remove('closing');
            searchInput.value = '';
            handleSearch('');
            switchToViewMode();
            fetch(`https://ap_guidebook/closeBook`, { method: 'POST' });
        }, 300);
    }

    function saveContent() {
        if (!canEdit) return;
        const newContent = quill.root.innerHTML;
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage) { switchToViewMode(); return; }
        fetch(`https://ap_guidebook/savePage`, {
            method: 'POST', body: JSON.stringify({ pageId: currentPage.id, newContent: newContent })
        }).then(resp => resp.json()).then(response => {
            if (response.success) {
                currentPage.content = newContent;
                switchToViewMode(currentPage.category);
            }
        });
    }

    function confirmAddCategory() {
        if (!canEdit) return;
        const categoryName = newCategoryInput.value;
        if (categoryName && categoryName.trim() !== "") {
            fetch(`https://ap_guidebook/addCategory`, {
                method: 'POST', body: JSON.stringify({ bookType: currentBookType, categoryName: categoryName.trim() })
            }).then(resp => resp.json()).then(response => {
                if(response.success) {
                    const newPage = { id: response.newPageId, book_type: currentBookType, category: categoryName.trim(), content: '', deletable: 1, priority: 99 };
                    bookPages.push(newPage);
                    renderNavMenu();
                    switchToViewMode(newPage.category);
                }
            });
        }
        addCategoryModal.style.display = 'none';
        newCategoryInput.value = '';
    }

    function confirmRemoveCategory() {
        if (!canEdit) return;
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage) return;
        fetch(`https://ap_guidebook/removeCategory`, {
            method: 'POST', body: JSON.stringify({ pageId: currentPage.id })
        }).then(resp => resp.json()).then(response => {
            if(response.success) {
                bookPages = bookPages.filter(p => p.id !== currentPage.id);
                renderNavMenu();
                const nextCategory = bookPages.length > 0 ? bookPages[0].category : null;
                if (nextCategory) {
                    renderContent(nextCategory);
                } else {
                    document.getElementById('content-title-view').innerText = "كتاب فارغ";
                    document.getElementById('content-body-view').innerHTML = "<p>هذا الكتاب فارغ...</p>";
                    activeCategory = null;
                    if (removeCategoryButton) {
                        removeCategoryButton.disabled = true;
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
                mediaModalTitle.textContent = 'إدراج صورة';
                mediaUrlInput.placeholder = 'https://example.com/image.jpg';
                break;
            case 'video':
                mediaModalTitle.textContent = 'إدراج فيديو';
                mediaUrlInput.placeholder = 'https://example.com/video.mp4';
                break;
            case 'youtube':
                mediaModalTitle.textContent = 'إدراج فيديو يوتيوب';
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

    function previewMedia() {
        const url = mediaUrlInput.value.trim();
        if (!url) return;

        const alt = mediaAltInput.value.trim() || 'معاينة';
        const position = mediaPositionModal.value;
        const size = mediaSizeModal.value;

        let previewHTML = '';
        
        switch(currentMediaType) {
            case 'image':
                previewHTML = `<img src="${url}" alt="${alt}" style="max-width: 100%; max-height: 200px;" onerror="this.style.display='none'; this.nextSibling.style.display='block';">
                              <p style="display: none; color: #e74c3c;">خطأ في تحميل الصورة</p>`;
                break;
            case 'video':
                previewHTML = `<video controls style="max-width: 100%; max-height: 200px;" preload="metadata">
                                  <source src="${url}" type="video/mp4">
                                  متصفحك لا يدعم تشغيل الفيديو.
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

    // Event listeners
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
                const categoryToStart = data.startCategory && bookPages.find(p => p.category === data.startCategory) ? data.startCategory : bookPages[0].category;
                renderContent(categoryToStart);
            } else {
                document.getElementById('content-title-view').innerText = "كتاب فارغ";
                document.getElementById('content-body-view').innerHTML = "<p>هذا الكتاب فارغ. يمكن للمشرف إضافة فئات جديدة في وضع التحرير.</p>";
                activeCategory = null;
                if (removeCategoryButton) {
                    removeCategoryButton.disabled = true;
                }
            }

            document.getElementById('book-title-view').innerText = data.bookTitle || 'GUIDEBOOK';
            if (editButton) {
                editButton.style.display = canEdit ? 'block' : 'none';
            }
            ipadFrame.style.display = 'block';
            switchToViewMode(activeCategory);
        }
    });

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
                removeConfirmText.innerText = `هل أنت متأكد من حذف فئة "${currentPage.category}"؟ لا يمكن التراجع عن هذا الإجراء.`;
            }
            if (removeCategoryModal) {
                removeCategoryModal.style.display = 'flex';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            handleSearch(searchInput.value);
        });
    }

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

    // Media event listeners
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

    // URL input preview on change
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