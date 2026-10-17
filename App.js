import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Dimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, Qibla } from 'adhan';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 1. إعداد سلوك الإشعارات لتكون صامتة تماماً (قراءة بصرية فقط بدون صوت أو اهتزاز)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_CHANNEL_ID = 'silent_dhikr_channel_v3';

// إحداثيات الكعبة المشرفة في مكة المكرمة
const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
};

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

// قائمة الأذكار الأساسية الافتراضية
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
  // حالة التطبيق العامة
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('tasbeeh'); // 'tasbeeh' | 'prayers' | 'qibla' | 'notifications'
  
  // حالة السبحة
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [adhkarList, setAdhkarList] = useState(DEFAULT_ADHKAR);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // حالة نافذة إضافة ذكر مخصص
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customDhikrInput, setCustomDhikrInput] = useState('');

  // حالة الإشعارات الصامتة
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationInterval, setNotificationInterval] = useState(15);
  const [testingNotification, setTestingNotification] = useState(false);

  // حالة التحديثات الفورية (OTA Updates)
  const { isUpdateAvailable: isOtaAvailable, isUpdatePending } = Updates.useUpdates();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);

  // حالة الموقع والجغرافيا المشتركة (لمواقيت الصلاة والقبلة)
  const [userCoords, setUserCoords] = useState({ latitude: 30.0444, longitude: 31.2357 }); // القاهرة افتراضياً
  const [cityName, setCityName] = useState('القاهرة، مصر');
  const [locationLoading, setLocationLoading] = useState(false);

  // حالة البوصلة
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

  // حالة النافذة المنبثقة الإسلامية الأنيقة (Custom Beautiful Popup)
  const [customPopup, setCustomPopup] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info', // 'update' | 'success' | 'danger' | 'info'
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

    // إخفاء اللودر بسلاسة بعد اكتمال التهيئة (1.8 ثانية)
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

  // فحص وتطبيق التحديثات الهوائية بعد اختفاء شاشة البداية بالكامل (لتجنب تعارض الـ Modals على أندرويد)
  useEffect(() => {
    if (!isAppLoading) {
      if (isUpdatePending) {
        showRestartPopup();
      } else {
        checkForAppUpdates(false);
      }
    }
  }, [isAppLoading]);

  // إظهار نافذة إعادة التشغيل فور اكتمال تنزيل التحديث في الخلفية في أي وقت
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

  // تشغيل مستشعر البوصلة وتحديد القبلة بدقة عالية
  useEffect(() => {
    let headingSub = null;
    let magnetometerSub = null;
    let isSubscribed = true;

    if (activeTab === 'qibla') {
      const initCompass = async () => {
        try {
          // 1. محاولة استخدام مستشعر البوصلة المدمج من expo-location (دقة عالية وتصحيح انحراف)
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

          // 2. إذا لم تتوفر الصلاحية أو لم يدعم الهاتف watchHeading، نستخدم Magnetometer مع تصحيح المحاور
          const available = await Magnetometer.isAvailableAsync();
          if (!isSubscribed) return;
          setHasMagnetometer(available);
          if (available) {
            Magnetometer.setUpdateInterval(80);
            magnetometerSub = Magnetometer.addListener((data) => {
              if (!isSubscribed) return;
              let { x, y } = data;
              // في هواتف أندرويد وآيفون: المحور Y للأعلى والمحور X لليمين
              // الزاوية باتجاه عقارب الساعة من الشمال: Math.atan2(-x, y)
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
  }, [activeTab]);

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

  // تحديث جدولة الإشعارات عند تغيير الإعدادات
  useEffect(() => {
    if (notificationsEnabled) {
      scheduleRotatingNotifications(notificationInterval, adhkarList);
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

  // تهيئة قناة الإشعارات الصامتة
  const setupNotificationSystem = async () => {
    try {
      if (Platform.OS === 'android') {
        // حذف القنوات القديمة حتى لا يحتفظ نظام أندرويد بإعدادات الاهتزاز السابقة
        try {
          await Notifications.deleteNotificationChannelAsync('silent_dhikr_channel');
          await Notifications.deleteNotificationChannelAsync('silent_dhikr_channel_v2');
        } catch (_) {}

        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
          name: 'الأذكار والتسابيح الصامتة',
          description: 'تنبيهات صامتة بالذكر تظهر على الشاشة بهدوء تام دون أي صوت أو اهتزاز نهائياً',
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

      if (finalStatus !== 'granted') {
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.log('Error setting up notification channel', error);
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

      const { latitude, longitude } = loc.coords;
      setUserCoords({ latitude, longitude });

      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
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

      // اختيار المعيار الحسابي الأنسب جغرافياً
      let params = CalculationMethod.MuslimWorldLeague();
      if (lat >= 20 && lat <= 32 && lng >= 25 && lng <= 36) {
        // مصر وشمال إفريقيا
        params = CalculationMethod.Egyptian();
      } else if (lat >= 16 && lat <= 32 && lng >= 36 && lng <= 60) {
        // شبه الجزيرة العربية والخليج
        params = CalculationMethod.UmmAlQura();
      }

      const prayerTimes = new PrayerTimes(coordinates, date, params);
      setPrayerTimesData(prayerTimes);
      updatePrayerCountdown(prayerTimes);

      // حساب زاوية القبلة الدقيقة فلكياً باستخدام خوارزمية adhan المعتمدة
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

    // إذا انتهت صلوات اليوم، فالصلاة القادمة هي فجر الغد
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

  // تنسيق الوقت باللغة العربية (مثال: 04:30 ص)
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

  // نافذة منبثقة فاخرة لتأكيد إعادة التشغيل بعد اكتمال التحديث
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

  // فحص وتطبيق التحديثات الهوائية الفورية
  const checkForAppUpdates = async (showAlertIfNoUpdate = true) => {
    if (__DEV__) {
      if (showAlertIfNoUpdate) {
        showPopup({
          type: 'info',
          icon: 'code-working-outline',
          title: 'وضع التطوير',
          message: 'ميزة التحديثات الفورية التلقائية تعمل داخل ملف الـ APK المثبت على الهاتف وليس داخل بيئة التطوير.',
        });
      }
      return;
    }

    // إذا كان التحديث قد تم تنزيله وجاهزاً لإعادة التشغيل
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
          // إذا ضغط المستخدم يدوياً على زر فحص التحديثات
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
          // عند الفحص التلقائي بعد فتح التطبيق: نبدأ التنزيل في الخلفية مباشرةً ليظهر له بوب اب إعادة التشغيل فور انتهائه
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

  // تنزيل وتثبيت التحديث وإظهار نافذة إعادة التشغيل مباشرة فور اكتماله
  const downloadAndApplyUpdate = async (showAlertOnError = true) => {
    if (__DEV__) return;
    try {
      setIsDownloadingUpdate(true);
      await Updates.fetchUpdateAsync();
      showRestartPopup();
    } catch (error) {
      console.log('Update fetch error:', error);
      if (isUpdatePending) {
        showRestartPopup();
        return;
      }
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

  // إلغاء كل الإشعارات
  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.log('Error canceling notifications', e);
    }
  };

  // دالة تنسيق الإشعار ليظهر بشكل إسلامي فخم وبسيط ومريح للعين صامت تماماً بدون صوت أو اهتزاز
  const getDhikrNotificationContent = (dhikrItem) => {
    return {
      title: `« ${dhikrItem.text} »`,
      body: dhikrItem.virtue ? `✨ ${dhikrItem.virtue}` : '🌿 أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      sound: false,
      channelId: NOTIFICATION_CHANNEL_ID,
      priority: Notifications.AndroidNotificationPriority.LOW,
      color: '#0F683D',
    };
  };

  // جدولة إشعارات دورية بتصميم إسلامي راقي وبسيط
  const scheduleRotatingNotifications = async (minutes, list) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!list || list.length === 0) return;

      const intervalSec = Math.max(60, minutes * 60);

      // جدولة مسبقة لـ 20 إشعاراً قادماً لضمان تنوع الذكر في كل مرة
      for (let i = 1; i <= 20; i++) {
        const dhikrItem = list[(i - 1) % list.length];
        await Notifications.scheduleNotificationAsync({
          content: getDhikrNotificationContent(dhikrItem),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval',
            seconds: intervalSec * i,
            repeats: false,
          },
        });
      }
    } catch (error) {
      console.log('Error scheduling rotating notifications', error);
    }
  };

  // تجربة الإشعار الصامت الآن
  const handleTestNotification = async () => {
    try {
      setTestingNotification(true);
      const currentDhikr = adhkarList[selectedIndex] || DEFAULT_ADHKAR[0];

      await Notifications.scheduleNotificationAsync({
        content: getDhikrNotificationContent(currentDhikr),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval',
          seconds: 2,
          repeats: false,
        },
      });

      setTimeout(() => {
        setTestingNotification(false);
        showPopup({
          type: 'success',
          icon: 'notifications-circle-outline',
          title: 'تم إرسال الإشعار بنجاح ✨',
          message: 'تفقد شريط الإشعارات بالأعلى لترى التنسيق الجديد الأنيق والبسيط للذكر وفضله بهدوء تام دون صوت أو اهتزاز.',
        });
      }, 2500);
    } catch (e) {
      setTestingNotification(false);
      showPopup({
        type: 'danger',
        icon: 'alert-circle-outline',
        title: 'خطأ',
        message: 'يرجى التأكد من تفعيل صلاحيات الإشعارات للتطبيق.',
      });
    }
  };

  // تفعيل/تعطيل الإشعارات
  const handleToggleNotifications = async (val) => {
    if (val) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        showPopup({
          type: 'info',
          icon: 'notifications-off-outline',
          title: 'تنبيه الصلاحيات',
          message: 'يرجى السماح للتطبيق بإرسال الإشعارات حتى يعمل التذكير البصري الصامت.',
        });
        setNotificationsEnabled(false);
        AsyncStorage.setItem(STORAGE_KEYS.NOTIF_ENABLED, JSON.stringify(false));
        return;
      }
    }
    setNotificationsEnabled(val);
    AsyncStorage.setItem(STORAGE_KEYS.NOTIF_ENABLED, JSON.stringify(val));
  };

  // تغيير فترة التكرار
  const handleSelectInterval = (min) => {
    setNotificationInterval(min);
    AsyncStorage.setItem(STORAGE_KEYS.NOTIF_INTERVAL, min.toString());
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

  // تصفير الإجمالي الكلي مع تأكيد
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

  // سمات الألوان
  const theme = {
    bg: isDarkMode ? '#0B1A13' : '#F4F8F5',
    cardBg: isDarkMode ? '#132B20' : '#FFFFFF',
    cardBorder: isDarkMode ? '#1F4031' : '#E2EBE5',
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

      {/* شريط تنبيه إذا كان هناك تحديث جديد متاح أو قيد التنزيل أو جاهز لإعادة التشغيل */}
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
              : 'تحديث جديد متاح! اضغط هنا للتطبيق الفوري دون حذف التطبيق'}
          </Text>
        </TouchableOpacity>
      )}

      {/* شريط التنقل بين التبويبات الأربعة */}
      <View style={[styles.tabBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
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
            style={[
              styles.tabText,
              { color: activeTab === 'tasbeeh' ? theme.white : theme.textSecondary },
            ]}
          >
            السبحة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'prayers' && { backgroundColor: theme.emeraldMain },
          ]}
          onPress={() => setActiveTab('prayers')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="mosque"
            size={16}
            color={activeTab === 'prayers' ? theme.white : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'prayers' ? theme.white : theme.textSecondary },
            ]}
          >
            الصلوات
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'qibla' && { backgroundColor: theme.emeraldMain },
          ]}
          onPress={() => setActiveTab('qibla')}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="compass"
            size={15}
            color={activeTab === 'qibla' ? theme.white : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'qibla' ? theme.white : theme.textSecondary },
            ]}
          >
            القبلة
          </Text>
        </TouchableOpacity>

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
              <TouchableOpacity
                onPress={openAddDhikrModal}
                style={styles.addDhikrLink}
              >
                <Text style={[styles.addDhikrLinkText, { color: theme.emeraldMain }]}>
                  + إضافة ذكر
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
              <Text style={styles.dhikrCardBadgeText}>الذكر الحالي</Text>
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

      {/* 2. تبويب مواقيت الصلاة الدقيقة والعد التنازلي الحي */}
      {activeTab === 'prayers' && (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* شريط المدينة والموقع الحالي مع زر التحديث */}
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

          {/* قائمة مواقيت الصلوات الخمس مع الشروق */}
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
                    </View>

                    <Text
                      style={[
                        styles.prayerItemTime,
                        {
                          color: isNext ? theme.emeraldMain : theme.textPrimary,
                          fontWeight: isNext ? '800' : '700',
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

          {/* اختيار سريع للمدينة */}
          <View
            style={[
              styles.presetCitiesCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, marginTop: 14 },
            ]}
          >
            <Text style={[styles.presetCitiesTitle, { color: theme.textPrimary }]}>
              تغيير المدينة يدوياً:
            </Text>
            <View style={styles.citiesGrid}>
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
            </View>
          </View>
        </ScrollView>
      )}

      {/* 3. تبويب اتجاه القبلة الذكية */}
      {activeTab === 'qibla' && (
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
            {/* شارة التوجيه الديناميكية الذكية */}
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

            {/* سهم مقدمة الهاتف الثابت في الأعلى */}
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

            {/* قرص البوصلة الذي يدور ليطابق الاتجاهات الجغرافية الواقعية */}
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
                {/* علامة الشمال باللون الأحمر البارز */}
                <View style={styles.directionNorthWrap}>
                  <Text style={[styles.directionNorth, { color: theme.danger }]}>ش</Text>
                  <View style={[styles.northDot, { backgroundColor: theme.danger }]} />
                </View>

                {/* باقي الاتجاهات الشرق، الجنوب، الغرب */}
                <Text style={[styles.directionEast, { color: theme.textSecondary }]}>ق</Text>
                <Text style={[styles.directionSouth, { color: theme.textSecondary }]}>ج</Text>
                <Text style={[styles.directionWest, { color: theme.textSecondary }]}>غ</Text>

                {/* مؤشر الكعبة الشريفة الثابت على قرص البوصلة عند زاوية القبلة لمدينتك */}
                <View
                  style={[
                    styles.kaabaNeedleContainer,
                    {
                      transform: [{ rotate: `${qiblaAngle}deg` }],
                    },
                  ]}
                >
                  <View style={styles.kaabaPointerWrap}>
                    <View
                      style={[
                        styles.kaabaIconBox,
                        isFacingQibla && {
                          backgroundColor: '#0F683D',
                          borderColor: theme.goldAccent,
                          elevation: 6,
                        },
                      ]}
                    >
                      <Text style={styles.kaabaEmoji}>🕋</Text>
                    </View>
                    <View
                      style={[
                        styles.pointerNeedle,
                        {
                          backgroundColor: isFacingQibla ? theme.goldAccent : '#CBA258',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* المركز الأنيق للبوصلة */}
                <View
                  style={[
                    styles.compassCenterPivot,
                    {
                      backgroundColor: isFacingQibla ? '#0F683D' : theme.cardBg,
                      borderColor: theme.goldAccent,
                    },
                  ]}
                >
                  <Ionicons
                    name="compass"
                    size={22}
                    color={isFacingQibla ? '#FFFFFF' : theme.goldAccent}
                  />
                </View>
              </View>
            </View>

            {/* بطاقات البيانات الرقمية التوضيحية */}
            <View style={styles.qiblaStatsRow}>
              <View
                style={[
                  styles.qiblaStatCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                ]}
              >
                <Text style={[styles.qiblaStatTitle, { color: theme.textSecondary }]}>
                  زاوية القبلة
                </Text>
                <Text style={[styles.qiblaStatValue, { color: theme.emeraldMain }]}>
                  {qiblaAngle}°
                </Text>
                <Text style={[styles.qiblaStatSub, { color: theme.textSecondary }]}>
                  {qiblaAngle >= 90 && qiblaAngle <= 180
                    ? 'جنوب شرق'
                    : qiblaAngle > 180 && qiblaAngle <= 270
                    ? 'جنوب غرب'
                    : 'شمال'}
                </Text>
              </View>

              <View
                style={[
                  styles.qiblaStatCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                ]}
              >
                <Text style={[styles.qiblaStatTitle, { color: theme.textSecondary }]}>
                  اتجاه الهاتف
                </Text>
                <Text
                  style={[
                    styles.qiblaStatValue,
                    { color: isFacingQibla ? theme.emeraldMain : theme.textPrimary },
                  ]}
                >
                  {heading}°
                </Text>
                <Text style={[styles.qiblaStatSub, { color: theme.textSecondary }]}>
                  {heading >= 338 || heading < 23
                    ? 'شمال'
                    : heading >= 23 && heading < 68
                    ? 'شمال شرق'
                    : heading >= 68 && heading < 113
                    ? 'شرق'
                    : heading >= 113 && heading < 158
                    ? 'جنوب شرق'
                    : heading >= 158 && heading < 203
                    ? 'جنوب'
                    : heading >= 203 && heading < 248
                    ? 'جنوب غرب'
                    : heading >= 248 && heading < 293
                    ? 'غرب'
                    : 'شمال غرب'}
                </Text>
              </View>
            </View>

            {/* تلميح المعايرة لضمان أعلى دقة */}
            <View
              style={[
                styles.calibrationTipCard,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
              ]}
            >
              <MaterialCommunityIcons name="rotate-3d-variant" size={20} color={theme.goldAccent} />
              <Text style={[styles.calibrationTipText, { color: theme.textSecondary }]}>
                للحصول على أعلى دقة: احمل الهاتف أفقياً بعيداً عن المعادن، وحركه على شكل (∞) لمعايرة الحساسات.
              </Text>
            </View>

            {!hasMagnetometer && (
              <View style={[styles.sensorWarningBox, { backgroundColor: theme.dangerBg }]}>
                <Ionicons name="warning-outline" size={16} color={theme.danger} />
                <Text style={[styles.sensorWarningText, { color: theme.danger }]}>
                  جهازك لا يحتوي على مستشعر بوصلة مغناطيسي مدمج. يمكنك الاستعانة بزاوية القبلة الموضحة أعلاه ({qiblaAngle}°) لتحديد الاتجاه يدوياً.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* 4. تبويب التذكير الصامت */}
      {activeTab === 'notifications' && (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.infoTitleRow}>
              <Ionicons name="eye-outline" size={26} color={theme.emeraldMain} />
              <Text style={[styles.infoTitle, { color: theme.emeraldMain }]}>
                نظام التذكير الصامت (قراءة نظر فقط)
              </Text>
            </View>
            <Text style={[styles.infoDesc, { color: theme.textPrimary }]}>
              صُمم هذا النظام ليُظهر لك الأذكار على شاشة هاتفك بهدوء تام دون صوت ودون اهتزاز وبنص الذكر فقط، لتستمر
              في ذكر الله أثناء عملك أو دراستك أو وجودك في الاجتماعات والمجالس دون أن تُحدث أي إزعاج.
            </Text>

            <View style={[styles.badgeList, { borderTopColor: theme.cardBorder }]}>
              <View style={[styles.featurePill, { backgroundColor: theme.emeraldLight }]}>
                <Ionicons name="volume-mute-outline" size={15} color={theme.emeraldMain} />
                <Text style={[styles.featurePillText, { color: theme.emeraldMain }]}>
                  صوت معطّل نهائياً
                </Text>
              </View>
              <View style={[styles.featurePill, { backgroundColor: theme.emeraldLight }]}>
                <MaterialCommunityIcons name="vibrate-off" size={15} color={theme.emeraldMain} />
                <Text style={[styles.featurePillText, { color: theme.emeraldMain }]}>
                  اهتزاز معطّل نهائياً
                </Text>
              </View>
              <View style={[styles.featurePill, { backgroundColor: theme.emeraldLight }]}>
                <Ionicons name="sync-outline" size={15} color={theme.emeraldMain} />
                <Text style={[styles.featurePillText, { color: theme.emeraldMain }]}>
                  تبديل دوري للذكر
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.settingCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfoWrap}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                  تفعيل الإشعارات الصامتة
                </Text>
                <Text style={[styles.settingSubLabel, { color: theme.textSecondary }]}>
                  {notificationsEnabled
                    ? 'التذكير قيد العمل بصمت كل ' + notificationInterval + ' دقيقة'
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

          <View
            style={[
              styles.settingCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.settingLabel, { color: theme.textPrimary, marginBottom: 12 }]}>
              تكرار التذكير كل:
            </Text>
            <View style={styles.intervalOptionsRow}>
              {[5, 15, 30, 60].map((min) => {
                const isSelected = notificationInterval === min;
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
                      {min === 60 ? 'ساعة' : `${min} دقائق`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.settingCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfoWrap}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                  تحديثات التطبيق الفورية (OTA)
                </Text>
                <Text style={[styles.settingSubLabel, { color: theme.textSecondary }]}>
                  يمكنك فحص وتنزيل أي تحديثات جديدة بضغطة زر دون حذف التطبيق
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
                ? 'جاري إرسال الإشعار بعد ثانيتين...'
                : 'تجربة الإشعار الصامت الآن'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.testHint, { color: theme.textSecondary }]}>
            * سيظهر إشعار صامت بنص الذكر فقط بهدوء في شريط الإشعارات بعد ثانيتين للتأكد من خلوه من أي صوت أو اهتزاز.
          </Text>
        </ScrollView>
      )}

      {/* نافذة منبثقة لإضافة ذكر مخصص بتصميم إسلامي فاخر مطابق للتحديثات */}
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
            {/* هالة التوهج الخارجية للأيقونة */}
            <View
              style={[
                styles.popupFloatingBadgeHalo,
                { backgroundColor: 'rgba(203, 162, 88, 0.18)' },
              ]}
            />

            {/* الأيقونة العلوية الطافية */}
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

            {/* وسام الفئة */}
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

            {/* عنوان النافذة */}
            <Text style={[styles.popupTitle, { color: theme.textPrimary }]}>
              أضف ذكراً أو دعاءً خاصاً
            </Text>

            {/* الزخرفة الهندسية الفاصلة */}
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

      {/* شاشة التحميل الإسلامية بكامل مساحة الشاشة (Full-Screen Animated Splash Loader) */}
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
            {/* حلقة التوهج المحيطة بالشعار */}
            <Animated.View
              style={[
                styles.splashRingOuter,
                {
                  transform: [{ scale: splashPulseAnim }],
                },
              ]}
            >
              <View style={styles.splashRingInner}>
                <MaterialCommunityIcons name="beads" size={54} color="#CBA258" />
              </View>
            </Animated.View>

            {/* نصوص الشعار */}
            <Text style={styles.splashTitle}>مُذكِّر وتَسبيح</Text>
            <Text style={styles.splashVerse}>﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾</Text>

            {/* شريط التحميل الأنيق */}
            <View style={styles.splashLoadingWrap}>
              <ActivityIndicator size="small" color="#CBA258" />
              <Text style={styles.splashLoadingText}>جاري تهيئة الأذكار والمواقيت...</Text>
            </View>
          </Animated.View>

          {/* البسملة في الأسفل */}
          <View style={styles.splashFooter}>
            <Text style={styles.splashBismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          </View>
        </Animated.View>
      </Modal>

      {/* نافذة منبثقة إسلامية مخصصة وفخمة جداً (Custom Islamic Alert / Popup Modal) */}
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
            {/* هالة التوهج الخارجية للأيقونة */}
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

            {/* الأيقونة العلوية الطافية */}
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

            {/* وسام / شارة فئة التنبيه */}
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

            {/* عنوان التنبيه */}
            <Text style={[styles.popupTitle, { color: theme.textPrimary }]}>
              {customPopup.title}
            </Text>

            {/* الزخرفة الهندسية الفاصلة */}
            <Text style={[styles.popupMotifDivider, { color: theme.goldAccent }]}>
              ◈  ◆  ◈
            </Text>

            {/* نص التنبيه */}
            <Text style={[styles.popupMessage, { color: theme.textSecondary }]}>
              {customPopup.message}
            </Text>

            {/* أزرار التفاعل المنسقة */}
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
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  tabText: {
    fontSize: 12,
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
  },
  dhikrChipText: {
    fontSize: 13,
  },
  deleteChipIcon: {
    marginRight: 6,
  },
  currentDhikrCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  dhikrCardBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#CBA258',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dhikrCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  currentDhikrText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 4,
  },
  virtueBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
    width: '100%',
  },
  virtueText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
    lineHeight: 18,
  },
  counterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  outerPulseRing: {
    width: width * 0.65,
    height: width * 0.65,
    maxWidth: 260,
    maxHeight: 260,
    borderRadius: 130,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerPulseRing: {
    width: '90%',
    height: '90%',
    borderRadius: 120,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasbeehButton: {
    width: width * 0.52,
    height: width * 0.52,
    maxWidth: 210,
    maxHeight: 210,
    borderRadius: 105,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    elevation: 8,
    shadowColor: '#0F683D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  tapInstructionText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  counterNumberText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 1,
    marginVertical: 2,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    gap: 6,
  },
  totalStatsLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalStatsValue: {
    fontSize: 22,
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
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // أنماط بطاقة الصلاة القادمة
  nextPrayerHeroCard: {
    borderRadius: 18,
    padding: 18,
    marginVertical: 12,
    borderWidth: 1.5,
    elevation: 5,
    shadowColor: '#0F683D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextPrayerHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPrayerBadge: {
    backgroundColor: '#CBA258',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nextPrayerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  nextPrayerHeroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  countdownBox: {
    alignItems: 'center',
    marginVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  countdownLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  countdownDigits: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // قائمة الصلوات
  prayersListWrap: {
    gap: 8,
  },
  prayerItemCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  prayerItemRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
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
  prayerItemTime: {
    fontSize: 16,
  },
  // أنماط القبلة
  qiblaLocationCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 6,
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
    backgroundColor: 'rgba(15, 104, 61, 0.1)',
  },
  qiblaLocationTexts: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
    marginLeft: 10,
  },
  qiblaLocationTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  qiblaLocationSub: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshLocationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  qiblaAlignBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginBottom: 10,
    borderWidth: 1.2,
    maxWidth: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qiblaAlignBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneAimWrapper: {
    alignItems: 'center',
    marginBottom: 2,
  },
  phoneAimLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: -4,
  },
  compassDialOuter: {
    width: width * 0.74,
    height: width * 0.74,
    maxWidth: 290,
    maxHeight: 290,
    borderRadius: 145,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  compassRotatingDial: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  directionEast: {
    position: 'absolute',
    right: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  directionSouth: {
    position: 'absolute',
    bottom: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  directionWest: {
    position: 'absolute',
    left: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  kaabaNeedleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaabaPointerWrap: {
    position: 'absolute',
    top: 14,
    alignItems: 'center',
  },
  kaabaIconBox: {
    backgroundColor: '#0F683D',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBA258',
    elevation: 4,
  },
  kaabaEmoji: {
    fontSize: 18,
  },
  pointerNeedle: {
    width: 3.5,
    height: 58,
    borderRadius: 2,
    marginTop: 2,
  },
  compassCenterPivot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  qiblaStatsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 18,
    width: '100%',
    maxWidth: 340,
  },
  qiblaStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  qiblaStatTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  qiblaStatValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  qiblaStatSub: {
    fontSize: 11,
    marginTop: 2,
  },
  calibrationTipCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    maxWidth: 340,
  },
  calibrationTipText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
  },
  sensorWarningBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
    maxWidth: 340,
  },
  sensorWarningText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
  },
  presetCitiesCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  presetCitiesTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'right',
  },
  citiesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  cityChipText: {
    fontSize: 12,
  },
  // أنماط التذكير الصامت
  infoCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoDesc: {
    fontSize: 13.5,
    lineHeight: 22,
    textAlign: 'right',
  },
  badgeList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  featurePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  featurePillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  settingCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 14,
  },
  settingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfoWrap: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  settingSubLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  checkUpdateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  checkUpdateBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  intervalOptionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  intervalChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  intervalChipText: {
    fontSize: 13,
  },
  testNotificationBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
    borderWidth: 1.5,
    elevation: 3,
  },
  testNotificationBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  testHint: {
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  // أنماط شاشة البداية الإسلامية كاملة الشاشة (Splash Loader)
  splashOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashRingOuter: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: 'rgba(203, 162, 88, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(203, 162, 88, 0.05)',
  },
  splashRingInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: '#CBA258',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 104, 61, 0.4)',
    elevation: 8,
    shadowColor: '#CBA258',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  splashTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  splashVerse: {
    color: '#CBA258',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 28,
  },
  splashLoadingWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(203, 162, 88, 0.25)',
  },
  splashLoadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  splashFooter: {
    position: 'absolute',
    bottom: 36,
  },
  splashBismillah: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // أنماط النوافذ المنبثقة الإسلامية الفاخرة (Custom Islamic Popups)
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  popupCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 46,
    paddingBottom: 22,
    borderWidth: 1.8,
    alignItems: 'center',
    position: 'relative',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  popupFloatingBadgeHalo: {
    position: 'absolute',
    top: -42,
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  popupFloatingBadge: {
    position: 'absolute',
    top: -33,
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  popupCategoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  popupCategoryPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  popupMotifDivider: {
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 10,
    opacity: 0.85,
  },
  popupTitle: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  popupMessage: {
    fontSize: 13.5,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  popupActionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    width: '100%',
  },
  popupActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  popupActionBtnText: {
    fontSize: 14,
  },
  customDhikrInputBox: {
    width: '100%',
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    fontSize: 14.5,
    lineHeight: 22,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
});
