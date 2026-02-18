import React from "react";
import { View, Text, Image, ImageBackground, StyleSheet, Alert, Platform } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import { arabicIndic } from "@/src/lib/quran/mushaf";

const MUSHAF_FRAME = require("../../assets/mushaf-frame.png");
const APP_ICON = require("../../../assets/icon.png");

type AyahImageProps = {
  surahName: string;
  ayahNumber: number;
  ayahText: string;
};

const AyahImageCard = React.forwardRef<View, AyahImageProps>(
  ({ surahName, ayahNumber, ayahText }, ref) => {
    const cleanText = ayahText.replace(/\u06DE/g, "").trim();
    const number = arabicIndic(ayahNumber);

    return (
      <View ref={ref} style={s.card} collapsable={false}>
        {/* ── Surah frame - full width at top ── */}
        <ImageBackground
          source={MUSHAF_FRAME}
          style={s.frame}
          imageStyle={s.frameImage}
        >
          <Text style={s.frameTitle} allowFontScaling={false}>
            {`سورة ${surahName.replace(/^سورة\s*/i, "")}`}
          </Text>
        </ImageBackground>

        {/* ── Ayah text ── */}
        <View style={s.ayahWrap}>
          <Text style={s.ayahText} allowFontScaling={false}>
            {`${cleanText}\u00A0${number}`}
          </Text>
        </View>

        {/* ── App icon + branding ── */}
        <View style={s.branding}>
          <View style={s.brandIconWrap}>
            <Image source={APP_ICON} style={s.brandIcon} />
          </View>
          <Text style={s.brandText}>بواسطة تطبيق رفيق المسلم</Text>
        </View>
      </View>
    );
  }
);

AyahImageCard.displayName = "AyahImageCard";

/* ─── Capture + Save helper ─── */
export async function captureAndSaveAyahImage(
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

    Alert.alert("تم الحفظ", "تم حفظ صورة الآية في المعرض");
    return true;
  } catch (error) {
    console.error("Error saving ayah image:", error);
    Alert.alert("خطأ", "تعذّر حفظ الصورة");
    return false;
  }
}

export default AyahImageCard;

const s = StyleSheet.create({
  card: {
    width: 900,
    backgroundColor: "#F8F1E6",
    position: "absolute",
    left: -9999,
    top: -9999,
  },

  // ── Surah frame - full width, no padding ──
  frame: {
    width: "100%",
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  frameImage: {
    resizeMode: "cover",
    width: "100%",
    height: "100%",
  },
  frameTitle: {
    fontFamily: "ScheherazadeNewBold",
    fontSize: 52,
    color: "#6E5A46",
    textAlign: "center",
    writingDirection: "rtl",
  },

  // ── Ayah text ──
  ayahWrap: {
    paddingHorizontal: 50,
    paddingTop: 36,
    paddingBottom: 40,
  },
  ayahText: {
    fontFamily: "KFGQPCUthmanicScript",
    fontSize: 48,
    color: "#2F2A24",
    textAlign: "center",
    lineHeight: 90,
    writingDirection: "rtl",
  },

  // ── Branding ──
  branding: {
    alignItems: "center",
    gap: 10,
    paddingBottom: 36,
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
    fontSize: 16,
    color: "#7A6B5A",
  },
});
