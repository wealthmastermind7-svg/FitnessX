# Fitness Workout Generator - Design Guidelines

## Brand Identity
**Premium Fitness Companion** - A luxurious, iOS 26-inspired workout app that feels like a high-end fitness studio in your pocket. The defining aesthetic is **liquid glass** - frosted surfaces, subtle blurs, and premium purple gradients that catch light. Think Apple Fitness+ meets high-end spa.

**Memorable Element**: Frosted glass cards that appear to float above a deep gradient background, with muscle group visualizations emerging through translucent surfaces.

## Navigation Architecture
**Tab Navigation** (3 tabs, centered core action)
- **Discover** (left): Browse exercises and muscle groups with premium glass cards
- **Generate** (center): Core action - AI workout creation
- **Profile** (right): Stats, settings, saved workouts

## Screen-by-Screen Specifications

### 1. Discover Screen (Exercise Browser)
**Purpose**: Explore exercises and muscle groups with premium visual hierarchy

**Layout**:
- Transparent header with frosted glass search bar (right icon: magnifying glass)
- Scrollable main content
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- **Hero Section**: Full-width frosted glass card with purple gradient overlay
  - Featured workout of the day with large typography
  - Parallax scroll effect (0.6x speed)
  - Blur intensity: 20px backdrop filter
- **Muscle Groups Grid**: 2-column layout with glass cards
  - Each card: frosted glass background, 1px white border (0.15 opacity)
  - Dual-color muscle image from API (getDualColorImage)
  - Gradient overlay (purple to transparent, top to bottom)
  - Label in Display font, white text with subtle shadow
  - Press feedback: scale 0.97, glow effect (purple, opacity 0.4)
- **Exercise Categories**: Horizontal scroll chips with glass morphism
  - Active state: full purple gradient fill
  - Inactive: frosted glass with purple border
- **Exercise Cards**: Staggered grid layout (Pinterest-style)
  - Glass background with variable blur
  - Exercise image with gradient mask
  - Exercise name, sets/reps in premium typography
  - Smooth stagger animation on scroll (50ms delay per card)

### 2. Generate Workout Screen
**Purpose**: Create custom AI workouts with muscle selection

**Layout**:
- Custom header with oversized "Generate" title in Display font
- Scrollable form
- Floating gradient button at bottom
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl + 80

**Components**:
- Interactive body diagram (API: getDualColorImage) with frosted selection overlay
- Equipment multi-select glass chips
- Experience slider with gradient track (purple gradient)
- Floating "Generate Workout" button:
  - Purple gradient background (#9D4EDD to #5A189A)
  - Height: 56px, full-width minus xxl padding
  - Shadow: offset {0, 2}, opacity 0.10, radius 2
  - White bold text (17pt, weight 600)

### 3. Workout Detail Screen (Modal)
**Purpose**: Display generated workout with exercise list

**Layout**:
- Modal presentation with spring animation
- Custom header: close (left), save (right) in frosted glass bar
- Scrollable content
- Top inset: insets.top + Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl

**Components**:
- Sticky muscle diagram hero with dual-color API visualization
- Exercise cards with glass background, stagger animation (100ms intervals)
- Progress shimmer during AI generation (gradient sweeps)

### 4. Profile Screen
**Purpose**: User preferences and workout history

**Layout**:
- Transparent header
- Scrollable content
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- User avatar with edit button (frosted circle)
- Stats cards (glass morphism) showing workout count, streaks
- Settings list with glass dividers
- Saved workouts carousel with glass cards

**Profile Settings**:
- Display name field
- Avatar customization
- Measurement units toggle
- Experience level selector
- Theme preference (light/dark)

## Color Palette
- **Background Gradient**: Deep navy (#0D0221) to dark purple (#1A0B2E)
- **Primary Purple**: #9D4EDD (vibrant accent)
- **Deep Purple**: #5A189A (rich depth)
- **Glass Surface**: White 0.08 opacity with 20px blur
- **Glass Border**: White 0.15 opacity, 1px
- **Text Primary**: White (#FFFFFF)
- **Text Secondary**: White 0.6 opacity
- **Success**: Mint green (#7FFFD4)
- **Muscle Highlight**: Dynamic from API (HSL transitions)

## Typography
- **Display Font**: SF Pro Display, 48-64pt, weight 700, tight tracking (-0.02em) - hero titles, featured content
- **Heading 1**: SF Pro Display, 32pt, weight 600 - screen titles
- **Heading 2**: SF Pro Display, 24pt, weight 600 - card titles
- **Body**: SF Pro Text, 16pt, weight 400, line-height 1.5
- **Caption**: SF Pro Text, 13pt, weight 500, uppercase, tracking 0.05em

## Visual Design Principles
**Liquid Glass Aesthetic**:
- Frosted glass cards with backdrop blur (20px) and white borders (0.15 opacity)
- Purple gradient overlays for depth and premium feel
- Subtle glow effects on interactive elements (purple, 0.4 opacity)
- No hard drop shadows except floating buttons (specs above)

**Animations**:
- Spring physics: damping 0.8, stiffness 100
- Press feedback: scale to 0.97 for all touchables
- Parallax hero: 0.6x scroll speed
- Stagger animations: 50-100ms delays between elements
- Haptic feedback on muscle selection, workout generation

**Layering**:
- Deep gradient background (base layer)
- Frosted glass cards (mid layer with blur)
- Content with gradient masks (top layer)

## Assets to Generate
1. **icon.png** - App icon with purple gradient and abstract muscle silhouette
   - WHERE USED: Device home screen
2. **splash-icon.png** - Simplified gradient orb with glow
   - WHERE USED: Launch screen
3. **profile-avatar-preset.png** - Minimalist geometric fitness figure, white on transparent
   - WHERE USED: Default user avatar in Profile screen
4. **empty-saved-workouts.png** - Simple line illustration of dumbbell, purple gradient accent
   - WHERE USED: Profile screen when no saved workouts exist

**API Assets** (not generated, fetched):
- Muscle group visualizations via getDualColorImage, getIndividualColorImage
- WHERE USED: Discover grid, Generate screen, Workout Detail hero

## Accessibility
- Minimum touch target: 44x44pt
- Glass surfaces maintain 4.5:1 contrast for text
- VoiceOver labels for muscle diagrams
- Haptic feedback reinforces visual interactions
- Dynamic Type support for all text