chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openPageAndPressButton") {
        chrome.tabs.create({ url: request.url, active: false }, (tab) => {
            if (tab?.id !== undefined) {
                chrome.scripting.executeScript({
                    target: { tabId: tab!.id as number },
                    func: pressButtonOnPage
                }, () => {
                    chrome.tabs.remove(tab.id as number, () => {
                        sendResponse({ success: true });
                    });
                });
            } else {
                console.error("Tab ID is undefined");
                sendResponse({ success: false });
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
    }
}
