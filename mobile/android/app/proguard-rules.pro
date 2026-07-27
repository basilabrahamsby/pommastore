# Flutter Wrapper & Plugins
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.embedding.**  { *; }
-keep class io.flutter.provider.**  { *; }
-keep class io.flutter.plugins.**  { *; }
-keep class io.flutter.plugins.GeneratedPluginRegistrant { *; }
-dontwarn io.flutter.embedding.**

# Google Fonts
-keep class com.google.fonts.** { *; }
-dontwarn com.google.fonts.**

# Dio / OkHttp / Networking
-keepattributes Signature
-keepattributes Annotation
-keepattributes EnclosingMethod
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Android Core & Kotlin
-keep class androidx.core.** { *; }
-dontwarn androidx.core.**
-keep class kotlin.** { *; }
-keep class kotlin.reflect.** { *; }
-dontwarn kotlin.**
