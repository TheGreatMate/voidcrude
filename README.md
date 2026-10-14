# VOIDCRUDE

A retro pixel-art space tycoon inspired by *Turmoil*. Buy asteroid plots, scan for glowing **voidcrude**, steer drill pipes around rock and gas pockets, pump the crude into rigs, and let automatic haulers ferry it to the HELIX or NOVA refinery while prices change. The rival Syndicate is buying land and draining the same pockets. Spend profits between sectors on upgrades and Consortium shares. Own 51 shares to win.

## Progression

- **Land auctions:** every plot is won by bidding against the rivals. Each sector opens with an auction round, any free plot can be put up for auction, and rival land grabs go to auction too. Every bid resets the clock: going once, going twice, sold.
- **Glitch:** a $40 burrowing alien. Drop it underground and it scampers around, revealing a tunnel and sniffing out whole gas pockets.

- **Tycoons:** pick 1 of 6 characters, each with a passive bonus and an active ability on `Q` (with a cooldown). Three start unlocked; the other three unlock with Legacy points.
- **Rival corporations:** The Syndicate (grabs land), Kroll Mining (dumps crude to crash prices) and Hex Corp (sabotages your rigs). Each owns its own shares and taunts you. Any rival reaching 51 shares ends the run.
- **Black market (`6`):** pay credits to sabotage a rival, bribe the land registry, plant a price rumor, short a rival's stock, or take a quick loan.
- **Sector picker:** between sectors, choose 1 of 3 sectors. Each has its own rivals, modifiers (Gas-rich, Rocky, Boom Market, Unstable, and more) and a research multiplier.
- **Legacy (prestige):** every run, win or lose, earns Legacy points. Spend them on the title screen on permanent bonuses and character unlocks.

- **Rank-ups (per sector):** selling crude, striking pockets and finishing contracts earn XP. Every rank up pauses the game and deals 3 perk cards (common, rare or epic) to pick from, e.g. Overclock, Prefab Rig, Prospector, Sabotage, Overtime, Motherlode.
- **Contracts:** HELIX and NOVA post timed delivery contracts that pay credits plus Research Data (RD).
- **Tech tree (permanent):** RD buys nodes across 4 branches (Drilling, Extraction, Logistics, Markets), each ending in a capstone. Drilling includes **Pipe Couplers**: drill one rig's pipe into another's and every rig in the network shares its pockets. Credits go to buildings and shares.
- **Rock Blaster:** `5`, then click underground to shatter rock and ignite gas safely. You get 3 charges per sector, upgradable with RD to 10, and the blast radius grows at 6 and 9 charges.
- **Achievements:** 16 one-time goals that pay out RD.

It's pure HTML5 canvas with no dependencies, served by nginx. Saves are stored in the browser's localStorage after each sector.

## Finishing early

Out of crude? End the sector early from the pause menu, or click the top-bar prompt that replaces the day counter once every pocket your rigs tap is dry. Rivals still pump through the skipped days, leftover crude sells at 40%, and you earn +1 RD per 20 days saved.

## Money

Every sector starts with at least $2,000. Short on cash? Borrow in $1,000 steps from the shop or the black market (20% interest per sector, repay in the shop).

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
| `Space` | Pause menu (includes **End Sector Early**) |
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
