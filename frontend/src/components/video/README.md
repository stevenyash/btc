# SmartVideoPlayer - Refactored Architecture

## Overview

The SmartVideoPlayer component has been refactored into a modular, maintainable architecture using Vue 3 Composition API best practices.

## Architecture Improvements

### 1. **Composables** (Separation of Concerns)

The business logic has been extracted into reusable composables:

#### `useVideoSession.js`
- Manages session state and expiration
- Handles session monitoring and warnings
- Provides session refresh functionality
- **Benefits**: Isolated session logic, easier testing, reusable across components

#### `useConnectionQuality.js`
- Monitors network connection quality
- Provides real-time connection status
- Supports both Network Information API and fallback testing
- **Benefits**: Automatic quality adaptation, better user experience on slow connections

#### `useVideoQuality.js`
- Manages video quality selection
- Handles quality switching with playback continuity
- Auto-selects quality based on connection
- **Benefits**: Smooth quality transitions, intelligent quality selection

#### `useVideoStream.js`
- Fetches video URLs from API
- Handles loading states and errors
- Manages video data structure
- **Benefits**: Centralized API logic, consistent error handling

### 2. **Component Decomposition**

The monolithic component has been split into focused, single-responsibility components:

```
SmartVideoPlayer.vue (Main orchestrator)
├── SessionWarning.vue (Session expiry countdown)
├── SessionExpired.vue (Expired session UI)
├── ConnectionIndicator.vue (Network status display)
├── QualitySelector.vue (Quality selection menu)
├── RefreshConfirmDialog.vue (Session refresh confirmation)
├── LoadingOverlay.vue (Loading state)
├── ErrorState.vue (Error display with actions)
├── LessonInfo.vue (Lesson metadata display)
└── UsageStats.vue (Usage statistics display)
```

**Benefits**:
- Each component has a single responsibility
- Easier to test individual components
- Better code reusability
- Improved maintainability

### 3. **Performance Optimizations**

- **Computed Properties**: Expensive calculations are memoized
- **Event Debouncing**: Connection checks run at optimal intervals
- **Lazy Loading**: Components load only when needed
- **CSS Containment**: `contain: layout style paint` for better rendering
- **Transform Optimization**: `translate3d` for GPU acceleration

### 4. **Code Quality Improvements**

#### Before:
- 800+ lines in single file
- Mixed concerns (UI, business logic, API calls)
- Difficult to test
- Hard to maintain

#### After:
- Main component: ~400 lines
- 4 composables: ~150 lines each
- 9 focused UI components: ~50 lines each
- Clear separation of concerns
- Easy to test and maintain

## Usage

### Basic Usage

```vue
<template>
  <SmartVideoPlayer
    :lesson-id="123"
    :user-id="userId"
    :autoplay="true"
    @play="handlePlay"
    @ended="handleEnded"
  />
</template>

<script setup>
import SmartVideoPlayer from '@/components/SmartVideoPlayer.vue';

function handlePlay() {
  console.log('Video started playing');
}

function handleEnded() {
  console.log('Video ended');
}
</script>
```

### Advanced Usage with Refs

```vue
<template>
  <SmartVideoPlayer
    ref="videoPlayer"
    :lesson-id="lessonId"
    :user-id="userId"
    :security-enabled="true"
    :show-lesson-info="true"
    @session-expired="handleSessionExpired"
  />
</template>

<script setup>
import { ref } from 'vue';
import SmartVideoPlayer from '@/components/SmartVideoPlayer.vue';

const videoPlayer = ref(null);

function handleSessionExpired() {
  // Handle session expiration
  videoPlayer.value.refreshSession();
}

function getCurrentPlaybackTime() {
  return videoPlayer.value.getCurrentTime();
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lessonId` | String/Number | required | Lesson ID to load |
| `userId` | String/Number | null | User ID for authentication |
| `userPhone` | String | null | Phone for guest access |
| `isGuest` | Boolean | false | Guest mode flag |
| `autoplay` | Boolean | false | Auto-play video |
| `securityEnabled` | Boolean | true | Enable download prevention |
| `showLessonInfo` | Boolean | true | Show lesson information |
| `showStats` | Boolean | true | Show usage statistics |
| `lessonData` | Object | null | Pre-loaded lesson data |
| `thumbnailUrl` | String | '' | Video thumbnail URL |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `play` | - | Video started playing |
| `pause` | - | Video paused |
| `ended` | - | Video playback ended |
| `error` | Error | Playback error occurred |
| `timeupdate` | { currentTime } | Playback time updated |
| `loaded` | VideoData | Video loaded successfully |
| `session-expired` | - | Session expired |
| `session-refreshed` | - | Session refreshed |
| `balance-updated` | { newBalance } | Lesson balance updated |
| `buffering` | - | Video buffering started |
| `buffering-end` | - | Video buffering ended |

## Exposed Methods

```javascript
// Playback control
videoPlayer.value.play()
videoPlayer.value.pause()
videoPlayer.value.seekTo(time)
videoPlayer.value.toggleFullscreen()

// Session management
videoPlayer.value.refreshSession()
videoPlayer.value.retryVideoLoad()

// State getters
videoPlayer.value.getCurrentTime()
videoPlayer.value.getDuration()
videoPlayer.value.getIsPlaying()
videoPlayer.value.getVideoData()
videoPlayer.value.getSessionStatus()
videoPlayer.value.getConnectionQuality()
videoPlayer.value.getCurrentQuality()
```

## Testing

### Testing Composables

```javascript
import { useVideoSession } from '@/composables/useVideoSession';

describe('useVideoSession', () => {
  it('should handle session expiration', () => {
    const { sessionExpired, handleSessionExpired } = useVideoSession();

    handleSessionExpired();

    expect(sessionExpired.value).toBe(true);
  });
});
```

### Testing Components

```javascript
import { mount } from '@vue/test-utils';
import SessionWarning from '@/components/video/SessionWarning.vue';

describe('SessionWarning', () => {
  it('should display countdown timer', () => {
    const wrapper = mount(SessionWarning, {
      props: { sessionTimeRemaining: 5 }
    });

    expect(wrapper.find('.session-warning').exists()).toBe(true);
  });
});
```

## Migration Guide

### From Old Component

```vue
<!-- Old -->
<SmartVideoPlayer
  :lesson-id="123"
  :user-id="userId"
/>
```

### To New Component

```vue
<!-- New - Same API, better internals -->
<SmartVideoPlayer
  :lesson-id="123"
  :user-id="userId"
/>
```

**No breaking changes!** The public API remains the same.

## Benefits Summary

### For Developers
- ✅ Easier to understand and modify
- ✅ Better code organization
- ✅ Reusable composables
- ✅ Easier to test
- ✅ Better TypeScript support potential

### For Users
- ✅ Better performance
- ✅ Smoother quality transitions
- ✅ Better error handling
- ✅ Improved connection handling
- ✅ More responsive UI

### For Maintenance
- ✅ Smaller, focused files
- ✅ Clear separation of concerns
- ✅ Easier to debug
- ✅ Easier to extend
- ✅ Better documentation

## Future Enhancements

1. **TypeScript Migration**: Add full TypeScript support
2. **Unit Tests**: Add comprehensive test coverage
3. **Accessibility**: Enhance ARIA labels and keyboard navigation
4. **Analytics**: Add detailed playback analytics
5. **Offline Support**: Add service worker for offline playback
6. **Picture-in-Picture**: Add PiP mode support
7. **Chromecast**: Add casting support

## Contributing

When adding new features:
1. Keep components small and focused
2. Extract reusable logic into composables
3. Add proper TypeScript types
4. Write unit tests
5. Update documentation

## License

Same as parent project.
