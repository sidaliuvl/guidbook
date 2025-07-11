// Anya Project Guidebook Script
// Version: 1.0.0

document.addEventListener('DOMContentLoaded', () => {
    
    let bookPages = [], activeCategory = '', currentBookType = 'warga', quill;

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

    
    function initializeQuill() {
        quill = new Quill('#editor', {
            theme: 'snow',
            modules: { toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], [{ 'color': [] }, { 'background': [] }], ['link'], ['clean']] }
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
            navItem.innerHTML = `<i class="${iconClass}"></i> ${page.category}`;
            navItem.addEventListener('click', () => renderContent(page.category));
            navMenu.appendChild(navItem);
        });
    }
    
    function renderContent(categoryName) {
        const page = bookPages.find(p => p.category.toLowerCase() === categoryName.toLowerCase());
        if (page) {
            document.getElementById('content-title-view').innerText = page.category;
            contentBodyView.innerHTML = processInternalLinks(page.content);
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.category.toLowerCase() === categoryName.toLowerCase());
            });
            activeCategory = page.category;
            removeCategoryButton.disabled = false;
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
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage && bookPages.length > 0) return;
        document.getElementById('editing-category-title').innerText = currentPage ? `Editing: ${currentPage.category}` : 'Add First Category';
        quill.root.innerHTML = currentPage ? currentPage.content : '<p>Mulai tulis di sini...</p>';
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
        const newContent = quill.root.innerHTML;
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage) { switchToViewMode(); return; }
        fetch(`https://ap_guidebook/savePage`, {
            method: 'POST', body: JSON.stringify({ pageId: currentPage.id, newContent: newContent })
        }).then(resp => resp.json()).then(response => {
            if (response.success) {
                currentPage.content = newContent;
                document.getElementById('content-body-view').innerHTML = newContent;
                switchToViewMode(currentPage.category);
            }
        });
    }


    function confirmAddCategory() {
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
                    document.getElementById('content-title-view').innerText = "Buku Kosong";
                    document.getElementById('content-body-view').innerHTML = "<p>Buku ini masih kosong...</p>";
                    activeCategory = null;
                    removeCategoryButton.disabled = true;
                }
                switchToViewMode(nextCategory);
            }
        });
        removeCategoryModal.style.display = 'none';
    }


    window.addEventListener('message', function(event) {
        const data = event.data;
        if (data.action === 'openBook') {
            bookPages = data.pages;
            currentBookType = data.bookType;
            searchInput.value = '';
            handleSearch('');
            renderNavMenu();

            if (bookPages.length > 0) {
                const categoryToStart = data.startCategory && bookPages.find(p => p.category === data.startCategory) ? data.startCategory : bookPages[0].category;
                renderContent(categoryToStart);
            } else {
                document.getElementById('content-title-view').innerText = "Buku Kosong";
                document.getElementById('content-body-view').innerHTML = "<p>Buku ini masih kosong. Admin bisa menambahkan kategori baru di mode edit.</p>";
                activeCategory = null;
                removeCategoryButton.disabled = true;
            }

            document.getElementById('book-title-view').innerText = data.bookTitle || 'GUIDEBOOK';
            editButton.style.display = data.canEdit ? 'block' : 'none';
            ipadFrame.style.display = 'block';
            switchToViewMode(activeCategory);
        }
    });

    editButton.addEventListener('click', switchToEditMode);
    saveButton.addEventListener('click', saveContent);
    exitEditButton.addEventListener('click', () => switchToViewMode(activeCategory));
    closeButton.addEventListener('click', closeBook);

    addCategoryButton.addEventListener('click', () => {
        if (addCategoryModal) {
            addCategoryModal.style.display = 'flex';
            if (newCategoryInput) {
                newCategoryInput.focus();
            }
        }
    });

    removeCategoryButton.addEventListener('click', () => {
        const currentPage = bookPages.find(p => p.category === activeCategory);
        if (!currentPage) return;
        if (removeConfirmText) {
            removeConfirmText.innerText = `Anda yakin ingin menghapus kategori "${currentPage.category}"? Tindakan ini tidak bisa dibatalkan.`;
        }
        if (removeCategoryModal) {
            removeCategoryModal.style.display = 'flex';
        }
    });

    searchInput.addEventListener('input', () => {
        handleSearch(searchInput.value);
    });

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
            });
        });
    }
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') confirmAddCategory();
        });
    }

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
});