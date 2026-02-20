'use strict'

document.addEventListener("DOMContentLoaded", function () {
    const pagesEl = document.getElementById('pages');

    let openId = null;
    let childPage = null;
    let childMount = null;

    function ensureChildShell() {
        if (childPage && childMount) return;

        const shell = document.getElementById('child-shell');
        const node = shell.content.firstElementChild.cloneNode(true);

        pagesEl.appendChild(node);
        childPage = node;
        childMount = node.querySelector('#childMount');
    }

    function removeChildShell() {
        if (!childPage) return;
        childPage.remove();
        childPage = null;
        childMount = null;
    }

    function setActiveLink(id) {
        document.querySelectorAll('.page-block[aria-current="page"]').forEach(a => {
            a.removeAttribute('aria-current');
        });
        if (!id) return;
        const active = document.querySelector(`.page-block[data-page="${CSS.escape(id)}"]`);
        if (active) active.setAttribute('aria-current', 'page');
    }

    function scrollToChild() {
        if (!childPage) return;
        const left = childPage.offsetLeft - 18; // match .pages padding if you have it
        pagesEl.scrollTo({ left, behavior: 'smooth' });
    }

    function scrollToParent() {
        pagesEl.scrollTo({ left: 0, behavior: 'smooth' });
    }

    function mountTemplate(id) {
        const tpl = document.getElementById(id);
        if (!tpl) return false;

        childMount.innerHTML = '';
        childMount.appendChild(tpl.content.cloneNode(true));
        childMount.scrollTop = 0;

        // Wire close button inside child
        childMount.querySelectorAll('[data-close-child]').forEach(btn => {
            btn.addEventListener('click', () => closeChild(), { once: true });
        });

        return true;
    }

    function openChild(id, { push = true } = {}) {
        if (!id) return;

        ensureChildShell();

        const ok = mountTemplate(id);
        if (!ok) return;

        openId = id;
        setActiveLink(id);
        scrollToChild();

        if (push) history.pushState({ child: id }, '', `#${encodeURIComponent(id)}`);
    }

    function closeChild({ push = true } = {}) {
        openId = null;
        setActiveLink(null);
        removeChildShell();
        scrollToParent();

        if (push) history.pushState({ child: null }, '', '#');
    }

    // Click handling for page blocks
    document.addEventListener('click', (e) => {
        const a = e.target.closest('.page-block[data-page]');
        if (!a) return;

        e.preventDefault();
        const id = a.getAttribute('data-page');
        openChild(id);
    });

    // Back/forward support
    window.addEventListener('popstate', () => {
        const hash = decodeURIComponent((location.hash || '').replace('#', ''));
        if (hash) openChild(hash, { push: false });
        else closeChild({ push: false });
    });

    // Open from hash on load (otherwise: no child shown)
    const initial = decodeURIComponent((location.hash || '').replace('#', ''));
    if (initial) openChild(initial, { push: false });
});