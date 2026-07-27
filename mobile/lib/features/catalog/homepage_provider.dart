import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api/api_client.dart';
import '../../core/locale/locale_provider.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final homepageDataProvider = StreamProvider<Map<String, dynamic>>((ref) async* {
  final currentLocale = ref.watch(localeProvider);
  final lang = currentLocale.languageCode;
  final prefs = await SharedPreferences.getInstance();

  final cacheKey = 'cached_homepage_data_$lang';
  final cachedString = prefs.getString(cacheKey);
  bool hasValidCache = false;
  if (cachedString != null) {
    try {
      final cachedMap = jsonDecode(cachedString) as Map<String, dynamic>;
      yield cachedMap;
      hasValidCache = true;
    } catch (_) {
      // Ignored: corrupt cache
    }
  }

  try {
    final client = ref.read(apiClientProvider);
    final res = await client.dio.get(
      '/storefront/homepage',
      queryParameters: {'lang': lang},
    );
    final data = res.data as Map<String, dynamic>;

    await prefs.setString(cacheKey, jsonEncode(data));

    yield data;
  } catch (e) {
    if (!hasValidCache) {
      rethrow;
    }
  }
});
