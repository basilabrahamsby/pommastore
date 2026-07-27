import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app_translations.dart';

const String _kLocaleKey = 'pommastore_locale_lang';

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('en')) {
    _loadSavedLocale();
  }

  Future<void> _loadSavedLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLang = prefs.getString(_kLocaleKey);
      if (savedLang == 'ar') {
        state = const Locale('ar');
      } else {
        state = const Locale('en');
      }
    } catch (_) {}
  }

  Future<void> toggleLocale() async {
    final nextLang = state.languageCode == 'en' ? 'ar' : 'en';
    state = Locale(nextLang);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kLocaleKey, nextLang);
    } catch (_) {}
  }

  Future<void> setLocale(String langCode) async {
    if (state.languageCode == langCode) return;
    state = Locale(langCode);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kLocaleKey, langCode);
    } catch (_) {}
  }

  bool get isArabic => state.languageCode == 'ar';
  bool get isRtl => state.languageCode == 'ar';
  TextDirection get textDirection => state.languageCode == 'ar' ? TextDirection.rtl : TextDirection.ltr;

  String tr(String key) => AppTranslations.translate(state.languageCode, key);
  String dynamicText(String? textEn, String? textAr) => AppTranslations.dynamicText(state.languageCode, textEn, textAr);
}

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

/// Extension on BuildContext for quick translation calls: `context.tr('nav_home')`
extension LocalizationExtension on BuildContext {
  String tr(String key) {
    final langCode = Localizations.localeOf(this).languageCode;
    return AppTranslations.translate(langCode, key);
  }

  bool get isRtl => Localizations.localeOf(this).languageCode == 'ar';

  TextDirection get textDirection => isRtl ? TextDirection.rtl : TextDirection.ltr;
}
