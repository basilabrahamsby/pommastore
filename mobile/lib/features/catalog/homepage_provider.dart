import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api/api_client.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final homepageDataProvider = StreamProvider<Map<String, dynamic>>((ref) async* {
  final prefs = await SharedPreferences.getInstance();

  // 1. Try to load cached data first for instant start
  final cachedString = prefs.getString('cached_homepage_data');
  if (cachedString != null) {
    try {
      final cachedMap = jsonDecode(cachedString) as Map<String, dynamic>;
      yield cachedMap;
    } catch (_) {
      // Ignored: corrupt cache
    }
  }

  // 2. Fetch fresh data from network in background
  final client = ref.read(apiClientProvider);
  final res = await client.dio.get('/storefront/homepage');
  final data = res.data as Map<String, dynamic>;

  // 3. Cache the fresh data
  await prefs.setString('cached_homepage_data', jsonEncode(data));

  // 4. Yield the fresh data
  yield data;
});
