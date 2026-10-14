# VOIDCRUDE

A retro pixel-art space tycoon inspired by *Turmoil*. Bid on asteroid plots, scan for glowing **voidcrude**, steer drill pipes around rock and gas, and let automatic haulers ferry the crude to the HELIX or NOVA refinery while prices swing. Rival corporations fight you for land, pockets and, in the end, control of the Colonial Consortium. Own 51 shares to win.

## The campaign

Six belts of three sectors each (about 1.5 to 2 hours). Each belt adds a hazard and keeps the earlier ones:

| Belt | Hazard | Counter |
|---|---|---|
| 1 Fertile Drift | Crude only - learn the ropes | |
| 2 Kessler Rocks | Solid rock blocks drills | Laser Bore, Rock Blaster (`5`) |
| 3 Vapor Fields | Gas pockets cause blowouts | Glitch (`7`) sniffs them out, Gas Siphon |
| 4 Writhing Deep | **Living crude** (pink) crawls and can slip off your pipes | Bio-Anchors |
| 5 Glacier Belt | **Cryo-crude** (icy blue) pumps at 30% | Heated Pipes, Thermal Core |
| 6 The Void Reach | **Void storms** ground haulers and fry rigs | Storm Shields, Storm Hangars |

- **Campaign map:** every step offers two sectors with different rivals and conditions (Bonanza, Boom Market, Unstable quakes and more). Harder picks pay bigger sector bonuses.
- **One currency:** upgrades and shares cost the same credits, so every upgrade is money you aren't saving for the stock auction.
- **Workshop:** upgrades across five branches (Drilling, Extraction, Logistics, Markets, Frontier) unlock as you reach each belt. Drilling includes **Pipe Couplers** (drill one rig's pipe into another's and the network shares its pockets).
- **Stock auctions:** shares only sell after belts 2 to 6, in falling-price lots: wait for a bargain, but a rival may buy first. Rivals bank cash every sector (watch their war chests on the map) and upgrade their own rigs. If nobody has 51 after the final belt, the smallest shareholder is eliminated and their stock is re-auctioned until someone does.
- **Sector bonuses:** drain all the crude under your land, sell every drop, clear all gas, or withdraw early.
- **Land auctions:** every plot is won by bidding. Each sector opens with an auction round, any free plot can be auctioned, and rival land grabs go to auction too.
- **The Cantina:** between sectors, Moxie, Old Zeke and Sly Vex sell one-sector deals: hot tips, cheap rigs, price fixes, hired muscle and side bets.
- **Minimum sell price:** set a floor on each refinery; haulers hold their crude until the price beats it.
- **Difficulty:** Easy, Normal or Hard on the character screen (Hard pays 50% more Legacy).

## Also in the game

- **Tycoons:** 6 characters, each with a passive bonus and an active ability on `Q`. Three unlock with Legacy points.
- **Rivals:** The Syndicate (grabs land), Kroll Mining (crashes prices) and Hex Corp (sabotages rigs), with taunts.
- **Black market (`6`):** sabotage a rival, bribe the land registry, plant a price rumor, short a rival's stock, or take a quick loan.
- **Rank-ups:** selling and striking crude earns XP; each rank deals 3 perk cards to pick from.
- **Contracts:** refineries post timed delivery jobs for credits.
- **Achievements:** 16 one-time goals that pay credits.
- **Legacy:** every run, win or lose, earns points for permanent bonuses and character unlocks.
- **Stats:** profit per sector, your crude against each rival's, station split and war chests.

It's pure HTML5 canvas with no dependencies, served by nginx. Progress saves in the browser between sectors and every few days during a sector, so **Continue Sector** picks up where you left off.

## Finishing early

Out of crude? End the sector early from the pause menu, or click the top-bar prompt that replaces the day counter once every pocket your rigs tap is dry. Rivals still pump through the skipped days, leftover crude sells at 40%, and you earn the early-withdrawal bonus.

## Money

Every sector starts with at least $2,000. Short on cash? Borrow in $1,000 steps from the workshop, the black market or the stock auction (20% interest per sector, repay in the workshop).

## Install on Unraid

Every push to `main` builds a multi-arch image (amd64 + arm64) and publishes it to `ghcr.io/thegreatmate/voidcrude:latest` via GitHub Actions.

### 1. Get the template onto your server

Pick one:

- **Template repository (recommended):** in Unraid go to **Docker → Template Repositories** (bottom of the Docker tab, in advanced view), add `https://github.com/TheGreatMate/voidcrude`, and click **Save**.
- **One command:** in the Unraid web terminal run:
  ```bash
  wget -O /boot/config/plugins/dockerMan/templates-user/my-voidcrude.xml https://raw.githubusercontent.com/TheGreatMate/voidcrude/main/unraid/voidcrude.xml
  ```

### 2. Add the container

**Docker → Add Container**, choose **voidcrude** from the *Template* dropdown, adjust the fields and click **Apply**.

| Field | Default | What it does |
|---|---|---|
| Name | `voidcrude` | Container name |
| Network Type | `Bridge` | Bridge, Host or a custom network such as `br0` |
| WebUI Port | `8088` | Port you open in your browser: `http://SERVER-IP:8088` |
| Container Port *(advanced)* | `80` | Port nginx listens on inside the container. Leave at `80` for Bridge. With Host or `br0` networking, set it to the port you want to browse to. |

Click the container icon → **WebUI** to play. Progress is stored in each browser, so there is no appdata folder to map.

### Updating

Every change pushed to `main` rebuilds the image automatically. On Unraid, the Docker tab then shows **update ready**; click it to pull the new version.

## Run locally

```bash
docker compose up -d --build
```

Open http://localhost:8088. To pull the published image instead of building, run `docker compose pull && docker compose up -d`.

### Without a registry

```bash
docker build -t voidcrude:latest .
docker save voidcrude:latest -o voidcrude.tar
# copy voidcrude.tar to the server, then on Unraid:
docker load -i voidcrude.tar
docker run -d --name voidcrude -p 8088:80 voidcrude:latest
```


## Controls

| Input | Action |
|---|---|
| Click an `AUCTION` sign | Put a plot up for auction (`B` bids, `Esc` passes) |
| `7`, then click underground | Release Glitch, an alien that tunnels around and sniffs out gas |
| `1` / `2` / `4` | Rig / Silo / Scanner placement tool |
| `3` | Buy a hauler (it joins the side with fewer haulers) |
| `5` | Rock blaster (click underground) |
| `6` | Black market |
| `Q` | Your tycoon's ability |
| `1`-`3` on a rank-up | Pick a perk card |
| Click rig, then click underground | Lay a pipe; each click adds a joint and the next run continues from it |
| Drag from a joint (or the rig) | Branch a new pipe from that joint |
| Right-click / `Esc` | Finish the pipe you are laying |
| Click a refinery, or ► on its price panel | Move one of your haulers to that side |
| ◄ on a refinery's price panel | Move one of its haulers to the other side |
| Click a hauler, then a refinery | Switch that hauler's side |
| `Space` | Pause menu (includes **End Sector Early**); buy the current lot at a stock auction |
| `-` / `+` on a refinery panel | Set its minimum sell price |
| `1X` `2X` `4X` (top bar) or `F` | Game speed |
| `Tab` | Cycle haulers |
| `Esc` / right-click | Cancel |
| `M` | Music toggle |

## Files

- `public/` holds the whole game (`index.html`, `game.js`, `style.css`)
- `Dockerfile` and `default.conf.template` build a small nginx:alpine image; `NGINX_PORT` sets the listen port
- `unraid/` holds the Unraid template and icon
- `.github/workflows/docker.yml` builds and publishes the image to GHCR
- `docker-compose.yml` runs it locally on port 8088
