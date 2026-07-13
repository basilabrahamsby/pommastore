import 'package:dio/dio.dart';
import 'token_manager.dart';

class ApiClient {
  late final Dio dio;
  
  // Set target URL of the VM backend
  static const String baseUrl = 'https://kozmocart.com/api/v1';

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 12),
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
