import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_responsive.dart';
import '../../features/cart/cart_provider.dart';

class NavigationShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const NavigationShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final iconSize = R.icon(context, 20);
    final labelSize = R.font(context, 11);
    final cartItems = ref.watch(cartProvider);
    final cartCount = cartItems.fold<int>(0, (sum, i) => sum + i.quantity);

    Widget bagIcon({bool active = false}) {
      final icon = Icon(
        LucideIcons.shoppingBag,
        size: iconSize,
        color: active ? AppTheme.primaryRose : AppTheme.textMuted,
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
          border: Border(
            top: BorderSide(color: AppTheme.borderLight, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: navigationShell.currentIndex,
          backgroundColor: AppTheme.backgroundLight,
          selectedItemColor: AppTheme.primaryRose,
          unselectedItemColor: AppTheme.textMuted,
          selectedFontSize: labelSize,
          unselectedFontSize: labelSize,
          type: BottomNavigationBarType.fixed,
          onTap: (index) {
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          },
          items: [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.compass, size: iconSize),
              activeIcon: Icon(LucideIcons.compass, size: iconSize),
              label: 'Explore',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.search, size: iconSize),
              activeIcon: Icon(LucideIcons.search, size: iconSize),
              label: 'Search',
            ),
            BottomNavigationBarItem(
              icon: bagIcon(),
              activeIcon: bagIcon(active: true),
              label: 'Bag',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.user, size: iconSize),
              activeIcon: Icon(LucideIcons.user, size: iconSize),
              label: 'Account',
            ),
          ],
        ),
      ),
    );
  }
}
