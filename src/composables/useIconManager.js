// 图标管理和预加载 composable
import { ref, onMounted } from 'vue';

// 加密工具函数
const encryptData = (data, key) => {
  // 简化的加密实现，实际项目中应使用更安全的算法
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const decryptData = (encryptedData, key) => {
  // 简化的解密实现
  const data = atob(encryptedData);
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};

// 生成加密密钥
const generateKey = () => {
  const key = localStorage.getItem('iconCacheKey');
  if (key) {
    return key;
  }
  const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('iconCacheKey', newKey);
  return newKey;
};

// 图标文件列表
const iconFiles = [
  'activity.svg', 'add-bookmark.svg', 'add-folder.svg', 'add-tag.svg', 'add-to-cloud.svg',
  'add-user.svg', 'add-wallet.svg', 'alert-circle.svg', 'alert-romb.svg', 'alert-triangle-1.svg',
  'alert-triangle.svg', 'anchor.svg', 'apple.svg', 'apps.svg', 'arrow-bottom-left.svg',
  'arrow-bottom-right.svg', 'arrow-down.svg', 'arrow-left.svg', 'arrow-right.svg', 'arrow-top-left.svg',
  'arrow-top-right.svg', 'arrow-up-1.svg', 'arrow-up.svg', 'attach.svg', 'battery-charging.svg',
  'battery-empty.svg', 'battery-full.svg', 'battery-m-full.svg', 'battery-s-full.svg', 'behance.svg',
  'bitcoin.svg', 'bluetooth.svg', 'book.svg', 'bookmark.svg', 'bottom-left-square.svg',
  'bottom-right-square.svg', 'broadcast.svg', 'calendar.svg', 'call-missed.svg', 'call-sillent.svg',
  'call.svg', 'calling.svg', 'camera.svg', 'card.svg', 'cart.svg',
  'cases.svg', 'chart-square.svg', 'chart.svg', 'chat.svg', 'check-circle.svg',
  'check-double.svg', 'check.svg', 'chevron-down.svg', 'chevron-left.svg', 'chevron-right.svg',
  'chevron-top.svg', 'chevrons-down.svg', 'chevrons-left.svg', 'chevrons-right.svg', 'chevrons-up.svg',
  'close-square.svg', 'close.svg', 'code-alt.svg', 'code.svg', 'collections.svg',
  'color-picker.svg', 'columns.svg', 'command.svg', 'copy.svg', 'corner-bottom-left.svg',
  'corner-bottom-right.svg', 'corner-left-down.svg', 'corner-left-up.svg', 'corner-right-down.svg', 'corner-right-up.svg',
  'corner-up-left.svg', 'corner-up-right.svg', 'country.svg', 'crop-rotate-bl.svg', 'crop-rotate-br.svg',
  'crop-rotate-tl.svg', 'crop-rotate-tr.svg', 'crop.svg', 'dashboard.svg', 'debug.svg',
  'delivery.svg', 'desktop.svg', 'direction.svg', 'discount-square.svg', 'discount-wave.svg',
  'discovery.svg', 'down-square.svg', 'download-alt.svg', 'download-from-cloud.svg', 'download.svg',
  'dribbble.svg', 'earth.svg', 'edit-square.svg', 'edit.svg', 'euro.svg',
  'exit-fullscreen.svg', 'export.svg', 'eye-off.svg', 'eye.svg', 'facebook.svg',
  'fb-messanger.svg', 'figma.svg', 'filter-alt.svg', 'filter.svg', 'flag.svg',
  'flash.svg', 'folder.svg', 'fullscreen.svg', 'game.svg', 'gem.svg',
  'github.svg', 'google.svg', 'gps-alt.svg', 'gps.svg', 'graph.svg',
  'headphones.svg', 'heart.svg', 'home.svg', 'hr-align-c.svg', 'hr-align-l.svg',
  'hr-align-r.svg', 'hr-distribute-c.svg', 'hr-distribute-l.svg', 'hr-distribute-r.svg', 'image.svg',
  'instagram.svg', 'latest.svg', 'layers.svg', 'left-square.svg', 'like.svg',
  'line-space.svg', 'link.svg', 'linkedin.svg', 'list-close.svg', 'list-open.svg',
  'load-spinner.svg', 'location-alt.svg', 'location.svg', 'lock.svg', 'login-alt.svg',
  'login.svg', 'logout-alt.svg', 'logout.svg', 'mac-book.svg', 'mail.svg',
  'maximize-two-square.svg', 'maximize-view-square.svg', 'maximize-view.svg', 'menu.svg', 'message.svg',
  'minimize-square-close.svg', 'minimize-square.svg', 'minimize-view.svg', 'minus-circle.svg', 'minus.svg',
  'more-circle.svg', 'music-note.svg', 'notification.svg', 'paper-download.svg', 'paper-fail.svg',
  'paper-negative.svg', 'paper-plus.svg', 'paper-upload.svg', 'paper.svg', 'pin-map.svg',
  'pinterest.svg', 'plus-circle.svg', 'plus.svg', 'prime.svg', 'print.svg',
  'profile.svg', 'puzzle-piece.svg', 'redo-action.svg', 'redo.svg', 'reflect-hr.svg',
  'reflect-vr.svg', 'refresh-double.svg', 'refresh.svg', 'repeat-one.svg', 'report.svg',
  'right-square.svg', 'scale.svg', 'scan.svg', 'scissors.svg', 'send.svg',
  'settings-alt.svg', 'settings.svg', 'share-alt.svg', 'share.svg', 'shield-done.svg',
  'shield-fail.svg', 'sidebar-close.svg', 'sidebar-open.svg', 'sidebar.svg', 'smartphone.svg',
  'sort-arrow-down.svg', 'sort-arrow-up.svg', 'sort-two-arrow.svg', 'sort.svg', 'star.svg',
  'store.svg', 'swap.svg', 'tag.svg', 'ticket.svg', 'time-24hours.svg',
  'time-circle.svg', 'time-quarter-to.svg', 'time-quarter.svg', 'time-square.svg', 'tips.svg',
  'tooltip-circle.svg', 'tooltip-square.svg', 'top-left-square.svg', 'top-right-square.svg', 'trash.svg',
  'twitter.svg', 'undo-action.svg', 'undo.svg', 'unlike.svg', 'unlock.svg',
  'upload-alt.svg', 'upload.svg', 'url.svg', 'usd.svg', 'users-group.svg',
  'users-two.svg', 'video-off.svg', 'video.svg', 'view-column.svg', 'view-table.svg',
  'voice-alt.svg', 'voice.svg', 'volume-down.svg', 'volume-off.svg', 'volume-up.svg',
  'vr-align-b.svg', 'vr-align-c.svg', 'vr-align-t.svg', 'vr-distribute-b.svg', 'vr-distribute-c.svg',
  'vr-distribute-t.svg', 'wallet.svg', 'wi-fi-off.svg', 'wi-fi-on.svg', 'youtube.svg'
];

// 表情映射规则
const emojiMap = {
  ':smile:': 'heart.svg',
  ':laugh:': 'like.svg',
  ':sad:': 'alert-circle.svg',
  ':angry:': 'alert-triangle.svg',
  ':surprised:': 'flash.svg',
  ':thinking:': 'puzzle-piece.svg',
  ':thumbsup:': 'check-circle.svg',
  ':thumbsdown:': 'close-circle.svg',
  ':ok:': 'check.svg',
  ':no:': 'close.svg',
  ':info:': 'info.svg',
  ':warning:': 'alert-triangle.svg',
  ':error:': 'alert-circle.svg',
  ':success:': 'check-circle.svg',
  ':question:': 'puzzle-piece.svg',
  ':star:': 'star.svg',
  ':heart:': 'heart.svg',
  ':bookmark:': 'bookmark.svg',
  ':tag:': 'tag.svg',
  ':share:': 'share.svg',
  ':download:': 'download.svg',
  ':upload:': 'upload.svg',
  ':settings:': 'settings.svg',
  ':user:': 'profile.svg',
  ':home:': 'home.svg',
  ':search:': 'discovery.svg',
  ':menu:': 'menu.svg',
  ':message:': 'message.svg',
  ':chat:': 'chat.svg',
  ':bell:': 'notification.svg',
  ':calendar:': 'calendar.svg',
  ':clock:': 'time-circle.svg',
  ':map:': 'location.svg',
  ':link:': 'link.svg',
  ':image:': 'image.svg',
  ':video:': 'video.svg',
  ':music:': 'music-note.svg',
  ':file:': 'paper.svg',
  ':folder:': 'folder.svg',
  ':trash:': 'trash.svg',
  ':copy:': 'copy.svg',
  ':edit:': 'edit.svg',
  ':lock:': 'lock.svg',
  ':unlock:': 'unlock.svg',
  ':eye:': 'eye.svg',
  ':eye-off:': 'eye-off.svg',
  ':arrow-up:': 'arrow-up.svg',
  ':arrow-down:': 'arrow-down.svg',
  ':arrow-left:': 'arrow-left.svg',
  ':arrow-right:': 'arrow-right.svg',
  ':plus:': 'plus.svg',
  ':minus:': 'minus.svg',
  ':chevron-up:': 'chevron-top.svg',
  ':chevron-down:': 'chevron-down.svg',
  ':chevron-left:': 'chevron-left.svg',
  ':chevron-right:': 'chevron-right.svg'
};

export function useIconManager() {
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const error = ref(null);
  const cacheKey = generateKey();

  // 检查图标是否已缓存
  const checkIconCache = (iconName) => {
    try {
      const encryptedData = localStorage.getItem(`icon_${iconName}`);
      if (encryptedData) {
        const decryptedData = decryptData(encryptedData, cacheKey);
        return decryptedData;
      }
      return null;
    } catch (err) {
      console.error('Error checking icon cache:', err);
      return null;
    }
  };

  // 缓存图标
  const cacheIcon = (iconName, data) => {
    try {
      const encryptedData = encryptData(data, cacheKey);
      localStorage.setItem(`icon_${iconName}`, encryptedData);
    } catch (err) {
      console.error('Error caching icon:', err);
    }
  };

  // 预加载所有图标
  const preloadIcons = async () => {
    if (isLoaded.value) return;
    
    isLoading.value = true;
    error.value = null;

    try {
      const promises = iconFiles.map(async (iconFile) => {
        // 检查是否已缓存
        const cachedData = checkIconCache(iconFile);
        if (cachedData) {
          return cachedData;
        }

        // 加载图标
        const response = await fetch(`/icons/${iconFile}`);
        if (!response.ok) {
          throw new Error(`Failed to load icon: ${iconFile}`);
        }

        const data = await response.text();
        // 缓存图标
        cacheIcon(iconFile, data);
        return data;
      });

      await Promise.all(promises);
      isLoaded.value = true;
    } catch (err) {
      console.error('Error preloading icons:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  // 替换文本中的表情为图标
  const replaceEmojis = (text) => {
    if (!text || typeof text !== 'string') return text;

    let result = text;
    Object.entries(emojiMap).forEach(([emoji, iconFile]) => {
      const cachedIcon = checkIconCache(iconFile);
      if (cachedIcon) {
        const iconUrl = `data:image/svg+xml;utf8,${encodeURIComponent(cachedIcon)}`;
        const iconHtml = `<img src="${iconUrl}" alt="${emoji}" class="emoji-icon" style="width: 20px; height: 20px; vertical-align: middle;" />`;
        result = result.replace(new RegExp(emoji, 'g'), iconHtml);
      }
    });

    return result;
  };

  // 清理缓存
  const clearIconCache = () => {
    iconFiles.forEach(iconFile => {
      localStorage.removeItem(`icon_${iconFile}`);
    });
    isLoaded.value = false;
  };

  // 在组件挂载时预加载图标
  onMounted(() => {
    preloadIcons();
  });

  return {
    isLoading,
    isLoaded,
    error,
    preloadIcons,
    replaceEmojis,
    clearIconCache,
    checkIconCache
  };
}
