function log(text: string, category: string = "", type: string = "info") {
    const prefix = "Manganato";
    const generalCss = 'color: white; padding: 2px 6px; '
    let customCSS = generalCss + ' border-radius: 3px;';

    switch (type) {
        case "error":
            customCSS += " background-color: #f15e55;"
            break;
        case "warning":
            customCSS += " background-color: #ff5417;"
            break;
        case "success":
            customCSS += " background-color: #1c8a52;"
            break;
        default:
            customCSS += " background-color: #7dc4ca;"
            break;
    }
    if (category == "") {
        console.log(`%c${prefix}`, customCSS, text);
    } else {
        let categoryCSS = generalCss + ' border-radius: 0 3px 3px 0; margin-left: -5px;';
        switch (category) {
            case "img":
                categoryCSS += " background-color: #f15e55;"
                break;
            default:
                categoryCSS += " background-color: #bc7690;"
                break;
        }

        customCSS += " padding-right: 10px;";
        console.log(`%c${prefix[0]}%c${category}`, customCSS, categoryCSS, text);
    }
}

function adjustImageHeight() {
    const images = document.querySelectorAll<HTMLImageElement>('.container-chapter-reader img');
    let allImagesBelowThreshold = true;

    images.forEach(img => {
		let ratio = img.naturalHeight / img.naturalWidth;
        if (ratio > 2.5) {
            allImagesBelowThreshold = false;
        }
    });

    if (allImagesBelowThreshold) {
        images.forEach(img => img.style.height = '100vh');
    }
	else {
		images.forEach(img => img.style.width = '450px');
	}
}

function fixStyles() {
    const topDiv = document.querySelector<HTMLDivElement>(".silder-title");
    if (topDiv) {
        topDiv.style.width = "100%";
    }

    const panelDiv = document.querySelector<HTMLDivElement>(".panel-topview-title");
    if (panelDiv) {
        panelDiv.style.width = "100%";
    }

    const categoryDiv = document.querySelector<HTMLDivElement>(".pn-category-story-title");
    if (categoryDiv) {
        categoryDiv.style.width = "100%";
    }
}

function removeAdDivs() {
    const targetDivs = document.querySelectorAll('div[style*="text-align: center;"][style*="max-width: 620px;"]');
    targetDivs.forEach(div => {
        div.remove();
    })
}

function addScrollButtons() {
    let closestImageIndex = -1; // Keeps track of the current image index
    let scrollTimeout: number;

    // Get all images
    const pageDiv = document.querySelector(".container-chapter-reader");
    if (!pageDiv) {
        log("Not on manga page.")
        return;
    }
    const images = pageDiv.querySelectorAll('img');
    log(`Total images: ${images.length}`, "img");

    const navigationPanel = document.querySelectorAll(".panel-navigation")[1]

    // Function to scroll to a specific image
    function scrollToImage(index: number, position: 'start' | 'center' | 'end' | 'nearest') {
        if (index >= 0 && index < images.length) {
            images[index].scrollIntoView({ behavior: 'smooth', block: position });
            closestImageIndex = index; // Update the current image index
        }
    }

    // Function to find the closest image initially
    function findClosestImage() {
        const maxDistance = 100;
        let closestDistance = Infinity;
        const navigationPanelRect = navigationPanel.getBoundingClientRect();
        const isNavigationPanelInView = navigationPanelRect.top < window.innerHeight && navigationPanelRect.bottom > 0;

        // If the navigation panel is in view, set closestImageIndex to the last image
        if (isNavigationPanelInView) {
            closestImageIndex = images.length;
            log(`Outside of reader.`, "info");
            return;
        }

        images.forEach((img, index) => {
            const distance = Math.abs(img.getBoundingClientRect().top);
            if (distance < closestDistance && distance < maxDistance) {
                closestDistance = distance;
                closestImageIndex = index;
            }
        });

        log(`Closest image index: ${closestImageIndex}`, "img");
    }

    // Find the closest image when the script runs
    findClosestImage();

    // Event listener for key presses
    window.addEventListener('keydown', (event) => {
        // If at top of page scroll to first image.
        if (window.scrollY <= 100) {
            if (event.key === 'ArrowRight') {
                scrollToImage(0, 'start');
                return; // Exit the function to prevent further execution
            }
        }

        if (event.key === 'ArrowRight') {
            // Scroll to the next image (bottom)
            if (closestImageIndex < images.length - 1) {
                scrollToImage(closestImageIndex + 1, 'end');
            } else if (closestImageIndex == images.length - 1) {
                navigationPanel.scrollIntoView({ behavior: 'smooth', block: "end" });
            }
        } else if (event.key === 'ArrowLeft') {
            // Scroll to the previous image (top)
            if (closestImageIndex > 0) {
                scrollToImage(closestImageIndex - 1, 'start');
            } else if (closestImageIndex == 0) {
                scrollToImage(closestImageIndex, 'start');
            }
        }
    });

    function onScrollStop() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            findClosestImage(); // Update closest image after scrolling has stopped
        }, 50);
    }

    // Reset closest image on scroll to re-evaluate when scrolling has stopped
    window.addEventListener('scroll', onScrollStop);
}

// Run the function to adjust the image height
adjustImageHeight();
removeAdDivs();
fixStyles();
addScrollButtons();
