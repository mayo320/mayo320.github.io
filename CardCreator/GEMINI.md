# Gemini Code Assistant Documentation

This document provides an overview of the Card Creator project, its structure, and how to work with it.

## Project Overview

The Card Creator is a web-based application for creating and managing custom cards for a card game. It allows users to define cards with various attributes, including name, cost, level, faction, abilities, and more. The application also provides functionality for exporting cards as images for printing and use in the game.

The project appears to be a trading card game (TCG) creator, with a focus on generating printable cards. It includes a scoring system to evaluate the balance of the cards.

## Key Files

*   `main.html`: An entry point of the application. It contains the HTML structure for the card creator interface. This is less frequently used, use `ui_2.html` instead.
*   `ui_2.html`: The UI for the card creator.
*   `main.js`: The main JavaScript file that contains the core logic of the application. It handles card creation, data loading, and user interactions.
*   `data.js`: This file contains the card data, including card definitions, encoded data for card sets, and other game-related information.
*   `score.js`: This file contains the logic for the card scoring system. It defines the criteria for evaluating card balance and assigns scores to cards based on their attributes and abilities.
*   `styles/ui_2.css`: The main stylesheet for the application. It defines the visual appearance of the cards and the user interface.
*   `zip.js`: This file contains the logic for decompressing the encoded card data.

## Technologies Used

*   HTML
*   CSS
*   JavaScript
*   [html2canvas](https://html2canvas.hertzen.com/): A JavaScript library for taking "screenshots" of web pages or parts of it.

## How to Run

1.  Open the `main.html` or `ui_2.html` file in a web browser.
2.  The application will load the card data and display the card creator interface.
3.  You can then use the interface to create, view, and export cards.

## Development

### Scoring System

The scoring system is defined in the `score.js` file. It uses a set of criteria to evaluate the balance of the cards. You can modify these criteria to adjust the scoring system to your needs.

### Other Important Notes

* Do no directly modify `data.js`, this will always be manually populated by the user