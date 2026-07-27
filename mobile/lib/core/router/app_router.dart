import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/navigation/navigation_shell.dart';
import '../../features/catalog/home_screen.dart';
import '../../features/catalog/categories_screen.dart';
import '../../features/catalog/search_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/account/account_screen.dart';
import '../../features/auth/login_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'shellHome');
final GlobalKey<NavigatorState> _shellNavigatorCategoriesKey = GlobalKey<NavigatorState>(debugLabel: 'shellCategories');
final GlobalKey<NavigatorState> _shellNavigatorSearchKey = GlobalKey<NavigatorState>(debugLabel: 'shellSearch');
final GlobalKey<NavigatorState> _shellNavigatorCartKey = GlobalKey<NavigatorState>(debugLabel: 'shellCart');
final GlobalKey<NavigatorState> _shellNavigatorAccountKey = GlobalKey<NavigatorState>(debugLabel: 'shellAccount');

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: <RouteBase>[
    // Authentication Page
    GoRoute(
      path: '/login',
      builder: (BuildContext context, GoRouterState state) => const LoginScreen(),
    ),
    
    // 5-Tab Shell Navigation (Myntra-style)
    StatefulShellRoute.indexedStack(
      builder: (BuildContext context, GoRouterState state, StatefulNavigationShell navigationShell) {
        return NavigationShell(navigationShell: navigationShell);
      },
      branches: <StatefulShellBranch>[
        // 1. Home
        StatefulShellBranch(
          navigatorKey: _shellNavigatorHomeKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/',
              builder: (BuildContext context, GoRouterState state) => const HomeScreen(),
            ),
          ],
        ),
        // 2. Categories
        StatefulShellBranch(
          navigatorKey: _shellNavigatorCategoriesKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/categories',
              builder: (BuildContext context, GoRouterState state) => const CategoriesScreen(),
            ),
          ],
        ),
        // 3. Search / Catalog
        StatefulShellBranch(
          navigatorKey: _shellNavigatorSearchKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/search',
              builder: (BuildContext context, GoRouterState state) => const SearchScreen(),
            ),
          ],
        ),
        // 4. Bag
        StatefulShellBranch(
          navigatorKey: _shellNavigatorCartKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/bag',
              builder: (BuildContext context, GoRouterState state) => const CartScreen(),
            ),
          ],
        ),
        // 5. Account / Profile
        StatefulShellBranch(
          navigatorKey: _shellNavigatorAccountKey,
          routes: <RouteBase>[
            GoRoute(
              path: '/account',
              builder: (BuildContext context, GoRouterState state) => const AccountScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
