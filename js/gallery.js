/**
 * Gallery JavaScript for Mark 1615 Website
 * Handles Google Drive API integration for displaying images
 */

class GalleryManager {
    constructor() {
        // Google API configuration
        this.API_KEY = 'AIzaSyAjg2xBXqFkPcVsihTXalP589pc8CmVOyI'; // Replace with your actual API key
        this.CLIENT_ID = '33889537983-s7rf71t1v1evm983p6taq1u56fhpofa3.apps.googleusercontent.com'; // Replace with your actual client ID
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
        
        this.gapi = null;
        this.tokenClient = null;
        this.isAuthorized = false;
        this.currentImages = [];
        this.currentImageIndex = 0;
        
        this.init();
    }

    async init() {
        try {
            await this.loadGoogleAPI();
            this.setupEventListeners();
            this.checkAuthStatus();
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showError('Failed to initialize gallery. Please refresh the page and try again.');
        }
    }

    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('auth2', resolve);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async checkAuthStatus() {
        try {
            await gapi.load('client:auth2', async () => {
                await gapi.client.init({
                    apiKey: this.API_KEY,
                    clientId: this.CLIENT_ID,
                    discoveryDocs: [this.DISCOVERY_DOC],
                    scope: this.SCOPES
                });

                this.gapi = gapi;
                const authInstance = gapi.auth2.getAuthInstance();
                
                if (authInstance.isSignedIn.get()) {
                    this.isAuthorized = true;
                    this.hideAuthContainer();
                    this.loadGallery();
                } else {
                    this.showAuthContainer();
                }
            });
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthContainer();
        }
    }

    setupEventListeners() {
        // Authorization button
        document.getElementById('authorizeButton').addEventListener('click', () => {
            this.authorize();
        });

        // Lightbox controls
        document.getElementById('lightboxModal').addEventListener('click', (e) => {
            if (e.target.id === 'lightboxModal') {
                this.closeLightbox();
            }
        });

        document.querySelector('.lightbox-close').addEventListener('click', () => {
            this.closeLightbox();
        });

        document.querySelector('.lightbox-prev').addEventListener('click', () => {
            this.previousImage();
        });

        document.querySelector('.lightbox-next').addEventListener('click', () => {
            this.nextImage();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('lightboxModal').style.display === 'block') {
                switch(e.key) {
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.previousImage();
                        break;
                    case 'ArrowRight':
                        this.nextImage();
                        break;
                }
            }
        });
    }

    async authorize() {
        try {
            const authInstance = this.gapi.auth2.getAuthInstance();
            await authInstance.signIn();
            this.isAuthorized = true;
            this.hideAuthContainer();
            this.loadGallery();
        } catch (error) {
            console.error('Authorization failed:', error);
            this.showError('Authorization failed. Please try again.');
        }
    }

    async loadGallery() {
        this.showLoading();
        
        try {
            const folders = await this.getFolders();
            const galleryHTML = await this.buildGalleryHTML(folders);
            document.getElementById('galleryContainer').innerHTML = galleryHTML;
            
            this.hideLoading();
            this.animateGalleryLoad();
        } catch (error) {
            console.error('Failed to load gallery:', error);
            this.hideLoading();
            this.showError('Failed to load gallery images. Please try again.');
        }
    }

    async getFolders() {
        const response = await gapi.client.drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder'",
            spaces: 'drive',
            fields: 'files(id, name)'
        });

        const folders = [];
        
        for (const folder of response.result.files) {
            const images = await this.getImagesFromFolder(folder.id);
            if (images.length > 0) {
                folders.push({
                    name: folder.name,
                    images: images
                });
            }
        }

        return folders;
    }

    async getImagesFromFolder(folderId) {
        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and (mimeType contains 'image/')`,
            spaces: 'drive',
            fields: 'files(id, name, webViewLink, webContentLink, thumbnailLink)'
        });

        return response.result.files.map(file => ({
            id: file.id,
            name: file.name,
            thumbnailUrl: this.getImageUrl(file.id, 'thumb'),
            fullUrl: this.getImageUrl(file.id, 'full'),
            webViewLink: file.webViewLink
        }));
    }

    getImageUrl(fileId, size = 'full') {
        const baseUrl = `https://drive.google.com/uc?id=${fileId}`;
        if (size === 'thumb') {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
        }
        return baseUrl;
    }

    async buildGalleryHTML(folders) {
        let html = '';
        
        for (const folder of folders) {
            html += `
                <div class="folder-section">
                    <h3 class="folder-title">${this.escapeHtml(folder.name)}</h3>
                    <div class="gallery-grid">
            `;
            
            folder.images.forEach((image, index) => {
                const globalIndex = this.currentImages.length;
                this.currentImages.push(image);
                
                html += `
                    <div class="gallery-item" data-image-index="${globalIndex}">
                        <img src="${image.thumbnailUrl}" alt="${this.escapeHtml(image.name)}" loading="lazy">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }

        // Add click events after HTML is inserted
        setTimeout(() => {
            document.querySelectorAll('.gallery-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.imageIndex);
                    this.openLightbox(index);
                });
            });
        }, 100);

        return html;
    }

    openLightbox(index) {
        this.currentImageIndex = index;
        const image = this.currentImages[index];
        
        document.getElementById('lightboxImage').src = image.fullUrl;
        document.getElementById('lightboxModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        document.getElementById('lightboxModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    previousImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentImages.length) % this.currentImages.length;
        document.getElementById('lightboxImage').src = this.currentImages[this.currentImageIndex].fullUrl;
    }

    nextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentImages.length;
        document.getElementById('lightboxImage').src = this.currentImages[this.currentImageIndex].fullUrl;
    }

    showAuthContainer() {
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('loadingContainer').style.display = 'none';
        document.getElementById('galleryContainer').style.display = 'none';
    }

    hideAuthContainer() {
        document.getElementById('authContainer').style.display = 'none';
    }

    showLoading() {
        document.getElementById('loadingContainer').style.display = 'block';
        document.getElementById('galleryContainer').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingContainer').style.display = 'none';
        document.getElementById('galleryContainer').style.display = 'block';
    }

    animateGalleryLoad() {
        const sections = document.querySelectorAll('.folder-section');
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('loaded');
            }, index * 200);
        });
    }

    showError(message) {
        document.getElementById('galleryContainer').innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
        document.getElementById('galleryContainer').style.display = 'block';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Fallback gallery for demonstration (when API is not configured)
class FallbackGallery {
    constructor() {
        this.init();
    }

    init() {
        this.showFallbackContent();
    }

    showFallbackContent() {
        const fallbackHTML = `
            <div class="alert alert-info text-center mb-4" role="alert">
                <h5><i class="fas fa-info-circle me-2"></i>Demo Mode</h5>
                <p class="mb-0">This is a demonstration of the gallery layout. To connect to Google Drive, please configure the API credentials in gallery.js</p>
            </div>
            
            <div class="folder-section loaded">
                <h3 class="folder-title">Community Events</h3>
                <div class="gallery-grid">
                    <div class="gallery-item">
                        <img src="img/1.jpg" alt="Community Event 1">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                    <div class="gallery-item">
                        <img src="img/2.jpg" alt="Community Event 2">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                    <div class="gallery-item">
                        <img src="img/3.jpg" alt="Community Event 3">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="folder-section loaded">
                <h3 class="folder-title">Worship Services</h3>
                <div class="gallery-grid">
                    <div class="gallery-item">
                        <img src="img/4.jpg" alt="Worship Service 1">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                    <div class="gallery-item">
                        <img src="img/5.jpg" alt="Worship Service 2">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                    <div class="gallery-item">
                        <img src="img/6.jpg" alt="Worship Service 3">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="folder-section loaded">
                <h3 class="folder-title">Outreach Programs</h3>
                <div class="gallery-grid">
                    <div class="gallery-item">
                        <img src="img/7.jpg" alt="Outreach Program 1">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                    <div class="gallery-item">
                        <img src="img/8.jpg" alt="Outreach Program 2">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                    <div class="gallery-item">
                        <img src="img/9.jpg" alt="Outreach Program 3">
                        <div class="gallery-item-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('galleryContainer').innerHTML = fallbackHTML;
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('loadingContainer').style.display = 'none';
        
        this.setupFallbackLightbox();
    }

    setupFallbackLightbox() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        const images = Array.from(galleryItems).map(item => item.querySelector('img'));
        let currentIndex = 0;

        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                currentIndex = index;
                const img = item.querySelector('img');
                document.getElementById('lightboxImage').src = img.src;
                document.getElementById('lightboxModal').style.display = 'block';
                document.body.style.overflow = 'hidden';
            });
        });

        // Lightbox navigation
        document.querySelector('.lightbox-close').addEventListener('click', () => {
            document.getElementById('lightboxModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        document.querySelector('.lightbox-prev').addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            document.getElementById('lightboxImage').src = images[currentIndex].src;
        });

        document.querySelector('.lightbox-next').addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % images.length;
            document.getElementById('lightboxImage').src = images[currentIndex].src;
        });

        document.getElementById('lightboxModal').addEventListener('click', (e) => {
            if (e.target.id === 'lightboxModal') {
                document.getElementById('lightboxModal').style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // // Check if API credentials are configured
    // const hasApiKey = 'YOUR_API_KEY' !== 'YOUR_API_KEY';
    // const hasClientId = 'YOUR_CLIENT_ID' !== 'YOUR_CLIENT_ID';
    // debugger;
    // if (hasApiKey && hasClientId) {
        new GalleryManager();
    // } else {
    //     // Use fallback gallery for demonstration
    //     new FallbackGallery();
    // }
});