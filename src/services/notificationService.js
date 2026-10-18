import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { RANDOM_NOTIFICATION_ADHKAR } from '../data/adhkarData';

export const NOTIFICATION_CHANNEL_ID = 'silent_dhikr_channel_v4';
export const NOTIFICATION_GROUP_ID = 'dhikr_single_group';

/**
 * إعداد معالج الإشعارات ليكون هادئاً ومرئياً في شريط التنبيهات
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * تهيئة قناة الإشعارات على أندرويد لتعمل بصمت تام وبأناقة دون إزعاج
 */
export const setupNotificationSystem = async () => {
  try {
    if (Platform.OS === 'android') {
      // تنظيف القنوات القديمة
      const oldChannels = [
        'silent_dhikr_channel',
        'silent_dhikr_channel_v2',
        'silent_dhikr_channel_v3',
      ];
      for (const ch of oldChannels) {
        try {
          await Notifications.deleteNotificationChannelAsync(ch);
        } catch (_) {}
      }

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'الأذكار والتسابيح الصامتة',
        description: 'تنبيهات صامتة بالذكر تظهر بهدوء في شريط الإشعارات دون صوت أو اهتزاز',
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        enableVibrate: false,
        vibrationPattern: null,
        showBadge: false,
        enableLights: false,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.log('Error setting up notification channel:', error);
    return false;
  }
};

/**
 * خلط مصفوفة الأذكار عشوائياً (Fisher-Yates Shuffle)
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * تجهيز محتوى إشعار الذكر بتنسيق إسلامي أنيق
 */
export const getDhikrNotificationContent = (dhikrItem) => {
  const text = dhikrItem.text || dhikrItem;
  const virtue = dhikrItem.virtue;

  return {
    title: `« ${text} »`,
    body: virtue ? `✨ ${virtue}` : '🌿 أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    sound: false,
    channelId: NOTIFICATION_CHANNEL_ID,
    priority: Notifications.AndroidNotificationPriority.LOW,
    color: '#0F683D',
    threadIdentifier: NOTIFICATION_GROUP_ID,
    autoDismiss: true,
  };
};

/**
 * مسح جميع الإشعارات السابقة المعروضة لمنع التراكم وإبقاء إشعار واحد فقط
 */
export const dismissOldPresentedNotifications = async (exceptIdentifier = null) => {
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    if (!presented || presented.length === 0) return;

    for (const item of presented) {
      const id = item.request?.identifier;
      if (id && id !== exceptIdentifier) {
        await Notifications.dismissNotificationAsync(id).catch(() => {});
      }
    }
  } catch (e) {
    console.log('Error dismissing old presented notifications:', e);
  }
};

/**
 * جدولة طابور إشعارات دورية عشوائية متنوعة (50 إشعاراً قادماً)
 * تحل مشكلة التكرار ومشكله تراكم الإشعارات
 */
export const scheduleRandomNotificationsQueue = async (
  intervalMinutes,
  customList = []
) => {
  try {
    // 1. إلغاء أي إشعارات سابقة مجدولة
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 2. تجميع بنك الأذكار (الأذكار العشوائية الافتراضية + أي أذكار أضافها المستخدم)
    const combinedPool = [
      ...RANDOM_NOTIFICATION_ADHKAR,
      ...(customList || []).map((c) => ({
        text: c.text,
        virtue: c.virtue || 'ذكر مخصص',
      })),
    ];

    if (combinedPool.length === 0) return;

    const intervalSec = Math.max(60, intervalMinutes * 60);
    const TOTAL_SLOTS = 50; // جدولة 50 إشعاراً عشوائياً مقدماً

    // خلط الأذكار
    let pool = shuffleArray(combinedPool);

    for (let i = 0; i < TOTAL_SLOTS; i++) {
      if (pool.length === 0) {
        pool = shuffleArray(combinedPool);
      }
      const randomDhikr = pool.pop();
      const delaySeconds = (i + 1) * intervalSec;

      await Notifications.scheduleNotificationAsync({
        identifier: `azkar_slot_${i}`,
        content: getDhikrNotificationContent(randomDhikr),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval',
          seconds: delaySeconds,
          repeats: false,
        },
      });
    }
  } catch (error) {
    console.log('Error scheduling random notifications queue:', error);
  }
};

/**
 * تجربة إرسال إشعار فوري عشوائي الآن مع استبدال ومسح أي إشعار سابق
 */
export const testRandomNotificationNow = async (customList = []) => {
  try {
    const combinedPool = [
      ...RANDOM_NOTIFICATION_ADHKAR,
      ...(customList || []).map((c) => ({
        text: c.text,
        virtue: c.virtue || 'ذكر مخصص',
      })),
    ];

    const randomDhikr =
      combinedPool[Math.floor(Math.random() * combinedPool.length)] ||
      RANDOM_NOTIFICATION_ADHKAR[0];

    // مسح المعروض حالياً حتى لا يتراكم
    await dismissOldPresentedNotifications();

    const testId = `test_dhikr_${Date.now()}`;
    await Notifications.scheduleNotificationAsync({
      identifier: testId,
      content: getDhikrNotificationContent(randomDhikr),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval',
        seconds: 1,
        repeats: false,
      },
    });

    return randomDhikr;
  } catch (e) {
    console.log('Error sending test notification:', e);
    throw e;
  }
};

/**
 * إلغاء جميع الإشعارات المجدولة والمعروضة
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  } catch (e) {
    console.log('Error canceling notifications:', e);
  }
};
