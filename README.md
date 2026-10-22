# NFL GRIDIRON — Expansion Phase 1

This is an **incremental update**, not completion of the five-part expansion request.

## Added in this build
- Franchise Mode menu and weekly season simulation.
- A 32-team, 18-week schedule with 17 games and one bye per team (simplified round-robin opponents, **not** official NFL scheduling).
- Standings, weekly results, simulated AFC/NFC playoff brackets and Super Bowl champion.
- Save/load one franchise locally in browser localStorage and continue into another season.
- The previous offline Quick Play and separate two-avatar online beta are preserved.

## Not yet implemented
- Shared 22-player engine and full online 11-on-11 multiplayer.
- Advanced quarterback throwing meter and receiver catch types.
- Realistic line blocking and blitz/sack mechanics.
- Fully playable kickoffs, punts, and field goals.
- Franchise roster management, draft, trades, multiple save slots, official NFL divisions and tiebreakers, and playable franchise games.

## Run
For offline Quick Play and Franchise Mode, open `index.html` in Chrome. Browser storage must be enabled for saving.
For online beta, install Node.js 18+, run `npm install` then `npm start` and open `http://localhost:3000`.
To play online across separate networks, deploy the project to a Node.js host with WebSocket support and share its HTTPS URL.

The online mode remains a **simplified prototype**, and has not been tested across separate computers.
