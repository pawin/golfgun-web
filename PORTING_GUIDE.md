# GolfGun Flutter to Next.js Porting Guide

This document tracks the progress of porting the GolfGun Flutter app to Next.js.

## Overall Progress: ~80% Complete

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

### Services (9/11) - 82% ✅
- [x] `userService.ts` - User authentication, profile, guest creation
- [x] `courseService.ts` - Course fetching
- [x] `friendService.ts` - Friend requests, friendships
- [x] `roundService.ts` - Round watching, score updates, game management, start round, join/leave, delete game
- [x] `scorecardService.ts` - Scorecard operations, teebox updates
- [x] `spinnerService.ts` - Party game spinner operations (including ensureOptions)
- [x] `adminService.ts` - Admin operations (course management, round management)
- [x] `gameStatsService.ts` - Game statistics calculations (1v1, TeamVS, Horse, Olympic, Skins)
- [x] `headToHeadService.ts` - Head-to-head statistics

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
- [x] `pages/RoundDetailScreen.tsx` - Round detail/scorecard view (complete with ScorecardTable)
- [x] `pages/RoundSettingsScreen.tsx` - Round configuration
- [x] `pages/GameSettingsScreen.tsx` - Game configuration (complete with all game types)
- [x] `widgets/RoundCardView.tsx` - Round card display component

### Localization (2/2) - 100% ✅
- [x] `messages/en.json` - English translations (partial - needs full ARB port)
- [x] `messages/th.json` - Thai translations (partial - needs full ARB port)
- [x] `i18n.ts` - i18n configuration
- [x] `middleware.ts` - Locale middleware

### Utils (3/4) - 75% ✅
- [x] `dateFormatter.ts` - Date formatting utilities
- [x] `validator.ts` - Username validation, color generation, initials
- [x] `party_game_defaults.ts` - Party game default options

### Theme & Styling
- [x] `globals.css` - Tailwind setup with GolfGun color variables
- [x] Theme colors defined (green primary, gold accent, etc.)

---

## ❌ Missing Items

### Services (2/11) - 18% Remaining

#### Low Priority
- [ ] `localeStore.ts` - Locale management (may use different approach with next-intl)
- [ ] `userMigrationService.ts` - User migration utilities

### Screens/Pages (2/17) - 12% Remaining

#### Critical (Authentication & Onboarding)
- [x] `auth.tsx` - Authentication screen (sign in/sign up) ✅
- [x] `username.tsx` - Username selection screen ✅

#### High Priority (Core Features)
- [x] `courses.tsx` - Course selection/browsing ✅
- [x] `my_rounds.tsx` - User's rounds list ✅
- [x] `start_round.tsx` - Start new round flow ✅
- [x] `round_detail.tsx` - Round detail/scorecard view ✅ (complete with full ScorecardTable)
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

### Utils (3/4) - 75% Remaining
- [ ] `image_helper.ts` - Image processing utilities (web-based implementation needed)
- [x] `party_game_defaults.ts` - Party game default options ✅

### Routes (Missing)
- [ ] `/auth` - Authentication page
- [ ] `/username` - Username setup
- [ ] `/courses` - Courses list
- [ ] `/rounds` - Rounds list
- [ ] `/rounds/[id]` - Round detail
- [ ] `/rounds/[id]/settings` - Round settings
- [ ] `/rounds/start` - Start round
- [ ] `/profile/[userId]` - User profile
- [ ] `/profile/edit` - Edit profile
- [ ] `/admin/courses` - Admin courses
- [ ] `/admin/rounds` - Admin rounds

### Localization (Needs Completion)
- [ ] Port all remaining ARB translations to JSON
- [ ] Add missing translation keys from Flutter app
- [ ] Test all translations

### Features to Port
- [ ] Deep linking support (round sharing URLs)
- [ ] Image upload and processing
- [ ] Line LIFF integration (if needed for web)
- [x] Party game wheel functionality ✅
- [ ] Round sharing/copy link
- [ ] Guest user management
- [x] Scorecard rendering ✅ (complete ScorecardTable component)
- [x] Game calculations (matchplay, skins, olympic, horse) ✅ (gameStatsService)
- [x] Statistics calculations ✅ (StatsTab)
- [x] Head-to-head comparisons ✅ (headToHeadService)

---

## Priority Order for Completion

### Phase 1: Core Authentication & Navigation (Critical)
1. ✅ Basic app structure (DONE)
2. ✅ Firebase setup (DONE)
3. [ ] Auth screen (sign in/sign up)
4. [ ] Username screen
5. [ ] Complete tab navigation with all tabs functional

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
1. [ ] Complete all translations
2. [ ] Image helper utilities (web-based implementation needed)
3. [ ] Deep linking
4. [ ] Performance optimization
5. [ ] Testing

---

## Notes

- **Models**: All models have been ported and are functional ✅
- **Services**: Most services are complete - only localeStore and userMigrationService remain (low priority)
- **Components**: All major widgets and screens have been ported ✅
- **Tabs**: All main tabs are complete (Home, Rounds, Stats, Friends, More) ✅
- **Styling**: Tailwind CSS is set up with theme variables, component-level styling implemented
- **Localization**: Framework is set up, but needs complete ARB file port

## Recent Updates

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
2025-01-15 - Major milestone: ScorecardTable and ScoreEditDialog completed! Full scorecard rendering with color-coded scores, stats editing, and Olympic points support. Overall progress at 80%, Components at 100%, Widgets at 100%.

