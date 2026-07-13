import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ── Brand Colors (matches storefront globals.css) ───────────────────────────
  static const Color primaryRose = Color(0xFFD2168D);   // --color-accent
  static const Color accentGold = Color(0xFFC9A84C);    // hero gold
  static const Color ratingAmber = Color(0xFFFFA41C);   // --color-rating
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF9F9F9);
  static const Color borderLight = Color(0xFFE5E5EA);
  static const Color textMuted = Color(0xFF8E8E93);
  static const Color textNeutral = Color(0xFF404040);   // neutral-700

  // ── Font Families (mirrors storefront layout.tsx) ──────────────────────────
  // Poppins   → font-sans / font-spectral  (body, UI labels)
  // Playfair  → font-serif / font-cormorant (headings, section titles)
  // Montserrat→ font-montserrat             (buttons, tags, tracking text)

  // Convenience accessors used by individual widgets
  static TextStyle poppins({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.normal,
    Color color = Colors.black,
    double? letterSpacing,
    double? height,
  }) =>
      GoogleFonts.poppins(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        height: height,
      );

  static TextStyle playfair({
    double fontSize = 20,
    FontWeight fontWeight = FontWeight.normal,
    Color color = Colors.black,
    FontStyle fontStyle = FontStyle.normal,
    double? letterSpacing,
    double? height,
  }) =>
      GoogleFonts.playfairDisplay(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        fontStyle: fontStyle,
        letterSpacing: letterSpacing,
        height: height,
      );

  static TextStyle montserrat({
    double fontSize = 11,
    FontWeight fontWeight = FontWeight.w600,
    Color color = Colors.black,
    double? letterSpacing,
  }) =>
      GoogleFonts.montserrat(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
      );

  // ── TextTheme (Tailwind-equivalent size scale) ─────────────────────────────
  // xs=10, sm=12, base=14, lg=16, xl=18, 2xl=20, 3xl=24, 4xl=30, 5xl=36, 6xl=48
  static TextTheme get _textTheme => TextTheme(
    // displayLarge → hero / 6xl equivalent (48px)
    displayLarge: GoogleFonts.playfairDisplay(
      fontSize: 48,
      fontWeight: FontWeight.normal,
      color: Colors.black,
      letterSpacing: 1.5,
      height: 1.1,
    ),
    // displayMedium → 5xl (36px)
    displayMedium: GoogleFonts.playfairDisplay(
      fontSize: 36,
      fontWeight: FontWeight.normal,
      color: Colors.black,
      letterSpacing: 1.2,
      height: 1.15,
    ),
    // displaySmall → 4xl (30px)
    displaySmall: GoogleFonts.playfairDisplay(
      fontSize: 30,
      fontWeight: FontWeight.normal,
      color: Colors.black,
      letterSpacing: 1.0,
      height: 1.2,
    ),
    // headlineLarge → 3xl (24px) — section titles like "New Arrivals", "Popular Picks"
    headlineLarge: GoogleFonts.playfairDisplay(
      fontSize: 24,
      fontWeight: FontWeight.normal,
      color: Colors.black,
      letterSpacing: 2.0,
      height: 1.2,
    ),
    // headlineMedium → 2xl (20px)
    headlineMedium: GoogleFonts.playfairDisplay(
      fontSize: 20,
      fontWeight: FontWeight.normal,
      color: Colors.black,
      letterSpacing: 1.5,
      height: 1.25,
    ),
    // headlineSmall → xl (18px) — card titles
    headlineSmall: GoogleFonts.playfairDisplay(
      fontSize: 18,
      fontWeight: FontWeight.normal,
      color: Colors.black,
      letterSpacing: 1.0,
      height: 1.3,
    ),
    // titleLarge → lg (16px) — Montserrat labels/nav
    titleLarge: GoogleFonts.montserrat(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: Colors.black,
      letterSpacing: 1.5,
    ),
    // titleMedium → base (14px) — Montserrat product labels
    titleMedium: GoogleFonts.montserrat(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: Colors.black,
      letterSpacing: 1.2,
    ),
    // titleSmall → sm (12px) — Montserrat tags / tracking widest
    titleSmall: GoogleFonts.montserrat(
      fontSize: 12,
      fontWeight: FontWeight.w700,
      color: Colors.black,
      letterSpacing: 2.5,
    ),
    // bodyLarge → base (14px) — Poppins main body text
    bodyLarge: GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: FontWeight.normal,
      color: textNeutral,
      height: 1.6,
    ),
    // bodyMedium → sm (12px) — Poppins secondary body
    bodyMedium: GoogleFonts.poppins(
      fontSize: 12,
      fontWeight: FontWeight.normal,
      color: textNeutral,
      height: 1.6,
    ),
    // bodySmall → xs (10px) — Poppins captions / muted
    bodySmall: GoogleFonts.poppins(
      fontSize: 10,
      fontWeight: FontWeight.normal,
      color: textMuted,
      height: 1.5,
    ),
    // labelLarge → Montserrat 11px uppercase (buttons)
    labelLarge: GoogleFonts.montserrat(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      color: Colors.white,
      letterSpacing: 2.0,
    ),
    // labelMedium → Montserrat 10px
    labelMedium: GoogleFonts.montserrat(
      fontSize: 10,
      fontWeight: FontWeight.w700,
      color: Colors.black,
      letterSpacing: 2.5,
    ),
    // labelSmall → Poppins 9px muted
    labelSmall: GoogleFonts.poppins(
      fontSize: 9,
      fontWeight: FontWeight.normal,
      color: textMuted,
    ),
  );

  // ── Light Theme ────────────────────────────────────────────────────────────
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: backgroundLight,
      primaryColor: primaryRose,
      colorScheme: const ColorScheme.light(
        primary: primaryRose,
        onPrimary: Colors.white,
        secondary: accentGold,
        surface: surfaceLight,
        onSurface: Colors.black,
      ),
      textTheme: _textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: backgroundLight,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black),
        titleTextStyle: GoogleFonts.montserrat(
          color: Colors.black,
          fontSize: 13,
          fontWeight: FontWeight.w700,
          letterSpacing: 2.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: backgroundLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6),
          side: const BorderSide(color: borderLight, width: 1),
        ),
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceLight,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: primaryRose, width: 1.5),
        ),
        labelStyle: GoogleFonts.poppins(color: textMuted, fontSize: 13),
        hintStyle: GoogleFonts.poppins(color: textMuted, fontSize: 13),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryRose,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24), // rounded-full like storefront
          ),
          textStyle: GoogleFonts.montserrat(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 2.0,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.black,
          side: const BorderSide(color: Colors.black, width: 1),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          textStyle: GoogleFonts.montserrat(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 2.0,
          ),
        ),
      ),
    );
  }
}
