<h1 align="center">
  Manganato Enhancer
</h1>

A simple chrome extension made to improve the manganato experience. Contains visual changes such as making manga pages take up the entire screen and quality of life tweaks like letting you go through a manga with the arrow keys.

# Features

## Bookmark Search

You can search through your bookmark without having to look through each page individually.

![Search](https://i.imgur.com/o5gyKtf.png)

## Export Bookmarks

You can export all your bookmarks as a `json` file.

## Go Through Manga Page by Page

Instead of scrolling through manga you can go through page by page with either shortcuts or by clicking on the page.

## Customizable Settings

![Settings](https://i.imgur.com/wwcL2HR.png)

# Shortcuts

Shortcut buttons can be configured in the settings.

- `>`: **Right Arrow**.
- `<`: **Left Arrow**.

## General Shortcuts

Works on all pages.

| Key      | Function |
| ----------- | ----------- |
| Ctrl + b     | Go To Bookmarks |
| Ctrl + m     | Go To Home |

## Manga Shortcuts

Works while reading a chapter.

| Key      | Function |
| ----------- | ----------- |
| >   | Next Page |
| <     | Previous Page |
| Shift + >   | Last Page |
| Shift + <     | First Page |
| Ctrl + >   | Next Chapter |
| Ctrl + <     | Previous Chapter |
| Ctrl + i     | Change Image Server |
| Ctrl + Enter     | Bookmark Manga |

## Bookmark Shortcuts

Works while in bookmarks.

| Key      | Function |
| ----------- | ----------- |
| Ctrl + Right Arrow   | Next Page |
| Ctrl + Left Arrow   | Previous Page |
| Ctrl + Shift + Right Arrow   | Last Page |
| Ctrl + Shift + Left Arrow   | First Page |

## Manga Page Shortcuts

Works while on the main page of a manga.

| Key      | Function |
| ----------- | ----------- |
| Ctrl + Enter   | Go to First Chapter |

# Installation

1. Download the Extension:
    * Download `manganato-enhancer.zip` from the latest [release](https://github.com/sn0w12/Manganato/releases/latest)
    * Or clone it with `Git clone https://github.com/sn0w12/Manganato`
      * If you cloned it, build it with `npm run build`

2. Extract Files:
    * If you downloaded a zip file, extract it to a convenient location.

3. Open Chrome and Navigate to Extensions:
    * Open Google Chrome and go to chrome://extensions/.

4. Enable Developer Mode:
    * In the top right corner of the Extensions page, enable Developer mode by toggling the switch.

5. Load Unpacked Extension:
    * Click the Load unpacked button and select the directory where you extracted or built the extension files.
