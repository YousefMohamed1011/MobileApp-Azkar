import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Share,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { MORNING_ADHKAR, EVENING_ADHKAR } from '../data/adhkarData';

const STORAGE_KEY_MORNING = '@azkar_morning_counters_v1';
const STORAGE_KEY_EVENING = '@azkar_evening_counters_v1';

export default function MorningEveningScreen({ theme, showPopup }) {
  const [activeTab, setActiveTab] = useState('morning'); // 'morning' | 'evening'
  const [morningCounters, setMorningCounters] = useState({});
  const [eveningCounters, setEveningCounters] = useState({});

  // أنيميشن عند التبديل
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadSavedCounters();
  }, []);

  const loadSavedCounters = async () => {
    try {
      const [savedMorning, savedEvening] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_MORNING),
        AsyncStorage.getItem(STORAGE_KEY_EVENING),
      ]);
      if (savedMorning) setMorningCounters(JSON.parse(savedMorning));
      if (savedEvening) setEveningCounters(JSON.parse(savedEvening));
    } catch (e) {
      console.log('Error loading morning/evening counters', e);
    }
  };

  const saveCounters = async (tab, newCounters) => {
    try {
      if (tab === 'morning') {
        setMorningCounters(newCounters);
        await AsyncStorage.setItem(STORAGE_KEY_MORNING, JSON.stringify(newCounters));
      } else {
        setEveningCounters(newCounters);
        await AsyncStorage.setItem(STORAGE_KEY_EVENING, JSON.stringify(newCounters));
      }
    } catch (e) {
      console.log('Error saving counters', e);
    }
  };

  const switchTab = (newTab) => {
    if (newTab === activeTab) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setActiveTab(newTab);
  };

  const currentList = activeTab === 'morning' ? MORNING_ADHKAR : EVENING_ADHKAR;
  const currentCounters = activeTab === 'morning' ? morningCounters : eveningCounters;

  // الضغط على عداد ذكر معين
  const handleDhikrPress = (dhikr) => {
    const currentVal = currentCounters[dhikr.id] ?? dhikr.count;
    if (currentVal <= 0) return; // مكتمل بالفعل

    const newVal = currentVal - 1;
    const updated = { ...currentCounters, [dhikr.id]: newVal };
    saveCounters(activeTab, updated);

    // إذا اكتمل آخر ذكر في القائمة
    if (newVal === 0) {
      const totalCompleted = currentList.filter(
        (item) => (item.id === dhikr.id ? 0 : (currentCounters[item.id] ?? item.count)) === 0
      ).length;

      if (totalCompleted === currentList.length) {
        showPopup?.({
          type: 'success',
          icon: 'sparkles',
          title: activeTab === 'morning' ? 'تقبل الله أذكار الصباح ☀️' : 'تقبل الله أذكار المساء 🌙',
          message:
            activeTab === 'morning'
              ? 'هنيئاً لك! أتممت قراءة جميع أذكار الصباح كاملة، حفظك الله ورعاك في يومك هذا.'
              : 'هنيئاً لك! أتممت قراءة جميع أذكار المساء كاملة، جعلها الله في ميزان حسناتك وحفظك ليلتك كلها.',
        });
      }
    }
  };

  // إعادة ضبط عدادات التبويب الحالي
  const handleResetCurrent = () => {
    showPopup?.({
      type: 'info',
      icon: 'refresh-circle',
      title: 'إعادة ضبط العدادات',
      message: `هل ترغب في إعادة ضبط عدادات ${activeTab === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'} للبدء من جديد؟`,
      buttons: [
        { text: 'إلغاء', style: 'cancel', onPress: () => {} },
        {
          text: 'نعم، إعادة ضبط',
          style: 'danger',
          onPress: () => {
            const resetObj = {};
            currentList.forEach((item) => {
              resetObj[item.id] = item.count;
            });
            saveCounters(activeTab, resetObj);
          },
        },
      ],
    });
  };

  // مشاركة الذكر
  const handleShareDhikr = async (dhikr) => {
    try {
      await Share.share({
        message: `« ${dhikr.text} »\n\nفضله: ${dhikr.virtue || ''}\n(تكرار: ${dhikr.count} مرات)\n\nمن تطبيق مُذكِّر وتَسبيح 🌿`,
      });
    } catch (_) {}
  };

  // إحصائيات الإنجاز
  const completedCount = currentList.filter(
    (item) => (currentCounters[item.id] ?? item.count) === 0
  ).length;
  const progressPercent = Math.round((completedCount / currentList.length) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* مفتاح التبديل الراقي بين الصباح والمساء */}
      <View
        style={[
          styles.switchContainer,
          { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.switchBtn,
            activeTab === 'morning' && {
              backgroundColor: theme.emeraldMain,
              shadowColor: theme.emeraldMain,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 4,
            },
          ]}
          onPress={() => switchTab('morning')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="sunny"
            size={18}
            color={activeTab === 'morning' ? theme.white : theme.textSecondary}
          />
          <Text
            style={[
              styles.switchText,
              { color: activeTab === 'morning' ? theme.white : theme.textSecondary },
            ]}
          >
            أذكار الصباح
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchBtn,
            activeTab === 'evening' && {
              backgroundColor: theme.emeraldMain,
              shadowColor: theme.emeraldMain,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 4,
            },
          ]}
          onPress={() => switchTab('evening')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="moon"
            size={17}
            color={activeTab === 'evening' ? theme.white : theme.textSecondary}
          />
          <Text
            style={[
              styles.switchText,
              { color: activeTab === 'evening' ? theme.white : theme.textSecondary },
            ]}
          >
            أذكار المساء
          </Text>
        </TouchableOpacity>
      </View>

      {/* بطاقة ملخص الإنجاز والتقدم */}
      <View
        style={[
          styles.progressCard,
          { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
        ]}
      >
        <View style={styles.progressHeader}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
              {activeTab === 'morning' ? 'إنجاز أذكار الصباح ☀️' : 'إنجاز أذكار المساء 🌙'}
            </Text>
            <Text style={[styles.progressSubtitle, { color: theme.textSecondary }]}>
              أنجزت {completedCount} من أصل {currentList.length} أذكار
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.resetBtn,
              { backgroundColor: theme.emeraldLight, borderColor: theme.cardBorder },
            ]}
            onPress={handleResetCurrent}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={theme.emeraldMain} />
            <Text style={[styles.resetBtnText, { color: theme.emeraldMain }]}>إعادة ضبط</Text>
          </TouchableOpacity>
        </View>

        {/* شريط التقدم الفاخر */}
        <View style={[styles.progressBarBg, { backgroundColor: theme.emeraldLight }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: progressPercent === 100 ? '#27AE60' : theme.emeraldMain,
              },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text style={[styles.progressPercent, { color: theme.emeraldMain }]}>
            {progressPercent}% مكتمل
          </Text>
          {progressPercent === 100 && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
              <Text style={styles.completedBadgeText}>أتممت الورد اليومي بنجاح ✨</Text>
            </View>
          )}
        </View>
      </View>

      {/* قائمة بطاقات الأذكار */}
      <Animated.View style={{ opacity: fadeAnim }}>
        {currentList.map((item, index) => {
          const remaining = currentCounters[item.id] ?? item.count;
          const isDone = remaining <= 0;

          return (
            <View
              key={item.id}
              style={[
                styles.dhikrCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: isDone ? '#27AE60' : theme.cardBorder,
                  borderWidth: isDone ? 1.5 : 1,
                },
              ]}
            >
              {/* ترويسة بطاقة الذكر */}
              <View style={styles.dhikrCardHeader}>
                <View style={styles.dhikrIndexBadge}>
                  <Text style={[styles.dhikrIndexText, { color: theme.emeraldMain }]}>
                    #{index + 1}
                  </Text>
                  <Text style={[styles.dhikrTitle, { color: theme.textPrimary }]}>
                    {item.title}
                  </Text>
                </View>

                <View style={styles.headerActionRow}>
                  <TouchableOpacity
                    style={[styles.miniIconBtn, { backgroundColor: theme.emeraldLight }]}
                    onPress={() => handleShareDhikr(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-social-outline" size={16} color={theme.emeraldMain} />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.countTargetBadge,
                      {
                        backgroundColor: isDone ? 'rgba(39, 174, 96, 0.12)' : theme.emeraldLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countTargetText,
                        { color: isDone ? '#27AE60' : theme.emeraldMain },
                      ]}
                    >
                      {item.count > 1 ? `${item.count} مرات` : 'مرة واحدة'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* نص الذكر بالتشكيل الواضح والخط الفاخر */}
              <Text
                style={[
                  styles.dhikrText,
                  { color: theme.textPrimary, lineHeight: 32 },
                ]}
              >
                {item.text}
              </Text>

              {/* صندوق الفضل والسند */}
              {item.virtue && (
                <View
                  style={[
                    styles.virtueBox,
                    {
                      backgroundColor: theme.emeraldLight,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={14}
                    color={theme.goldAccent}
                    style={{ marginLeft: 6, marginTop: 2 }}
                  />
                  <Text style={[styles.virtueText, { color: theme.textSecondary }]}>
                    {item.virtue}
                  </Text>
                </View>
              )}

              {/* زر العد والإنهاء التفاعلي */}
              <TouchableOpacity
                style={[
                  styles.countBtn,
                  isDone
                    ? { backgroundColor: '#27AE60' }
                    : { backgroundColor: theme.emeraldMain },
                ]}
                onPress={() => handleDhikrPress(item)}
                activeOpacity={isDone ? 1 : 0.75}
                disabled={isDone}
              >
                {isDone ? (
                  <View style={styles.doneBtnRow}>
                    <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                    <Text style={styles.doneBtnText}>اكتمل هذا الذكر ✨</Text>
                  </View>
                ) : (
                  <View style={styles.activeBtnRow}>
                    <Text style={styles.activeBtnCount}>{remaining}</Text>
                    <Text style={styles.activeBtnLabel}>اضغط للتسبيح</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  switchContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 5,
    borderWidth: 1,
    marginBottom: 16,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27AE60',
  },
  dhikrCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dhikrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dhikrIndexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dhikrIndexText: {
    fontSize: 14,
    fontWeight: '800',
  },
  dhikrTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTargetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  countTargetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dhikrText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  virtueBox: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  virtueText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    textAlign: 'right',
  },
  countBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  doneBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  activeBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBtnCount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  activeBtnLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
});
