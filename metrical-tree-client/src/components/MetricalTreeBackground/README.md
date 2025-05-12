# MetricalTreeBackground Component

A dynamic, animated tree visualization that represents stress patterns in metrical trees for linguistics. This React component serves as a configurable background that can be used in the Stanford Linguistics Suite.

## Features

- Dynamic tree generation with stress pattern visualization
- Responsive design that adapts to different screen sizes
- Configurable colors, animation speed, tree growth parameters, and more
- Particle system for enhanced visual appeal
- Grid background with customizable appearance
- Built-in controls for regenerating and pausing/resuming animation
- Mobile-optimized rendering with simplified tree structure
- Performance optimizations using requestAnimationFrame and React hooks

## Installation

The component is already part of the Stanford Linguistics Suite project. No additional installation is required.

## Usage

### Basic Usage

```jsx
import React from 'react';
import MetricalTreeBackground from './components/MetricalTreeBackground';

const App = () => {
  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      {/* The background component */}
      <MetricalTreeBackground />
      
      {/* Your content goes here */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <h1>Your Content</h1>
        <p>This content will appear on top of the animated background.</p>
      </div>
    </div>
  );
};

export default App;
```

### Advanced Usage with Configuration

```jsx
import React, { useRef } from 'react';
import MetricalTreeBackground from './components/MetricalTreeBackground';

const App = () => {
  // Create a ref to access the component's methods
  const treeRef = useRef(null);
  
  // Function to regenerate the tree
  const handleRegenerate = () => {
    if (treeRef.current) {
      treeRef.current.regenerateTree();
    }
  };
  
  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      {/* Configured background component */}
      <MetricalTreeBackground
        ref={treeRef}
        colorScheme={{
          unstressedColor: '#B6A379', // Stanford gold
          normalColor: '#8D3C1E',     // Stanford clay
          stressedColor: '#8C1515',   // Stanford red
          backgroundColor: '#f5f5f5',
        }}
        tree={{
          maxDepth: 6,
          growthSpeed: 3,
          pulseEnabled: true,
        }}
        particles={{
          enabled: true,
          count: 25,
        }}
        animation={{
          autoRegenerate: true,
          regenerateTime: 40000, // 40 seconds
        }}
        showControls={false}
        onReady={() => console.log('Background ready')}
        onTreeGenerated={() => console.log('Tree generation complete')}
      />
      
      {/* Your content with custom controls */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px' }}>
        <h1>Your Content</h1>
        <p>This content will appear on top of the animated background.</p>
        <button onClick={handleRegenerate}>Generate New Tree</button>
      </div>
    </div>
  );
};

export default App;
```

### Demo Component

A demo component is included to showcase the capabilities of the MetricalTreeBackground component. You can use it as a reference for how to implement and configure the component.

```jsx
import React from 'react';
import MetricalTreeBackgroundDemo from './components/MetricalTreeBackground/Demo';

const DemoPage = () => {
  return <MetricalTreeBackgroundDemo />;
};

export default DemoPage;
```

## Props

### `colorScheme` (object)

Customize the colors used in the visualization.

```jsx
{
  unstressedColor: '#B6A379', // Color for unstressed nodes
  normalColor: '#8D3C1E',     // Color for normal nodes
  stressedColor: '#8C1515',   // Color for stressed nodes
  backgroundColor: '#f5f5f5', // Background color
  gridMajorLine: '#e2e8f0',   // Color for major grid lines
  gridMinorLine: '#edf2f7',   // Color for minor grid lines
  particleColors: ['#B6A379', '#8D3C1E', '#8C1515', '#5E3032'] // Colors for particles
}
```

### `animation` (object)

Control animation behavior.

```jsx
{
  active: true,           // Whether animation is active
  growthSpeed: 3,         // Speed of branch growth
  growthDelay: 80,        // Delay between branch generations
  regenerateTime: 40000,  // Time in ms before auto-regeneration
  boundaryCheck: true,    // Check if branches are within viewport
  autoRegenerate: true    // Whether to auto-regenerate the tree
}
```

### `tree` (object)

Configure tree appearance and behavior.

```jsx
{
  maxDepth: 6,                  // Maximum depth of the tree
  initialAngle: -Math.PI / 2,   // Initial angle (straight up)
  initialSpreadAngle: Math.PI / 5, // Initial spread angle
  lengthReductionFactor: 0.85,  // Length reduction per level
  widthReductionFactor: 0.75,   // Width reduction per level
  branchSpreadFactor: 0.65,     // How much branches fan out
  minBranchAngle: Math.PI / 12, // Minimum angle between branches
  maxBranchAngle: Math.PI / 6,  // Maximum angle between branches
  pulseEnabled: true,           // Enable pulsing effect
  pulseMinOpacity: 0.6,         // Minimum opacity for pulse
  pulseMaxOpacity: 1.0,         // Maximum opacity for pulse
  pulseDuration: 2000           // Duration of pulse in ms
}
```

### `grid` (object)

Configure grid appearance.

```jsx
{
  enabled: true,       // Whether to show the grid
  majorSpacing: 100,   // Spacing between major grid lines
  minorSpacing: 20     // Spacing between minor grid lines
}
```

### `particles` (object)

Configure particle system.

```jsx
{
  enabled: true,     // Whether to show particles
  count: 25,         // Number of particles
  maxSize: 3,        // Maximum particle size
  minSize: 1,        // Minimum particle size
  speed: 0.5,        // Particle movement speed
  opacityMin: 0.2,   // Minimum particle opacity
  opacityMax: 0.7    // Maximum particle opacity
}
```

### `responsive` (object)

Configure responsive behavior.

```jsx
{
  enabled: true,           // Whether to enable responsive behavior
  minScaleFactor: 0.5,     // Minimum scale factor
  maxScaleFactor: 2.0,     // Maximum scale factor
  mobileThreshold: 768,    // Width threshold for mobile devices
  mobileMaxDepth: 4,       // Maximum tree depth on mobile
  mobileParticleCount: 15  // Number of particles on mobile
}
```

### Other Props

- `showControls` (boolean): Whether to show built-in controls (default: `true`)
- `className` (string): Additional CSS class name for the root element
- `onReady` (function): Callback function called when the component is ready
- `onTreeGenerated` (function): Callback function called when tree generation is complete

## Methods

The component exposes the following methods via a ref:

- `regenerateTree()`: Regenerate the tree
- `pauseAnimation()`: Pause the animation
- `resumeAnimation()`: Resume the animation
- `setConfig(newConfig)`: Update the configuration

Example:

```jsx
const treeRef = useRef(null);

// Regenerate the tree
treeRef.current.regenerateTree();

// Pause animation
treeRef.current.pauseAnimation();

// Resume animation
treeRef.current.resumeAnimation();

// Update configuration
treeRef.current.setConfig({
  tree: { maxDepth: 8 },
  particles: { count: 30 }
});
```

## Performance Considerations

- The component uses `requestAnimationFrame` for smooth animations
- SVG elements are created and manipulated directly for better performance
- The tree depth is automatically reduced on mobile devices
- Animation is paused when the component is not visible
- Cleanup is performed on unmount to prevent memory leaks

## Browser Compatibility

The component uses standard SVG and JavaScript features that are supported in all modern browsers. It has been tested in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Credits

Developed for the Stanford Linguistics Suite to visualize metrical trees and stress patterns in phonology.
