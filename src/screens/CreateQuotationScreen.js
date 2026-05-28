// Create/Edit Quotation Screen
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
  Platform, Modal, StatusBar, KeyboardAvoidingView, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalendarPicker from '../components/CalendarPicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { DEFAULT_COMPANY, DEFAULT_TERMS } from '../utils/constants';
import { numberToWords } from '../utils/formatters';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import BottomDrawer from '../components/BottomDrawer';
import { clientService } from '../services/clientService';
import { quotationService } from '../services/quotationService';
import useStore from '../store/useStore';

const CreateQuotationScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { showToast } = useStore();
  const editQuotation = route.params?.quotation;
  const isEditing = !!editQuotation;
  const { colors, themeMode } = useTheme();

  // Document info
  const [documentNo, setDocumentNo] = useState(editQuotation?.documentNo || '');
  const [currency, setCurrency] = useState(editQuotation?.currency || useStore.getState().baseCurrency || 'BDT');
  const currencySymbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '৳';
  const [date, setDate] = useState(editQuotation?.date?.toDate ? editQuotation.date.toDate() : new Date());
  const [validityDate, setValidityDate] = useState(
    editQuotation?.validityDate?.toDate
      ? editQuotation.validityDate.toDate()
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  );

  // Company info (Prepared By)
  const [companyName, setCompanyName] = useState(editQuotation?.companyName || DEFAULT_COMPANY.name);
  const [companyTagline, setCompanyTagline] = useState(editQuotation?.companyTagline || DEFAULT_COMPANY.tagline);
  const [companyAddress, setCompanyAddress] = useState(editQuotation?.companyAddress || DEFAULT_COMPANY.address);
  const [companyEmail, setCompanyEmail] = useState(editQuotation?.companyEmail || DEFAULT_COMPANY.email);
  const [companyWeb, setCompanyWeb] = useState(editQuotation?.companyWeb || DEFAULT_COMPANY.web);

  // Client info (Prepared For)
  const [clientName, setClientName] = useState(editQuotation?.clientName || '');
  const [clientAddress, setClientAddress] = useState(editQuotation?.clientAddress || '');
  const [clientAttn, setClientAttn] = useState(editQuotation?.clientAttn || '');

  // Timeline
  const [projectStartDate, setProjectStartDate] = useState(
    editQuotation?.projectStartDate?.toDate ? editQuotation.projectStartDate.toDate() : new Date()
  );
  const [deliveryTimeline, setDeliveryTimeline] = useState(
    editQuotation?.deliveryTimeline?.toDate 
      ? editQuotation.deliveryTimeline.toDate() 
      : (typeof editQuotation?.deliveryTimeline === 'string' && !isNaN(Date.parse(editQuotation.deliveryTimeline)) ? new Date(editQuotation.deliveryTimeline) : new Date())
  );

  // Service items
  const [items, setItems] = useState(
    editQuotation?.items || [
      { sl: 1, title: '', description: [''], importantExclusion: '', qty: '1', amount: '' },
    ]
  );

  // Advances
  const [advances, setAdvances] = useState(
    editQuotation?.advances || []
  );

  // Net due in words
  const [netDueInWords, setNetDueInWords] = useState(editQuotation?.netDueInWords || '');

  // Terms
  const [termsAndConditions, setTermsAndConditions] = useState(
    editQuotation?.termsAndConditions || DEFAULT_TERMS
  );

  // UI states
  const [clients, setClients] = useState([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(null); // 'date' | 'validity' | 'start' | advance index
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    company: false,
    items: false,
    advances: false,
    terms: false,
  });

  const handleBack = () => {
    if (route.params?.fromDashboard) {
      navigation.navigate('DashboardDrawer');
    } else {
      navigation.goBack();
    }
  };

  useEffect(() => {
    clientService.getAll().then(setClients).catch(console.error);
  }, []);

  // Calculate totals
  const grossTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0) * (parseInt(item.qty) || 1), 0);
  const totalQty = items.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
  const totalAdvances = advances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const netDue = grossTotal - totalAdvances;

  // Auto-generate net due in words
  useEffect(() => {
    if (netDue > 0) {
      setNetDueInWords(numberToWords(netDue, currency));
    }
  }, [netDue, currency]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Item management
  const addItem = () => {
    setItems([...items, { sl: items.length + 1, title: '', description: [''], importantExclusion: '', qty: '1', amount: '' }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sl: i + 1 }));
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addDescriptionPoint = (itemIndex) => {
    const newItems = [...items];
    newItems[itemIndex].description = [...newItems[itemIndex].description, ''];
    setItems(newItems);
  };

  const updateDescriptionPoint = (itemIndex, descIndex, value) => {
    const newItems = [...items];
    newItems[itemIndex].description[descIndex] = value;
    setItems(newItems);
  };

  const removeDescriptionPoint = (itemIndex, descIndex) => {
    const newItems = [...items];
    if (newItems[itemIndex].description.length <= 1) return;
    newItems[itemIndex].description = newItems[itemIndex].description.filter((_, i) => i !== descIndex);
    setItems(newItems);
  };

  // Advance management
  const addAdvance = () => {
    setAdvances([...advances, { amount: '', date: new Date().toISOString(), label: '' }]);
  };

  const removeAdvance = (index) => {
    setAdvances(advances.filter((_, i) => i !== index));
  };

  const updateAdvance = (index, field, value) => {
    const newAdvances = [...advances];
    newAdvances[index] = { ...newAdvances[index], [field]: value };
    setAdvances(newAdvances);
  };

  // Terms management
  const addTerm = () => {
    setTermsAndConditions([...termsAndConditions, { title: '', body: '' }]);
  };

  const removeTerm = (index) => {
    setTermsAndConditions(termsAndConditions.filter((_, i) => i !== index));
  };

  const updateTerm = (index, field, value) => {
    const newTerms = [...termsAndConditions];
    newTerms[index] = { ...newTerms[index], [field]: value };
    setTermsAndConditions(newTerms);
  };

  const handleSave = async (isDraft = false) => {
    if (!documentNo.trim()) {
      showToast('Document number is required.', 'error');
      return;
    }
    if (!clientName.trim()) {
      showToast('Client name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const data = {
        documentNo: documentNo.trim(),
        currency,
        date,
        validityDate,
        companyName, companyTagline, companyAddress, companyEmail, companyWeb,
        clientName: clientName.trim(),
        clientAddress: clientAddress.trim(),
        clientAttn: clientAttn.trim(),
        projectStartDate,
        deliveryTimeline: deliveryTimeline instanceof Date ? deliveryTimeline.toISOString() : deliveryTimeline.trim(),
        items: items.map((item) => ({
          ...item,
          qty: parseInt(item.qty) || 1,
          amount: parseFloat(item.amount) || 0,
        })),
        grossTotal,
        advances: advances.map((a) => ({
          ...a,
          amount: parseFloat(a.amount) || 0,
        })),
        netDue,
        netDueInWords,
        termsAndConditions,
        status: isDraft ? 'DRAFT' : 'FINAL',
      };

      if (isEditing) {
        await quotationService.update(editQuotation.id, data);
        showToast(isDraft ? 'Draft updated.' : 'Quotation updated.', 'success');
      } else {
        await quotationService.create(data);
        showToast(isDraft ? 'Draft saved.' : 'Quotation saved.', 'success');
      }

      handleBack();
    } catch (error) {
      console.error('Error saving quotation:', error);
      showToast('Failed to save quotation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const data = {
      documentNo, currency, date, validityDate,
      companyName, companyTagline, companyAddress, companyEmail, companyWeb,
      clientName, clientAddress, clientAttn,
      projectStartDate, deliveryTimeline,
      items: items.map((item) => ({
        ...item,
        qty: parseInt(item.qty) || 1,
        amount: parseFloat(item.amount) || 0,
      })),
      grossTotal, totalQty, advances, netDue, netDueInWords, termsAndConditions,
    };
    navigation.navigate('QuotationPreview', { quotation: data, isNew: !isEditing });
  };

  const formatDisplayDate = (d) => {
    const dateObj = typeof d === 'string' ? new Date(d) : (d?.toDate ? d.toDate() : d);
    return dateObj?.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) || '';
  };

  const SectionHeader = ({ title, section, count }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section)}>
      <Text style={styles.sectionTitle}>{title} {count !== undefined && `(${count})`}</Text>
      <Ionicons
        name={expandedSections[section] ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const styles = getStyles(colors, insets);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Premium Dynamic Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Quotation' : 'Create Quotation'}</Text>
          <Text style={styles.headerSubtitle}>{isEditing ? 'Modify terms, services, and advances' : 'Generate professional proposal'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* ========== DOCUMENT INFO ========== */}
          <Text style={styles.mainTitle}>Document Information</Text>

          <InputField
            label="Document Number"
            value={documentNo}
            onChangeText={setDocumentNo}
            placeholder="e.g. DT-2026-087"
            icon="document-outline"
            required
          />

          <View style={styles.inputRow}>
            <InputField
              label="Date"
              value={formatDisplayDate(date)}
              onPress={() => setShowDatePicker('date')}
              icon="calendar-outline"
              style={styles.flex1}
            />
            <View style={styles.rowSpacer} />
            <InputField
              label="Validity"
              value={formatDisplayDate(validityDate)}
              onPress={() => setShowDatePicker('validity')}
              icon="calendar-outline"
              style={styles.flex1}
            />
          </View>

          <InputField
            label="Currency"
            value={currency === 'USD' ? 'US Dollar ($)' : currency === 'GBP' ? 'British Pound (£)' : currency === 'EUR' ? 'Euro (€)' : 'Bangladeshi Taka (৳)'}
            onPress={() => setShowCurrencyPicker(true)}
            icon="cash-outline"
          />

          {/* ========== PREPARED BY (Collapsible) ========== */}
          <SectionHeader title="Prepared By" section="company" />
          {expandedSections.company && (
            <View style={styles.sectionBody}>
              <InputField label="Company Name" value={companyName} onChangeText={setCompanyName} placeholder="Company name" />
              <InputField label="Tagline" value={companyTagline} onChangeText={setCompanyTagline} placeholder="Tagline" />
              <InputField label="Address" value={companyAddress} onChangeText={setCompanyAddress} placeholder="Address" />
              <InputField label="Email" value={companyEmail} onChangeText={setCompanyEmail} placeholder="Email" autoCapitalize="none" />
              <InputField label="Website" value={companyWeb} onChangeText={setCompanyWeb} placeholder="Website" autoCapitalize="none" />
            </View>
          )}

          {/* ========== PREPARED FOR ========== */}
          <Text style={styles.mainTitle}>Prepared For</Text>

          <TouchableOpacity style={styles.selectClientBtn} onPress={() => setShowClientPicker(true)}>
            <Ionicons name="people-outline" size={16} color={colors.accent} />
            <Text style={styles.selectClientText}>Select from existing clients</Text>
          </TouchableOpacity>

          <InputField label="Client Name" value={clientName} onChangeText={setClientName} placeholder="e.g. Decision Maker LTD" required />
          <InputField label="Client Address" value={clientAddress} onChangeText={setClientAddress} placeholder="e.g. Dhaka, Bangladesh" />
          <InputField label="Attention" value={clientAttn} onChangeText={setClientAttn} placeholder="e.g. Founder / CEO" />

          {/* ========== TIMELINE ========== */}
          <Text style={styles.mainTitle}>Project Timeline</Text>
          <View style={styles.dateRow}>
            <InputField
              label="Start Date"
              value={formatDisplayDate(projectStartDate)}
              onPress={() => setShowDatePicker('start')}
              icon="calendar-outline"
              style={{ flex: 1 }}
            />
            <InputField
              label="Delivery Date"
              value={formatDisplayDate(deliveryTimeline)}
              onPress={() => setShowDatePicker('delivery')}
              icon="calendar-outline"
              style={{ flex: 1 }}
            />
          </View>

          {/* ========== SERVICE ITEMS ========== */}
          <SectionHeader title="Service Items" section="items" count={items.length} />
          {expandedSections.items && (
            <View style={styles.sectionBody}>
              {items.map((item, index) => (
                <Card key={index} variant="outlined" style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemSl}>Item #{item.sl}</Text>
                    {items.length > 1 && (
                      <TouchableOpacity onPress={() => removeItem(index)}>
                        <Ionicons name="close-circle" size={22} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <InputField label="Title" value={item.title} onChangeText={(v) => updateItem(index, 'title', v)} placeholder="Service title" required labelBgColor={colors.surface} />

                  <Text style={styles.subLabel}>Description Points</Text>
                  {item.description.map((desc, descIdx) => (
                    <View key={descIdx} style={styles.descRow}>
                      <Text style={styles.bullet}>•</Text>
                      <InputField
                        value={desc}
                        onChangeText={(v) => updateDescriptionPoint(index, descIdx, v)}
                        placeholder="Description point"
                        style={{ flex: 1, marginBottom: SPACING.sm }}
                        labelBgColor={colors.surface}
                      />
                      {item.description.length > 1 && (
                        <TouchableOpacity onPress={() => removeDescriptionPoint(index, descIdx)} style={styles.removeDescBtn}>
                          <Ionicons name="remove-circle-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addDescBtn} onPress={() => addDescriptionPoint(index)}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                    <Text style={styles.addDescText}>Add point</Text>
                  </TouchableOpacity>

                  <InputField
                    label="Important Exclusion (optional)"
                    value={item.importantExclusion}
                    onChangeText={(v) => updateItem(index, 'importantExclusion', v)}
                    placeholder="Any exclusions..."
                    multiline
                    numberOfLines={2}
                    labelBgColor={colors.surface}
                  />

                  <View style={styles.dateRow}>
                    <View style={{ flex: 1 }}>
                      <InputField label="Quantity" value={String(item.qty)} onChangeText={(v) => updateItem(index, 'qty', v)} keyboardType="numeric" labelBgColor={colors.surface} />
                    </View>
                    <View style={{ flex: 2 }}>
                      <InputField label={`Amount (${currency})`} value={String(item.amount)} onChangeText={(v) => updateItem(index, 'amount', v)} keyboardType="numeric" labelBgColor={colors.surface} />
                    </View>
                  </View>
                </Card>
              ))}
              <Button title="Add Service Item" onPress={addItem} variant="outline" icon="add-outline" />
            </View>
          )}

          {/* ========== FINANCIAL SUMMARY ========== */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gross Valuation</Text>
              <Text style={styles.summaryValue}>{currencySymbol}{grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>

          {/* ========== ADVANCES ========== */}
          <SectionHeader title="Advance Payments" section="advances" count={advances.length} />
          {expandedSections.advances && (
            <View style={styles.sectionBody}>
              {advances.map((advance, index) => (
                <Card key={index} variant="outlined" style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemSl}>Advance #{index + 1}</Text>
                    <TouchableOpacity onPress={() => removeAdvance(index)}>
                      <Ionicons name="close-circle" size={22} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                  <InputField label="Label" value={advance.label} onChangeText={(v) => updateAdvance(index, 'label', v)} placeholder="e.g. Mobilization Advance" labelBgColor={colors.surface} />
                  <View style={styles.dateRow}>
                    <InputField
                      label={`Amount (${currency})`}
                      value={String(advance.amount)}
                      onChangeText={(v) => updateAdvance(index, 'amount', v)}
                      keyboardType="numeric"
                      icon="cash-outline"
                      style={{ flex: 1 }}
                      labelBgColor={colors.surface}
                    />
                    <InputField
                      label="Date"
                      value={formatDisplayDate(advance.date)}
                      onPress={() => setShowDatePicker(`advance_${index}`)}
                      icon="calendar-outline"
                      style={{ flex: 1 }}
                      labelBgColor={colors.surface}
                    />
                  </View>
                </Card>
              ))}
              <Button title="Add Advance" onPress={addAdvance} variant="outline" icon="add-outline" />

              {advances.length > 0 && (
                <View style={[styles.summaryCard, { marginTop: SPACING.md }]}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Net Outstanding Due</Text>
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>
                      {currencySymbol}{netDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              )}

              <InputField
                label="Net Due in Words"
                value={netDueInWords}
                onChangeText={setNetDueInWords}
                placeholder="Auto-generated from amount"
                multiline
                numberOfLines={2}
              />
            </View>
          )}

          {/* ========== TERMS ========== */}
          <SectionHeader title="Terms & Conditions" section="terms" count={termsAndConditions.length} />
          {expandedSections.terms && (
            <View style={styles.sectionBody}>
              {termsAndConditions.map((term, index) => (
                <Card key={index} variant="outlined" style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemSl}>Term #{index + 1}</Text>
                    <TouchableOpacity onPress={() => removeTerm(index)}>
                      <Ionicons name="close-circle" size={22} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                  <InputField label="Title" value={term.title} onChangeText={(v) => updateTerm(index, 'title', v)} placeholder="Term title" labelBgColor={colors.surface} />
                  <InputField label="Body" value={term.body} onChangeText={(v) => updateTerm(index, 'body', v)} placeholder="Term description" multiline numberOfLines={3} labelBgColor={colors.surface} />
                </Card>
              ))}
              <Button title="Add Term" onPress={addTerm} variant="outline" icon="add-outline" />
            </View>
          )}

          {/* ========== ACTIONS ========== */}
          <View style={styles.actionButtons}>
            <Button
              title="Preview PDF"
              onPress={handlePreview}
              variant="secondary"
              icon="eye-outline"
              style={{ marginBottom: SPACING.md }}
            />
            <Button
              title="Save as Draft"
              onPress={() => handleSave(true)}
              loading={saving}
              variant="outline"
              icon="document-text-outline"
              style={{ marginBottom: SPACING.md }}
            />
            <Button
              title={isEditing && editQuotation?.status !== 'DRAFT' ? 'Update Quotation' : 'Save & Generate Quotation'}
              onPress={() => handleSave(false)}
              loading={saving}
              icon="save-outline"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Currency Picker */}
      <BottomDrawer
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        title="Select Currency"
        height={300}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {[
            { value: 'BDT', label: 'Bangladeshi Taka (৳)' },
            { value: 'USD', label: 'US Dollar ($)' },
            { value: 'GBP', label: 'British Pound (£)' },
            { value: 'EUR', label: 'Euro (€)' }
          ].map(c => (
            <TouchableOpacity
              key={c.value}
              style={[
                styles.modalItem,
                { borderWidth: 1, borderColor: 'transparent', marginBottom: 8 },
                currency === c.value && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
              ]}
              onPress={() => {
                setCurrency(c.value);
                setShowCurrencyPicker(false);
              }}
            >
              <Text style={[styles.modalItemText, currency === c.value && { color: colors.primary }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomDrawer>

      {/* Custom Calendar Picker */}
      <CalendarPicker
        visible={showDatePicker !== null}
        onClose={() => setShowDatePicker(null)}
        selectedDate={
          showDatePicker === 'date' ? date
            : showDatePicker === 'validity' ? validityDate
            : showDatePicker === 'start' ? projectStartDate
            : showDatePicker === 'delivery' ? deliveryTimeline
            : showDatePicker?.startsWith('advance_')
              ? new Date(advances[parseInt(showDatePicker.split('_')[1])]?.date || Date.now())
              : new Date()
        }
        onSelectDate={(selectedDate) => {
          if (!selectedDate) return;
          if (showDatePicker === 'date') setDate(selectedDate);
          else if (showDatePicker === 'validity') setValidityDate(selectedDate);
          else if (showDatePicker === 'start') setProjectStartDate(selectedDate);
          else if (showDatePicker === 'delivery') setDeliveryTimeline(selectedDate);
          else if (showDatePicker?.startsWith('advance_')) {
            const idx = parseInt(showDatePicker.split('_')[1]);
            updateAdvance(idx, 'date', selectedDate.toISOString());
          }
        }}
      />

      {/* Client Picker Drawer */}
      <BottomDrawer
        visible={showClientPicker}
        onClose={() => setShowClientPicker(false)}
        title="Select Client"
        height={380}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {clients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.modalItem}
              onPress={() => {
                setClientName(client.name);
                setClientAddress(client.address || '');
                setClientAttn(client.contactPerson || '');
                setShowClientPicker(false);
              }}
            >
              <Text style={styles.modalItemText}>{client.name}</Text>
              <Text style={styles.modalItemSub}>{client.address}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomDrawer>
    </View>
  );
};

const getStyles = (colors, insets) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    paddingTop: Math.max((insets?.top || 0), SPACING.md) + (Platform.OS === 'ios' ? 10 : 15),
    paddingBottom: Math.max((insets?.bottom || 0), 16) + 24,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '15', // Super soft border line
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border + '25',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl - 2,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs - 1,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHT.medium,
  },
  scrollContent: { padding: SPACING.lg, paddingBottom: Math.max((insets?.bottom || 0), 16) + 24},
  mainTitle: {
    fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary,
    marginTop: SPACING.lg, marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: colors.textSecondary,
    marginBottom: SPACING.xs + 2, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  subLabel: {
    fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: colors.textSecondary,
    marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateRow: { flexDirection: 'row', gap: SPACING.md },
  selectClientBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    marginBottom: SPACING.md, alignSelf: 'flex-start',
  },
  selectClientText: { fontSize: FONT_SIZE.sm, color: colors.accent, fontWeight: FONT_WEIGHT.medium },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, marginTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary },
  sectionBody: { marginBottom: SPACING.md },
  itemCard: { padding: SPACING.md, marginBottom: SPACING.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  itemSl: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semiBold, color: colors.primary },
  descRow: { flexDirection: 'row', alignItems: 'center' },
  bullet: { fontSize: FONT_SIZE.lg, color: colors.textTertiary, marginRight: SPACING.sm, marginBottom: SPACING.sm },
  removeDescBtn: { marginLeft: SPACING.xs, marginBottom: SPACING.sm },
  addDescBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md },
  addDescText: { fontSize: FONT_SIZE.sm, color: colors.accent, fontWeight: FONT_WEIGHT.medium },
  summaryCard: {
    backgroundColor: colors.primary + '08', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg, borderWidth: 1, borderColor: colors.primary + '20',
    marginBottom: SPACING.lg,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semiBold, color: colors.textPrimary },
  summaryValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary },
  actionButtons: { marginTop: SPACING.xxl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.xl, maxHeight: '60%',
    borderWidth: 1, borderColor: colors.border + '25',
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary, marginBottom: SPACING.lg },
  modalItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.xs },
  modalItemText: { fontSize: FONT_SIZE.md, color: colors.textPrimary, fontWeight: FONT_WEIGHT.medium },
  modalItemSub: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginTop: 2 },
});

export default CreateQuotationScreen;
