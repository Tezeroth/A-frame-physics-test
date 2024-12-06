AFRAME.registerComponent('navigate-or-open', {
    schema: {
        target: { type: 'string', default: '' }, // URL to open
        hoverColor: { type: 'color', default: 'yellow' }, // Hover effect color
        openInIframe: { type: 'boolean', default: false }, // Whether to open in iframe
        event: { type: 'string', default: 'click' }, // Triggering event
        grabbable: { type: 'boolean', default: false } // Enable grabbing in VR
    },

    init: function () {
        console.log('Component initialized');
        this.originalColors = new Map();
        const el = this.el;
        const data = this.data;

        // Add hover and click functionality
        el.addEventListener('mouseenter', this.onHoverEnter.bind(this));
        el.addEventListener('mouseleave', this.onHoverLeave.bind(this));
        el.addEventListener(data.event, (e) => {
            e.stopPropagation(); // Prevent interference with other components
            this.onAction();
        });

        // If grabbable, add the necessary attributes for interaction
        if (data.grabbable) {
            el.setAttribute('grabbable', '');
            el.setAttribute('dynamic-body', '');
            el.setAttribute('super-hands', '');
        }

        // Add original property storage for hover effects
        this.storeOriginalProperties();

        // Bind iframe-related methods
        this.openIframe = this.openIframe.bind(this);
        this.mountStyles();
    },

    onHoverEnter: function () {
        const mesh = this.el.getObject3D('mesh');
        if (mesh) {
            mesh.traverse((node) => {
                if (node.isMesh) {
                    if (!this.originalColors.has(node)) {
                        this.originalColors.set(
                            node,
                            node.material.color ? node.material.color.clone() : null
                        );
                    }
                    if (node.material.color) {
                        node.material.color.set(this.data.hoverColor);
                    }
                }
            });
        }
    },

    onHoverLeave: function () {
        const mesh = this.el.getObject3D('mesh');
        if (mesh) {
            mesh.traverse((node) => {
                if (node.isMesh) {
                    const originalColor = this.originalColors.get(node);
                    if (originalColor) {
                        node.material.color.copy(originalColor);
                    }
                }
            });
        }
    },

    onAction: function () {
        const sceneEl = this.el.sceneEl;

        // Avoid performing actions in VR/AR mode
        if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) {
            console.log("In VR/AR mode, skipping navigate-or-open action.");
            return;
        }

        if (this.data.openInIframe) {
            this.openIframe();
        } else {
            this.navigate();
        }
    },

    navigate: function () {
        if (this.data.target) {
            window.location.href = this.data.target;
        } else {
            console.warn('No target URL specified for navigation.');
        }
    },

    openIframe: function () {
        console.log("Opening iframe...");
        const sceneEl = this.el.sceneEl;
        const isVRMode = sceneEl.is('vr-mode');
        const isARMode = sceneEl.is('ar-mode');
        const isXRMode = isVRMode || isARMode;

        if (isXRMode) {
            console.log("Exiting XR mode to open modal.");
            const handleExitXR = () => {
                console.log("XR session ended. Opening modal.");
                sceneEl.removeEventListener('exit-vr', handleExitXR);
                let modal = this.mountHTML();
                modal.focus();
            };

            sceneEl.addEventListener('exit-vr', handleExitXR);
            sceneEl.exitVR();
        } else {
            console.log("Opening modal in desktop mode.");
            let modal = this.mountHTML();
            modal.focus();
        }
    },

    mountStyles: function () {
        const styles = document.querySelector(this.modalStyleSelector);

        if (!styles) {
            const template = `<style id="${this.modalStyleSelector}">
                ${this.modalSelector}.page__modal {
                    position: fixed;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 90vw;
                    height: 70vh;
                }
                ${this.modalSelector}.page__modal .page__modal-header {
                    width: 100%;
                    display: flex;
                    flex-direction: row-reverse;
                }
                ${this.modalSelector}.page__modal iframe {
                    width: 100%;
                    height: 100%;
                }
            </style>`;
            document.body.insertAdjacentHTML('beforeend', template);
        }
    },

    closeIframe: function () {
        this.clearGarbage();

        const sceneEl = this.el.sceneEl;
        sceneEl.enterVR();
        console.log("Returning to VR mode.");
        sceneEl.focus();
    },

    get modalSelector() {
        return '#a_open_page_iframe';
    },

    get modalStyleSelector() {
        return '#a_open_page_css';
    },

    clearGarbage: function () {
        document.querySelectorAll(this.modalSelector).forEach((item) => item.remove());
    },

    mountHTML: function () {
        this.clearGarbage();

        const template = `<div id="a_open_page_iframe" class="page__modal">
            <div class="page__modal-header">
                <button class="close">Back to XR</button>
            </div>
            <iframe src="${this.data.target}" frameborder="0"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                    sandbox="allow-same-origin allow-scripts"
                    width="100%" height="100%">
            </iframe>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', template);

        const modal = document.querySelector('#a_open_page_iframe');
        modal.querySelector('.close').addEventListener('click', this.closeIframe.bind(this));
        return modal;
    },

    storeOriginalProperties: function () {
        const mesh = this.el.getObject3D('mesh');
        if (mesh) {
            mesh.traverse((node) => {
                if (node.isMesh && node.material.color) {
                    this.originalColors.set(node, node.material.color.clone());
                }
            });
        }
    }
});
