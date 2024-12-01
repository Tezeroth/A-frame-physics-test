AFRAME.registerComponent('navigate-or-open', {
    schema: {
        target: { type: 'string', default: '' },
        hoverColor: { type: 'color', default: 'yellow' },
        openInIframe: { type: 'boolean', default: false },
        event: { type: 'string', default: 'click' },
        grabbable: { type: 'boolean', default: false } // New: Enable grabbing in VR
    },

    init: function () {
        console.log('Component initialized');
        this.originalColors = new Map();
        const el = this.el;
        const data = this.data;

        // Add hover and click functionality
        el.addEventListener('mouseenter', this.onHoverEnter.bind(this));
        el.addEventListener('mouseleave', this.onHoverLeave.bind(this));
        el.addEventListener(data.event, this.onAction.bind(this));

        // If grabbable, add the 'grab' class for interaction
        if (data.grabbable) {
            el.classList.add('grabbable');
        }

        // Add original property storage for hover effects
        this.storeOriginalProperties();
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
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.width = '80vw';
        modal.style.height = '60vh';
        modal.style.zIndex = '1000';
        modal.style.backgroundColor = 'white';
        modal.style.border = '2px solid #ccc';
        modal.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
    
        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.zIndex = '1001';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    
        // Add iframe
        const iframe = document.createElement('iframe');
        iframe.src = this.data.target;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
    
        modal.appendChild(closeButton);
        modal.appendChild(iframe);
        document.body.appendChild(modal);
    }
    ,

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
