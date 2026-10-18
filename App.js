import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Dimensions,
  Switch,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import MorningEveningScreen from './src/components/MorningEveningScreen';
import PrayerAzkarScreen from './src/components/PrayerAzkarScreen';
import {
  setupNotificationSystem,
  scheduleRandomNotificationsQueue,
  testRandomNotificationNow,
  cancelAllNotifications,
  dismissOldPresentedNotifications,
  NOTIFICATION_CHANNEL_ID,
} from './src/services/notificationService';

const { width } = Dimensions.get('window');

// قائمة مدن افتراضية عالمية
const PRESET_CITIES = [
  { name: 'القاهرة، مصر', lat: 30.0444, lng: 31.2357, method: 'Egyptian' },
  { name: 'الرياض، السعودية', lat: 24.7136, lng: 46.6753, method: 'UmmAlQura' },
  { name: 'مكة المكرمة', lat: 21.3891, lng: 39.8579, method: 'UmmAlQura' },
  { name: 'المدينة المنورة', lat: 24.5247, lng: 39.5692, method: 'UmmAlQura' },
  { name: 'دبي، الإمارات', lat: 25.2048, lng: 55.2708, method: 'Dubai' },
  { name: 'الكويت، الكويت', lat: 29.3759, lng: 47.9774, method: 'Kuwait' },
  { name: 'الدوحة، قطر', lat: 25.2854, lng: 51.531, method: 'Qatar' },
  { name: 'عمان، الأردن', lat: 31.9454, lng: 35.9284, method: 'MuslimWorldLeague' },
  { name: 'بغداد، العراق', lat: 33.3152, lng: 44.3661, method: 'MuslimWorldLeague' },
  { name: 'القدس، فلسطين', lat: 31.7683, lng: 35.2137, method: 'MuslimWorldLeague' },
  { name: 'الخرطوم، السودان', lat: 15.5007, lng: 32.5599, method: 'Egyptian' },
  { name: 'طرابلس، ليبيا', lat: 32.8872, lng: 13.1913, method: 'Egyptian' },
  { name: 'تونس، تونس', lat: 36.8065, lng: 10.1815, method: 'MuslimWorldLeague' },
  { name: 'الجزائر، الجزائر', lat: 36.7538, lng: 3.0588, method: 'MuslimWorldLeague' },
  { name: 'الرباط، المغرب', lat: 34.0209, lng: -6.8416, method: 'MuslimWorldLeague' },
  { name: 'إسطنبول، تركيا', lat: 41.0082, lng: 28.9784, method: 'Turkey' },
  { name: 'لندن، بريطانيا', lat: 51.5074, lng: -0.1278, method: 'MuslimWorldLeague' },
  { name: 'نيويورك، أمريكا', lat: 40.7128, lng: -74.006, method: 'NorthAmerica' },
];

// قائمة الأذكار الأساسية الافتراضية للسبحة
const DEFAULT_ADHKAR = [
  {
    id: '1',
    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    virtue: 'حبيبتان إلى الرحمن، خفيفتان على اللسان، ثقيلتان في الميزان',
    isCustom: false,
  },
  {
    id: '2',
    text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    virtue: 'من صلى عليّ صلاة صلى الله عليه بها عشراً',
    isCustom: false,
  },
  {
    id: '3',
    text: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
    virtue: 'من لزم الاستغفار جعل الله له من كل هم فرجاً ومن كل ضيق مخرجاً',
    isCustom: false,
  },
  {
    id: '4',
    text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    virtue: 'كنز من كنوز الجنة ودواء لتسعة وتسعين داء أيسرها الهم',
    isCustom: false,
  },
  {
    id: '5',
    text: 'سُبْحَانَ اللَّهِ ، وَالْحَمْدُ لِلَّهِ ، وَلَا إِلَهَ إِلَّا اللَّهُ ، وَاللَّهُ أَكْبَرُ',
    virtue: 'الباقيات الصالحات وأحب الكلام إلى الله تعالى',
    isCustom: false,
  },
  {
    id: '6',
    text: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    virtue: 'دعوة ذي النون ما دعا بها مسلم في شيء إلا استجاب الله له',
    isCustom: false,
  },
  {
    id: '7',
    text: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    virtue: 'أمان لكل خائف وتفويض الأمر لكافي المهمات سبحانه',
    isCustom: false,
  },
  {
    id: '8',
    text: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    virtue: 'سؤال الله باسمه الأعظم وأصل تفريج الكربات',
    isCustom: false,
  },
];

const STORAGE_KEYS = {
  CURRENT_COUNT: '@azkar_current_count',
  TOTAL_COUNT: '@azkar_total_count',
  SELECTED_INDEX: '@azkar_selected_index',
  CUSTOM_ADHKAR: '@azkar_custom_adhkar',
  DARK_MODE: '@azkar_dark_mode',
  NOTIF_ENABLED: '@azkar_notif_enabled',
  NOTIF_INTERVAL: '@azkar_notif_interval',
};

export default function App() {
  // حالة المظهر والتبويبات
  const [isDarkMode, setIsDarkMode] = useState(false);
  // 'tasbeeh' | 'morning_evening' | 'prayer_adhkar' | 'prayers_qibla' | 'notifications'
  const [activeTab, setActiveTab] = useState('tasbeeh');
  const [prayersQiblaSubTab, setPrayersQiblaSubTab] = useState('prayers'); // 'prayers' | 'qibla'

  // حالة السبحة
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [adhkarList, setAdhkarList] = useState(DEFAULT_ADHKAR);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // حالة نافذة إضافة ذكر مخصص
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customDhikrInput, setCustomDhikrInput] = useState('');

  // حالة الإشعارات الصامتة العشوائية
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationInterval, setNotificationInterval] = useState(15);
  const [testingNotification, setTestingNotification] = useState(false);

  // حالة التحديثات الفورية (OTA Updates)
  const { isUpdateAvailable: isOtaAvailable, isUpdatePending } = Updates.useUpdates();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);

  // حالة الموقع والجغرافيا (لمواقيت الصلاة والقبلة)
  const [userCoords, setUserCoords] = useState({ latitude: 30.0444, longitude: 31.2357 }); // القاهرة افتراضياً
  const [cityName, setCityName] = useState('القاهرة، مصر');
  const [locationLoading, setLocationLoading] = useState(false);

  // حالة البوصلة والقبلة
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(136);
  const [hasMagnetometer, setHasMagnetometer] = useState(true);

  // حالة مواقيت الصلاة والعد التنازلي الحي
  const [prayerTimesData, setPrayerTimesData] = useState(null);
  const [nextPrayerInfo, setNextPrayerInfo] = useState({ name: '', time: null, remainingText: '' });
  const [currentTimeText, setCurrentTimeText] = useState('');

  // أنيميشن زر التسبيح
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // حالة شاشة البداية / اللودر الإسلامي الأنيق
  const [isAppLoading, setIsAppLoading] = useState(true);
  const splashFadeAnim = useRef(new Animated.Value(1)).current;
  const splashScaleAnim = useRef(new Animated.Value(0.92)).current;
  const splashPulseAnim = useRef(new Animated.Value(1)).current;

  // حالة النافذة المنبثقة الإسلامية الموحدة (Custom Beautiful Popup)
  const [customPopup, setCustomPopup] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    icon: '',
    buttons: [],
  });
  const popupScaleAnim = useRef(new Animated.Value(0.85)).current;
  const popupFadeAnim = useRef(new Animated.Value(0)).current;

  const showPopup = ({ title, message, type = 'info', icon, buttons = [] }) => {
    setCustomPopup({
      visible: true,
      title,
      message,
      type,
      icon,
      buttons: buttons.length ? buttons : [{ text: 'حسناً', style: 'primary', onPress: hidePopup }],
    });
    Animated.parallel([
      Animated.spring(popupScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(popupFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hidePopup = () => {
    Animated.parallel([
      Animated.timing(popupScaleAnim, {
        toValue: 0.88,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(popupFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCustomPopup((prev) => ({ ...prev, visible: false }));
    });
  };

  const modalScaleAnim = useRef(new Animated.Value(0.85)).current;
  const modalFadeAnim = useRef(new Animated.Value(0)).current;

  const openAddDhikrModal = () => {
    setIsModalVisible(true);
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeAddDhikrModal = () => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0.88,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsModalVisible(false);
    });
  };

  // تهيئة التطبيق عند الفتح لأول مرة
  useEffect(() => {
    loadSavedData();
    setupNotificationSystem();
    detectUserLocation();
    dismissOldPresentedNotifications();

    // تشغيل أنيميشن النبض الهادئ لشعار الشاشة الترحيبية
    Animated.loop(
      Animated.sequence([
        Animated.timing(splashPulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(splashPulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(splashScaleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const splashTimer = setTimeout(() => {
      Animated.timing(splashFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsAppLoading(false);
      });
    }, 1800);

    return () => clearTimeout(splashTimer);
  }, []);

  // إدارة الإشعارات الذكية: منع التراكم والتجديد التلقائي
  useEffect(() => {
    // 1. الاستماع للإشعارات الواردة ومسح أي إشعار سابق فوراً لمنع التراكم
    const receivedSub = Notifications.addNotificationReceivedListener(async (notification) => {
      await dismissOldPresentedNotifications(notification.request?.identifier);
    });

    // 2. عند عودة المستخدم للتطبيق: تنظيف شريط الإشعارات وتجديد طابور الأذكار العشوائية
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        dismissOldPresentedNotifications();
        if (notificationsEnabled) {
          scheduleRandomNotificationsQueue(
            notificationInterval,
            adhkarList.filter((a) => a.isCustom)
          );
        }
      }
    });

    return () => {
      receivedSub.remove();
      appStateSub.remove();
    };
  }, [notificationsEnabled, notificationInterval, adhkarList]);

  // فحص وتطبيق التحديثات الهوائية بعد اختفاء شاشة البداية
  useEffect(() => {
    if (!isAppLoading) {
      if (isUpdatePending) {
        showRestartPopup();
      } else {
        checkForAppUpdates(false);
      }
    }
  }, [isAppLoading]);

  // إظهار نافذة إعادة التشغيل فور اكتمال تنزيل التحديث في الخلفية
  useEffect(() => {
    if (!isAppLoading && isUpdatePending) {
      showRestartPopup();
    }
  }, [isAppLoading, isUpdatePending]);

  // مؤقت تحديث الساعة والعد التنازلي لمواقيت الصلاة كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeText(formatTimeArabic(now));
      if (prayerTimesData) {
        updatePrayerCountdown(prayerTimesData);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [prayerTimesData]);

  // تشغيل مستشعر البوصلة وتحديد القبلة
  useEffect(() => {
    let headingSub = null;
    let magnetometerSub = null;
    let isSubscribed = true;

    if (activeTab === 'prayers_qibla' && prayersQiblaSubTab === 'qibla') {
      const initCompass = async () => {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            try {
              headingSub = await Location.watchHeadingAsync((hData) => {
                if (!isSubscribed) return;
                const h =
                  hData.trueHeading >= 0 ? hData.trueHeading : hData.magneticHeading;
                if (typeof h === 'number' && !isNaN(h)) {
                  setHeading(Math.round(h));
                  setHasMagnetometer(true);
                }
              });
              return;
            } catch (e) {
              console.log('watchHeadingAsync fallback to Magnetometer', e);
            }
          }

          const available = await Magnetometer.isAvailableAsync();
          if (!isSubscribed) return;
          setHasMagnetometer(available);
          if (available) {
            Magnetometer.setUpdateInterval(80);
            magnetometerSub = Magnetometer.addListener((data) => {
              if (!isSubscribed) return;
              let { x, y } = data;
              let angle = Math.atan2(-x, y) * (180 / Math.PI);
              if (angle < 0) angle += 360;
              setHeading(Math.round(angle));
            });
          }
        } catch (err) {
          console.log('Error initializing compass', err);
        }
      };

      initCompass();
    }

    return () => {
      isSubscribed = false;
      if (headingSub && headingSub.remove) headingSub.remove();
      if (magnetometerSub && magnetometerSub.remove) magnetometerSub.remove();
    };
  }, [activeTab, prayersQiblaSubTab]);

  // إعادة حساب مواقيت الصلاة والقبلة عند تغير الإحداثيات
  useEffect(() => {
    calculatePrayersAndQibla(userCoords.latitude, userCoords.longitude);
  }, [userCoords]);

  // حفظ البيانات عند تغيرها
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.CURRENT_COUNT, count.toString());
  }, [count]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.TOTAL_COUNT, totalCount.toString());
  }, [totalCount]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.SELECTED_INDEX, selectedIndex.toString());
  }, [selectedIndex]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // تحديث جدولة الأذكار العشوائية عند تغيير الإعدادات
  useEffect(() => {
    if (notificationsEnabled) {
      scheduleRandomNotificationsQueue(
        notificationInterval,
        adhkarList.filter((a) => a.isCustom)
      );
    } else {
      cancelAllNotifications();
    }
  }, [notificationsEnabled, notificationInterval, adhkarList]);

  // تحميل البيانات المحفوظة محلياً
  const loadSavedData = async () => {
    try {
      const savedCount = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_COUNT);
      if (savedCount !== null) setCount(parseInt(savedCount, 10));

      const savedTotal = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_COUNT);
      if (savedTotal !== null) setTotalCount(parseInt(savedTotal, 10));

      const savedIndex = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_INDEX);
      if (savedIndex !== null) setSelectedIndex(parseInt(savedIndex, 10));

      const savedDarkMode = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (savedDarkMode !== null) setIsDarkMode(JSON.parse(savedDarkMode));

      const savedNotifEnabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIF_ENABLED);
      if (savedNotifEnabled !== null) setNotificationsEnabled(JSON.parse(savedNotifEnabled));

      const savedNotifInterval = await AsyncStorage.getItem(STORAGE_KEYS.NOTIF_INTERVAL);
      if (savedNotifInterval !== null) setNotificationInterval(parseInt(savedNotifInterval, 10));

      const savedCustom = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_ADHKAR);
      if (savedCustom !== null) {
        const parsedCustom = JSON.parse(savedCustom);
        setAdhkarList([...DEFAULT_ADHKAR, ...parsedCustom]);
      }
    } catch (e) {
      console.log('Error loading local data', e);
    }
  };

  // اكتشاف موقع المستخدم التلقائي عبر GPS
  const detectUserLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geo && geo.length > 0) {
          const item = geo[0];
          const name = item.city || item.region || item.country || 'موقعك الحالي';
          setCityName(name);
        }
      } catch (e) {
        setCityName('موقعك الجغرافي');
      }
    } catch (err) {
      console.log('Location detection error', err);
    } finally {
      setLocationLoading(false);
    }
  };

  // اختيار مدينة يدوياً
  const handleSelectCityPreset = (city) => {
    setCityName(city.name);
    setUserCoords({ latitude: city.lat, longitude: city.lng });
  };

  // حساب مواقيت الصلاة وزاوية القبلة وفق أحدث المعادلات الفلكية الدقيقة
  const calculatePrayersAndQibla = (lat, lng) => {
    try {
      const coordinates = new Coordinates(lat, lng);
      const date = new Date();

      let params = CalculationMethod.MuslimWorldLeague();
      if (lat >= 20 && lat <= 32 && lng >= 25 && lng <= 36) {
        params = CalculationMethod.Egyptian();
      } else if (lat >= 16 && lat <= 32 && lng >= 36 && lng <= 60) {
        params = CalculationMethod.UmmAlQura();
      }

      const prayerTimes = new PrayerTimes(coordinates, date, params);
      setPrayerTimesData(prayerTimes);
      updatePrayerCountdown(prayerTimes);

      const qiblaCalc = Qibla(coordinates);
      setQiblaAngle(Math.round(qiblaCalc));
    } catch (error) {
      console.log('Error calculating prayer times', error);
    }
  };

  // تحديث العد التنازلي للصلاة القادمة
  const updatePrayerCountdown = (pTimes) => {
    if (!pTimes) return;
    const now = new Date();

    const prayerList = [
      { key: 'fajr', name: 'الفجر', time: pTimes.fajr },
      { key: 'sunrise', name: 'الشروق', time: pTimes.sunrise },
      { key: 'dhuhr', name: 'الظهر', time: pTimes.dhuhr },
      { key: 'asr', name: 'العصر', time: pTimes.asr },
      { key: 'maghrib', name: 'المغرب', time: pTimes.maghrib },
      { key: 'isha', name: 'العشاء', time: pTimes.isha },
    ];

    let next = null;
    for (let p of prayerList) {
      if (p.time > now) {
        next = p;
        break;
      }
    }

    if (!next) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTimes = new PrayerTimes(
        new Coordinates(userCoords.latitude, userCoords.longitude),
        tomorrow,
        CalculationMethod.Egyptian()
      );
      next = { key: 'fajr', name: 'الفجر (غداً)', time: tomorrowTimes.fajr };
    }

    const diffMs = next.time.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = (n) => (n < 10 ? '0' + n : n);
    const remaining = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

    setNextPrayerInfo({
      name: next.name,
      time: next.time,
      remainingText: remaining,
    });
  };

  // استنتاج الصلاة الحالية بناءً على الوقت الحالي
  const getCurrentPrayerKey = () => {
    if (!prayerTimesData) return 'fajr';
    const now = new Date();
    if (now < prayerTimesData.fajr) return 'fajr';
    if (now < prayerTimesData.dhuhr) return 'dhuhr';
    if (now < prayerTimesData.asr) return 'asr';
    if (now < prayerTimesData.maghrib) return 'maghrib';
    if (now < prayerTimesData.isha) return 'isha';
    return 'fajr';
  };

  // تنسيق الوقت باللغة العربية
  const formatTimeArabic = (date) => {
    if (!date) return '--:--';
    let h = date.getHours();
    const m = date.getMinutes();
    const period = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    h = h ? h : 12;
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${pad(h)}:${pad(m)} ${period}`;
  };

  // نافذة تأكيد إعادة التشغيل بعد اكتمال التحديث
  const showRestartPopup = () => {
    showPopup({
      type: 'update',
      icon: 'sparkles-outline',
      title: 'تم تنزيل التحديث بنجاح ✨',
      message: 'تم تجهيز الإصدار الجديد بنجاح في الخلفية. أعد تشغيل التطبيق الآن لتطبيق التحسينات فوراً بنقرة واحدة.',
      buttons: [
        { text: 'لاحقاً', style: 'cancel', onPress: hidePopup },
        {
          text: 'إعادة التشغيل الآن ⚡',
          style: 'primary',
          onPress: async () => {
            hidePopup();
            try {
              await Updates.reloadAsync();
            } catch (e) {
              console.log('Error reloading update', e);
            }
          },
        },
      ],
    });
  };

  // فحص وتطبيق التحديثات الهوائية
  const checkForAppUpdates = async (showAlertIfNoUpdate = true) => {
    if (__DEV__) {
      if (showAlertIfNoUpdate) {
        showPopup({
          type: 'info',
          icon: 'code-working-outline',
          title: 'وضع التطوير',
          message: 'ميزة التحديثات الفورية التلقائية تعمل داخل تطبيق الهاتف المثبت وليس داخل بيئة التطوير.',
        });
      }
      return;
    }

    if (isUpdatePending) {
      showRestartPopup();
      return;
    }

    try {
      setIsCheckingUpdate(true);
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setHasUpdateAvailable(true);
        if (showAlertIfNoUpdate) {
          showPopup({
            type: 'update',
            icon: 'cloud-download-outline',
            title: 'تحديث جديد متاح 🚀',
            message: 'يوجد إصدار جديد للتطبيق يتضمن تحسينات ومزايا جديدة. هل تريد تنزيله وتطبيقه الآن فوراً بنقرة واحدة؟',
            buttons: [
              { text: 'لاحقاً', style: 'cancel', onPress: hidePopup },
              {
                text: 'تحديث وتثبيت الآن ✨',
                style: 'primary',
                onPress: async () => {
                  hidePopup();
                  await downloadAndApplyUpdate(true);
                },
              },
            ],
          });
        } else {
          downloadAndApplyUpdate(false);
        }
      } else {
        setHasUpdateAvailable(false);
        if (showAlertIfNoUpdate) {
          showPopup({
            type: 'success',
            icon: 'checkmark-circle-outline',
            title: 'أحدث إصدار ✅',
            message: 'أنت تستخدم أحدث نسخة متوفرة من التطبيق بكافة الميزات.',
          });
        }
      }
    } catch (error) {
      if (showAlertIfNoUpdate) {
        showPopup({
          type: 'success',
          icon: 'checkmark-circle-outline',
          title: 'فحص التحديثات',
          message: 'أنت تستخدم أحدث إصدار متوفر حالياً.',
        });
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // تنزيل وتثبيت التحديث
  const downloadAndApplyUpdate = async (showAlertOnError = true) => {
    if (__DEV__) return;
    try {
      setIsDownloadingUpdate(true);
      const result = await Updates.fetchUpdateAsync();
      if (result.isNew) {
        showRestartPopup();
      }
    } catch (error) {
      if (showAlertOnError) {
        showPopup({
          type: 'danger',
          icon: 'alert-circle-outline',
          title: 'خطأ في التحديث',
          message: 'تعذر تنزيل التحديث حالياً، يرجى المحاولة لاحقاً.',
        });
      }
    } finally {
      setIsDownloadingUpdate(false);
    }
  };

  // تجربة الإشعار الصامت العشوائي الآن مع استبدال ومسح أي إشعار سابق
  const handleTestNotification = async () => {
    try {
      setTestingNotification(true);
      const sentDhikr = await testRandomNotificationNow(adhkarList.filter((a) => a.isCustom));

      setTimeout(() => {
        setTestingNotification(false);
        showPopup({
          type: 'success',
          icon: 'notifications-circle-outline',
          title: 'تم إرسال إشعار عشوائي بنجاح ✨',
          message: `تم إرسال ذكر عشوائي:\n« ${sentDhikr.text} »\n\nتفقد شريط الإشعارات؛ حيث يتم إرسال أذكار عشوائية متجددة دائماً مع استبدال أي إشعار سابق فوراً دون أي تراكم.`,
        });

        if (notificationsEnabled) {
          scheduleRandomNotificationsQueue(
            notificationInterval,
            adhkarList.filter((a) => a.isCustom)
          );
        }
      }, 1500);
    } catch (e) {
      setTestingNotification(false);
      showPopup({
        type: 'danger',
        icon: 'alert-circle-outline',
        title: 'تنبيه',
        message: 'يرجى التأكد من تفعيل صلاحيات الإشعارات للتطبيق.',
      });
    }
  };

  // تفعيل/تعطيل الإشعارات
  const handleToggleNotifications = async (val) => {
    if (val) {
      const granted = await setupNotificationSystem();
      if (!granted) {
        showPopup({
          type: 'info',
          icon: 'notifications-off-outline',
          title: 'صلاحيات الإشعارات',
          message: 'يرجى السماح للتطبيق بإرسال الإشعارات حتى يعمل التذكير البصري الصامت.',
        });
        setNotificationsEnabled(false);
        AsyncStorage.setItem(STORAGE_KEYS.NOTIF_ENABLED, JSON.stringify(false));
        return;
      }
      setNotificationsEnabled(true);
      AsyncStorage.setItem(STORAGE_KEYS.NOTIF_ENABLED, JSON.stringify(true));
      scheduleRandomNotificationsQueue(
        notificationInterval,
        adhkarList.filter((a) => a.isCustom)
      );
    } else {
      setNotificationsEnabled(false);
      AsyncStorage.setItem(STORAGE_KEYS.NOTIF_ENABLED, JSON.stringify(false));
      cancelAllNotifications();
    }
  };

  // تغيير فترة التكرار
  const handleSelectInterval = (min) => {
    setNotificationInterval(min);
    AsyncStorage.setItem(STORAGE_KEYS.NOTIF_INTERVAL, min.toString());
    if (notificationsEnabled) {
      scheduleRandomNotificationsQueue(
        min,
        adhkarList.filter((a) => a.isCustom)
      );
    }
  };

  // ضغط زر التسبيح مع أنيميشن نبضي
  const handlePressTasbeeh = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.93,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();

    setCount((prev) => prev + 1);
    setTotalCount((prev) => prev + 1);
  };

  // تصفير العداد الحالي فقط
  const handleResetCurrent = () => {
    setCount(0);
  };

  // تصفير الإجمالي الكلي
  const handleResetTotal = () => {
    showPopup({
      type: 'danger',
      icon: 'trash-outline',
      title: 'تصفير الإجمالي الكلي',
      message: 'هل أنت متأكد من تصفير مجموع كل التسبيحات نهائياً؟',
      buttons: [
        { text: 'إلغاء', style: 'cancel', onPress: hidePopup },
        {
          text: 'تأكيد التصفير',
          style: 'destructive',
          onPress: () => {
            setTotalCount(0);
            setCount(0);
            hidePopup();
          },
        },
      ],
    });
  };

  // إضافة ذكر مخصص
  const handleAddCustomDhikr = async () => {
    const trimmed = customDhikrInput.trim();
    if (!trimmed) {
      showPopup({
        type: 'info',
        icon: 'alert-circle-outline',
        title: 'تنبيه',
        message: 'يرجى كتابة نص الذكر أو الدعاء أولاً.',
      });
      return;
    }

    const newDhikr = {
      id: Date.now().toString(),
      text: trimmed,
      virtue: 'ذكر مخصص أضفته بنفسك',
      isCustom: true,
    };

    const updatedList = [...adhkarList, newDhikr];
    setAdhkarList(updatedList);
    setSelectedIndex(updatedList.length - 1);
    setCustomDhikrInput('');
    closeAddDhikrModal();

    const customOnly = updatedList.filter((item) => item.isCustom);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ADHKAR, JSON.stringify(customOnly));
  };

  // حذف ذكر مخصص
  const handleDeleteCustomDhikr = (id) => {
    showPopup({
      type: 'danger',
      icon: 'trash-outline',
      title: 'حذف الذكر',
      message: 'هل تريد حذف هذا الذكر من قائمتك؟',
      buttons: [
        { text: 'إلغاء', style: 'cancel', onPress: hidePopup },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const updatedList = adhkarList.filter((item) => item.id !== id);
            setAdhkarList(updatedList);
            setSelectedIndex(0);

            const customOnly = updatedList.filter((item) => item.isCustom);
            await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ADHKAR, JSON.stringify(customOnly));
            hidePopup();
          },
        },
      ],
    });
  };

  // سمات الألوان الفاخرة المحدثة
  const theme = {
    bg: isDarkMode ? '#08140E' : '#F4F8F5',
    cardBg: isDarkMode ? '#10241A' : '#FFFFFF',
    cardBorder: isDarkMode ? '#1B3829' : '#E2EBE5',
    textPrimary: isDarkMode ? '#EAF7EE' : '#143825',
    textSecondary: isDarkMode ? '#8EAFA0' : '#4E725F',
    emeraldMain: isDarkMode ? '#227B52' : '#0F683D',
    emeraldLight: isDarkMode ? '#173F2D' : '#E3EFE8',
    goldAccent: '#CBA258',
    danger: '#D9534F',
    dangerBg: isDarkMode ? '#381A1A' : '#FDE8E8',
    white: '#FFFFFF',
  };

  const selectedDhikr = adhkarList[selectedIndex] || DEFAULT_ADHKAR[0];

  // حساب الفرق الزاوي الدقيق بين اتجاه الهاتف وزاوية القبلة
  let rawDiff = (qiblaAngle - heading + 360) % 360;
  if (rawDiff > 180) {
    rawDiff = rawDiff - 360;
  }
  const isFacingQibla = Math.abs(rawDiff) <= 5;
  const qiblaTurnDirection = isFacingQibla ? 'aligned' : rawDiff > 0 ? 'right' : 'left';
  const qiblaTurnDegrees = Math.abs(Math.round(rawDiff));

  // قائمة الصلوات للعرض في بطاقات أنيقة
  const prayerDisplayList = prayerTimesData
    ? [
        { key: 'fajr', name: 'صلاة الفجر', icon: 'weather-sunset-up', time: prayerTimesData.fajr },
        { key: 'sunrise', name: 'شروق الشمس', icon: 'weather-sunny', time: prayerTimesData.sunrise },
        { key: 'dhuhr', name: 'صلاة الظهر', icon: 'white-balance-sunny', time: prayerTimesData.dhuhr },
        { key: 'asr', name: 'صلاة العصر', icon: 'weather-partly-cloudy', time: prayerTimesData.asr },
        { key: 'maghrib', name: 'صلاة المغرب', icon: 'weather-sunset-down', time: prayerTimesData.maghrib },
        { key: 'isha', name: 'صلاة العشاء', icon: 'weather-night', time: prayerTimesData.isha },
      ]
    : [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <RNStatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* الشريط العلوي الهيدر */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => setIsDarkMode(!isDarkMode)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={theme.goldAccent}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.emeraldMain }]}>مُذكِّر وتَسبيح</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
          </Text>
        </View>

        <View style={styles.headerRightBtns}>
          <TouchableOpacity
            style={[
              styles.headerIconBtn,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
            onPress={() => checkForAppUpdates(true)}
            activeOpacity={0.7}
            disabled={isCheckingUpdate || isDownloadingUpdate}
          >
            {isCheckingUpdate || isDownloadingUpdate ? (
              <ActivityIndicator size="small" color={theme.emeraldMain} />
            ) : (
              <Ionicons
                name="cloud-download-outline"
                size={20}
                color={(hasUpdateAvailable || isOtaAvailable || isUpdatePending) ? '#E67E22' : theme.emeraldMain}
              />
            )}
            {(hasUpdateAvailable || isOtaAvailable || isUpdatePending) && <View style={styles.updateBadgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.headerIconBtn,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
            onPress={openAddDhikrModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={theme.emeraldMain} />
          </TouchableOpacity>
        </View>
      </View>

      {/* شريط تنبيه التحديثات الهوائية إذا كانت متاحة */}
      {(hasUpdateAvailable || isOtaAvailable || isUpdatePending) && (
        <TouchableOpacity
          style={[
            styles.updateBanner,
            isUpdatePending && { backgroundColor: theme.emeraldMain },
          ]}
          onPress={() => {
            if (isUpdatePending) {
              showRestartPopup();
            } else {
              downloadAndApplyUpdate(true);
            }
          }}
          activeOpacity={0.85}
        >
          {isDownloadingUpdate ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={isUpdatePending ? 'reload-circle-outline' : 'sparkles'}
              size={18}
              color="#FFFFFF"
            />
          )}
          <Text style={styles.updateBannerText}>
            {isUpdatePending
              ? 'تم تجهيز التحديث بنجاح! اضغط هنا لإعادة التشغيل الآن ⚡'
              : isDownloadingUpdate
              ? 'جاري تنزيل التحديث الجديد في الخلفية... ⏳'
              : 'تحديث جديد متاح! اضغط هنا للتطبيق الفوري'}
          </Text>
        </TouchableOpacity>
      )}

      {/* شريط التبويبات الخمسة الفاخر */}
      <View style={[styles.tabBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        {/* 1. السبحة */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'tasbeeh' && { backgroundColor: theme.emeraldMain },
          ]}
          onPress={() => setActiveTab('tasbeeh')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="beads"
            size={16}
            color={activeTab === 'tasbeeh' ? theme.white : theme.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              { color: activeTab === 'tasbeeh' ? theme.white : theme.textSecondary },
            ]}
          >
            السبحة
          </Text>
        </TouchableOpacity>

        {/* 2. الصباح والمساء */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'morning_evening' && { backgroundColor: theme.emeraldMain },
          ]}
          onPress={() => setActiveTab('morning_evening')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="white-balance-sunny"
            size={16}
            color={activeTab === 'morning_evening' ? theme.white : theme.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              { color: activeTab === 'morning_evening' ? theme.white : theme.textSecondary },
            ]}
          >
            الصباح والمساء
          </Text>
        </TouchableOpacity>

        {/* 3. أذكار الصلوات */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'prayer_adhkar' && { backgroundColor: theme.emeraldMain },
          ]}
          onPress={() => setActiveTab('prayer_adhkar')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={16}
            color={activeTab === 'prayer_adhkar' ? theme.white : theme.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              { color: activeTab === 'prayer_adhkar' ? theme.white : theme.textSecondary },
            ]}
          >
            أذكار الصلوات
          </Text>
        </TouchableOpacity>

        {/* 4. المواقيت والقبلة */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'prayers_qibla' && { backgroundColor: theme.emeraldMain },
          ]}
          onPress={() => setActiveTab('prayers_qibla')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="mosque"
            size={16}
            color={activeTab === 'prayers_qibla' ? theme.white : theme.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              { color: activeTab === 'prayers_qibla' ? theme.white : theme.textSecondary },
            ]}
          >
            المواقيت والقبلة
          </Text>
        </TouchableOpacity>

        {/* 5. التنبيهات */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'notifications' && { backgroundColor: theme.emeraldMain },
          ]}
          onPress={() => setActiveTab('notifications')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="notifications-outline"
            size={15}
            color={activeTab === 'notifications' ? theme.white : theme.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              { color: activeTab === 'notifications' ? theme.white : theme.textSecondary },
            ]}
          >
            التذكير
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. تبويب السبحة الذكية */}
      {activeTab === 'tasbeeh' && (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>اختر الذكر:</Text>
              <TouchableOpacity onPress={openAddDhikrModal} style={styles.addDhikrLink}>
                <Text style={[styles.addDhikrLinkText, { color: theme.emeraldMain }]}>
                  + إضافة ذكر مخصص
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.adhkarScrollContent}
              style={styles.adhkarScroll}
            >
              {adhkarList.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedIndex(index)}
                    style={[
                      styles.dhikrChip,
                      {
                        backgroundColor: isSelected ? theme.emeraldMain : theme.cardBg,
                        borderColor: isSelected ? theme.goldAccent : theme.cardBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.dhikrChipText,
                        {
                          color: isSelected ? theme.white : theme.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.text}
                    </Text>
                    {item.isCustom && (
                      <TouchableOpacity
                        onPress={() => handleDeleteCustomDhikr(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.deleteChipIcon}
                      >
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={isSelected ? theme.white : theme.danger}
                        />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View
            style={[
              styles.currentDhikrCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <View style={styles.dhikrCardBadge}>
              <Text style={styles.dhikrCardBadgeText}>الذكر المختار للتسبيح</Text>
            </View>

            <Text style={[styles.currentDhikrText, { color: theme.textPrimary }]}>
              {selectedDhikr.text}
            </Text>

            {selectedDhikr.virtue ? (
              <View style={[styles.virtueBox, { backgroundColor: theme.emeraldLight }]}>
                <Ionicons name="sparkles" size={14} color={theme.goldAccent} />
                <Text style={[styles.virtueText, { color: theme.textSecondary }]}>
                  {selectedDhikr.virtue}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.counterSection}>
            <View
              style={[
                styles.outerPulseRing,
                { borderColor: isDarkMode ? '#1B4734' : '#D1E6DC' },
              ]}
            >
              <View
                style={[
                  styles.innerPulseRing,
                  { borderColor: isDarkMode ? '#246146' : '#B8D8CB' },
                ]}
              >
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.tasbeehButton,
                      {
                        backgroundColor: theme.emeraldMain,
                        borderColor: theme.goldAccent,
                      },
                    ]}
                    onPress={handlePressTasbeeh}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.tapInstructionText}>اضغط للتسبيح</Text>
                    <Text style={styles.counterNumberText}>{count}</Text>
                    <MaterialCommunityIcons
                      name="hand-pointing-up"
                      size={24}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.statsCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.totalStatsRow}>
              <View style={styles.totalStatsLabelWrap}>
                <MaterialCommunityIcons
                  name="counter"
                  size={22}
                  color={theme.emeraldMain}
                />
                <Text style={[styles.totalStatsLabel, { color: theme.textPrimary }]}>
                  إجمالي التسبيحات الكلي:
                </Text>
              </View>
              <Text style={[styles.totalStatsValue, { color: theme.emeraldMain }]}>
                {totalCount.toLocaleString('ar-EG')}
              </Text>
            </View>

            <View style={styles.resetButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.resetBtn,
                  { backgroundColor: theme.emeraldLight, borderColor: theme.cardBorder },
                ]}
                onPress={handleResetCurrent}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={theme.emeraldMain} />
                <Text style={[styles.resetBtnText, { color: theme.emeraldMain }]}>
                  تصفير العداد الحالي
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resetBtn,
                  { backgroundColor: theme.dangerBg, borderColor: theme.danger },
                ]}
                onPress={handleResetTotal}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={theme.danger} />
                <Text style={[styles.resetBtnText, { color: theme.danger }]}>
                  تصفير الإجمالي
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 2. تبويب أذكار الصباح والمساء التفاعلية */}
      {activeTab === 'morning_evening' && (
        <MorningEveningScreen theme={theme} showPopup={showPopup} />
      )}

      {/* 3. تبويب أذكار الصلوات الخمس المخصصة */}
      {activeTab === 'prayer_adhkar' && (
        <PrayerAzkarScreen
          theme={theme}
          showPopup={showPopup}
          defaultPrayer={getCurrentPrayerKey()}
        />
      )}

      {/* 4. تبويب المواقيت والقبلة المدمج الراقي */}
      {activeTab === 'prayers_qibla' && (
        <View style={{ flex: 1 }}>
          {/* مفتاح التبديل الفاخر بين مواقيت الصلاة واتجاه القبلة */}
          <View
            style={[
              styles.subTabSwitchContainer,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.subTabSwitchBtn,
                prayersQiblaSubTab === 'prayers' && {
                  backgroundColor: theme.emeraldMain,
                  elevation: 3,
                },
              ]}
              onPress={() => setPrayersQiblaSubTab('prayers')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="clock-time-four-outline"
                size={17}
                color={prayersQiblaSubTab === 'prayers' ? theme.white : theme.textSecondary}
              />
              <Text
                style={[
                  styles.subTabSwitchText,
                  {
                    color: prayersQiblaSubTab === 'prayers' ? theme.white : theme.textSecondary,
                  },
                ]}
              >
                مواقيت الصلاة
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subTabSwitchBtn,
                prayersQiblaSubTab === 'qibla' && {
                  backgroundColor: theme.emeraldMain,
                  elevation: 3,
                },
              ]}
              onPress={() => setPrayersQiblaSubTab('qibla')}
              activeOpacity={0.85}
            >
              <FontAwesome5
                name="compass"
                size={15}
                color={prayersQiblaSubTab === 'qibla' ? theme.white : theme.textSecondary}
              />
              <Text
                style={[
                  styles.subTabSwitchText,
                  {
                    color: prayersQiblaSubTab === 'qibla' ? theme.white : theme.textSecondary,
                  },
                ]}
              >
                اتجاه القبلة
              </Text>
            </TouchableOpacity>
          </View>

          {/* محتوى مواقيت الصلاة */}
          {prayersQiblaSubTab === 'prayers' && (
            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* شريط الموقع الحالي */}
              <View
                style={[
                  styles.qiblaLocationCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                ]}
              >
                <View style={styles.qiblaLocationRow}>
                  <View style={styles.qiblaLocationIconWrap}>
                    <Ionicons name="location" size={20} color={theme.emeraldMain} />
                  </View>
                  <View style={styles.qiblaLocationTexts}>
                    <Text style={[styles.qiblaLocationTitle, { color: theme.textPrimary }]}>
                      {locationLoading ? 'جاري تحديد موقعك...' : cityName}
                    </Text>
                    <Text style={[styles.qiblaLocationSub, { color: theme.textSecondary }]}>
                      مواقيت دقيقة فلكياً وفق موقعك الجغرافي
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={detectUserLocation}
                    style={[styles.refreshLocationBtn, { backgroundColor: theme.emeraldLight }]}
                    activeOpacity={0.7}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color={theme.emeraldMain} />
                    ) : (
                      <Ionicons name="locate" size={18} color={theme.emeraldMain} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* بطاقة الصلاة القادمة والعد التنازلي الحي */}
              <View
                style={[
                  styles.nextPrayerHeroCard,
                  {
                    backgroundColor: theme.emeraldMain,
                    borderColor: theme.goldAccent,
                  },
                ]}
              >
                <View style={styles.nextPrayerHeaderRow}>
                  <View style={styles.nextPrayerBadge}>
                    <Text style={styles.nextPrayerBadgeText}>الصلاة القادمة</Text>
                  </View>
                  <Text style={styles.nextPrayerHeroName}>{nextPrayerInfo.name}</Text>
                </View>

                <View style={styles.countdownBox}>
                  <Text style={styles.countdownLabel}>الوقت المتبقي حتى الأذان:</Text>
                  <Text style={styles.countdownDigits}>{nextPrayerInfo.remainingText || '--:--:--'}</Text>
                </View>

                <View style={styles.prayerHeroFooterRow}>
                  <Text style={styles.prayerHeroTime}>
                    موعد الأذان: {formatTimeArabic(nextPrayerInfo.time)}
                  </Text>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="rgba(255,255,255,0.8)" />
                </View>
              </View>

              {/* قائمة مواقيت الصلوات الخمس */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 10 }]}>
                  مواقيت اليوم:
                </Text>

                <View style={styles.prayersListWrap}>
                  {prayerDisplayList.map((prayer) => {
                    const isNext = nextPrayerInfo.name.includes(prayer.name.replace('صلاة ', ''));
                    return (
                      <View
                        key={prayer.key}
                        style={[
                          styles.prayerItemCard,
                          {
                            backgroundColor: isNext ? theme.emeraldLight : theme.cardBg,
                            borderColor: isNext ? theme.goldAccent : theme.cardBorder,
                          },
                        ]}
                      >
                        <View style={styles.prayerItemRight}>
                          <View
                            style={[
                              styles.prayerIconCircle,
                              {
                                backgroundColor: isNext ? theme.emeraldMain : 'rgba(15, 104, 61, 0.1)',
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={prayer.icon}
                              size={20}
                              color={isNext ? theme.white : theme.emeraldMain}
                            />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.prayerItemName,
                                {
                                  color: isNext ? theme.emeraldMain : theme.textPrimary,
                                  fontWeight: isNext ? '800' : '600',
                                },
                              ]}
                            >
                              {prayer.name}
                            </Text>
                            {isNext && <Text style={styles.nextPrayerTagText}>حان موعدها تقريباً</Text>}
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.prayerItemTime,
                            {
                              color: isNext ? theme.emeraldMain : theme.textPrimary,
                              fontWeight: isNext ? '800' : '600',
                            },
                          ]}
                        >
                          {formatTimeArabic(prayer.time)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* قائمة المدن الجغرافية المعتمدة */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 10 }]}>
                  اختر مدينتك يدوياً:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.citiesScrollContent}
                >
                  {PRESET_CITIES.map((city) => {
                    const isSelected = cityName.includes(city.name.split('،')[0]);
                    return (
                      <TouchableOpacity
                        key={city.name}
                        style={[
                          styles.cityChip,
                          {
                            backgroundColor: isSelected ? theme.emeraldMain : theme.emeraldLight,
                            borderColor: isSelected ? theme.goldAccent : theme.cardBorder,
                          },
                        ]}
                        onPress={() => handleSelectCityPreset(city)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.cityChipText,
                            {
                              color: isSelected ? theme.white : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {city.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>
          )}

          {/* محتوى بوصلة القبلة */}
          {prayersQiblaSubTab === 'qibla' && (
            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.qiblaLocationCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                ]}
              >
                <View style={styles.qiblaLocationRow}>
                  <View style={styles.qiblaLocationIconWrap}>
                    <Ionicons name="location" size={20} color={theme.emeraldMain} />
                  </View>
                  <View style={styles.qiblaLocationTexts}>
                    <Text style={[styles.qiblaLocationTitle, { color: theme.textPrimary }]}>
                      {locationLoading ? 'جاري تحديد موقعك...' : cityName}
                    </Text>
                    <Text style={[styles.qiblaLocationSub, { color: theme.textSecondary }]}>
                      زاوية القبلة: {qiblaAngle}° من الشمال الحقيقي
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={detectUserLocation}
                    style={[styles.refreshLocationBtn, { backgroundColor: theme.emeraldLight }]}
                    activeOpacity={0.7}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color={theme.emeraldMain} />
                    ) : (
                      <Ionicons name="locate" size={18} color={theme.emeraldMain} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.compassContainer}>
                {/* شارة التوجيه الديناميكية */}
                <View
                  style={[
                    styles.qiblaAlignBadge,
                    {
                      backgroundColor: isFacingQibla ? '#0F683D' : theme.cardBg,
                      borderColor: isFacingQibla ? theme.goldAccent : theme.cardBorder,
                      elevation: isFacingQibla ? 6 : 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.qiblaAlignBadgeText,
                      { color: isFacingQibla ? '#FFFFFF' : theme.textPrimary },
                    ]}
                  >
                    {isFacingQibla
                      ? '✨ أنت الآن باتجاه القبلة تماماً نحو الكعبة المشرفة 🕋 ✨'
                      : qiblaTurnDirection === 'right'
                      ? `أدر هاتفك ${qiblaTurnDegrees}° نحو اليمين ↻`
                      : `أدر هاتفك ${qiblaTurnDegrees}° نحو اليسار ↺`}
                  </Text>
                </View>

                {/* سهم مقدمة الهاتف الثابت */}
                <View style={styles.phoneAimWrapper}>
                  <Ionicons
                    name="caret-down"
                    size={28}
                    color={isFacingQibla ? theme.goldAccent : theme.emeraldMain}
                  />
                  <Text
                    style={[
                      styles.phoneAimLabel,
                      { color: isFacingQibla ? theme.goldAccent : theme.textSecondary },
                    ]}
                  >
                    مقدمة الهاتف
                  </Text>
                </View>

                {/* قرص البوصلة الدوار */}
                <View
                  style={[
                    styles.compassDialOuter,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: isFacingQibla ? theme.goldAccent : theme.cardBorder,
                      shadowColor: isFacingQibla ? theme.goldAccent : '#000',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.compassRotatingDial,
                      {
                        transform: [{ rotate: `${-heading}deg` }],
                      },
                    ]}
                  >
                    <View style={styles.directionNorthWrap}>
                      <Text style={[styles.directionNorth, { color: theme.danger }]}>ش</Text>
                      <View style={[styles.northDot, { backgroundColor: theme.danger }]} />
                    </View>

                    <Text style={[styles.directionEast, { color: theme.textSecondary }]}>ق</Text>
                    <Text style={[styles.directionSouth, { color: theme.textSecondary }]}>ج</Text>
                    <Text style={[styles.directionWest, { color: theme.textSecondary }]}>غ</Text>

                    {/* مؤشر الكعبة الشريفة */}
                    <View
                      style={[
                        styles.qiblaPointerWrap,
                        {
                          transform: [{ rotate: `${qiblaAngle}deg` }],
                        },
                      ]}
                    >
                      <View style={styles.qiblaPointerLine} />
                      <View
                        style={[
                          styles.kaabaIconContainer,
                          {
                            backgroundColor: isFacingQibla ? theme.goldAccent : '#111111',
                            borderColor: theme.goldAccent,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name="cube-outline" size={20} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>

                  {/* إبرة البوصلة المركزية */}
                  <View style={styles.centerPivotDot} />
                </View>
              </View>

              {/* بطاقة معلومات البوصلة */}
              <View
                style={[
                  styles.qiblaStatsCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                ]}
              >
                <View style={styles.qiblaStatItem}>
                  <Text style={[styles.qiblaStatLabel, { color: theme.textSecondary }]}>
                    اتجاه الهاتف الحالي:
                  </Text>
                  <Text style={[styles.qiblaStatValue, { color: theme.emeraldMain }]}>
                    {heading}°
                  </Text>
                </View>
                <View style={[styles.qiblaStatDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.qiblaStatItem}>
                  <Text style={[styles.qiblaStatLabel, { color: theme.textSecondary }]}>
                    زاوية القبلة لمدينتك:
                  </Text>
                  <Text style={[styles.qiblaStatValue, { color: theme.goldAccent }]}>
                    {qiblaAngle}°
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.qiblaTipCard,
                  { backgroundColor: theme.emeraldLight, borderColor: theme.cardBorder },
                ]}
              >
                <Ionicons name="information-circle-outline" size={20} color={theme.emeraldMain} />
                <Text style={[styles.qiblaTipText, { color: theme.textSecondary }]}>
                  لضمان أعلى دقة: ضع الهاتف بشكل مسطح أفقياً وابتعد عن الأجهزة الإلكترونية والمعادن.
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* 5. تبويب التنبيهات الصامتة والإعدادات */}
      {activeTab === 'notifications' && (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* بطاقة شرح النظام مع تأكيد عدم التراكم والعشوائية */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.infoTitleRow}>
              <Ionicons name="sparkles" size={24} color={theme.goldAccent} />
              <Text style={[styles.infoTitle, { color: theme.emeraldMain }]}>
                نظام التذكير الصامت العشوائي
              </Text>
            </View>
            <Text style={[styles.infoDesc, { color: theme.textPrimary }]}>
              يرسل لك التطبيق أذكاراً نبوية وأدعية قرآنية عشوائية متنوعة بهدوء تام دون أي صوت أو اهتزاز.
              كما يتم استبدال الإشعار السابق تلقائياً فور نزول أي ذكر جديد حتى لا تتراكم الإشعارات في شريط هاتفك إطلاقاً.
            </Text>

            <View style={[styles.badgeList, { borderTopColor: theme.cardBorder }]}>
              <View style={[styles.featurePill, { backgroundColor: theme.emeraldLight }]}>
                <Ionicons name="shuffle-outline" size={15} color={theme.emeraldMain} />
                <Text style={[styles.featurePillText, { color: theme.emeraldMain }]}>
                  أذكار عشوائية متجددة
                </Text>
              </View>
              <View style={[styles.featurePill, { backgroundColor: theme.emeraldLight }]}>
                <Ionicons name="sync-outline" size={15} color={theme.emeraldMain} />
                <Text style={[styles.featurePillText, { color: theme.emeraldMain }]}>
                  استبدال فوري (بدون تراكم)
                </Text>
              </View>
              <View style={[styles.featurePill, { backgroundColor: theme.emeraldLight }]}>
                <Ionicons name="volume-mute-outline" size={15} color={theme.emeraldMain} />
                <Text style={[styles.featurePillText, { color: theme.emeraldMain }]}>
                  صامت وهادئ تماماً
                </Text>
              </View>
            </View>
          </View>

          {/* تفعيل / تعطيل الإشعارات */}
          <View
            style={[
              styles.settingCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfoWrap}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                  تفعيل الإشعارات العشوائية
                </Text>
                <Text style={[styles.settingSubLabel, { color: theme.textSecondary }]}>
                  {notificationsEnabled
                    ? `التذكير يعمل بصمت كل ${notificationInterval} دقيقة دون تراكم`
                    : 'الإشعارات متوقفة حالياً'}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#CCCCCC', true: theme.emeraldMain }}
                thumbColor={notificationsEnabled ? theme.goldAccent : '#FFFFFF'}
              />
            </View>
          </View>

          {/* اختيار فترة التكرار */}
          <View
            style={[
              styles.settingCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.settingLabel, { color: theme.textPrimary, marginBottom: 12 }]}>
              تكرار التذكير العشوائي كل:
            </Text>
            <View style={styles.intervalOptionsRow}>
              {[15, 30, 45, 60, 120, 180].map((min) => {
                const isSelected = notificationInterval === min;
                const label =
                  min === 60
                    ? 'ساعة'
                    : min === 120
                    ? 'ساعتين'
                    : min === 180
                    ? '3 ساعات'
                    : `${min} دقيقة`;

                return (
                  <TouchableOpacity
                    key={min}
                    style={[
                      styles.intervalChip,
                      {
                        backgroundColor: isSelected ? theme.emeraldMain : theme.emeraldLight,
                        borderColor: isSelected ? theme.goldAccent : theme.cardBorder,
                      },
                    ]}
                    onPress={() => handleSelectInterval(min)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.intervalChipText,
                        {
                          color: isSelected ? theme.white : theme.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* بطاقة معاينة حية لشكل الإشعار في شريط الهاتف */}
          <View
            style={[
              styles.previewCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.previewHeaderRow}>
              <View style={styles.previewAppBadge}>
                <Ionicons name="notifications" size={14} color={theme.emeraldMain} />
                <Text style={[styles.previewAppName, { color: theme.textPrimary }]}>
                  مُذكِّر وتَسبيح • الآن
                </Text>
              </View>
              <Text style={[styles.previewSilentBadge, { color: theme.textSecondary }]}>
                صامت 🔕
              </Text>
            </View>

            <Text style={[styles.previewDhikrText, { color: theme.emeraldMain }]}>
              « سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ »
            </Text>
            <Text style={[styles.previewVirtueText, { color: theme.textSecondary }]}>
              ✨ حبيبتان إلى الرحمن، خفيفتان على اللسان، ثقيلتان في الميزان
            </Text>
            <View style={[styles.previewDivider, { backgroundColor: theme.cardBorder }]} />
            <Text style={[styles.previewFootnote, { color: theme.textSecondary }]}>
              🔒 يستبدل الإشعار نفسه تلقائياً بكل ذكر جديد حتى لا تتراكم الإشعارات في شريط هاتفك.
            </Text>
          </View>

          {/* زر تجربة إشعار عشوائي فوري */}
          <TouchableOpacity
            style={[
              styles.testNotificationBtn,
              {
                backgroundColor: testingNotification ? theme.cardBorder : theme.emeraldMain,
                borderColor: theme.goldAccent,
              },
            ]}
            onPress={handleTestNotification}
            disabled={testingNotification}
            activeOpacity={0.85}
          >
            <Ionicons
              name={testingNotification ? 'hourglass-outline' : 'paper-plane-outline'}
              size={20}
              color={theme.white}
            />
            <Text style={styles.testNotificationBtnText}>
              {testingNotification
                ? 'جاري إرسال الإشعار العشوائي...'
                : 'تجربة إرسال إشعار عشوائي الآن 🔀'}
            </Text>
          </TouchableOpacity>

          {/* تحديثات التطبيق الفورية */}
          <View
            style={[
              styles.settingCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, marginTop: 12 },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfoWrap}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                  تحديثات التطبيق الفورية (OTA)
                </Text>
                <Text style={[styles.settingSubLabel, { color: theme.textSecondary }]}>
                  فحص وتنزيل أي تحديثات جديدة بضغطة زر دون الحاجة لإعادة التثبيت
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.checkUpdateBtn, { backgroundColor: theme.emeraldMain }]}
                onPress={() => checkForAppUpdates(true)}
                disabled={isCheckingUpdate || isDownloadingUpdate}
                activeOpacity={0.8}
              >
                {isCheckingUpdate || isDownloadingUpdate ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.checkUpdateBtnText}>فحص التحديثات</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* نافذة منبثقة لإضافة ذكر مخصص */}
      <Modal
        visible={isModalVisible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeAddDhikrModal}
      >
        <View style={styles.popupOverlay}>
          <Animated.View
            style={[
              styles.popupCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.goldAccent,
                opacity: modalFadeAnim,
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <View
              style={[
                styles.popupFloatingBadgeHalo,
                { backgroundColor: 'rgba(203, 162, 88, 0.18)' },
              ]}
            />

            <View
              style={[
                styles.popupFloatingBadge,
                {
                  backgroundColor: theme.emeraldMain,
                  borderColor: isDarkMode ? '#132B20' : '#FFFFFF',
                },
              ]}
            >
              <MaterialCommunityIcons name="book-open-page-variant" size={28} color="#CBA258" />
            </View>

            <View
              style={[
                styles.popupCategoryPill,
                {
                  backgroundColor: 'rgba(203, 162, 88, 0.15)',
                  borderColor: theme.goldAccent,
                },
              ]}
            >
              <Text style={[styles.popupCategoryPillText, { color: theme.goldAccent }]}>
                ✨ إضافة ذكر مخصص ✨
              </Text>
            </View>

            <Text style={[styles.popupTitle, { color: theme.textPrimary }]}>
              أضف ذكراً أو دعاءً خاصاً
            </Text>

            <Text style={[styles.popupMotifDivider, { color: theme.goldAccent }]}>
              ◈  ◆  ◈
            </Text>

            <Text style={[styles.popupMessage, { color: theme.textSecondary, marginBottom: 14 }]}>
              اكتب صيغة الذكر أو الدعاء التي ترغب في ترديدها وإضافتها لقائمتك:
            </Text>

            <TextInput
              style={[
                styles.customDhikrInputBox,
                {
                  color: theme.textPrimary,
                  backgroundColor: isDarkMode ? '#0B1A13' : '#F9FCFA',
                  borderColor: theme.cardBorder,
                },
              ]}
              placeholder="مثال: رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ..."
              placeholderTextColor={theme.textSecondary}
              value={customDhikrInput}
              onChangeText={setCustomDhikrInput}
              multiline
              textAlign="right"
              autoFocus
            />

            <View style={styles.popupActionsRow}>
              <TouchableOpacity
                style={[
                  styles.popupActionBtn,
                  { backgroundColor: theme.emeraldLight, borderColor: theme.cardBorder },
                ]}
                onPress={closeAddDhikrModal}
                activeOpacity={0.7}
              >
                <Text style={[styles.popupActionBtnText, { color: theme.textSecondary, fontWeight: '600' }]}>
                  إلغاء
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.popupActionBtn,
                  {
                    backgroundColor: theme.emeraldMain,
                    borderColor: theme.goldAccent,
                    elevation: 4,
                  },
                ]}
                onPress={handleAddCustomDhikr}
                activeOpacity={0.8}
              >
                <Text style={[styles.popupActionBtnText, { color: '#FFFFFF', fontWeight: '800' }]}>
                  حفظ الذكر 🌿
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* شاشة التحميل الإسلامية الترحيبية الكاملة */}
      <Modal
        visible={isAppLoading}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => {}}
      >
        <RNStatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Animated.View
          style={[
            styles.splashOverlay,
            {
              backgroundColor: isDarkMode ? '#07140E' : '#0B3B24',
              opacity: splashFadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.splashContent,
              {
                transform: [{ scale: splashScaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.splashGlowHalo,
                {
                  transform: [{ scale: splashPulseAnim }],
                  backgroundColor: 'rgba(203, 162, 88, 0.15)',
                },
              ]}
            />

            <View style={styles.splashIconCircle}>
              <MaterialCommunityIcons name="beads" size={54} color="#CBA258" />
            </View>

            <Text style={styles.splashTitle}>مُذكِّر وتَسبيح</Text>
            <Text style={styles.splashMotif}>◈  ✦  ◈</Text>
            <Text style={styles.splashVerse}>« أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ »</Text>
            <Text style={styles.splashSubtitle}>حصنك اليومي من الأذكار والتسابيح الصامتة</Text>

            <View style={styles.splashFooter}>
              <ActivityIndicator size="small" color="#CBA258" />
              <Text style={styles.splashLoadingText}>جاري التهيئة المباركة...</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* النافذة المنبثقة الإسلامية الموحدة */}
      <Modal
        visible={customPopup.visible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={hidePopup}
      >
        <View style={styles.popupOverlay}>
          <Animated.View
            style={[
              styles.popupCard,
              {
                backgroundColor: theme.cardBg,
                borderColor:
                  customPopup.type === 'update'
                    ? theme.goldAccent
                    : customPopup.type === 'danger'
                    ? theme.danger
                    : theme.cardBorder,
                opacity: popupFadeAnim,
                transform: [{ scale: popupScaleAnim }],
              },
            ]}
          >
            <View
              style={[
                styles.popupFloatingBadgeHalo,
                {
                  backgroundColor:
                    customPopup.type === 'update'
                      ? 'rgba(203, 162, 88, 0.18)'
                      : customPopup.type === 'danger'
                      ? 'rgba(217, 83, 79, 0.18)'
                      : 'rgba(15, 104, 61, 0.18)',
                },
              ]}
            />

            <View
              style={[
                styles.popupFloatingBadge,
                {
                  backgroundColor:
                    customPopup.type === 'update'
                      ? theme.goldAccent
                      : customPopup.type === 'danger'
                      ? theme.danger
                      : customPopup.type === 'success'
                      ? theme.emeraldMain
                      : theme.emeraldMain,
                  borderColor: isDarkMode ? '#132B20' : '#FFFFFF',
                },
              ]}
            >
              <Ionicons
                name={
                  customPopup.icon
                    ? customPopup.icon
                    : customPopup.type === 'update'
                    ? 'cloud-download-outline'
                    : customPopup.type === 'danger'
                    ? 'alert-circle-outline'
                    : customPopup.type === 'success'
                    ? 'checkmark-outline'
                    : 'information-circle-outline'
                }
                size={28}
                color="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.popupCategoryPill,
                {
                  backgroundColor:
                    customPopup.type === 'update'
                      ? 'rgba(203, 162, 88, 0.15)'
                      : customPopup.type === 'danger'
                      ? 'rgba(217, 83, 79, 0.12)'
                      : 'rgba(15, 104, 61, 0.12)',
                  borderColor:
                    customPopup.type === 'update'
                      ? theme.goldAccent
                      : customPopup.type === 'danger'
                      ? theme.danger
                      : theme.emeraldMain,
                },
              ]}
            >
              <Text
                style={[
                  styles.popupCategoryPillText,
                  {
                    color:
                      customPopup.type === 'update'
                        ? theme.goldAccent
                        : customPopup.type === 'danger'
                        ? theme.danger
                        : theme.emeraldMain,
                  },
                ]}
              >
                {customPopup.type === 'update'
                  ? '✨ تحديث فوري متاح ✨'
                  : customPopup.type === 'danger'
                  ? '⚠️ تأكيد الإجراء ⚠️'
                  : customPopup.type === 'success'
                  ? '🌿 اكتمل بنجاح 🌿'
                  : '✦ تنبيه مُذكِّر ✦'}
              </Text>
            </View>

            <Text style={[styles.popupTitle, { color: theme.textPrimary }]}>
              {customPopup.title}
            </Text>

            <Text style={[styles.popupMotifDivider, { color: theme.goldAccent }]}>
              ◈  ◆  ◈
            </Text>

            <Text style={[styles.popupMessage, { color: theme.textSecondary }]}>
              {customPopup.message}
            </Text>

            <View style={styles.popupActionsRow}>
              {customPopup.buttons.map((btn, index) => {
                const isPrimary = btn.style === 'primary';
                const isDestructive = btn.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.popupActionBtn,
                      isPrimary && {
                        backgroundColor: theme.emeraldMain,
                        borderColor: theme.goldAccent,
                        elevation: 4,
                      },
                      isDestructive && {
                        backgroundColor: theme.danger,
                        borderColor: theme.danger,
                        elevation: 4,
                      },
                      !isPrimary &&
                        !isDestructive && {
                          backgroundColor: theme.emeraldLight,
                          borderColor: theme.cardBorder,
                        },
                    ]}
                    onPress={btn.onPress || hidePopup}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.popupActionBtnText,
                        {
                          color:
                            isPrimary || isDestructive ? '#FFFFFF' : theme.textPrimary,
                          fontWeight: isPrimary || isDestructive ? '800' : '600',
                        },
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerRightBtns: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  updateBadgeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
  },
  updateBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E67E22',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  updateBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row-reverse',
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    gap: 3,
  },
  tabText: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  subTabSwitchContainer: {
    flexDirection: 'row-reverse',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  subTabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  subTabSwitchText: {
    fontSize: 13,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionWrap: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  addDhikrLink: {
    paddingHorizontal: 4,
  },
  addDhikrLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  adhkarScroll: {
    marginHorizontal: -16,
  },
  adhkarScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row-reverse',
  },
  dhikrChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 240,
    gap: 6,
  },
  dhikrChipText: {
    fontSize: 13,
  },
  deleteChipIcon: {
    marginLeft: 4,
  },
  currentDhikrCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginTop: 14,
    alignItems: 'center',
  },
  dhikrCardBadge: {
    backgroundColor: 'rgba(203, 162, 88, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  dhikrCardBadgeText: {
    color: '#CBA258',
    fontSize: 11,
    fontWeight: '700',
  },
  currentDhikrText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  virtueBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  virtueText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  counterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  outerPulseRing: {
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: (width * 0.62) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  innerPulseRing: {
    width: width * 0.54,
    height: width * 0.54,
    borderRadius: (width * 0.54) / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasbeehButton: {
    width: width * 0.46,
    height: width * 0.46,
    borderRadius: (width * 0.46) / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  tapInstructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  counterNumberText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  totalStatsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalStatsLabelWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  totalStatsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalStatsValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  resetButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  qiblaLocationCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  qiblaLocationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qiblaLocationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  qiblaLocationTexts: {
    flex: 1,
    alignItems: 'flex-end',
  },
  qiblaLocationTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  qiblaLocationSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  refreshLocationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextPrayerHeroCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextPrayerHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nextPrayerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextPrayerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  nextPrayerHeroName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  countdownBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  countdownLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginBottom: 4,
  },
  countdownDigits: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
  },
  prayerHeroFooterRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 10,
  },
  prayerHeroTime: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
  prayersListWrap: {
    gap: 8,
  },
  prayerItemCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  prayerItemRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  prayerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerItemName: {
    fontSize: 15,
  },
  nextPrayerTagText: {
    fontSize: 10.5,
    color: '#CBA258',
    fontWeight: '700',
  },
  prayerItemTime: {
    fontSize: 15,
  },
  citiesScrollContent: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  cityChipText: {
    fontSize: 12.5,
  },
  compassContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  qiblaAlignBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  qiblaAlignBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  phoneAimWrapper: {
    alignItems: 'center',
    marginBottom: -6,
    zIndex: 10,
  },
  phoneAimLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  compassDialOuter: {
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: (width * 0.72) / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  compassRotatingDial: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.72) / 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionNorthWrap: {
    position: 'absolute',
    top: 8,
    alignItems: 'center',
  },
  directionNorth: {
    fontSize: 16,
    fontWeight: '900',
  },
  northDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  directionEast: {
    position: 'absolute',
    left: 12,
    fontSize: 14,
    fontWeight: '800',
  },
  directionSouth: {
    position: 'absolute',
    bottom: 10,
    fontSize: 14,
    fontWeight: '800',
  },
  directionWest: {
    position: 'absolute',
    right: 12,
    fontSize: 14,
    fontWeight: '800',
  },
  qiblaPointerWrap: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  qiblaPointerLine: {
    width: 2,
    height: 38,
    backgroundColor: '#CBA258',
    marginTop: 20,
  },
  kaabaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  centerPivotDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CBA258',
  },
  qiblaStatsCard: {
    flexDirection: 'row-reverse',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 14,
    alignItems: 'center',
  },
  qiblaStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  qiblaStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  qiblaStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  qiblaStatDivider: {
    width: 1,
    height: 30,
  },
  qiblaTipCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
  },
  qiblaTipText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
  },
  infoCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  infoDesc: {
    fontSize: 13.5,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 14,
  },
  badgeList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  featurePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfoWrap: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingSubLabel: {
    fontSize: 12,
    marginTop: 3,
    textAlign: 'right',
  },
  intervalOptionsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  intervalChipText: {
    fontSize: 13,
  },
  previewCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  previewHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewAppBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  previewAppName: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewSilentBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewDhikrText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 6,
  },
  previewVirtueText: {
    fontSize: 12.5,
    textAlign: 'right',
    lineHeight: 18,
  },
  previewDivider: {
    height: 1,
    marginVertical: 10,
  },
  previewFootnote: {
    fontSize: 11,
    textAlign: 'right',
  },
  testNotificationBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 4,
  },
  testNotificationBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  checkUpdateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  checkUpdateBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  popupFloatingBadgeHalo: {
    position: 'absolute',
    top: -30,
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  popupFloatingBadge: {
    position: 'absolute',
    top: -26,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCategoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 8,
  },
  popupCategoryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  popupMotifDivider: {
    fontSize: 12,
    marginVertical: 6,
    letterSpacing: 2,
  },
  popupMessage: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  customDhikrInputBox: {
    width: '100%',
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  popupActionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    width: '100%',
  },
  popupActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupActionBtnText: {
    fontSize: 14,
  },
  splashOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  splashContent: {
    alignItems: 'center',
    position: 'relative',
  },
  splashGlowHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -15,
  },
  splashIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: '#CBA258',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  splashMotif: {
    color: '#CBA258',
    fontSize: 14,
    marginVertical: 8,
    letterSpacing: 4,
  },
  splashVerse: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  splashSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 40,
  },
  splashFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  splashLoadingText: {
    color: '#CBA258',
    fontSize: 13,
    fontWeight: '600',
  },
});
