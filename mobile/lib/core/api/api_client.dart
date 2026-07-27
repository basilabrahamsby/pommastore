import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'token_manager.dart';

class ApiClient {
  late final Dio dio;
  static String currentLanguage = 'en';

  /// URL strategy matching the storefront api.ts approach:
  /// - Flutter Web on production domain (pommastore.com): relative /api/v1 → Nginx proxies it
  /// - Flutter Web on localhost (dev): absolute https://pommastore.com/api/v1 (same as native)
  /// - Native Android/iOS: absolute https://pommastore.com/api/v1 (no CORS restrictions)
  static String get baseUrl {
    if (kIsWeb) {
      final host = Uri.base.host;
      final isLocalhost = host == 'localhost' || host == '127.0.0.1';
      if (!isLocalhost) {
        return '/api/v1/';
      }
    }
    return 'https://pommastore.com/api/v1/';
  }

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    ));

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await TokenManager.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['Content-Type'] = 'application/json';
          options.headers['Accept-Language'] = currentLanguage;

          // Normalize relative endpoint paths so Dio appends cleanly to baseUrl
          if (!options.path.startsWith('http')) {
            if (options.path.startsWith('/')) {
              options.path = options.path.substring(1);
            }
          }

          return handler.next(options);
        },
        onError: (DioException e, handler) {
          return handler.next(e);
        },
      ),
    );
  }
}
