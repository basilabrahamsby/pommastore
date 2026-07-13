import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class CachedImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final double opacity;
  final Alignment alignment;
  final Widget? placeholder;
  final Widget? errorWidget;

  const CachedImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.opacity = 1.0,
    this.alignment = Alignment.center,
    this.placeholder,
    this.errorWidget,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) {
      return errorWidget ?? Container(color: Colors.grey.shade200);
    }

    // On Web, standard Image.network uses browser native caching
    if (kIsWeb) {
      return Image.network(
        imageUrl,
        width: width,
        height: height,
        fit: fit,
        alignment: alignment,
        opacity: AlwaysStoppedAnimation(opacity),
        errorBuilder: (context, error, stackTrace) =>
            errorWidget ?? Container(color: Colors.grey.shade200),
      );
    }

    // On mobile, CachedNetworkImage caches onto disk/SQLite for instant display
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      alignment: alignment,
      memCacheWidth: width != null ? (width! * 2).toInt() : null,
      memCacheHeight: height != null ? (height! * 2).toInt() : null,
      errorWidget: (context, url, error) =>
          errorWidget ?? Container(color: Colors.grey.shade200),
    );
  }
}
