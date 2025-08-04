browser.contextMenus.create({
    id: "advanced-image-viewer",
    title: browser.i18n.getMessage("context_menu_item_title"),
    contexts: ["image"]
});


browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "advanced-image-viewer") {
        browser.tabs.sendMessage(tab.id, {
            action: "openAdvancedImageViewer",
            imageUrl: info.srcUrl
        }).catch(err => {
            console.error(`[${browser.i18n.getMessage("extension_title")}]:`, err);
        });
    }
});