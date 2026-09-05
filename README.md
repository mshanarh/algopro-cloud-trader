# Algopro Cloud

Build 2 connected projects: "Algopro Portal" web platform + "Algopro" mobile app.



=== PART 1: ALGOPRO PORTAL WEB PLATFORM ===



Design: Clean, modern, white background with dark blue gradient headers. Mobile-first but works on desktop. Use green/teal as primary button color. Purple for main CTAs.



PUBLIC LANDING PAGE at root URL:

1. Hero Section: Top nav bar with Algopro logo left, "Features", "Login" buttons right. Large heading: "Host Your Forex EAs in the Cloud with Algopro". Subheading: "A secure mobile hosting platform that lets you run MetaTrader EAs 24/7 and control everything from your phone. Supports 40,000+ MT4/MT5 brokers worldwide." 2 buttons: Purple "Get Started" and outlined "Download App" with Android/iOS icons. Hero image: Mockup of phone showing Algopro app Bot Console.

2. Trust Bar: "Compatible with all major brokers: IC Markets, Exness, FTMO, XM, Pepperstone + 40,000 others" with broker logos

3. How It Works - 3 Steps: "Upload Your EA", "Generate License", "Trade 24/7"

4. Features Grid - 6 cards: "Cloud Hosting", "License Control", "Live Trade Logs", "Chart Scanner", "Custom Branding", "Secure MT4/MT5 - Works with any broker"

5. CTA Section: Dark blue gradient, "Ready to Automate Your Forex Business?", Purple "Start Now" + "Download Algopro App" buttons

6. Footer: Logo + "Algopro © 2026", Links: Terms, Privacy, Contact



AFTER LOGIN - ADMIN PORTAL PAGES:

1. Dashboard/Home: "Good morning, [Display Name]", "Welcome to Algopro Portal — All systems are running smoothly. You have [X] active licences.", Mentor ID badge + Date, Status card with green dot, Licence Usage bar + "Request More Keys", Active Subscriptions card

2. Generate Licence Key: Username input, EXPERT ADVISOR dropdown, SUBSCRIPTION PLAN grid: 3 DAYS, 5 DAYS, 30 DAYS, 3 MONTHS, 6 MONTHS, 1 YEAR, Green "Generate Key" + Copy button

3. New EA page: Add EA form + "Your Expert Advisors" table

4. Clients List page: Search, STATUS badges, Extend/Revoke, Export CSV

5. Profile Settings: Gradient header, profile pic upload, Full Name, Display Name



=== PART 2: ALGOPRO MOBILE APP ===



Hosting: Cloud-hosted. Forex EA runs 24/7 on secure VPS, not on phone. App is control panel.



App flow:

1. Landing: "START NOW" button with green checkmark

2. Login: "Mentor ID" + "Email address" + Purple "Sign in"

3. Welcome screen: "Welcome Master" for 2 seconds with robot icon



Core features:

1. License Key Page: Input + "Validate Key"

2. MetaTrader Connection Screen:

   - Title: "Connect Your Broker"

   - Subtext: "Works with MT4 or MT5 from any of 40,000+ supported brokers"

   - Dropdown: "Platform" - MT4 or MT5

   - Inputs: "Broker Server" with search, "Account Number", "Password"

   - "Connect to Cloud" button

   - Status: "Connected to Cloud Server" green dot or "Disconnected" red

   - Help text: "Find your server in MT4/MT5 → Help → About"



3. Bot Control Dashboard:

   - EA name "ULTRA SPACE PRIME", "Scalper · Medium RISK"

   - Circular bot icon - grey when stopped, pulsing glow in chosen color when running

   - Buttons: Red "STOP BOT" and Grey "+ SYMBOLS"

   - BOT CONSOLE: First log "Bot activated", then "EA BLAZE system initialized", "Connected to broker: [Server Name]", "Ultra Space Prime started · symbols: GBPUSD"

   - Logic: On "Start Bot" → toast "Bot activated" + glow + logs



4. Chart Scanner: Live pairs, "Scan Now", signals

5. Settings: "Bot Appearance" - 6 color circles for active glow

6. Trade Logs: Real-time trades with timestamp, pair, lot, P/L

7. Server Status: Cloud VPS uptime, CPU/RAM



Bottom navigation: Home, Broker, Settings, Help, Light/Dark toggle



=== BACKEND LOGIC ===

1. Portal creates license keys tied to: Username, Email, EA, Expiry

2. Mobile app validates keys with Portal API

3. MT4/MT5 credentials stored encrypted on cloud VPS, never on phone

4. Portal shows "40,000+ brokers supported" on landing page

5. On login: "Welcome Master" screen

6. On Start Bot: "Bot activated" toast + console log

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://algopro-cloud-trader.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8168f075-1790-4114-84f0-ba95fede9595).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
