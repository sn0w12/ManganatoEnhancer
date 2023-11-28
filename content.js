
function adjustImageHeight() {
    const images = document.querySelectorAll('.container-chapter-reader img');
    let allImagesBelowThreshold = true;

    images.forEach(img => {
        if (img.naturalHeight >= 3000) {
            allImagesBelowThreshold = false;
        }
    });

    if (allImagesBelowThreshold) {
        images.forEach(img => img.style.height = '1003px');
    }
	else {
		images.forEach(img => img.style.width = '450px');
	}
}

// Run the function to adjust the image height
adjustImageHeight();
