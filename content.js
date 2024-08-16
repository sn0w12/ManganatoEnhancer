
function adjustImageHeight() {
    const images = document.querySelectorAll('.container-chapter-reader img');
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

// Run the function to adjust the image height
adjustImageHeight();
