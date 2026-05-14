# Lafay Tracker

Application web **mobile-first** pour suivre une séance type méthode Lafay : catalogue de niveaux, séance guidée (séries, repos, transitions), minuterie, profil, journal de fin de séance — avec **Supabase** (auth + base + RLS).

> Les contenus intégrés sont des **résumés de suivi**, non substitutifs au livre officiel.

## Prérequis

- **Node.js 20+** (voir `engines` dans `package.json`)
- Un projet **[Supabase](https://supabase.com)** avec les migrations appliquées

## Installation locale

```bash
git clone https://github.com/WilGLN/mes-exos.git
cd mes-exos
npm install
```

### Variables d’environnement

1. Copie `.env.example` vers `.env.local` (fichier **non versionné**).
2. Renseigne l’URL du projet et la **clé anon** (jamais la `service_role` côté client).

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet (ex. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clé publique **anon** |

Sans ces variables, l’app redirige vers `/setup` avec les consignes.

### Base de données Supabase

Applique les migrations **dans l’ordre** depuis le dossier `supabase/migrations/` (via [Supabase CLI](https://supabase.com/docs/guides/cli) ou l’éditeur SQL du dashboard) :

`0001` → `0002` → … → `0010` (voir noms de fichiers dans le dépôt).

Après le seed catalogue (`0009` + correctifs `0010`), configure l’**URL du site** et les **redirect URLs** dans Supabase → *Authentication* → *URL configuration* (voir section Netlify ci-dessous si tu déploies en ligne).

## Scripts npm

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de dev Vite (souvent `http://localhost:5173`) |
| `npm run build` | Build production dans `dist/` |
| `npm run preview` | Prévisualise le build localement |

## Déploiement Netlify

Le dépôt contient un fichier **`netlify.toml`** :

- **Build** : `npm run build`
- **Dossier publié** : `dist`
- **Node** : 20 (variable `NODE_VERSION`)
- **SPA** : redirection `/*` → `/index.html` (React Router)

Le dossier **`public/_redirects`** est copié dans `dist/` au build (filet de sécurité).

### Étapes Netlify

1. **New site** → importer le dépôt GitHub `WilGLN/mes-exos`.
2. Laisser les paramètres détectés depuis `netlify.toml` (ou saisir *build* / *publish* comme ci-dessus).
3. **Site settings → Environment variables** : ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (mêmes valeurs qu’en local).
4. Déclencher un **Deploy**.
5. Dans **Supabase** → *Authentication* → *URL configuration* :
   - **Site URL** : `https://<ton-site>.netlify.app`
   - **Redirect URLs** : inclure cette URL (et `http://localhost:5173/**` pour le dev si tu utilises l’auth par lien / OAuth).

Domaine personnalisé : ajoute aussi l’URL finale dans Supabase.

## Usage smartphone

- Viewport avec **`viewport-fit=cover`** et métadonnées **PWA partielles** (`apple-mobile-web-app-capable`, etc.) dans `index.html`.
- Styles : **safe areas** (`env(safe-area-inset-*)`), shell centré type iPhone, **zones tactiles** ≥ 44–48 px sur les actions principales, navigation basse fixe.
- Après déploiement, tester sur **Safari iOS** (connexion, navigation, séance, minuterie, sons / vibrations selon les réglages du téléphone).

## Structure utile du dépôt

```
src/
  App.tsx              # Routes
  pages/               # Écrans
  components/          # Layout, session, etc.
  hooks/               # useWorkoutSession, catalogue, profil
  lib/                 # Supabase, catalogue, session workout
  styles/index.css     # Design global + responsive
public/
  _redirects           # SPA Netlify (copié dans dist)
supabase/migrations/ # Schéma + seeds + correctifs repos
netlify.toml           # CI Netlify
cahier-des-charges.json
.env.example
```

## Documentation produit

- Spécification fonctionnelle / périmètre : **`cahier-des-charges.json`**
- UX de référence : **`design/ux-specification-lafay-tracker.json`**
- QA mobile : **`docs/qa-device-matrix-iphone.md`**

## Sécurité

- Ne **commit** jamais `.env.local` ni de clés `service_role`.
- La sécurité des données repose sur les **politiques RLS** Supabase et l’usage de la clé **anon** uniquement côté client.

## Licence

Le dépôt contient le code de l’application ; les droits sur la **méthode Lafay** et le livre restent ceux des auteurs / éditeurs concernés.
