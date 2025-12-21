# Fitness Workout Generator - Design Guidelines

## Architecture Decisions

### Authentication
**No Auth Required** (local-first utility app)
- Data stored locally
- Include profile/settings screen with:
  - User-customizable avatar (1 cinematic fitness-themed preset avatar)
  - Display name field
  - App preferences (theme, measurement units, experience level)

### Navigation
**Tab Navigation** (3 tabs with centered core action)
- **Discover** (left tab): Browse pre-made workouts and muscle group library
- **Generate** (center tab): Core action - create custom workout
- **Profile** (right tab): User stats, settings, saved workouts

### Screen Specifications

#### 1. Discover Screen
- **Purpose**: Browse workout templates and explore muscle groups
- **Layout**:
  - Transparent header with search bar (right icon)
  - Scrollable main content with hero section featuring parallax effect
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - Hero carousel with cinematic muscle group visualizations (parallax on scroll)
  - "Popular Workouts" section with horizontal scroll cards
  - "Muscle Groups" grid with interactive 3D muscle images from API
  - Each card uses subtle scale animation on press (0.98)

#### 2. Generate Workout Screen
- **Purpose**: Create personalized workout with muscle group selection
- **Layout**:
  - Custom header with "Generate Workout" title (oversized typography)
  - Scrollable form with floating submit button
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl + 80 (floating button height)
- **Components**:
  - Muscle group selector (interactive body diagram from API - getDualColorImage)
  - Equipment multi-select chips with smooth expand/collapse
  - Experience level slider with haptic feedback
  - Description text area
  - Floating "Generate" button with drop shadow specs:
    - shadowOffset: {width: 0, height: 2}
    - shadowOpacity: 0.10
    - shadowRadius: 2
- **Interactions**:
  - Muscle groups highlight on body diagram with color fade transition
  - Selected chips scale and glow subtly
  - Form fields use smooth slide-up keyboard with animated label movement

#### 3. Workout Detail Screen (Modal)
- **Purpose**: Display generated workout with exercises and muscle visualization
- **Layout**:
  - Custom header with close button (left) and save button (right)
  - Scrollable content with sticky muscle group visualization
  - Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl
- **Components**:
  - Parallax hero section with dual-color muscle diagram
  - Exercise cards with smooth stagger animation on load
  - Each exercise shows: name, sets, reps, rest time
  - Progress indicator at bottom during generation
- **Transitions**:
  - Modal slides up with spring animation
  - Muscle diagram fades in with subtle zoom (1.05 to 1.0)

#### 4. Profile Screen
- **Purpose**: User settings, stats, and saved workouts
- **Layout**:
  - Transparent header
  - Scrollable content
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - User avatar with customization button
  - Stats cards (workouts completed, favorite muscle groups)
  - Settings list with clean dividers
  - Saved workouts horizontal carousel

## Design System

### Color Palette
- **Primary**: Deep cinematic blue-black (#0A0E1A)
- **Accent**: Electric gradient (Coral #FF6B6B to Orange #FFB347)
- **Surface**: Dark elevated cards (#1A1F2E)
- **Text Primary**: Off-white (#F5F5F7)
- **Text Secondary**: Muted gray (#8E8E93)
- **Success**: Vibrant green (#34C759)
- **Muscle Highlight**: Dynamic from API (HSL format for smooth transitions)

### Typography
- **Font Family**: Pluvix Luxury (display), SF Pro (system fallback)
- **Display**: 48-72pt, weight 700, tight letter-spacing (-0.02em)
- **Heading 1**: 32pt, weight 600
- **Heading 2**: 24pt, weight 600
- **Body**: 16pt, weight 400, line-height 1.5
- **Caption**: 13pt, weight 500, uppercase tracking (0.05em)

### Spacing Scale
- xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48

### Visual Design Principles
- **Cinematic Depth**: Use subtle gradients and layering for depth
- **Parallax Effects**: Hero sections scroll at 0.5x speed of content
- **Smooth Transitions**: All animations use spring physics (damping: 0.8, stiffness: 100)
- **Interactive Feedback**: 
  - Touchables scale to 0.98 on press
  - Haptic feedback on muscle group selection and workout generation
  - Glow effects on active states (outer glow with accent color, opacity 0.3)
- **Glass Morphism**: Cards use subtle backdrop blur with border glow
- **No drop shadows** except floating action buttons (exact specs above)

### Component Specifications
- **Muscle Group Card**: 
  - Background: Surface color with 1px accent border
  - Image: Full-width with 16:9 aspect ratio
  - Label: Overlay at bottom with gradient backdrop
  - Press: Scale 0.98, border glow intensifies
  
- **Exercise Card**:
  - Horizontal layout with exercise name (Heading 2) on left
  - Sets/reps on right in monospace font
  - Separator line (1px, 0.1 opacity)
  
- **Floating Action Button**:
  - Height: 56px
  - Full-width minus 2xl padding
  - Gradient background (accent colors)
  - Bold text (17pt, weight 600)
  - Mandatory shadow (see specs above)

### Critical Assets
1. **User Avatar Preset**: Minimalist geometric fitness silhouette (1 option, high-contrast on dark background)
2. **Muscle Group Visualizations**: Fetched from API endpoints (getDualColorImage, getIndividualColorImage)
3. **Tab Bar Icons**: Use Feather icons - search, zap (generate), user
4. **Empty States**: Simple line illustrations for "No saved workouts" (don't generate, use system icons)

### Accessibility
- Minimum touch target: 44x44pt
- Color contrast ratio: 4.5:1 for body text, 3:1 for large text
- Muscle group images support VoiceOver descriptions
- Haptic feedback enhances non-visual interaction cues
- Dynamic Type support for all text elements