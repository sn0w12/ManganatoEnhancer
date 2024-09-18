import { Manganato } from "./manganato";
import { Settings } from "./utility/settings";

const settings = new Settings();
const mangaNato = new Manganato(settings);

const pageType = mangaNato.getPageType();

if (pageType === "chapter") {
    const chapterHandler = mangaNato.chapterHandler;
    chapterHandler.initialize();
} else if (pageType === "bookmark") {
    const bookmarkHandler = mangaNato.bookmarkHandler;
    bookmarkHandler.initialize();
}
