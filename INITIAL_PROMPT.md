# GitHub Copilot Prompt — Vampire Fantasy Idle RPG

## Project Overview

Create a browser-based Vampire Fantasy Idle RPG called **Bloodbound: Ascension** using TypeScript, HTML5, and CSS3.

The player begins as a newly awakened, weak vampire in a dark fantasy world filled with monsters, supernatural creatures, and ancient beings.

The primary gameplay mechanic is **Blood Absorption**: the player grows stronger by hunting monsters and can permanently acquire unique abilities by defeating and absorbing monsters that are stronger than the player.

The game should combine idle RPG progression, automatic combat, character customization, ability collection, and exploration.

Build a fully functional and visually polished application rather than a static prototype.

## 1. Technology Requirements

Use the following technologies:

- TypeScript for game logic, mechanics, and state management.
- HTML5 for the interface.
- CSS3 for styling and animations.
- Vite for development and building.
- LocalStorage for saving and loading progress.

Do not use React, Angular, Vue, or a backend. Use vanilla TypeScript with modular, object-oriented or component-based architecture where appropriate.

Organize the code so new monsters, locations, and abilities can be added easily.

## 2. Player Character

The player controls a vampire who becomes progressively more powerful.

### Player Stats

Implement these attributes:

- Level
- Experience
- Health / Max Health
- Attack
- Defense
- Speed
- Blood Essence
- Blood Power

Each statistic should affect gameplay.

The player gains experience through combat and levels up automatically when reaching the required experience threshold.

Leveling up increases base statistics.

Blood Essence is a resource earned by defeating monsters and can be spent on permanent upgrades.

Blood Power represents the vampire's overall combat strength and is used to compare the player against monsters.

## 3. Idle Combat System

Implement a fully functioning automatic combat system.

### Combat Mechanics

- The player automatically attacks the selected monster at regular intervals.
- Monsters automatically retaliate.
- Damage is calculated using attack, defense, and ability modifiers.
- Display both player and monster health bars.
- Show damage numbers and combat messages.
- When a monster is defeated, award experience and Blood Essence.
- After victory, automatically spawn another monster.
- When the player dies, temporarily pause combat and restore health before resuming.
- Provide a button to pause or resume automatic combat.

Make combat balanced so progression is achievable without constant player interaction.

Include a scrolling combat log showing events such as attacks, critical hits, healing, victories, and abilities gained.

## 4. Blood Absorption System — Core Mechanic

**This is the most important mechanic in the game.**

Whenever a monster is defeated, the vampire automatically absorbs its blood.

### Absorption Rules

1. Every defeated monster awards Blood Essence.
2. Monsters have a combat Power Rating based on their statistics.
3. If the monster's Power Rating was greater than the player's Power Rating when the battle began, the monster qualifies as a stronger enemy.
4. Defeating a stronger monster allows the player to absorb one of its unique abilities.
5. The player permanently learns an ability when absorbing it for the first time.
6. Previously acquired abilities cannot be duplicated.
7. Defeating stronger monsters should reward more Blood Essence and experience.

Display a special notification when a new ability is absorbed.

Example:

**BLOOD ABSORPTION SUCCESSFUL**

Monster Defeated: Shadow Wolf

New Ability Acquired: Shadow Step

Effect: Increases dodge chance by 15%.

Make this system expandable so every monster species can have unique learnable abilities.

The player should be encouraged to challenge stronger enemies instead of only farming weak ones.

## 5. Monsters and Enemy Progression

Create multiple fantasy monsters with different statistics, strengths, and abilities.

Initial monsters:

| Monster | Unique Ability | Ability Effect |
|---|---|---|
| Feral Rat | Blood Scent | Increases critical hit chance |
| Shadow Wolf | Shadow Step | Increases dodge chance |
| Undead Knight | Bone Armor | Increases defense |
| Blood Wraith | Life Drain | Restores health when attacking |
| Ancient Vampire | Blood Frenzy | Increases attack speed |
| Abyssal Demon | Demonic Strength | Increases attack damage |

Monsters should have:

- Name
- Level
- Health
- Attack
- Defense
- Speed
- Power Rating
- Experience Reward
- Blood Essence Reward
- Unique Absorbable Ability

Scale monster strength based on the selected location and progression tier.

Clearly distinguish normal monsters, elite monsters, and bosses.

## 6. Ability System

Create an Ability Collection interface that displays every ability the vampire has absorbed.

Support two types of abilities:

### Passive Abilities

Automatically provide permanent bonuses, such as:

- Increased attack damage
- Faster attacks
- Increased health regeneration
- Improved defense
- Critical hit chance
- Dodge chance
- Increased Blood Essence rewards

### Active Abilities

Can be activated manually during combat and have cooldowns.

Examples:

- Blood Burst: Deals increased damage to the current enemy.
- Vampiric Drain: Damages the enemy and heals the player.
- Shadow Strike: Performs a powerful critical attack.
- Blood Shield: Temporarily reduces incoming damage.

For the initial version, implement at least four fully functional abilities with different effects.

Show ability descriptions, cooldowns, and whether an ability is active or passive.

All abilities must have real effects on gameplay rather than simply changing displayed statistics.

## 7. Locations and Exploration

Create multiple unlockable locations.

Initial locations:

**The Forgotten Graveyard**

- Starting area
- Weak undead and corrupted animals
- Low-level enemies

**The Cursed Forest**

- Stronger supernatural creatures
- Wolves and spirits
- Increased experience and Blood Essence rewards

**The Crimson Castle**

- Powerful undead warriors and vampires
- Elite monsters and bosses
- Rare abilities

The player should be able to select an unlocked location.

Locked locations should display their unlock requirements.

Each location should have a distinct appearance and enemy pool.

Unlock new areas through level progression or defeating powerful bosses.

## 8. Upgrades and Progression

Create an upgrade interface where the player spends Blood Essence on permanent stat improvements.

Include these upgrades:

- Attack Strength
- Maximum Health
- Defense
- Attack Speed
- Blood Absorption Efficiency

Each upgrade should:

- Have a clearly displayed Blood Essence cost.
- Increase in cost after every purchase.
- Apply its effect immediately.
- Persist through saved games.
- Update the player statistics and UI.

Show the player's overall Power Rating so they can compare their strength to enemies.

## 9. User Interface and Visual Design

Create a polished dark gothic fantasy interface inspired by vampire-themed RPGs.

### Visual Style

- Dark charcoal and black backgrounds.
- Deep crimson and burgundy accents.
- Gold highlights for rare items and important information.
- Gothic-inspired headings.
- Modern, readable body text.
- Subtle glow effects and animations.
- Responsive layout for desktop and mobile.

### Interface Layout

**Top Header**

- Game title
- Player level
- Blood Essence
- Current location
- Save status

**Left Panel — Vampire Character**

- Character name
- Player statistics
- Health bar
- Experience bar
- Overall Power Rating

**Center Panel — Combat**

- Current monster name and level
- Monster illustration or stylized visual
- Monster health bar
- Combat animations
- Combat controls
- Scrolling battle log

**Right Panel — Progression**

Create tabs for:

- Abilities
- Upgrades
- Locations
- Statistics

Make the interface feel like a fantasy game rather than a standard administrative dashboard.

Use CSS effects, icons, and styled fantasy elements. Avoid requiring paid assets or external API keys.

All interactive elements must work.

## 10. Save and Load System

Implement automatic saving through browser LocalStorage.

Save:

- Player statistics
- Level and experience
- Blood Essence
- Purchased upgrades
- Acquired abilities
- Unlocked locations
- Selected location

Load saved progress automatically when the application starts.

Add a manual Save button and a Reset Progress button.

Resetting progress must ask for confirmation before deleting saved data.

Handle missing or invalid save data gracefully.

## 11. Code Organization

Separate the application into logical modules.

Suggested structure:

```text
bloodbound-ascension/
├── index.html
├── package.json
├── tsconfig.json
├── README.md
├── PROMPT.md
├── .gitignore
├── src/
│   ├── main.ts
│   ├── styles/
│   │   └── main.css
│   ├── models/
│   │   ├── Player.ts
│   │   ├── Monster.ts
│   │   └── Ability.ts
│   ├── systems/
│   │   ├── CombatSystem.ts
│   │   ├── AbsorptionSystem.ts
│   │   ├── ProgressionSystem.ts
│   │   └── SaveSystem.ts
│   ├── data/
│   │   ├── monsters.ts
│   │   ├── abilities.ts
│   │   └── locations.ts
│   └── ui/
│       └── GameUI.ts
```

You may adjust the organization if a different structure is more appropriate.

Use proper TypeScript interfaces, classes, and types. Avoid `any` wherever possible.

Avoid unnecessarily complex abstractions.

## 12. Gameplay Balance

Ensure the game provides a satisfying progression loop:

1. Fight weak monsters.
2. Gain experience and Blood Essence.
3. Upgrade vampire statistics.
4. Challenge stronger monsters.
5. Defeat stronger monsters and absorb their unique abilities.
6. Use newly acquired abilities to defeat increasingly powerful enemies.
7. Unlock new locations.
8. Repeat.

Balance the game so the player can eventually defeat stronger opponents without getting trapped in an impossible progression state.

## 13. Testing and Error Handling

Implement appropriate error handling for invalid game state and missing data.

Verify that:

- Combat deals damage correctly.
- Monsters can defeat the player.
- The player recovers after dying.
- Experience and level progression work.
- Blood Essence rewards are awarded correctly.
- Upgrade purchases correctly spend resources.
- Absorbed abilities provide their intended bonuses.
- Abilities cannot be acquired multiple times.
- Only qualifying stronger monsters award new abilities.
- Progress saves and loads correctly.
- Reset Progress works.
- The UI updates when game state changes.

Avoid memory leaks, duplicate combat intervals, and excessive DOM updates.

## 14. GitHub and Documentation

This application is part of a college AI-assisted development assignment.

Create a README.md containing:

- Project name and description
- Project purpose
- Game features
- Technologies used
- AI development tools used
- Installation instructions
- Instructions for running the game
- How AI assisted development
- Screenshots section
- Future improvements
- Vibe Coding Reflection section

Also create a PROMPT.md file that can be used to record AI prompts and development iterations.

Do not invent testing results, screenshots, Git commit history, or personal reflection answers. Include placeholders where real evidence is required.

## 15. Development Approach

Build the project incrementally rather than generating an unnecessarily complex application all at once.

For the initial version, prioritize:

1. Setting up a working Vite + TypeScript + HTML project.
2. Creating the main game interface.
3. Implementing player and monster statistics.
4. Implementing automatic combat.
5. Implementing leveling and Blood Essence rewards.
6. Implementing the core stronger-monster ability absorption system.
7. Implementing basic ability effects.
8. Adding LocalStorage persistence.

After the initial version is functional, identify improvements that can be implemented in separate iterations, such as additional locations, more abilities, bosses, animations, and advanced progression.

The goal is a **working and extensible first version**, not a collection of unfinished features.

## 16. Final Instructions

Begin by creating the project structure and implementing the first playable version.

Generate actual working TypeScript, HTML, and CSS files.

Do not provide only pseudocode or descriptions.

Explain the major components and the purpose of each file.

Provide the commands required to install dependencies and run the application.

Make sure the game can start with:

```bash
npm install
npm run dev
```

Prioritize a functional gameplay loop, a polished dark fantasy interface, and a fully working Blood Absorption mechanic.

**The defining feature of this game is that the vampire evolves by stealing unique abilities from monsters stronger than itself. Make this mechanic central to the entire experience.**
