# Refactoring Inline CSS to Dedicated Files

## Goal
The goal is to remove all inline CSS (`style={{...}}`) from React components and move them into dedicated CSS files. Each component should have its own corresponding CSS file.

## User Review Required
> [!NOTE] 
> This is a purely structural refactoring. No visual changes are intended, but minor regressions are possible if specificity changes.

## Proposed Changes

### Phase 1: Create Missing CSS Files and Refactor
These components currently lack a dedicated CSS file or need one created.

#### [NEW] [Refactor TrackItem](file:///Users/srikarakkina/Desktop/musicWebApp/musicApp/src/components/TrackItem.jsx)
- Create `src/styles/TrackItem.css`.
- Move inline styles (add button positioning, colors) to CSS classes.
- Import CSS in `TrackItem.jsx`.

#### [NEW] [Refactor Callback](file:///Users/srikarakkina/Desktop/musicWebApp/musicApp/src/components/Callback.jsx)
- Create `src/styles/Callback.css`.
- Move error container and loading container styles to CSS.
- Import CSS in `Callback.jsx`.

#### [NEW] [Refactor YouTube Components](file:///Users/srikarakkina/Desktop/musicWebApp/musicApp/src/components/youtube)
- Create `src/styles/YouTubeCard.css` and `src/styles/YouTubeFilters.css`.
- Refactor `YouTubeCard.jsx` and `YouTubeFilters.jsx` to use these files.

### Phase 2: Refactor Existing Components
These components already have CSS files but contain inline styles that need extraction.

#### [MODIFY] [Dashboard](file:///Users/srikarakkina/Desktop/musicWebApp/musicApp/src/components/Dashboard.jsx)
- Extract inline styles for "Searching...", floating sidebar button, and layout containers to `Dashboard.css`.

#### [MODIFY] [PlaylistView](file:///Users/srikarakkina/Desktop/musicWebApp/musicApp/src/components/PlaylistView.jsx)
- Extract remaining inline styles (headers, sort menu positioning) to `PlaylistView.css`.

#### [MODIFY] [Sidebar](file:///Users/srikarakkina/Desktop/musicWebApp/musicApp/src/components/Sidebar.jsx) & [TopBar](file:///Users/srikarakkina/Desktop/musicWebApp/musicApp/src/components/TopBar.jsx)
- Move any layout or positioning inline styles to `Sidebar.css` and `TopBar.css`.

#### [MODIFY] [Video/Player Components](file:///Users/srikarakkina/Desktop/musicWebApp/musicApp/src/components)
- Check and clean `PlayerBar.jsx`, `FullPlayer.jsx`, `YouTubeView.jsx` and others.

## Verification Plan

### Manual Verification
- **Visual Inspection**: Run the app (`npm run dev`) and click through all views (Home, Playlist, YouTube, Stats, Zen Mode) to ensure layout remains identical.
- **Specific Checks**:
    - **TrackItem**: Hover over "Add to playlist" button, check "Watch on YouTube" icon alignment.
    - **Callback**: Cannot easily trigger without auth flow, but code is simple enough to verify by inspection.
    - **Dashboard**: Check floating sidebar button visibility when sidebar is closed.
    - **YouTube**: Check filter chips and video card layout.
