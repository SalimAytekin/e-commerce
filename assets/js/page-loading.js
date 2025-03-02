document.addEventListener('DOMContentLoaded', function() {
    const pageLoading = document.getElementById('page-loading');
    let resourcesLoaded = false;
    let headerLoaded = false;
    let footerLoaded = false;
    let newsletterLoaded = false;

    // while loading header
    const headerObserver = new MutationObserver(function(mutations) {
        if (document.getElementById('header').innerHTML.trim() !== '') {
            headerLoaded = true;
            checkAllContent();
        }
    });

    // while loading footer
    const footerObserver = new MutationObserver(function(mutations) {
        if (document.getElementById('footer').innerHTML.trim() !== '') {
            footerLoaded = true;
            checkAllContent();
        }
    });

    // while loading newsletter
    const newsletterObserver = new MutationObserver(function(mutations) {
        if (document.getElementById('newsletter-container').innerHTML.trim() !== '') {
            newsletterLoaded = true;
            checkAllContent();
        }
    });

    // start observer
    headerObserver.observe(document.getElementById('header'), { childList: true });
    footerObserver.observe(document.getElementById('footer'), { childList: true });
    newsletterObserver.observe(document.getElementById('newsletter-container'), { childList: true });

    // Check all resources
    window.onload = function() {
        resourcesLoaded = true;
        checkAllContent();
    };

    function checkAllContent() {
        if (resourcesLoaded && headerLoaded && footerLoaded && newsletterLoaded) {
            setTimeout(() => {
                pageLoading.classList.add('loaded');
                document.body.classList.add('content-loaded');
                
                setTimeout(() => {
                    pageLoading.style.display = 'none';
                }, 250);
            }, 500); 
        }
    }

    // wait max.  sec.
    setTimeout(() => {
        if (!document.body.classList.contains('content-loaded')) {
            pageLoading.classList.add('loaded');
            document.body.classList.add('content-loaded');
            setTimeout(() => {
                pageLoading.style.display = 'none';
            }, 250);
        }
    }, 10000);
});