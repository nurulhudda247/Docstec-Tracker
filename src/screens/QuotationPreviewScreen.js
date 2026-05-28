// Quotation Preview & PDF Generation Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import Button from '../components/Button';
import { generateQuotationHTML } from '../templates/quotationTemplate';
import { quotationService } from '../services/quotationService';
import ConfirmModal from '../components/ConfirmModal';
import BottomDrawer from '../components/BottomDrawer';
import useStore from '../store/useStore';
import { NURUL_SIGNATURE, RAIYAN_SIGNATURE } from '../utils/signatures';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QuotationPreviewScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { showToast } = useStore();
  const { quotation } = route.params;
  const { colors, themeMode } = useTheme();
  const [generating, setGenerating] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [showSignaturePicker, setShowSignaturePicker] = useState(false);

  const htmlContent = generateQuotationHTML({
    ...quotation,
    signatureImageBase64: signatureImage,
  });

  const pickSignatureImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const base64 = result.assets[0].base64;
        const mimeType = result.assets[0].mimeType || 'image/png';
        setSignatureImage(`data:${mimeType};base64,${base64}`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to pick signature image.', 'error');
    }
  };

  const generateAndSharePDF = async () => {
    setGenerating(true);
    try {
      const finalHTML = generateQuotationHTML({
        ...quotation,
        signatureImageBase64: signatureImage,
      });

      if (Platform.OS === 'web') {
        // Direct browser printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(finalHTML);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          showToast('Popup blocker active. Please allow popups to preview/print PDF.', 'error');
        }
        setGenerating(false);
        return;
      }

      const { uri } = await Print.printToFileAsync({
        html: finalHTML,
        base64: false,
      });

      // Rename file with document number safely
      const docNo = quotation.documentNo?.replace(/[^a-zA-Z0-9-]/g, '_') || 'quotation';
      const newUri = `${FileSystem.documentDirectory}${docNo}.pdf`;
      
      // Delete if a file with the same name already exists to prevent moveAsync from failing
      try {
        const fileInfo = await FileSystem.getInfoAsync(newUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(newUri, { idempotent: true });
        }
      } catch (err) {
        // console.log('Error checking/deleting file:', err);
      }

      await FileSystem.copyAsync({ from: uri, to: newUri });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Quotation ${quotation.documentNo}`,
          UTI: 'com.adobe.pdf', // important for iOS
        });
      } else {
        showToast('PDF saved to local storage.', 'success');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast(`Failed: ${error?.message || error}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const performDelete = async () => {
    try {
      await quotationService.delete(quotation.id);
      showToast('Quotation deleted successfully.', 'success');
      navigation.goBack();
    } catch (error) {
      showToast('Failed to delete quotation.', 'error');
    }
  };

  const handleDelete = () => {
    if (!quotation.id) return;
    setShowDeleteConfirm(true);
  };

  const styles = getStyles(colors, insets);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Premium Dynamic Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle} numberOfLines={1}>{quotation.documentNo || 'Proposal Preview'}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{quotation.clientName || 'PDF Document'}</Text>
        </View>
      </View>

      {/* Preview */}
      <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
        <View style={styles.previewCard}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={htmlContent}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Quotation Preview"
            />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              style={styles.webview}
              scrollEnabled={false}
              nestedScrollEnabled={false}
              showsVerticalScrollIndicator={false}
              injectedJavaScript={`
                document.body.style.zoom = "0.75";
                setTimeout(() => {
                  window.ReactNativeWebView.postMessage(document.body.scrollHeight.toString());
                }, 500);
                true;
              `}
              onMessage={(event) => {
                // Could use this to dynamically set height
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {/* Signature picker */}
        <TouchableOpacity style={styles.signatureBtn} onPress={() => setShowSignaturePicker(true)}>
          <Ionicons
            name={signatureImage ? 'checkmark-circle' : 'create-outline'}
            size={18}
            color={signatureImage ? colors.success : colors.textSecondary}
          />
          <Text style={[styles.signatureBtnText, signatureImage && { color: colors.success }]}>
            {signatureImage ? 'Change Signature' : 'Select Signature'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionBtns}>
          {quotation.id && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          )}
          {quotation.id && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('CreateQuotation', { quotation })}
            >
              <Ionicons name="create-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
          )}
          <Button
            title="Generate PDF"
            onPress={generateAndSharePDF}
            loading={generating}
            icon="download-outline"
            fullWidth={false}
            style={styles.pdfBtn}
          />
        </View>
      </View>

      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={performDelete}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation?"
        confirmText="Delete"
        type="danger"
      />

      <BottomDrawer
        visible={showSignaturePicker}
        onClose={() => setShowSignaturePicker(false)}
        title="Select Signature"
        height={320}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <TouchableOpacity
            style={[styles.modalItem, signatureImage === NURUL_SIGNATURE && { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
            onPress={() => { setSignatureImage(NURUL_SIGNATURE); setShowSignaturePicker(false); }}
          >
            <Text style={[styles.modalItemText, { color: colors.textPrimary }, signatureImage === NURUL_SIGNATURE && { color: colors.primary }]}>Nurul</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalItem, signatureImage === RAIYAN_SIGNATURE && { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
            onPress={() => { setSignatureImage(RAIYAN_SIGNATURE); setShowSignaturePicker(false); }}
          >
            <Text style={[styles.modalItemText, { color: colors.textPrimary }, signatureImage === RAIYAN_SIGNATURE && { color: colors.primary }]}>Raiyan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalItem}
            onPress={() => { setShowSignaturePicker(false); pickSignatureImage(); }}
          >
            <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>Upload Custom...</Text>
          </TouchableOpacity>
          {signatureImage && (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => { setSignatureImage(null); setShowSignaturePicker(false); }}
            >
              <Text style={[styles.modalItemText, { color: colors.danger }]}>Remove Signature</Text>
            </TouchableOpacity>
          )}
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
    paddingBottom: SPACING.lg,
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
  previewScroll: { flex: 1 },
  previewContent: { padding: SPACING.md, paddingBottom: 100 },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border + '25',
    ...SHADOWS.lg,
    height: Platform.OS === 'web' ? 900 : SCREEN_WIDTH * 1.414 * 1.2, // A4 aspect ratio approximation
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    backgroundColor: colors.surface,
    padding: SPACING.lg,
    paddingBottom: Math.max((insets?.bottom || 0), SPACING.md) + SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border + '25',
    ...SHADOWS.lg,
  },
  signatureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
  },
  signatureBtnText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  deleteBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.danger + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  editBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accent + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  pdfBtn: {
    flex: 1,
  },
  modalItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalItemText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default QuotationPreviewScreen;
