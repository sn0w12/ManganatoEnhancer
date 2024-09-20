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
    if (request.action === "processBookmark") {
        chrome.tabs.create({ url: request.url, active: false }, (tab) => {
            if (tab && tab.id !== undefined) {
                const tabId = tab.id;

                const onTabUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
                    if (updatedTabId === tabId && changeInfo.status === 'complete') {
                        // Remove the listener to prevent it from firing multiple times
                        chrome.tabs.onUpdated.removeListener(onTabUpdated);

                        // Inject the content script after the page has fully loaded
                        chrome.scripting.executeScript(
                            {
                                target: { tabId: tabId },
                                func: contentScriptFunction,
                            },
                            () => {
                                setTimeout(() => {
                                    chrome.tabs.remove(tabId, () => {
                                        sendResponse({ success: 1 });
                                    });
                                }, 5000); // 5 seconds
                            }
                        );
                    }
                };

                // Add a listener to wait for the tab to finish loading
                chrome.tabs.onUpdated.addListener(onTabUpdated);
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

function contentScriptFunction() {
    // Scroll to the bottom of the page
    window.scrollTo(0, document.body.scrollHeight);

    // Function to click the "Ok" button
    function clickOkButton(flashDiv: Element) {
        const okButton = flashDiv.querySelector('button.Yes');
        if (okButton) {
            (okButton as HTMLElement).click();
        }
    }

    // Check if the target element is already present
    const flashDiv = document.querySelector('div.flash.type-add');
    if (flashDiv) {
        clickOkButton(flashDiv);
    } else {
        // Set up MutationObserver
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const flashDiv = document.querySelector('div.flash.type-add');
                    console.log(flashDiv);
                    if (flashDiv) {
                        clickOkButton(flashDiv);
                        observer.disconnect();
                        break;
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}
