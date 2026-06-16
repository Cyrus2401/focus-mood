# DESIGN.md — Zenith Focus Design System Specification

> [!NOTE]
> Ce document définit l'univers esthétique et sémantique de l'application **Zenith Focus**. 
> Il sert de guide absolu pour l'ensemble des intégrations CSS et JS.

---

## 1. Thème Visuel

L'atmosphère générale est baptisée **"Cyber-Minimalist Zen"**. 
Le but est de créer un espace de travail virtuel qui élimine toute distraction cérébrale tout en enveloppant l'utilisateur dans une esthétique sombre, géométrique et immersive.
*   **Contrastes profonds** : Fonds extrêmement sombres rappelant le vide spatial.
*   **Aura lumineuse** : Éclairages indirects et halos colorés subtils (gradients) pour focaliser l'attention.
*   **Matérialité** : Panneaux "verre dépoli" (glassmorphism) flottants au-dessus de l'atmosphère pour une sensation de légèreté et d'ordre.

---

## 2. Palette de Couleurs

| Couleur | Code Hex | Nom du Rôle | Description & Usage |
| :--- | :--- | :--- | :--- |
| 🌌 | `#07050f` | **Zen Darkness** | Rôle sémantique: destruction (fond de secours). |
| 🪟 | `#141026` | **Vitreous Abyss** | Rôle sémantique: fond neutre des panneaux vitrés. |
| 💖 | `#ff5b8f` | **Focus Pink** | Rôle sémantique: primaire (concentration active). |
| 💚 | `#00f5d4` | **Flow Teal** | Rôle sémantique: secondaire / succès (repos de la session). |
| 💛 | `#ffb800` | **Mind Amber** | Rôle sémantique: accent / attention (interactions). |
| ⚪ | `#ffffff` | **Pure Light** | Rôle sémantique: texte principal, titres contrastés. |
| 🩶 | `#8b899e` | **Cosmic Grey** | Rôle sémantique: texte secondaire et icônes inactives. |

---

## 3. Typographie

*   **Outfit** - Display Font
    *   *Raison d'être* : Typographie géométrique et compacte.
    *   *Traitement* : Poids gras, empilement serré, espacement négatif des lettres.
*   **Inter** - Body Font
    *   *Raison d'être* : Clarté d'ingénierie absolue.
    *   *Traitement* : Poids moyen, espacement standard, lisibilité maximale.

---

## 4. Hiérarchie Typographique

*   **Titre d'Affichage** : Outfit, 24px, poids 700.
*   **Titre de Section** : Outfit, 16px, poids 600.
*   **Corps de Texte** : Inter, 8px, poids 400.

---

## 5. Espacement et Grille

Toutes les dimensions d'espacement (marges, paddings, gaps) reposent strictement sur un **système de grille de 8px** pour préserver une cohérence mathématique :
*   `4px` (Micro) : Bordures internes, écarts d'icônes.
*   `8px` (Small) : Padding des petits boutons, écarts de listes.
*   `16px` (Medium) : Padding standard des cartes, écarts de sections.
*   `24px` (Large) : Marges de mise en page principales.
*   `32px` (Macro) : Espacement des blocs majeurs.

---

## 6. Composants et États

### Variantes
1. **Bouton Principal** - Utilisé pour démarrer ou interrompre la session de concentration.
2. **Bouton Secondaire** - Dédié aux réinitialisations du système de chronométrage.
3. **Bouton Audio** - Dédié à la lecture et à l'arrêt des ondes sonores.

---

## 7. Motion et Animations

L'animation est le souffle vital de l'application. Elle doit se faire discrète mais haut de gamme.
*   **Load State (Entrée)** : Révélations progressives (staggers) de bas en haut : 20px vers 0px, avec une courbe fluide pour un sentiment de réactivité.
*   **Boutons (Hover)** : Légère élévation et transition douce de la lueur arrière (durée de 200ms).
*   **Boutons (Active/Click)** : Compression physique immédiate (durée de 100ms).
*   **Changement d'état (Timer Transition)** : Fondu enchaîné de couleur d'ambiance avec transition lente pour un effet enveloppant (durée de 300ms).

Note d'accessibilité: Toutes les animations respectent la directive `@media (prefers-reduced-motion: reduce)` en désactivant les mouvements de translation et en basculant sur des fondus d'opacité instantanés.

---

## ✅ Checklist

*   [x] Créer DESIGN.md avec structures réglementaires.
*   [x] S'assurer que tous les espacements sont des multiples de 8px.
*   [x] Vérifier la présence de seulement 2 polices (display + body).
