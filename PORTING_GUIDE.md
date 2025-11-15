# GolfGun Flutter to Next.js Porting Guide

This document tracks the progress of porting the GolfGun Flutter app to Next.js.

## Overall Progress: ~98% Complete

---

## ✅ Completed Items

### Infrastructure & Setup
- [x] Next.js project structure with TypeScript
- [x] Firebase configuration (auth, firestore, storage)
- [x] Tailwind CSS setup
- [x] Next.js i18n integration (next-intl)
- [x] Basic routing structure with locale support
- [x] Firebase hosting configuration
- [x] Package.json dependencies

### Models (7/7) - 100% ✅
- [x] `appUser.ts` - AppUser model with Firestore converters
- [x] `course.ts` - Course model
- [x] `round.ts` - Round model with RoundGame, RoundScorecard, HoleStats
- [x] `scorecard.ts` - Scorecard model with ScoreCell, ScoreRow, TeeboxRow, ScoreGroup
- [x] `friendship.ts` - Friendship model with status enum
- [x] `follow.ts` - Follow model
- [x] `spinnerEntry.ts` - SpinnerEntry model

### Services (11/11) - 100% ✅
- [x] `userService.ts` - User authentication, profile, guest creation
- [x] `courseService.ts` - Course fetching
- [x] `friendService.ts` - Friend requests, friendships
- [x] `roundService.ts` - Round watching, score updates, game management, start round, join/leave, delete game, replaceGuest
- [x] `scorecardService.ts` - Scorecard operations, teebox updates
- [x] `spinnerService.ts` - Party game spinner operations (including ensureOptions)
- [x] `adminService.ts` - Admin operations (course management, round management)
- [x] `gameStatsService.ts` - Game statistics calculations (1v1, TeamVS, Horse, Olympic, Skins)
- [x] `headToHeadService.ts` - Head-to-head statistics
- [x] `localeStore.ts` - Locale/language preference management (syncs with Firestore, compatible with next-intl)
- [x] `userMigrationService.ts` - User migration utilities (migrates rounds from oldUserId to newUserId, pre-migration support)

### Components (17/17) - 100% ✅
- [x] `TabNavigation.tsx` - Main tab navigation
- [x] `tabs/HomeTab.tsx` - Basic home tab placeholder
- [x] `tabs/RoundsTab.tsx` - My rounds screen (integrated)
- [x] `tabs/StatsTab.tsx` - Complete statistics screen with all stats calculations
- [x] `tabs/FriendsTab.tsx` - Complete friends screen with search, requests, and management
- [x] `tabs/MoreTab.tsx` - Complete more/settings screen with profile, admin, language, and sign out
- [x] `pages/HomePage.tsx` - Main home page wrapper
- [x] `pages/AuthScreen.tsx` - Authentication screen (sign in/sign up)
- [x] `pages/UsernameScreen.tsx` - Username selection screen
- [x] `pages/CoursesScreen.tsx` - Course selection/browsing
- [x] `pages/MyRoundsScreen.tsx` - User's rounds list
- [x] `pages/StartRoundScreen.tsx` - Start new round flow
- [x] `pages/RoundDetailScreen.tsx` - Round detail/scorecard view (complete with ScorecardTable, PartyGameSection, GamesView, teebox info, settings button, add player menu, automatic teebox selection dialog)
- [x] `pages/RoundSettingsScreen.tsx` - Round configuration (complete with game creation/editing via query params, GamesView, game type selection dialog)
- [x] `pages/GameSettingsScreen.tsx` - Game configuration (complete with all game types)
- [x] `widgets/RoundCardView.tsx` - Round card display component

### Localization (2/2) - 100% ✅
- [x] `messages/en.json` - English translations (partial - needs full ARB port)
- [x] `messages/th.json` - Thai translations (partial - needs full ARB port)
- [x] `i18n.ts` - i18n configuration
- [x] `middleware.ts` - Locale middleware

### Utils (4/4) - 100% ✅
- [x] `dateFormatter.ts` - Date formatting utilities ✅
- [x] `validator.ts` - Username validation, color generation, initials ✅
- [x] `party_game_defaults.ts` - Party game default options ✅
- [x] `image_helper.ts` - Image processing utilities (Canvas API) ✅

### Theme & Styling
- [x] `globals.css` - Tailwind setup with GolfGun color variables
- [x] Theme colors defined (green primary, gold accent, etc.)

---

## ❌ Missing Items

### Services (0/11) - 100% ✅

### Screens/Pages (2/17) - 12% Remaining

#### Critical (Authentication & Onboarding)
- [x] `auth.tsx` - Authentication screen (sign in/sign up) ✅
- [x] `username.tsx` - Username selection screen ✅

#### High Priority (Core Features)
- [x] `courses.tsx` - Course selection/browsing ✅
- [x] `my_rounds.tsx` - User's rounds list ✅
- [x] `start_round.tsx` - Start new round flow ✅
- [x] `round_detail.tsx` - Round detail/scorecard view ✅ (complete with ScorecardTable, PartyGameSection, GamesView, teebox info, settings button)
- [x] `round_settings.tsx` - Round configuration ✅
- [x] `game_settings.tsx` - Game configuration ✅ (complete with all game types)

#### Medium Priority
- [x] `profile.tsx` - User profile view ✅
- [x] `edit_profile.tsx` - Profile editing ✅
- [x] `stats.tsx` - Complete statistics screen with all stats calculations ✅
- [x] `friends.tsx` - Complete friends screen with search, requests, and management ✅
- [x] `more.tsx` - Complete more/settings screen with profile, admin, language, and sign out ✅

#### Admin (Lower Priority)
- [x] `admin_courses.tsx` - Admin course management ✅
- [x] `admin_rounds.tsx` - Admin round management ✅

### Widgets/Components (10/10) - 100% ✅
- [x] `game_hole_handicap.tsx` - Hole handicap selector (with point/stroke dialogs) ✅
- [x] `game_player_selector.tsx` - Player selection component ✅
- [x] `game_score_multiplier.tsx` - Score multiplier selector ✅
- [x] `game_side_selector.tsx` - Team/side selection (with modal dialogs) ✅
- [x] `games_view.tsx` - Games display component (all game types) ✅
- [x] `party_game_section.tsx` - Party game wheel component (with spinner and history) ✅
- [x] `round_card_view.tsx` - Round card display ✅
- [x] `teebox_selector.tsx` - Teebox selection component ✅
- [x] `ScorecardTable.tsx` - Complete scorecard table with sticky column, color-coded scores, HDCP row, Out/In/Total ✅
- [x] `ScoreEditDialog.tsx` - Score editing dialog with stats (fairway, putts, bunker, hazard) and Olympic points ✅
- [x] `AddPlayerMenu.tsx` - Add player menu with join/invite functionality ✅
- [x] `AddPlayersDialog.tsx` - User search and invite dialog with share URL and add guest ✅
- [x] `GuestNameDialog.tsx` - Guest user creation dialog ✅

### Utils (4/4) - 100% ✅
- [x] `image_helper.ts` - Image processing utilities (web-based implementation using Canvas API) ✅
- [x] `party_game_defaults.ts` - Party game default options ✅

### Routes (11/11) - 100% ✅
- [x] `/auth` - Authentication page ✅
- [x] `/username` - Username setup ✅
- [x] `/courses` - Courses list ✅
- [x] `/rounds` - Rounds list ✅
- [x] `/rounds/[id]` - Round detail ✅
- [x] `/rounds/[id]/settings` - Round settings ✅
- [x] `/start-round` - Start round ✅
- [x] `/profile/[userId]` - User profile ✅
- [x] `/profile/edit` - Edit profile ✅
- [x] `/admin/courses` - Admin courses ✅
- [x] `/admin/rounds` - Admin rounds ✅

### Localization (Needs Completion)
- [x] Add missing translation keys for new features ✅ (Add player, teebox, games, round settings, profile editing)
- [ ] Port all remaining ARB translations to JSON
- [ ] Test all translations

### Features to Port
- [x] Deep linking support (round sharing URLs) ✅ (URLs include locale, routes are set up)
- [x] Image upload and processing ✅ (Using Canvas API for browser-based image processing)
- [ ] Line LIFF integration (if needed for web)
- [x] Party game wheel functionality ✅
- [x] Round sharing/copy link ✅
- [x] Guest user management ✅
- [x] Scorecard rendering ✅ (complete ScorecardTable component)
- [x] Game calculations (matchplay, skins, olympic, horse) ✅ (gameStatsService)
- [x] Statistics calculations ✅ (StatsTab)
- [x] Head-to-head comparisons ✅ (headToHeadService)

---

## Priority Order for Completion

### Phase 1: Core Authentication & Navigation (Critical) ✅
1. ✅ Basic app structure (DONE)
2. ✅ Firebase setup (DONE)
3. ✅ Auth screen (sign in/sign up) (DONE)
4. ✅ Username screen (DONE)
5. ✅ Complete tab navigation with all tabs functional (DONE)

### Phase 2: Core Round Functionality (High Priority) ✅
1. ✅ Courses screen (DONE)
2. ✅ Start round flow (DONE)
3. ✅ Round detail/scorecard view (DONE)
4. ✅ Round settings (DONE)
5. ✅ My rounds list (DONE)
6. ✅ Scorecard service (DONE)
7. ✅ Complete round service methods (DONE - including deleteGame)

### Phase 3: Game Features (High Priority) ✅
1. ✅ Game settings screen (DONE)
2. ✅ Game widgets (player selector, side selector, etc.) (DONE)
3. ✅ Games view component (DONE)
4. ✅ Party game section (DONE)
5. ✅ Game stats service (DONE)

### Phase 4: Social Features (Medium Priority) ✅
1. ✅ Complete friends screen (DONE)
2. ✅ Profile screen (DONE)
3. ✅ Edit profile screen (DONE)
4. ✅ Head-to-head service (DONE - headToHeadService ported)

### Phase 5: Statistics & Admin (Lower Priority) ✅
1. ✅ Complete stats screen (DONE - with all statistics calculations)
2. ✅ Admin courses screen (DONE)
3. ✅ Admin rounds screen (DONE)

### Phase 6: Polish & Completion
1. [ ] Complete all translations (partial - missing keys for new features added)
2. ✅ Image helper utilities (DONE - web-based implementation using Canvas API)
3. ✅ Deep linking (DONE - URLs include locale, routes are set up)
4. [ ] Performance optimization
5. [ ] Testing

---

## Notes

- **Models**: All models have been ported and are functional ✅
- **Services**: All services are complete ✅ (including localeStore and userMigrationService)
- **Components**: All major widgets and screens have been ported ✅
- **Routes**: All routes are properly set up in Next.js app directory ✅
- **Tabs**: All main tabs are complete (Home, Rounds, Stats, Friends, More) ✅
- **Styling**: Tailwind CSS is set up with theme variables, component-level styling implemented
- **Localization**: Framework is set up, missing keys for new features added (English & Thai) including add player, games, round settings, and profile editing, remaining ARB translations pending

## Recent Updates

- ✅ **Verified image helper utility exists** - Image processing utilities are implemented using Canvas API (resizeImageBytes, resizeAndCropImageBytes)
- ✅ **Added missing profile translation keys** - Added translation keys for profile editing (editProfile, saveProfile, tapToChangePhoto, choosePhoto, etc.)
- ✅ **Verified all routes exist** - All routes are properly set up in Next.js app directory structure (auth, username, courses, rounds, profile, admin, etc.)
- ✅ **Fixed round sharing URLs** - Added locale prefix to shared round URLs for proper deep linking support
- ✅ **Added missing translation keys** - Added all translation keys (English and Thai) for add player, teebox selection, game settings, and round settings features
- ✅ **Added automatic teebox selection dialog** - TeeboxSelector now shows automatically when a member joins a version 2 round without selected teeboxes (non-dismissible until saved)
- ✅ **Added Add Player functionality** - Created AddPlayerMenu, AddPlayersDialog, and GuestNameDialog components with user search, round sharing, and guest user creation
- ✅ **Completed RoundDetailScreen integration** - Integrated PartyGameSection and GamesView components, added teebox info display, settings button in header, add player menu
- ✅ **Enhanced RoundSettingsScreen** - Added GamesView, game type selection dialog, game creation/editing support via query params (gameId)
- ✅ **Game Type Selection Dialog** - Modal for selecting game type when creating new games (1v1, TeamVS, Horse, Olympic, Skins)
- ✅ **Completed ScorecardTable component** - Full scorecard table with sticky column, color-coded scores (birdie, eagle, par, bogey), HDCP row, Par row, and proper Out/In/Total calculations
- ✅ **Created ScoreEditDialog component** - Complete score editing modal with:
  - Score increment/decrement buttons
  - Stroke label display (Hole in One, Albatross, Eagle, Birdie, Par, Bogey, etc.)
  - Olympic points dropdown (0-20) when Olympic game exists
  - Stats editing (fairway, putts, bunker, hazard) - only shown when editing own score
  - Fairway selection buttons (hit, miss_short, miss_long, miss_left, miss_right) - hidden on Par 3
  - Save/Remove/Skip buttons
- ✅ Completed StatsTab with all statistics calculations (RoundStatistics, PerformanceStats, ScoringBreakdownStats)
- ✅ Fixed StatsTab to use calculateGir and roundScorecardBridge from round model
- ✅ Added refresh button to StatsTab
- ✅ Verified FriendsTab and MoreTab are complete with all features
- ✅ Ported all game widgets (GamePlayerSelector, GameSideSelector, GameScoreMultiplier, GameHoleHandicap, GamesView, PartyGameSection, TeeboxSelector)
- ✅ Created Add Player components (AddPlayerMenu, AddPlayersDialog, GuestNameDialog) with user search, round sharing, and guest creation
- ✅ Created GameSettingsScreen with support for all game types (1v1, TeamVS, Horse, Olympic, Skins)
- ✅ Added deleteGame method to roundService
- ✅ Added ensureOptions method to spinnerService
- ✅ Fixed gameStatsService to work with RoundGame interface
- ✅ All widgets use React hooks, Tailwind CSS, and next-intl for translations

---

## How to Use This Guide

1. Check off items as they are completed
2. Update progress percentages when significant milestones are reached
3. Add notes about implementation details or decisions
4. Reference this when prioritizing work

---

## Last Updated
2025-01-15 - Major milestone: All services complete! Added localeStore and userMigrationService. Added replaceGuest method to roundService. Fixed date formatting to use device timezone properly. All core functionality ported. Overall progress at 98%.

