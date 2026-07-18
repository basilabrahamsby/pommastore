import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'token_manager.dart';

class ApiClient {
  late final Dio dio;

  /// URL strategy matching the storefront api.ts approach:
  /// - Flutter Web on production domain (pommastore.com): relative /api/v1 → Nginx proxies it
  /// - Flutter Web on localhost (dev): absolute https://pommastore.com/api/v1 (same as native)
  /// - Native Android/iOS: absolute https://pommastore.com/api/v1 (no CORS restrictions)
  static String get baseUrl {
    if (kIsWeb) {
      // On web, check if we are running on the production domain
      // Uri.base.host will be 'pommastore.com' in production, 'localhost' in dev
      final host = Uri.base.host;
      final isLocalhost = host == 'localhost' || host == '127.0.0.1';
      if (!isLocalhost) {
        // Deployed on pommastore.com — use relative path (no CORS, same origin as storefront)
        return '/api/v1';
      }
    }
    // Local dev web OR native mobile — use absolute production URL
    return 'https://pommastore.com/api/v1';
  }

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
    ));

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await TokenManager.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['Content-Type'] = 'application/json';
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          return handler.next(e);
        },
      ),
    );
  }
}
