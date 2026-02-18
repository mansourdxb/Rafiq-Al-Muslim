import React from "react";
import { View, Text, Image, StyleSheet, Alert, Share, Platform } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

const APP_ICON = require("../../../assets/icon.png");

type HadithImageProps = {
  hadithText: string;
  hadithNumber: string | number;
  source: string;
  author: string;
  chapter: string;
};

const HadithImageCard = React.forwardRef<View, HadithImageProps>(
  ({ hadithText, hadithNumber, source, author, chapter }, ref) => {
    return (
      <View ref={ref} style={s.card} collapsable={false}>
        {/* Green header bar */}
        <View style={s.header}>
          <Text style={s.headerText}>{source}</Text>
        </View>

        {/* Hadith text */}
        <View style={s.body}>
          <View style={s.numRow}>
            <View style={s.numBadge}>
              <Text style={s.numText}>{hadithNumber}</Text>
            </View>
          </View>

          <Text style={s.hadithText} allowFontScaling={false}>
            {hadithText}
          </Text>

          {/* Meta */}
          <View style={s.metaBox}>
            <Text style={s.metaLine}>
              <Text style={s.metaLabel}>{"المصدر: "}</Text>
              <Text style={s.metaValue}>{source}</Text>
            </Text>
            <Text style={s.metaLine}>
              <Text style={s.metaLabel}>{"المؤلف: "}</Text>
              <Text style={s.metaValue}>{author}</Text>
            </Text>
            <Text style={s.metaLine}>
              <Text style={s.metaLabel}>{"الكتاب: "}</Text>
              <Text style={s.metaValue}>{chapter}</Text>
            </Text>
            <Text style={s.metaLine}>
              <Text style={s.metaLabel}>{"رقم الحديث: "}</Text>
              <Text style={s.metaValue}>{String(hadithNumber)}</Text>
            </Text>
          </View>
        </View>

        {/* Branding */}
        <View style={s.branding}>
          <View style={s.brandRow}>
            <Text style={s.brandText}>بواسطة تطبيق رفيق المسلم</Text>
            <View style={s.brandIconWrap}>
              <Image source={APP_ICON} style={s.brandIcon} />
            </View>
          </View>
          <Text style={s.brandLink}>rafiqapp.me</Text>
        </View>
      </View>
    );
  }
);

HadithImageCard.displayName = "HadithImageCard";

/* ─── Save to gallery ─── */
export async function saveHadithImage(
  viewRef: React.RefObject<View>
): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("تنبيه", "يرجى السماح بالوصول إلى المعرض لحفظ الصورة");
      return false;
    }

    const uri = await captureRef(viewRef, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });

    const asset = await MediaLibrary.createAssetAsync(uri);
    await MediaLibrary.createAlbumAsync("رفيق المسلم", asset, false);

    Alert.alert("تم الحفظ", "تم حفظ صورة الحديث في المعرض");
    return true;
  } catch (error) {
    console.error("Error saving hadith image:", error);
    Alert.alert("خطأ", "تعذّر حفظ الصورة");
    return false;
  }
}

/* ─── Share as image ─── */
export async function shareHadithImage(
  viewRef: React.RefObject<View>
): Promise<boolean> {
  try {
    const uri = await captureRef(viewRef, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });

    if (Platform.OS === "ios") {
      await Share.share({ url: uri });
    } else {
      // Android: save to gallery first, then share the file URI
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("\u062a\u0646\u0628\u064a\u0647", "\u064a\u0631\u062c\u0649 \u0627\u0644\u0633\u0645\u0627\u062d \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0639\u0631\u0636 \u0644\u062d\u0641\u0638 \u0627\u0644\u0635\u0648\u0631\u0629");
        return false;
      }
      const dest = FileSystem.cacheDirectory + `hadith_${Date.now()}.png`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      await Share.share({ url: dest, message: dest });
    }
    return true;
  } catch (error) {
    console.error("Error sharing hadith image:", error);
    Alert.alert("\u062e\u0637\u0623", "\u062a\u0639\u0630\u0651\u0631 \u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0635\u0648\u0631\u0629");
    return false;
  }
}

export default HadithImageCard;

const s = StyleSheet.create({
  card: {
    width: 900,
    backgroundColor: "#F8F1E6",
    position: "absolute",
    left: -9999,
    top: -9999,
  },

  /* Green header */
  header: {
    backgroundColor: "#1B4332",
    paddingVertical: 36,
    paddingHorizontal: 50,
    alignItems: "center",
  },
  headerText: {
    fontFamily: "CairoBold",
    fontSize: 40,
    color: "#FFFFFF",
    textAlign: "center",
  },

  /* Body */
  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
    paddingBottom: 20,
  },
  numRow: {
    flexDirection: "row-reverse",
    marginBottom: 16,
  },
  numBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8E3D9",
    alignItems: "center",
    justifyContent: "center",
  },
  numText: {
    fontFamily: "CairoBold",
    fontSize: 24,
    color: "#4A4036",
  },
  hadithText: {
    fontFamily: "Cairo",
    fontSize: 36,
    lineHeight: 68,
    color: "#2F2A24",
    textAlign: "right",
    writingDirection: "rtl",
  },

  /* Meta */
  metaBox: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#E5E0D6",
    gap: 8,
  },
  metaLine: {
    textAlign: "right",
    writingDirection: "rtl",
    fontSize: 26,
  },
  metaLabel: {
    fontFamily: "CairoBold",
    fontSize: 26,
    color: "#2D7A4E",
  },
  metaValue: {
    fontFamily: "Cairo",
    fontSize: 26,
    color: "#B38B2D",
  },

  /* Branding */
  branding: {
    alignItems: "center",
    paddingBottom: 36,
    paddingTop: 10,
    gap: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandIcon: {
    width: 56,
    height: 56,
  },
  brandText: {
    fontFamily: "CairoBold",
    fontSize: 22,
    color: "#7A6B5A",
  },
  brandLink: {
    fontFamily: "Cairo",
    fontSize: 18,
    color: "#968C80",
  },
});
