---
applyTo: '**'
---

# Coding Preferences
- Use TypeScript for all new code.
- Prefer functional components with Hooks for React.
- Use Tailwind CSS for styling.

# Project Architecture
- Vite + React + TypeScript.
- Custom ECS (Entity Component System) for game logic.
- Assets located in `/assets/`.
- Source files are in the root directory (no `src/` folder).

# Solutions Repository
- [Asset Loading]: Use `AssetLoader` and `TextureManager` for handling game assets.
- [Rendering]: `WorldSystem` handles canvas rendering with texture support.
