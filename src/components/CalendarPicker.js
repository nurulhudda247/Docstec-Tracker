// Custom Premium Calendar Picker Modal Component (100% Platform & Web Compatible)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const CalendarPicker = ({ visible, onClose, selectedDate, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Synchronize internal current date with selectedDate when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentDate(selectedDate ? new Date(selectedDate) : new Date());
    }
  }, [visible, selectedDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day) => {
    const newSelectedDate = new Date(year, month, day);
    onSelectDate(newSelectedDate);
    onClose();
  };

  // Generate calendar grid cells
  const cells = [];
  // Empty cells for the first week offset
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ id: `empty-${i}`, val: '', empty: true });
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ id: `day-${i}`, val: i, empty: false });
  }

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const sel = new Date(selectedDate);
    return sel.getDate() === day && sel.getMonth() === month && sel.getFullYear() === year;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerText}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Titles */}
          <View style={styles.weekdaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, index) => (
              <Text key={index} style={styles.weekdayText}>{wd}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {cells.map((cell) => {
              if (cell.empty) {
                return <View key={cell.id} style={styles.cellEmpty} />;
              }

              const selected = isSelected(cell.val);
              const today = isToday(cell.val);

              return (
                <TouchableOpacity
                  key={cell.id}
                  style={[
                    styles.cellDay,
                    selected && styles.cellSelected,
                    today && !selected && styles.cellToday
                  ]}
                  onPress={() => handleSelectDay(cell.val)}
                >
                  <Text
                    style={[
                      styles.cellText,
                      selected && styles.cellTextSelected,
                      today && !selected && styles.cellTextToday
                    ]}
                  >
                    {cell.val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Elegant dark glass overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface, // Slate-800 inside dark mode
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 340, // Standard beautiful card size
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  arrowBtn: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textTertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  cellEmpty: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellDay: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  cellSelected: {
    backgroundColor: COLORS.primary, // Vibrant blue selection color
    borderRadius: 8,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },
  cellText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  cellTextSelected: {
    color: '#FFFFFF', // Pure white selected text
    fontWeight: FONT_WEIGHT.bold,
  },
  cellTextToday: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  closeBtn: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  closeBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default CalendarPicker;
