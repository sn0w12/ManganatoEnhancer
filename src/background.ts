chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openPageAndPressButton") {
        chrome.tabs.create({ url: request.url, active: false }, (tab) => {
            if (tab?.id !== undefined) {
                chrome.scripting.executeScript({
                    target: { tabId: tab!.id as number },
                    func: pressButtonOnPage
                }, (results) => {
                    // Check the result of the function
                    if (results && results.length > 0) {
                        const result = results[0].result;  // Get the returned value from the injected script

                        sendResponse({ success: result });
                    } else {
                        sendResponse({ success: 0 });  // No result returned
                    }

                    chrome.tabs.remove(tab.id as number);  // Close the tab after getting the result
                });
            } else {
                sendResponse({ success: 0 });
            }
        });
        return true;
    }
});

function pressButtonOnPage() {
    // This function runs in the context of the opened page
    const button = document.querySelector<HTMLButtonElement>('.story-bookmark');
    if (button) {
        button.click();
        return 1;
    }

    const followedButton = document.querySelector<HTMLParagraphElement>('.user_btn_follow_i');
    if (followedButton) {
        return 2;
    }
    return 0;
}
