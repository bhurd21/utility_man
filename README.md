# Utility Man

A Chrome extension that automatically provides solutions for Immaculate Grid puzzles by querying Sean Lahman's baseball database. Works seamlessly within the existing website UI without disrupting the user experience.

## Features

- **Automatic Detection**: Instantly scans and provides solutions when visiting sports-reference.com/immaculate-grid
- **Non-Intrusive Integration**: Solutions appear contextually within search dialogs using the site's existing UI
- **Historical Puzzle Support**: Works with current and past puzzles (grid-{number} URLs)
- **Configurable**: Hide/show toggle with persistent user preferences
- **Theme Support**: System, light, and dark mode options
- **Real-time Updates**: Automatically refreshes solutions when navigating between puzzles
- **Baseball Reference Integration**: Direct links to player profiles and statistics

## How It Works

1. Visit sports-reference.com/immaculate-grid - extension automatically activates
2. Click any grid cell to open the search dialog
3. Solutions appear formatted as a table with player names, ages, and stats
4. Toggle visibility with the eye icon or configure default behavior in the popup
5. Click player names to auto-fill the search or use Baseball Reference links for more details

## Technical Details

- **Database**: Sean Lahman's Baseball Database (1871-2023)
- **API**: Queries local server at brennanhurdgmail.com/api/imgrid
- **Architecture**: Modular Chrome Manifest V3 extension with clean separation of concerns
- **Permissions**: activeTab, storage, and host permissions for sports-reference.com/immaculate-grid

## Local Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Links

- [Immaculate Grid](https://www.sports-reference.com/immaculate-grid)
- [Sean Lahman's Baseball Database](http://seanlahman.com)
