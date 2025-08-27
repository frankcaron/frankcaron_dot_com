// Image URLs and their corresponding slider ranges
const images = {
    low: 'https://pplx-res.cloudinary.com/image/upload/v1756323496/pplx_project_search_images/4d73ab072af8d1bc38f83dec89169da7fd113e7d.png', // Contemplative black & white
    mid: 'https://pplx-res.cloudinary.com/image/upload/v1756323496/pplx_project_search_images/60f04e0418002a2d7ab98ea908d55f59554456a8.png', // White sweater with jewelry
    high: 'https://pplx-res.cloudinary.com/image/upload/v1756323496/pplx_project_search_images/5b839eb0208ff20a6b0f184ec5c0f3f8a8ccb190.png', // Artistic with overlays
    highest: 'https://pplx-res.cloudinary.com/image/upload/v1756323496/pplx_project_search_images/d50fa7b2121a2f37692cbdd99c1af8e9703dafd9.png' // Colorful side profile
};

// DOM elements
const slider = document.getElementById('gucciSlider');
const gucciImage = document.getElementById('gucciImage');
const sliderValue = document.getElementById('sliderValue');

// Current image state
let currentImageSrc = images.low;
let isTransitioning = false;

// Function to get the appropriate image based on slider value
function getImageForValue(value) {
    if (value >= 0 && value <= 30) {
        return images.low; // Not Gucci - contemplative/serious
    } else if (value >= 31 && value <= 60) {
        return images.mid; // Somewhat Gucci - confident with jewelry
    } else if (value >= 61 && value <= 85) {
        return images.high; // Very Gucci - artistic with overlays
    } else {
        return images.highest; // Maximum Gucci - colorful and vibrant
    }
}

// Function to update the image with smooth transition
function updateImage(newImageSrc) {
    if (newImageSrc !== currentImageSrc && !isTransitioning) {
        isTransitioning = true;
        
        // Add fade-out class
        gucciImage.classList.add('fade-out');
        
        // After fade-out completes, change image and fade in
        setTimeout(() => {
            gucciImage.src = newImageSrc;
            currentImageSrc = newImageSrc;
            
            // Wait for image to load before fading in
            gucciImage.onload = function() {
                gucciImage.classList.remove('fade-out');
                gucciImage.classList.add('fade-in');
                
                // Remove fade-in class after animation
                setTimeout(() => {
                    gucciImage.classList.remove('fade-in');
                    isTransitioning = false;
                }, 500);
            };
            
            // Handle error case
            gucciImage.onerror = function() {
                console.error('Failed to load image:', newImageSrc);
                gucciImage.classList.remove('fade-out');
                isTransitioning = false;
            };
        }, 250); // Half of the transition duration
    }
}

// Function to update slider value display with color
function updateSliderValueDisplay(value) {
    sliderValue.textContent = value;
    
    // Change color based on value
    const sliderValueElement = document.querySelector('.slider-value');
    if (value <= 30) {
        sliderValueElement.style.borderColor = '#ff5459'; // Red
        sliderValueElement.style.background = 'rgba(255, 84, 89, 0.1)';
        sliderValueElement.style.color = '#ff5459';
    } else if (value <= 60) {
        sliderValueElement.style.borderColor = '#e68161'; // Orange
        sliderValueElement.style.background = 'rgba(230, 129, 97, 0.1)';
        sliderValueElement.style.color = '#e68161';
    } else if (value <= 85) {
        sliderValueElement.style.borderColor = '#32b4c6'; // Teal
        sliderValueElement.style.background = 'rgba(50, 184, 198, 0.1)';
        sliderValueElement.style.color = '#32b4c6';
    } else {
        sliderValueElement.style.borderColor = '#32b4c6'; // Bright teal
        sliderValueElement.style.background = 'rgba(50, 184, 198, 0.15)';
        sliderValueElement.style.color = '#32b4c6';
    }
}

// Function to handle slider changes
function handleSliderChange(event) {
    const value = parseInt(event.target.value);
    const newImageSrc = getImageForValue(value);
    
    console.log('Slider value:', value, 'New image:', newImageSrc);
    
    updateImage(newImageSrc);
    updateSliderValueDisplay(value);
}

// Function to preload images for smooth transitions
function preloadImages() {
    Object.values(images).forEach(imageSrc => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => console.log('Preloaded:', imageSrc);
        img.onerror = () => console.error('Failed to preload:', imageSrc);
    });
}

// Event listeners
slider.addEventListener('input', handleSliderChange);
slider.addEventListener('change', handleSliderChange);

// Keyboard support
slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setTimeout(() => {
            handleSliderChange(e);
        }, 50);
    }
});

// Initialize the app
function initializeApp() {
    console.log('Initializing app...');
    
    // Preload all images
    preloadImages();
    
    // Set initial values
    const initialValue = parseInt(slider.value);
    console.log('Initial slider value:', initialValue);
    
    updateSliderValueDisplay(initialValue);
    
    // Set initial image
    const initialImageSrc = getImageForValue(initialValue);
    console.log('Setting initial image:', initialImageSrc);
    
    gucciImage.src = initialImageSrc;
    currentImageSrc = initialImageSrc;
    
    // Handle initial image load
    gucciImage.onload = function() {
        console.log('Initial image loaded successfully');
    };
    
    gucciImage.onerror = function() {
        console.error('Failed to load initial image:', initialImageSrc);
    };
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}