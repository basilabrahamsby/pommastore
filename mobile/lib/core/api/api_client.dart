import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'token_manager.dart';

class ApiClient {
  late final Dio dio;

  /// On Flutter Web: use a relative base URL (same-origin, no CORS issues)
  /// - same as how storefront api.ts uses relative /api/v1/storefront in production
  /// On native Android/iOS: use absolute production URL
  static String get baseUrl {
    if (kIsWeb) {
      // Use relative URL so the browser sends request to the same host
      // Works for both local dev (via --disable-web-security) and production (kozmocart.com)
      return '/api/v1';
    }
    return 'https://kozmocart.com/api/v1';
  }

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
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
          // Can hook custom centralized telemetry logging here
          return handler.next(e);
        },
      ),
    );
  }
}
