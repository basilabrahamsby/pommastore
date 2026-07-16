import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../core/widgets/product_card.dart';
import 'wishlist_provider.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlistItems = ref.watch(wishlistProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'MY FAVORITES',
          style: GoogleFonts.montserrat(
            fontSize: R.font(context, 14),
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
            color: Colors.black87,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: wishlistItems.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceLight,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.favorite_border,
                          size: 36,
                          color: AppTheme.primaryRose,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'YOUR WISHLIST IS EMPTY',
                        style: GoogleFonts.montserrat(
                          fontSize: R.font(context, 13),
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Explore our collection and add your favorite items to your wishlist.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: R.font(context, 11),
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop(); // Go back to Explore/Shop
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                        ),
                        child: Text(
                          'EXPLORE FRAGRANCES',
                          style: GoogleFonts.montserrat(
                            fontSize: R.font(context, 10.5),
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            : ConstrainedBox(
                constraints: R.maxContent(context),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: R.cols(context),
                      crossAxisSpacing: R.pad(context, 12),
                      mainAxisSpacing: R.pad(context, 12),
                      childAspectRatio: R.cardAspect(context),
                    ),
                    itemCount: wishlistItems.length,
                    itemBuilder: (context, index) {
                      return ProductCard(product: wishlistItems[index]);
                    },
                  ),
                ),
              ),
      ),
    );
  }
}
