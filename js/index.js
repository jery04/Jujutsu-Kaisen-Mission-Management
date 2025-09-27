// Generic loader to fetch an HTML fragment's <main> and inject it into #main-content
(function(){
    'use strict';

    function loadPage(path, stateObj){
        return fetch(path)
            .then(function(resp){
                if(!resp.ok) throw new Error('No se pudo cargar ' + path);
                return resp.text();
            })
            .then(function(html){
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var newMain = doc.querySelector('main');
                var main = document.getElementById('main-content');
                if(!main) throw new Error('No se encontró el elemento #main-content en esta página');
                if(newMain){
                    main.innerHTML = newMain.innerHTML;
                } else {
                    // If the loaded page doesn't have <main>, inject the whole body as fallback
                    main.innerHTML = doc.body ? doc.body.innerHTML : html;
                }
                // Manage styles/scripts from the loaded document to avoid collisions
                // Remove previously injected assets
                var injected = document.querySelectorAll('[data-injected="true"]');
                injected.forEach(function(node){ node.parentNode && node.parentNode.removeChild(node); });

                // Inject stylesheets and <style> from fetched doc head
                var rels = doc.querySelectorAll('link[rel="stylesheet"]');
                rels.forEach(function(link){
                    try{
                        var href = link.getAttribute('href');
                        if(!href) return;
                        // Avoid adding same href twice
                        var already = document.querySelector('link[rel="stylesheet"][href="' + href + '"]');
                        if(already) return;
                        var newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = href;
                        newLink.dataset.injected = 'true';
                        if(stateObj && stateObj.page) newLink.dataset.page = stateObj.page;
                        document.head.appendChild(newLink);
                    }catch(e){ console.warn('No se pudo inyectar stylesheet', e); }
                });

                var styles = doc.querySelectorAll('style');
                styles.forEach(function(s){
                    var newStyle = document.createElement('style');
                    newStyle.textContent = s.textContent;
                    newStyle.dataset.injected = 'true';
                    if(stateObj && stateObj.page) newStyle.dataset.page = stateObj.page;
                    document.head.appendChild(newStyle);
                });

                // Inject scripts from the fetched document (head and body)
                var scripts = Array.from(doc.querySelectorAll('script'));
                scripts.forEach(function(s){
                    var newScript = document.createElement('script');
                    if(s.src){
                        newScript.src = s.src;
                        // preserve execution order by loading synchronously
                        newScript.async = false;
                    } else {
                        newScript.textContent = s.textContent;
                    }
                    newScript.dataset.injected = 'true';
                    if(stateObj && stateObj.page) newScript.dataset.page = stateObj.page;
                    document.body.appendChild(newScript);
                });

                // push state if requested (don't push on popstate-driven loads)
                // Use hash routing so reloading the page keeps the index.html (and its header)
                if(stateObj && stateObj.push !== false){
                    var pushStateObj = Object.assign({}, stateObj || {}, {path: path});
                    // push a hash like #add or #signup instead of the real html path
                    var hash = pushStateObj.page ? ('#' + pushStateObj.page) : '#';
                    history.pushState(pushStateObj, '', hash);
                }
            });
    }

    document.addEventListener('DOMContentLoaded', function(){
        // Signup button (existing behavior)
        var signupBtn = document.getElementById('open-signup');
        if(signupBtn){
            signupBtn.addEventListener('click', function(e){
                e.preventDefault();
                loadPage('/html/signup.html', {page: 'signup'}).catch(function(err){ console.error(err); });
            });
        }

        // Add button (new): cargar add.html manteniendo header
        var addBtn = document.getElementById('open-add');
        if(addBtn){
            addBtn.addEventListener('click', function(e){
                e.preventDefault();
                loadPage('/html/add.html', {page: 'add'}).catch(function(err){ console.error(err); });
            });
        }

        // Handle back/forward navigation
        // If the URL contains a hash (e.g. #add or #signup) on load, load that page into the main
        if(location.hash){
            var page = location.hash.replace(/^#/, '');
            if(page === 'signup'){
                loadPage('/html/signup.html', {push: false}).catch(function(){ /* fallback: do nothing */ });
            } else if(page === 'add'){
                loadPage('/html/add.html', {push: false}).catch(function(){ /* fallback: do nothing */ });
            }
        }

        // Handle back/forward when the hash changes
        window.addEventListener('hashchange', function(){
            var page = location.hash.replace(/^#/, '');
            if(!page){
                // If hash cleared, reload to restore original index layout
                location.reload();
                return;
            }
            if(page === 'signup'){
                loadPage('/html/signup.html', {push: false}).catch(function(){ location.reload(); });
            } else if(page === 'add'){
                loadPage('/html/add.html', {push: false}).catch(function(){ location.reload(); });
            } else {
                location.reload();
            }
        });
    });
})();
