# Horloge Joiner — PRD

## Original problem
Site "Horloge Joiner" (style kawaifu.live): auto joiner Steal a Brainrot. Login Discord, owner "czr", balance par gift cards (générées seulement par czr), whitelist, logs brainrots (image, nom, mutation, prix) envoyés par bots in-game, reset HWID, regen key, slots (King 6 @ $5/h, Slave 10 @ $3/h, Russian 12 @ $1.25/h, max 24h), marketplace (location max $5.25/h), notification d'expiration 5 min avant (web), script Lua relié aux logs, blacklist/whitelist brainrots, self-bot. Ajout : clé owner infinie + Self Bot owner dans le panel (scan du serveur en 1s → report → server hop en boucle jusqu'à désactivation).

## Architecture
- FastAPI (server.py, brainrots.py = index de 55 brainrots avec images wiki fandom, lua_scripts.py = templates Lua client/selfbot/bot), MongoDB (users, slots, logs, giftcards, market, transactions, settings, selfbot_runs, oauth_states)
- React + Tailwind + shadcn, pages : Login, Home, Live Logs, Statistics, Slots, Marketplace, Leaderboard, Admin (Owner)
- Auth : Discord OAuth2 (prêt, en attente des clés) + login démo (MOCK_LOGIN=true, auto-désactivé quand les clés Discord sont configurées). JWT 7 jours.

## Implémenté (2026-10-19)
- Toutes les pages + panel owner (Self Bot, System & Bots, Gift Cards, Users & Whitelist, Brainrot Blacklist, Slots)
- Achat/extension de slot, freeze du système/des divisions, mode whitelist-only, ban, ajustement de balance
- Gift cards, transfert/regen de clé, reset HWID (cooldown 30 min), HWID lock dans le Lua
- Marketplace location/vente + historique
- API Lua : /script/auth, /script/poll (fenêtre de 8s), /script/report, /script/selfbot/status, /logs/ingest (X-Bot-Token)
- Flux démo (MOCK) : faux logs toutes les 60s, désactivable dans Owner > System

## Backlog
- P0 : clés Discord OAuth (Client ID/Secret) → désactiver le login démo
- P1 : valider le chemin de scan in-game (BillboardGui "AnimalOverhead") dans le vrai jeu ; ajuster les valeurs de base des brainrots
- P2 : bot Discord DM, plus de brainrots dans l'index, édition de l'index depuis le panel
