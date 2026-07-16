import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenManager {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'jwt_auth_token';

  static Future<void> saveToken(String token) async {
    try {
      await _storage.write(key: _tokenKey, value: token);
    } catch (e) {
      print('TokenManager: Error saving token: $e');
    }
  }

  static Future<String?> getToken() async {
    try {
      return await _storage.read(key: _tokenKey);
    } catch (e) {
      print('TokenManager: Error getting token: $e');
      return null;
    }
  }

  static Future<void> clearToken() async {
    try {
      await _storage.delete(key: _tokenKey);
    } catch (e) {
      print('TokenManager: Error clearing token: $e');
    }
  }
}
