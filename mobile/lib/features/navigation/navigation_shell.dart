import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../core/locale/locale_provider.dart';
import '../../features/cart/cart_provider.dart';

class NavigationShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const NavigationShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final iconSize = R.icon(context, 19);
    final labelSize = R.font(context, 10);
    final cartItems = ref.watch(cartProvider);
    final cartCount = cartItems.fold<int>(0, (sum, i) => sum + i.quantity);
    final currentLocale = ref.watch(localeProvider);
    final isAr = currentLocale.languageCode == 'ar';

    Widget bagIcon({bool active = false}) {
      final icon = Icon(
        LucideIcons.shoppingBag,
        size: iconSize,
        color: active ? AppTheme.primaryRose : AppTheme.textNeutral,
      );
      if (cartCount == 0) return icon;
      return Stack(
        clipBehavior: Clip.none,
        children: [
          icon,
          Positioned(
            top: -4,
            right: -6,
            child: Container(
              padding: const EdgeInsets.all(2),
              constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
              decoration: BoxDecoration(
                color: AppTheme.primaryRose,
                shape: cartCount < 10 ? BoxShape.circle : BoxShape.rectangle,
                borderRadius: cartCount >= 10 ? BorderRadius.circular(8) : null,
              ),
              child: Text(
                cartCount > 99 ? '99+' : '$cartCount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  height: 1,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      );
    }

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: AppTheme.borderLight, width: 0.8),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: navigationShell.currentIndex,
          backgroundColor: Colors.white,
          selectedItemColor: AppTheme.primaryRose,
          unselectedItemColor: AppTheme.textNeutral,
          selectedFontSize: labelSize,
          unselectedFontSize: labelSize,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          onTap: (index) {
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          },
          items: [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.home, size: iconSize),
              activeIcon: Icon(LucideIcons.home, size: iconSize, color: AppTheme.primaryRose),
              label: isAr ? 'الرئيسية' : 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.layoutGrid, size: iconSize),
              activeIcon: Icon(LucideIcons.layoutGrid, size: iconSize, color: AppTheme.primaryRose),
              label: isAr ? 'الفئات' : 'Categories',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.search, size: iconSize),
              activeIcon: Icon(LucideIcons.search, size: iconSize, color: AppTheme.primaryRose),
              label: isAr ? 'البحث' : 'Search',
            ),
            BottomNavigationBarItem(
              icon: bagIcon(),
              activeIcon: bagIcon(active: true),
              label: isAr ? 'الحقيبة' : 'Bag',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.user, size: iconSize),
              activeIcon: Icon(LucideIcons.user, size: iconSize, color: AppTheme.primaryRose),
              label: isAr ? 'حسابي' : 'Account',
            ),
          ],
        ),
      ),
    );
  }
}
