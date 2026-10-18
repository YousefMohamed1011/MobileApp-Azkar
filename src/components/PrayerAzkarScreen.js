import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PRAYER_SPECIFIC_ADHKAR } from '../data/adhkarData';

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function PrayerAzkarScreen({ theme, showPopup, defaultPrayer = 'fajr' }) {
  const [selectedPrayer, setSelectedPrayer] = useState(
    PRAYER_KEYS.includes(defaultPrayer) ? defaultPrayer : 'fajr'
  );
  const [prayerCounters, setPrayerCounters] = useState({});

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadCounters();
  }, [selectedPrayer]);

  const getStorageKey = (key) => `@azkar_prayer_${key}_counters_v1`;

  const loadCounters = async () => {
    try {
      const data = await AsyncStorage.getItem(getStorageKey(selectedPrayer));
      if (data) {
        setPrayerCounters(JSON.parse(data));
      } else {
        setPrayerCounters({});
      }
    } catch (e) {
      console.log('Error loading prayer counters', e);
    }
  };

  const saveCounters = async (newCounters) => {
    try {
      setPrayerCounters(newCounters);
      await AsyncStorage.setItem(getStorageKey(selectedPrayer), JSON.stringify(newCounters));
    } catch (e) {
      console.log('Error saving prayer counters', e);
    }
  };

  const switchPrayer = (key) => {
    if (key === selectedPrayer) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setSelectedPrayer(key);
  };

  const currentPrayerData = PRAYER_SPECIFIC_ADHKAR[selectedPrayer] || PRAYER_SPECIFIC_ADHKAR.fajr;
  const currentList = currentPrayerData.adhkar;

  // الضغط على عداد الذكر
  const handleDhikrPress = (dhikr) => {
    const currentVal = prayerCounters[dhikr.id] ?? dhikr.count;
    if (currentVal <= 0) return;

    const newVal = currentVal - 1;
    const updated = { ...prayerCounters, [dhikr.id]: newVal };
    saveCounters(updated);

    if (newVal === 0) {
      const totalDone = currentList.filter(
        (item) => (item.id === dhikr.id ? 0 : (prayerCounters[item.id] ?? item.count)) === 0
      ).length;

      if (totalDone === currentList.length) {
        showPopup?.({
          type: 'success',
          icon: 'sparkles',
          title: `تقبل الله صلاتك وذكرك 🕌`,
          message: `هنيئاً لك! أتممت أذكار ما بعد ${currentPrayerData.prayerName} كاملة، تقبل الله منا ومنكم صالح الأعمال.`,
        });
      }
    }
  };

  // إعادة ضبط عدادات هذه الصلاة
  const handleResetPrayer = () => {
    showPopup?.({
      type: 'info',
      icon: 'refresh-circle',
      title: 'إعادة ضبط أذكار الصلاة',
      message: `هل ترغب في إعادة ضبط عدادات أذكار ${currentPrayerData.prayerName}؟`,
      buttons: [
        { text: 'إلغاء', style: 'cancel', onPress: () => {} },
        {
          text: 'إعادة ضبط',
          style: 'danger',
          onPress: () => {
            const resetObj = {};
            currentList.forEach((item) => {
              resetObj[item.id] = item.count;
            });
            saveCounters(resetObj);
          },
        },
      ],
    });
  };

  // مشاركة الذكر
  const handleShareDhikr = async (dhikr) => {
    try {
      await Share.share({
        message: `« ${dhikr.text} »\n\nمن أذكار ${currentPrayerData.prayerName}\nفضله: ${dhikr.virtue || ''}\n\nتطبيق مُذكِّر وتَسبيح 🌿`,
      });
    } catch (_) {}
  };

  const completedCount = currentList.filter(
    (item) => (prayerCounters[item.id] ?? item.count) === 0
  ).length;
  const progressPercent = Math.round((completedCount / currentList.length) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* شريط اختيار الصلوات الخمس الفاخر */}
      <View
        style={[
          styles.prayerTabsWrap,
          { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prayerTabsScroll}
        >
          {PRAYER_KEYS.map((key) => {
            const isSelected = selectedPrayer === key;
            const pData = PRAYER_SPECIFIC_ADHKAR[key];

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.prayerTabItem,
                  {
                    backgroundColor: isSelected ? theme.emeraldMain : 'transparent',
                    borderColor: isSelected ? theme.emeraldMain : theme.cardBorder,
                  },
                ]}
                onPress={() => switchPrayer(key)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={pData.icon}
                  size={18}
                  color={isSelected ? theme.white : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.prayerTabText,
                    {
                      color: isSelected ? theme.white : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {pData.prayerName.replace('صلاة ', '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* بطاقة معلومات الصلاة والتقدم */}
      <View
        style={[
          styles.infoCard,
          { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
        ]}
      >
        <View style={styles.infoHeader}>
          <View style={styles.infoRight}>
            <View style={styles.prayerBadgeRow}>
              <View
                style={[
                  styles.prayerMainBadge,
                  { backgroundColor: theme.emeraldLight },
                ]}
              >
                <MaterialCommunityIcons
                  name={currentPrayerData.icon}
                  size={16}
                  color={theme.emeraldMain}
                />
                <Text style={[styles.prayerBadgeText, { color: theme.emeraldMain }]}>
                  {currentPrayerData.badge}
                </Text>
              </View>
            </View>

            <Text style={[styles.prayerMainTitle, { color: theme.textPrimary }]}>
              {currentPrayerData.prayerName}
            </Text>
            <Text style={[styles.prayerDescription, { color: theme.textSecondary }]}>
              {currentPrayerData.description}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.resetBtn,
              { backgroundColor: theme.emeraldLight, borderColor: theme.cardBorder },
            ]}
            onPress={handleResetPrayer}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={theme.emeraldMain} />
            <Text style={[styles.resetBtnText, { color: theme.emeraldMain }]}>إعادة</Text>
          </TouchableOpacity>
        </View>

        {/* شريط الإنجاز */}
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
            {completedCount} من {currentList.length} أذكار مكتملة ({progressPercent}%)
          </Text>
          {progressPercent === 100 && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
              <Text style={styles.completedBadgeText}>أتممت أذكار الصلاة ✨</Text>
            </View>
          )}
        </View>
      </View>

      {/* قائمة أذكار الصلاة المختارة */}
      <Animated.View style={{ opacity: fadeAnim }}>
        {currentList.map((item, index) => {
          const remaining = prayerCounters[item.id] ?? item.count;
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
              {/* ترويسة الذكر مع تمييز الأذكار الخاصة بكل صلاة */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderRight}>
                  <Text style={[styles.itemNumber, { color: theme.emeraldMain }]}>
                    #{index + 1}
                  </Text>
                  <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                    {item.title}
                  </Text>
                </View>

                <View style={styles.headerTagsRow}>
                  {item.isSpecial && (
                    <View
                      style={[
                        styles.specialBadge,
                        { backgroundColor: 'rgba(203, 162, 88, 0.15)' },
                      ]}
                    >
                      <Ionicons name="star" size={12} color={theme.goldAccent} />
                      <Text style={[styles.specialBadgeText, { color: theme.goldAccent }]}>
                        خاص بالصلاة
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.shareBtn, { backgroundColor: theme.emeraldLight }]}
                    onPress={() => handleShareDhikr(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-social-outline" size={15} color={theme.emeraldMain} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* نص الذكر الفاخر بالتشكيل */}
              <Text
                style={[
                  styles.dhikrText,
                  { color: theme.textPrimary, lineHeight: 32 },
                ]}
              >
                {item.text}
              </Text>

              {/* الفضل والسند النبوي */}
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
                    name="book-open-page-variant"
                    size={14}
                    color={theme.goldAccent}
                    style={{ marginLeft: 6, marginTop: 2 }}
                  />
                  <Text style={[styles.virtueText, { color: theme.textSecondary }]}>
                    {item.virtue}
                  </Text>
                </View>
              )}

              {/* زر العد التفاعلي */}
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
                    <Text style={styles.doneBtnText}>تم الذكر بنجاح ✨</Text>
                  </View>
                ) : (
                  <View style={styles.activeBtnRow}>
                    <Text style={styles.activeBtnCount}>{remaining}</Text>
                    <Text style={styles.activeBtnLabel}>
                      {remaining > 1 ? 'متبقي للتسبيح' : 'اضغط للإنهاء'}
                    </Text>
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
  prayerTabsWrap: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 6,
    marginBottom: 16,
  },
  prayerTabsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  prayerTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  prayerTabText: {
    fontSize: 14,
  },
  infoCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  prayerBadgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  prayerMainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  prayerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  prayerMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  prayerDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    marginLeft: 10,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 9,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  specialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
