# MetricalTreeBackground Component

This directory contains the components for the Metrical Tree Background visualization that appears on the home page and potentially other pages.

## Current Active Files

The following files are currently being used in the application:

- **MetricalTreeBackground.js**: The main container component that orchestrates the background visualization.
- **config/**
  - **index.js**: Exports all configurations
  - **backgroundConfig.js**: Configuration for the background (grid, colors, etc.)
  - **treeGraphConfig.js**: Configuration for the tree graph visualization
- **components/**
  - **TreeGraphVisualization.js**: Renders the metrical tree graph visualization
  - **StressBarChart.js**: Renders the stress bar chart at the bottom
  - **ParticlesAnimation.js**: Handles particle animations in the background

## Component Hierarchy

```
MetricalTreeBackground
├── Grid Background
├── ParticlesAnimation
├── TreeGraphVisualization
└── StressBarChart
```

## Unused/Legacy Files

The following files are no longer used and can be safely removed:

- **LinguisticMetricalTree.js**: An older implementation of the metrical tree visualization
- **RefactoredMetricalTree.js**: A refactored version that is no longer used
- **MetricalTreeBackgroundAdapter.js**: An adapter component that is no longer needed

## Z-Index Structure

The components are layered using the following z-index values:

1. Grid Background (z-index: 0)
2. TreeGraphVisualization (z-index: 1)
3. StressBarChart (z-index: 2)
4. Info Card (in Home.js, z-index: 15)
5. Attribution text (z-index: 20)

## Component Responsibilities

- **MetricalTreeBackground**: Main container that manages the overall state and layout
- **TreeGraphVisualization**: Renders the linguistic tree at the top of the background
- **StressBarChart**: Displays stress patterns with an animated bar chart at the bottom
- **ParticlesAnimation**: Creates subtle particle effects throughout the background

## Configuration

Key configuration options in `config/`:

- Tree graph dimensions and styling
- Animation timing and easing functions
- Color schemes
- Responsive breakpoints
