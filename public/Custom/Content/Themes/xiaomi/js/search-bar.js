/**
 * Xiaomi Search Bar Enhancement Script
 * This script adds interactive functionality to the search bar
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos da barra de pesquisa
    const searchInput = document.querySelector('.easy-access #search .input-wrapper input');
    const searchEraseBtn = document.querySelector('.easy-access #search .input-wrapper .search-erase');
    const searchForm = document.querySelector('.easy-access #search #product-search-form');
    const searchButton = document.querySelector('.easy-access #search button[type="submit"]');
    const mobileSearchIcon = document.querySelector('.top-bar .easy-access #search button[type="submit"]');
    const mobileSearch = document.querySelector('.top-search');
    const mobileSearchClose = document.querySelector('.top-search .close');
    
    // Funcionalidade para limpar o campo de busca
    if (searchEraseBtn) {
        searchEraseBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.focus();
        });
    }
    
    // Funcionalidade de busca ao clicar no botão
    if (searchButton) {
        searchButton.addEventListener('click', function(e) {
            // Apenas acionar a busca se houver texto
            if (!searchInput.value.trim()) {
                e.preventDefault();
                searchInput.focus();
            } else {
                // Se houver texto, permite que o formulário seja enviado normalmente
                return true;
            }
        });
    }
    
    // Impedir envio do formulário se o campo estiver vazio
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            if (!searchInput.value.trim()) {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
    
    // Funcionalidade para pesquisa mobile
    if (mobileSearchIcon && window.innerWidth <= 767) {
        mobileSearchIcon.addEventListener('click', function(e) {
            if (!searchInput.value.trim()) {
                e.preventDefault();
                
                if (mobileSearch) {
                    mobileSearch.style.display = 'flex';
                    setTimeout(() => {
                        mobileSearch.classList.add('active');
                        const mobileSearchInput = mobileSearch.querySelector('input');
                        if (mobileSearchInput) mobileSearchInput.focus();
                    }, 10);
                }
            }
        });
    }
    
    // Fechar pesquisa mobile
    if (mobileSearchClose) {
        mobileSearchClose.addEventListener('click', function() {
            mobileSearch.classList.remove('active');
            setTimeout(() => {
                mobileSearch.style.display = 'none';
            }, 300);
        });
    }
    
    // Adiciona sugestões de pesquisa após digitar
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            handleSearchSuggestions(this.value);
            
            // Mostrar ou esconder o botão de limpar
            if (searchEraseBtn) {
                if (this.value.trim().length > 0) {
                    searchEraseBtn.style.opacity = '1';
                } else {
                    searchEraseBtn.style.opacity = '0';
                }
            }
        });
        
        // Adicionar funcionalidade de tecla Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (this.value.trim().length > 0) {
                    searchForm.submit();
                } else {
                    e.preventDefault();
                }
            }
        });
    }
    
    // Função para lidar com sugestões de pesquisa
    function handleSearchSuggestions(query) {
        // Esta função deve ser adaptada para integrar com seu sistema de busca
        if (query.length >= 3) {
            // Aqui você pode chamar uma API para buscar sugestões
            console.log('Buscando sugestões para: ' + query);
            
            // Exemplo de exibição de sugestões (simulado)
            showSuggestions(query);
        } else {
            // Esconder sugestões se a consulta for muito curta
            const suggestionBox = document.querySelector('.suggestion-box-wrapper');
            if (suggestionBox) suggestionBox.style.display = 'none';
        }
    }
    
    // Função de exemplo para exibir sugestões
    function showSuggestions(query) {
        // Esta função é um exemplo e deve ser adaptada para seu sistema
        console.log('Mostrando sugestões para: ' + query);
    }
});
