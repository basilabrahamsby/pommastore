import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final homepageDataProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final client = ref.read(apiClientProvider);
  final res = await client.dio.get('/storefront/homepage');
  return res.data as Map<String, dynamic>;
});
